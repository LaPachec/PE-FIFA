import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { statisticsController } from './statistics.controller.js';

export const tournamentStatisticsRouter = Router({ mergeParams: true });

tournamentStatisticsRouter.get('/', asyncHandler(statisticsController.getByTournament));
