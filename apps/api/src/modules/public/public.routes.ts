import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { publicTournamentsController } from './public-tournaments.controller.js';

export const publicRouter = Router();

publicRouter.get(
  '/tournaments/:slug',
  asyncHandler(publicTournamentsController.findBySlug),
);
