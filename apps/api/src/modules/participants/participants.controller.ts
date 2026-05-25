import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import {
  createParticipantSchema,
  updateParticipantSchema,
} from './participants.schemas.js';
import { participantsService } from './participants.service.js';

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

export const participantsController = {
  async create(request: Request, response: Response) {
    try {
      const input = createParticipantSchema.parse(request.body);
      const participant = await participantsService.create(
        getParam(request, 'tournamentId'),
        input,
      );

      response.status(201).json(participant);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async listByTournament(request: Request, response: Response) {
    const participants = await participantsService.listByTournament(
      getParam(request, 'tournamentId'),
    );

    response.status(200).json(participants);
  },

  async findById(request: Request, response: Response) {
    const participant = await participantsService.findById(getParam(request, 'id'));

    response.status(200).json(participant);
  },

  async update(request: Request, response: Response) {
    try {
      const input = updateParticipantSchema.parse(request.body);
      const participant = await participantsService.update(getParam(request, 'id'), input);

      response.status(200).json(participant);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async delete(request: Request, response: Response) {
    await participantsService.delete(getParam(request, 'id'));

    response.status(204).send();
  },
};
