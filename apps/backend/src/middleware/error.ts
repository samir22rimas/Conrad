import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.statusCode ? err.message : 'Internal server error';

  // Return actionable, safe errors for expected database conflicts without
  // exposing connection details, table names, or query information.
  const prismaCode = err.code;
  if (prismaCode) {
    if (prismaCode === 'P2002') {
      statusCode = 409;
      message = 'A record with those details already exists';
    } else if (prismaCode === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
