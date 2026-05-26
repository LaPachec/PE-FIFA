import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../shared/middlewares/require-auth.js';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async summary(request: Request, response: Response) {
    const summary = await dashboardService.getSummary(getAuthenticatedUserId(request));

    response.status(200).json(summary);
  },
};
