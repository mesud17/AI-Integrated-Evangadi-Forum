import { safeExecute } from '../../../../db/config.js';
import { BadRequestError } from '../../../utils/errors/index.js';

export const listDocumentsForUserService = async ({ userId }) => {
  if (!userId) {
    throw new BadRequestError('User is required');
  }

  const sql = `
    SELECT
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  const rows = await safeExecute(sql, [userId]);

  return rows.map(document => ({
    document_id: document.document_id,
    title: document.title,
    mime_type: document.mime_type,
    byte_size: document.byte_size,
    status: document.status,
    error_message: document.error_message,
    created_at: document.created_at,
    updated_at: document.updated_at,
  }));
};
