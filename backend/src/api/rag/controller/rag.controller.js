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
import { BadRequestError } from "../../../utils/errors/index.js";
import { createDocumentFromUploadService } from "../service/rag.service.js";

export const createDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("PDF file required");
    }

    const result = await createDocumentFromUploadService(req.file, req.user.id);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Document uploaded and processed.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
