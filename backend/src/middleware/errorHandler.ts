import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('Uncaught error:', err);
  res.status(500).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
  });
};
