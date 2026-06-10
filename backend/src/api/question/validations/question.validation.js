import { query } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const searchQuestionsValidation = [
  query('query')
    .notEmpty()
    .withMessage('Query is required')
    .isString()
    .withMessage('Query must be a string')
    .isLength({ min: 5 })
    .withMessage('Query must be at least 5 characters long'),

  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be an integer between 1 and 20')
    .toInt(),

  query('threshold')
    .optional()
    .isFloat({ min: 0.0, max: 1.0 })
    .withMessage('threshold must be a float between 0 and 1')
    .toFloat(),

  validationErrorHandler,
];
