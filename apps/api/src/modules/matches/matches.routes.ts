import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { matchesController } from './matches.controller.js';

export const tournamentMatchesRouter = Router({ mergeParams: true });
export const matchesRouter = Router();

tournamentMatchesRouter.get('/', asyncHandler(matchesController.listByTournament));

matchesRouter.patch('/:id/result', asyncHandler(matchesController.updateResult));
