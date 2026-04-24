const { body, validationResult } = require('express-validator');

const signupRules = [
  body('email')
    .isEmail().withMessage('Valid email required.')
    .normalizeEmail(),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Email or username required.'),
  body('password').notEmpty().withMessage('Password required.'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { signupRules, loginRules, validate };
