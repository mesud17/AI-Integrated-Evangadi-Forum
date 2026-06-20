import fs from "fs";
import { safeExecute } from "../../../../db/config.js";
import { NotFoundError, BadRequestError } from "../../../utils/errors/index.js";

export const getDocumentFileService = async ({ documentId, userId }) => {
  const sql = `
    SELECT document_id AS id, user_id AS userId, title, mime_type AS mimeType, storage_path AS storagePath
    FROM documents
    WHERE document_id = ?
  `;

  const rows = await safeExecute(sql, [documentId]);

  if (rows.length === 0) {
    throw new NotFoundError("Document not found");
  }

  const document = rows[0];

  if (document.userId !== userId) {
    throw new NotFoundError("Document not found");
  }

  if (!fs.existsSync(document.storagePath)) {
    throw new BadRequestError("Document file is missing from storage");
  }

  return document;
};