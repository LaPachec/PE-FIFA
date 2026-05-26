import { Router } from 'express';
import { tournamentMatchesRouter } from '../matches/matches.routes.js';
import { tournamentParticipantsRouter } from '../participants/participants.routes.js';
import { tournamentStandingsRouter } from '../standings/standings.routes.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { tournamentsController } from './tournaments.controller.js';

export const tournamentsRouter = Router();

tournamentsRouter.post('/', asyncHandler(tournamentsController.create));
tournamentsRouter.get('/', asyncHandler(tournamentsController.list));
tournamentsRouter.use('/:tournamentId/participants', tournamentParticipantsRouter);
tournamentsRouter.use('/:tournamentId/matches', tournamentMatchesRouter);
tournamentsRouter.use('/:tournamentId/standings', tournamentStandingsRouter);
tournamentsRouter.post('/:id/start', asyncHandler(tournamentsController.start));
tournamentsRouter.post('/:id/finish', asyncHandler(tournamentsController.finish));
tournamentsRouter.get('/:id', asyncHandler(tournamentsController.findById));
tournamentsRouter.patch('/:id', asyncHandler(tournamentsController.update));
tournamentsRouter.delete('/:id', asyncHandler(tournamentsController.delete));
