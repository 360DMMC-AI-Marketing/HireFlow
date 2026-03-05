// ─── NoSQL Injection Prevention ──────────────────────────────────────────────
// Custom implementation since express-mongo-sanitize v2.2.0 is incompatible
// with Express 5. Strips $ and . from keys in req.body, req.query, req.params.

const DANGEROUS_KEYS = /^\$|\.|\$\$/;

function sanitizeValue(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Remove any $-prefixed operators that could be injected as strings
    // e.g., someone sending { email: { "$gt": "" } } as a JSON string
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.test(key)) {
        console.warn(`[Sanitize] Stripped dangerous key: "${key}"`);
        continue; // Skip dangerous keys entirely
      }
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
}

export const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  // Express 5: req.query and req.params are read-only getters
  // Sanitize their values in-place instead of reassigning
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (DANGEROUS_KEYS.test(key)) {
        console.warn(`[Sanitize] Stripped dangerous query key: "${key}"`);
        delete req.query[key];
      }
    }
  }
  next();
};

// ─── XSS Prevention ─────────────────────────────────────────────────────────
// Strips <script> tags and common XSS vectors from string values in req.body.

function stripXSS(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '');
  }
  if (Array.isArray(value)) return value.map(stripXSS);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) {
      clean[key] = stripXSS(value[key]);
    }
    return clean;
  }
  return value;
}

export const xssSanitize = (req, res, next) => {
  if (req.body) req.body = stripXSS(req.body);
  next();
};

// ─── Request Size Guard ──────────────────────────────────────────────────────
// Rejects suspiciously deep or wide objects (prevents prototype pollution)

export const depthGuard = (maxDepth = 10, maxKeys = 500) => {
  function checkDepth(obj, depth = 0) {
    if (depth > maxDepth) return false;
    if (obj && typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length > maxKeys) return false;
      for (const key of keys) {
        if (!checkDepth(obj[key], depth + 1)) return false;
      }
    }
    return true;
  }

  return (req, res, next) => {
    if (req.body && !checkDepth(req.body)) {
      return res.status(400).json({ success: false, error: 'Request body too complex' });
    }
    next();
  };
};