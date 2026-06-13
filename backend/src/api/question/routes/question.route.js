import express from 'express';
import { getSimilarQuestionsController } from '../controller/question.controller.js';
import { authenticateUser } from '../../../middleware/authentication.js';
import { getSimilarQuestionsValidation } from '../validations/question.validation.js';

const router = express.Router();

/**
 * @route   GET /api/questions/:questionHash/similar
 * @desc    Get questions similar to the given question hash
 * @access  Protected
 */
router.get(
  '/:questionHash/similar',
  // authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

export default router;