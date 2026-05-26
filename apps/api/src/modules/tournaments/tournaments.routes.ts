import { Router } from 'express';
import { tournamentMatchesRouter } from '../matches/matches.routes.js';
import { tournamentParticipantsRouter } from '../participants/participants.routes.js';
import { tournamentStandingsRouter } from '../standings/standings.routes.js';
import { tournamentStatisticsRouter } from '../statistics/statistics.routes.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { requireAuth } from '../../shared/middlewares/require-auth.js';
import { requireTournamentOwner } from '../../shared/middlewares/require-tournament-owner.js';
import { tournamentsController } from './tournaments.controller.js';

export const tournamentsRouter = Router();

tournamentsRouter.use(requireAuth);

tournamentsRouter.post('/', asyncHandler(tournamentsController.create));
tournamentsRouter.get('/', asyncHandler(tournamentsController.list));
tournamentsRouter.use(
  '/:tournamentId/participants',
  requireTournamentOwner('tournamentId'),
  tournamentParticipantsRouter,
);
tournamentsRouter.use(
  '/:tournamentId/matches',
  requireTournamentOwner('tournamentId'),
  tournamentMatchesRouter,
);
tournamentsRouter.use(
  '/:tournamentId/standings',
  requireTournamentOwner('tournamentId'),
  tournamentStandingsRouter,
);
tournamentsRouter.use(
  '/:tournamentId/statistics',
  requireTournamentOwner('tournamentId'),
  tournamentStatisticsRouter,
);
tournamentsRouter.post(
  '/:id/start',
  requireTournamentOwner('id'),
  asyncHandler(tournamentsController.start),
);
tournamentsRouter.post(
  '/:id/finish',
  requireTournamentOwner('id'),
  asyncHandler(tournamentsController.finish),
);
tournamentsRouter.post(
  '/:id/generate-knockout-stage',
  requireTournamentOwner('id'),
  asyncHandler(tournamentsController.generateKnockoutStage),
);
tournamentsRouter.get('/:id', requireTournamentOwner('id'), asyncHandler(tournamentsController.findById));
tournamentsRouter.patch('/:id', requireTournamentOwner('id'), asyncHandler(tournamentsController.update));
tournamentsRouter.delete('/:id', requireTournamentOwner('id'), asyncHandler(tournamentsController.delete));
