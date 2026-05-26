import type { Request, Response } from 'express';
import { standingsService } from './standings.service.js';

function getParam(request: Request, key: string) {
  const value = request.params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const standingsController = {
  async getByTournament(request: Request, response: Response) {
    const standings = await standingsService.getLeagueStandings(
      getParam(request, 'tournamentId'),
    );

    response.status(200).json(standings);
  },
};
