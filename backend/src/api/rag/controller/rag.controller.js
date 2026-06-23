import { StatusCodes } from "http-status-codes";
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
