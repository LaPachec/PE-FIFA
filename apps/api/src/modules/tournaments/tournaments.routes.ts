import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { tournamentsController } from './tournaments.controller.js';

export const tournamentsRouter = Router();

tournamentsRouter.post('/', asyncHandler(tournamentsController.create));
tournamentsRouter.get('/', asyncHandler(tournamentsController.list));
tournamentsRouter.get('/:id', asyncHandler(tournamentsController.findById));
tournamentsRouter.patch('/:id', asyncHandler(tournamentsController.update));
tournamentsRouter.delete('/:id', asyncHandler(tournamentsController.delete));
