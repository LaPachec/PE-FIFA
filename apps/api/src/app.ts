import cors from 'cors';
import express from 'express';
import { participantsRouter } from './modules/participants/participants.routes.js';
import { tournamentsRouter } from './modules/tournaments/tournaments.routes.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found-handler.js';

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

app.use('/tournaments', tournamentsRouter);
app.use('/participants', participantsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
