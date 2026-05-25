import type { Request, Response } from 'express';
import { matchesService } from './matches.service.js';

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
};
