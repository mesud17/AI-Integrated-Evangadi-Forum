import fs from "fs";
import { getDocumentFileService } from "../service/rag-file.service.js";

export const getDocumentFileController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await getDocumentFileService({ documentId, userId });

    const fileStream = fs.createReadStream(document.storagePath);

    res.on("close", () => fileStream.destroy());

    fileStream.on("error", (error) => {
      if (!res.headersSent) return next(error);
      res.destroy(error);
    });

    fileStream.on("open", () => {
      const safeFilename =
        (String(document.title || "document").replace(/[\r\n"]/g, "").trim() ||
          "document") + ".pdf";

      res.setHeader("Content-Type", document.mimeType || "application/pdf");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);

      fileStream.pipe(res);
    });
  } catch (error) {
    next(error);
  }
};
