import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

const answerFitValidation = [
  body('draftAnswer')
    .trim()
    .notEmpty()
    .withMessage('Draft answer is required')
    .isString()
    .withMessage('Draft answer must be a string')
    .isLength({ min: 10 })
    .withMessage('Draft answer must be at least 10 characters'),
  validationErrorHandler,
];

export default answerFitValidation;