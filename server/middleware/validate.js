const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const registerRules = () => [
  body('name')
    .trim()
    .notEmpty().withMessage('Naam zaroori hai')
    .isLength({ max: 80 }).withMessage('Naam zyada se zyada 80 characters ka ho'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email zaroori hai')
    .isEmail().withMessage('Email sahi format mein nahi'),

  body('password')
    .notEmpty().withMessage('Password zaroori hai')
    .isLength({ min: 8 }).withMessage('Password kam az kam 8 characters ka hona chahiye'),
];

const loginRules = () => [
  body('email')
    .trim()
    .notEmpty().withMessage('Email zaroori hai')
    .isEmail().withMessage('Email sahi format mein nahi'),

  body('password')
    .notEmpty().withMessage('Password zaroori hai'),
];

const analysisRules = () => [
  body('jobDescription')
    .trim()
    .notEmpty().withMessage('Job description zaroori hai')
    .isLength({ min: 100 }).withMessage('Job description kam az kam 100 characters ki honi chahiye')
    .isLength({ max: 8000 }).withMessage('Job description zyada se zyada 8000 characters ki honi chahiye'),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Job title zyada se zyada 120 characters ka ho'),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    throw new AppError(firstError, 400, 'VALIDATION_ERROR');
  }

  next();
};

module.exports = { registerRules, loginRules, analysisRules, checkValidation };