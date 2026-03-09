import AuditLog from '../models/AuditLog.js';

/**
 * Log an action to the audit trail.
 *
 * Usage:
 *   await audit(req, 'job_created', 'job', job._id, job.title, 'Created new job posting');
 *   await audit(req, 'candidate_status_changed', 'candidate', c._id, c.name, `Status: ${old} → ${new}`);
 *
 * @param {Object} req - Express request (for user info + IP)
 * @param {string} action - Action enum value
 * @param {string} resource - Resource type
 * @param {ObjectId} resourceId - ID of affected resource
 * @param {string} resourceName - Display name of resource
 * @param {string} description - Human-readable description
 * @param {Object} metadata - Optional extra data
 */
export const audit = async (req, action, resource, resourceId, resourceName, description, metadata) => {
  try {
    const user = req?.user;
    if (!user) return; // Skip if no user context (webhooks, system jobs)

    await AuditLog.create({
      userId: user._id || user.id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userEmail: user.email,
      userRole: user.role,
      action,
      resource,
      resourceId,
      resourceName,
      description,
      metadata,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent']?.slice(0, 200)
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[Audit] Log failed:', err.message);
  }
};

/**
 * Audit middleware — auto-logs common actions based on route + method.
 * Attach AFTER the controller runs (as a response interceptor).
 *
 * Usage in routes:
 *   router.post('/', createJob, auditMiddleware('job_created', 'job'));
 */
export const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    // Override res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
        const data = body?.data || body?.job || body?.candidate || body?.session || body;
        const resourceId = data?._id || data?.id || req.params?.id;
        const resourceName = data?.title || data?.name || data?.email || '';
        
        audit(req, action, resource, resourceId, resourceName,
          `${action.replace(/_/g, ' ')}${resourceName ? ': ' + resourceName : ''}`
        ).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};