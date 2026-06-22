import { StatusCodes } from "http-status-codes";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong, please try again later';

  // MySQL duplicate-key — always a client mistake, remap to 409
  if (err?.code === 'ER_DUP_ENTRY') {
    statusCode = StatusCodes.CONFLICT;
    code = 'CONFLICT';
    message = 'Duplicate value entered for a unique field';
  }

  return res.status(statusCode).json({ error: { code, message } });
};
