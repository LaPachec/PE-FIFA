import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { participantsController } from './participants.controller.js';

export const tournamentParticipantsRouter = Router({ mergeParams: true });
export const participantsRouter = Router();

tournamentParticipantsRouter.get(
  '/',
  asyncHandler(participantsController.listByTournament),
);
tournamentParticipantsRouter.get(
  '/pending',
  asyncHandler(participantsController.listPendingByTournament),
);
tournamentParticipantsRouter.patch(
  '/pending/approve-all',
  asyncHandler(participantsController.approveAllPending),
);
tournamentParticipantsRouter.post('/', asyncHandler(participantsController.create));

participantsRouter.patch('/:id/approve', asyncHandler(participantsController.approve));
participantsRouter.patch('/:id/reject', asyncHandler(participantsController.reject));
participantsRouter.get('/:id', asyncHandler(participantsController.findById));
participantsRouter.patch('/:id', asyncHandler(participantsController.update));
participantsRouter.delete('/:id', asyncHandler(participantsController.delete));
