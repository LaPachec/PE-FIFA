import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    response.status(error.statusCode).json({
      message: error instanceof Error ? error.message : 'Request error',
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    message: 'Internal server error',
  });
};
