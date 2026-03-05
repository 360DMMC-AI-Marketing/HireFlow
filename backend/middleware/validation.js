import { body, param, query, validationResult } from 'express-validator';

// ─── Validation Result Handler ───────────────────────────────────────────────

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ─── Auth Validations ────────────────────────────────────────────────────────

export const validateSignup = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name too long')
    .escape(),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name too long')
    .escape(),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-zA-Z]/).withMessage('Password must contain a letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  validate
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  validate
];

export const validateResetPassword = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
];

// ─── Job Validations ─────────────────────────────────────────────────────────

export const validateCreateJob = [
  body('title').trim().notEmpty().withMessage('Job title is required')
    .isLength({ max: 200 }).withMessage('Title too long'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('employmentType').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
    .withMessage('Invalid employment type'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 20000 }).withMessage('Description too long'),
  body('salary.min').optional().isNumeric().withMessage('Salary min must be a number'),
  body('salary.max').optional().isNumeric().withMessage('Salary max must be a number'),
  validate
];

export const validateUpdateJob = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('salary.min').optional().isNumeric(),
  body('salary.max').optional().isNumeric(),
  validate
];

// ─── Candidate Validations ───────────────────────────────────────────────────

export const validateCreateCandidate = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long')
    .escape(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('status').optional().isIn(['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'])
    .withMessage('Invalid status'),
  body('source').optional().isIn(['LinkedIn', 'Indeed', 'Email', 'HireFlow Direct', 'Referral', 'Agency'])
    .withMessage('Invalid source'),
  body('matchScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be 0-100'),
  validate
];

// ─── AI Interview Validations ────────────────────────────────────────────────

export const validateCreateInterview = [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('candidateId').isMongoId().withMessage('Valid candidate ID is required'),
  body('numQuestions').optional().isInt({ min: 1, max: 20 }).withMessage('Questions must be 1-20'),
  validate
];

// ─── General Validations ─────────────────────────────────────────────────────

export const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validate
];