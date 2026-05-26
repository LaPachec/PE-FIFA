import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { getAuthenticatedUserId } from '../../shared/middlewares/require-auth.js';
import {
  createTournamentSchema,
  updateInviteSettingsSchema,
  updateTournamentSchema,
} from './tournaments.schemas.js';
import { tournamentsService } from './tournaments.service.js';

function parseValidationError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join('; ');
    throw new AppError(message, 400);
  }

  throw error;
}

function getTournamentId(request: Request) {
  const id = request.params.id;

  if (Array.isArray(id)) {
    return id[0];
  }

  return id;
}

export const tournamentsController = {
  async create(request: Request, response: Response) {
    try {
      const input = createTournamentSchema.parse(request.body);
      const tournament = await tournamentsService.create(
        input,
        getAuthenticatedUserId(request),
      );

      response.status(201).json(tournament);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async list(request: Request, response: Response) {
    const tournaments = await tournamentsService.list(getAuthenticatedUserId(request));

    response.status(200).json(tournaments);
  },

  async findById(request: Request, response: Response) {
    const tournament = await tournamentsService.findById(
      getTournamentId(request),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(tournament);
  },

  async update(request: Request, response: Response) {
    try {
      const input = updateTournamentSchema.parse(request.body);
      const tournament = await tournamentsService.update(
        getTournamentId(request),
        input,
        getAuthenticatedUserId(request),
      );

      response.status(200).json(tournament);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async delete(request: Request, response: Response) {
    await tournamentsService.delete(getTournamentId(request), getAuthenticatedUserId(request));

    response.status(204).send();
  },

  async start(request: Request, response: Response) {
    const tournament = await tournamentsService.start(
      getTournamentId(request),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(tournament);
  },

  async finish(request: Request, response: Response) {
    const tournament = await tournamentsService.finish(
      getTournamentId(request),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(tournament);
  },

  async generateKnockoutStage(request: Request, response: Response) {
    const tournament = await tournamentsService.generateKnockoutStage(
      getTournamentId(request),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(tournament);
  },

  async updateInviteSettings(request: Request, response: Response) {
    try {
      const input = updateInviteSettingsSchema.parse(request.body);
      const tournament = await tournamentsService.updateInviteSettings(
        getTournamentId(request),
        input,
        getAuthenticatedUserId(request),
      );

      response.status(200).json(tournament);
    } catch (error) {
      parseValidationError(error);
    }
  },

  async regenerateInviteCode(request: Request, response: Response) {
    const tournament = await tournamentsService.regenerateInviteCode(
      getTournamentId(request),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(tournament);
  },
};
