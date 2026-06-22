import express from "express";
import { param } from "express-validator";
import { authenticateUser as authenticate } from "../../../middleware/authentication.js";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import { getUserProfileController } from "../controller/user.controller.js";

const router = express.Router();

router.use(authenticate);

// GET /api/users/:userId/profile
router.get(
  "/:userId/profile",
  [
    param("userId")
      .isInt({ min: 1 })
      .withMessage("userId must be a positive integer")
      .toInt(),
    validationErrorHandler,
  ],
  getUserProfileController
);

export default router;
