import { body, param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";


export const createQuestionValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  validationErrorHandler,
];

export const draftCoachValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  validationErrorHandler,
];


export const getQuestionsValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),

  query("mine")
    .optional()
    .isBoolean()
    .withMessage("Mine must be a boolean")
    .toBoolean(),

  validationErrorHandler,
];

export const getSingleQuestionValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .bail()
    .isString()
    .withMessage("Question hash must be a string")
    .bail()
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Question hash must be a 16-character lowercase hex string"),

  validationErrorHandler,
];
