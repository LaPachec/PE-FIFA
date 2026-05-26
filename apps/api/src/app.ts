import cors from 'cors';
import express from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { matchesRouter } from './modules/matches/matches.routes.js';
import { participantsRouter } from './modules/participants/participants.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { tournamentsRouter } from './modules/tournaments/tournaments.routes.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found-handler.js';
import { requireAuth } from './shared/middlewares/require-auth.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'fifa-tournament-manager-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/participants', requireAuth, participantsRouter);
app.use('/matches', requireAuth, matchesRouter);
app.use('/public', publicRouter);

app.use(notFoundHandler);
app.use(errorHandler);
