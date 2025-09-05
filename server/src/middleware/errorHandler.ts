import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 if no status code
  const statusCode = err.statusCode || 500;
  
  // Log error details in development
  if (process.env.DEBUG_MODE === 'true') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      statusCode,
    });
  } else {
    console.error(`Error: ${err.message} - ${req.method} ${req.url}`);
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
      ...(process.env.DEBUG_MODE === 'true' && { stack: err.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      status: 404,
      path: req.path,
    },
  });
}