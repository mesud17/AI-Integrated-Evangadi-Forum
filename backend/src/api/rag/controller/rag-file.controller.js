import fs from "fs";
import { getDocumentFileService } from "../service/rag-file.service.js";

export const getDocumentFileController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await getDocumentFileService({ documentId, userId });

    res.setHeader("Content-Type", document.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.title}"`
    );

    const fileStream = fs.createReadStream(document.storagePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      next(error);
    });

  } catch (error) {
    next(error);
  }
};