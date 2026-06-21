import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const deleteDocumentValidation = [
  param("documentId")
    .notEmpty()
    .withMessage("documentId is required")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer")
    .toInt(),

  validationErrorHandler,
];
