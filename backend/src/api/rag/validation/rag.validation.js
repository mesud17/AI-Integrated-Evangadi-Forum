import { query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
export const queryAssistantValidation = [
  query('question')
    .trim() 
    .notEmpty()
    .withMessage('Query parameter "question" is required.'),
  validationErrorHandler, 
];