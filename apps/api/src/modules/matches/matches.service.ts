import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import type { UpdateMatchResultInput } from './matches.schemas.js';

function getLeagueWinnerParticipantId(
  homeScore: number,
  awayScore: number,
  homeParticipantId: string | null,
  awayParticipantId: string | null,
) {
  if (homeScore === awayScore) {
    return null;
  }

  if (!homeParticipantId || !awayParticipantId) {
    throw new AppError('Match participants are not defined', 409);
  }

  return homeScore > awayScore ? homeParticipantId : awayParticipantId;
}

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

  async updateResult(id: string, input: UpdateMatchResultInput) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    if (!match.tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (match.tournament.status !== 'IN_PROGRESS') {
      throw new AppError('Tournament must be in progress to update match results', 409);
    }

    if (match.status !== 'PENDING' && match.status !== 'FINISHED') {
      throw new AppError('Match result cannot be updated in the current status', 409);
    }

    if (match.phase !== 'LEAGUE') {
      throw new AppError('Only LEAGUE match results can be updated for now', 400);
    }

    const winnerParticipantId = getLeagueWinnerParticipantId(
      input.homeScore,
      input.awayScore,
      match.homeParticipantId,
      match.awayParticipantId,
    );

    return prisma.match.update({
      where: { id },
      data: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        status: 'FINISHED',
        playedAt: new Date(),
        winnerParticipantId,
      },
    });
  },
};
