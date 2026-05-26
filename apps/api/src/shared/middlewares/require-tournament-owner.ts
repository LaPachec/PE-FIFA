import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../errors/app-error.js';
import { getAuthenticatedUserId } from './require-auth.js';

export function requireTournamentOwner(paramName: 'id' | 'tournamentId') {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const paramValue = request.params[paramName];
      const tournamentId = Array.isArray(paramValue) ? paramValue[0] : paramValue;

      if (!tournamentId) {
        throw new AppError('Tournament id is required', 400);
      }

      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { ownerId: true },
      });

      if (!tournament) {
        throw new AppError('Tournament not found', 404);
      }

      if (tournament.ownerId !== getAuthenticatedUserId(request)) {
        throw new AppError('Tournament not found', 404);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
