import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';

export const matchesService = {
  async listByTournament(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
    });
  },
};
