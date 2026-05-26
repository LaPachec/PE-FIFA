import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { dashboardController } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', asyncHandler(dashboardController.summary));
