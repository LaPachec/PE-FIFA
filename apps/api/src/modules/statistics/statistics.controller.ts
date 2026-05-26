import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../shared/middlewares/require-auth.js';
import { statisticsService } from './statistics.service.js';

function getParam(request: Request, key: string) {
  const value = request.params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const statisticsController = {
  async getByTournament(request: Request, response: Response) {
    const statistics = await statisticsService.getTournamentStatistics(
      getParam(request, 'tournamentId'),
      getAuthenticatedUserId(request),
    );

    response.status(200).json(statistics);
  },
};
