import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { searchQuestionsValidation } from '../validations/question.validation.js';
import { searchQuestionsSemanticController } from '../controller/question.controller.js';

const router = express.Router();

/**
 * @route GET /api/questions/search
 * @desc Semantic search for questions
 * @access Protected (Requires Bearer Token)
 */
router.get('/search', authenticateUser, searchQuestionsValidation, searchQuestionsSemanticController);

export default router;
