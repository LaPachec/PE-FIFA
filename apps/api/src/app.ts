import cors from 'cors';
import express from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { matchesRouter } from './modules/matches/matches.routes.js';
import { participantsRouter } from './modules/participants/participants.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { tournamentsRouter } from './modules/tournaments/tournaments.routes.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found-handler.js';
import { requireAuth } from './shared/middlewares/require-auth.js';

export const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const defaultCorsOrigin = isProduction ? '' : 'http://localhost:3000';
const corsOrigin = process.env.CORS_ORIGIN ?? defaultCorsOrigin;
const allowedCorsOrigins = corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'fifa-tournament-manager-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRouter);
app.use('/dashboard', requireAuth, dashboardRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/participants', requireAuth, participantsRouter);
app.use('/matches', requireAuth, matchesRouter);
app.use('/public', publicRouter);

app.use(notFoundHandler);
app.use(errorHandler);
