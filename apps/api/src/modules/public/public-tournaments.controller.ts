import type { Request, Response } from 'express';
import { publicTournamentsService } from './public-tournaments.service.js';

function getParam(request: Request, key: string) {
  const value = request.params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const publicTournamentsController = {
  async findBySlug(request: Request, response: Response) {
    const tournament = await publicTournamentsService.findBySlug(
      getParam(request, 'slug'),
    );

    response.status(200).json(tournament);
  },
};
