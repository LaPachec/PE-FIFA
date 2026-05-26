import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { getAuthenticatedUserId } from '../../shared/middlewares/require-auth.js';
import { authService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

function parseValidationError(error: unknown) {
  if (error instanceof ZodError) {
    throw new AppError(error.issues.map((issue) => issue.message).join('; '), 400);
  }

  throw error;
}

export const authController = {
  async register(request: Request, response: Response) {
    try {
      const input = registerSchema.parse(request.body);
      const result = await authService.register(input);

      response.status(201).json(result);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async login(request: Request, response: Response) {
    try {
      const input = loginSchema.parse(request.body);
      const result = await authService.login(input);

      response.status(200).json(result);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async me(request: Request, response: Response) {
    const user = await authService.me(getAuthenticatedUserId(request));

    response.status(200).json(user);
  },
};
