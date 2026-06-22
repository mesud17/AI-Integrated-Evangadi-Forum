import fs from "fs";
import { getDocumentFileService } from "../service/rag-file.service.js";

export const getDocumentFileController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await getDocumentFileService({ documentId, userId });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const safeFilename =
      (String(document.title || "document").replace(/[\r\n"]/g, "").trim() ||
        "document") + ".pdf";
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);

    const fileStream = fs.createReadStream(document.storagePath);

    res.on("close", () => fileStream.destroy());

    fileStream.on("error", (error) => {
      if (!res.headersSent) return next(error);
      res.destroy(error);
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};
