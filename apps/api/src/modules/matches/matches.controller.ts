import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { updateMatchResultSchema } from './matches.schemas.js';
import { matchesService } from './matches.service.js';

function parseValidationError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join('; ');
    throw new AppError(message, 400);
  }

  throw error;
}

function getParam(request: Request, key: string) {
  const value = request.params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const matchesController = {
  async listByTournament(request: Request, response: Response) {
    const matches = await matchesService.listByTournament(getParam(request, 'tournamentId'));

    response.status(200).json(matches);
  },

  async updateResult(request: Request, response: Response) {
    try {
      const input = updateMatchResultSchema.parse(request.body);
      const match = await matchesService.updateResult(getParam(request, 'id'), input);

      response.status(200).json(match);
    } catch (error) {
      parseValidationError(error);
    }
  },
};
