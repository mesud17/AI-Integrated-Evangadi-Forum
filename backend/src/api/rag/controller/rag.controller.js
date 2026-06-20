import { StatusCodes } from "http-status-codes";
import { searchInDocumentService } from "../service/rag.service.js";

export const searchInDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { query, k } = req.query;

    const result = await searchInDocumentService({
      documentId: Number(documentId),
      userId: req.user.id,
      query,
      k,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Ranked chunk excerpts",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
