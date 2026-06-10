import { StatusCodes } from 'http-status-codes';
import { searchQuestionsSemanticService } from '../service/question.service.js';

/**
 * Handles semantic search requests for questions.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const { query: searchQuery, k, threshold } = req.query;

    const result = await searchQuestionsSemanticService({
      query: searchQuery,
      k,
      threshold,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Semantic search completed successfully',
      data: result.data,
      meta: {
        total: result.meta.total,
        k: result.meta.k,
        threshold: result.meta.threshold,
        query: searchQuery,
        questionHash: null,
      },
    });
  } catch (error) {
    next(error);
  }
};
