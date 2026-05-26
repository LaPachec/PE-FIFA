import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { standingsController } from './standings.controller.js';

export const tournamentStandingsRouter = Router({ mergeParams: true });

tournamentStandingsRouter.get('/', asyncHandler(standingsController.getByTournament));
