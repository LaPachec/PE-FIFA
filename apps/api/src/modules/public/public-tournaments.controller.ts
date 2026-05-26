import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createParticipantSchema } from '../participants/participants.schemas.js';
import { AppError } from '../../shared/errors/app-error.js';
import { publicTournamentsService } from './public-tournaments.service.js';

function getParam(request: Request, key: string) {
  const value = request.params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseValidationError(error: unknown) {
  if (error instanceof ZodError) {
    throw new AppError(error.issues.map((issue) => issue.message).join('; '), 400);
  }

  throw error;
}

export const publicTournamentsController = {
  async findBySlug(request: Request, response: Response) {
    const tournament = await publicTournamentsService.findBySlug(
      getParam(request, 'slug'),
    );

    response.status(200).json(tournament);
  },

  async getInvite(request: Request, response: Response) {
    const invite = await publicTournamentsService.getInvite(getParam(request, 'slug'));

    response.status(200).json(invite);
  },

  async join(request: Request, response: Response) {
    try {
      const input = createParticipantSchema.parse(request.body);
      const participant = await publicTournamentsService.join(
        getParam(request, 'slug'),
        input,
      );

      response.status(201).json(participant);
    } catch (error) {
      parseValidationError(error);
    }
  },
};
