import { prisma, type MatchPhase, type Prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import type { UpdateMatchResultInput } from './matches.schemas.js';

const knockoutPhases: MatchPhase[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
];

function isKnockoutPhase(phase: MatchPhase) {
  return knockoutPhases.includes(phase);
}

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

function getKnockoutWinnerParticipantId(
  homeScore: number,
  awayScore: number,
  homePenaltyScore: number | null | undefined,
  awayPenaltyScore: number | null | undefined,
  homeParticipantId: string | null,
  awayParticipantId: string | null,
) {
  if (!homeParticipantId || !awayParticipantId) {
    throw new AppError('Match participants are not defined', 409);
  }

  if (homeScore === awayScore) {
    const hasPenaltyScores =
      homePenaltyScore !== null &&
      homePenaltyScore !== undefined &&
      awayPenaltyScore !== null &&
      awayPenaltyScore !== undefined;

    if (!hasPenaltyScores) {
      throw new AppError('Partidas eliminatórias empatadas precisam de decisão por pênaltis.', 400);
    }

    if (homePenaltyScore === awayPenaltyScore) {
      throw new AppError('A disputa de pênaltis precisa ter um vencedor.', 400);
    }

    return homePenaltyScore > awayPenaltyScore ? homeParticipantId : awayParticipantId;
  }

  return homeScore > awayScore ? homeParticipantId : awayParticipantId;
}

function getPenaltyScores(input: {
  phase: MatchPhase;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
}) {
  if (!isKnockoutPhase(input.phase)) {
    return {
      homePenaltyScore: null,
      awayPenaltyScore: null,
    };
  }

  if (input.homeScore !== input.awayScore) {
    return {
      homePenaltyScore: null,
      awayPenaltyScore: null,
    };
  }

  return {
    homePenaltyScore: input.homePenaltyScore ?? null,
    awayPenaltyScore: input.awayPenaltyScore ?? null,
  };
}

function getNextKnockoutPhase(phase: MatchPhase) {
  if (phase === 'ROUND_OF_16') {
    return 'QUARTER_FINAL' as const;
  }

  if (phase === 'QUARTER_FINAL') {
    return 'SEMI_FINAL' as const;
  }

  if (phase === 'SEMI_FINAL') {
    return 'FINAL' as const;
  }

  return null;
}

async function finishKnockoutTournament(
  transaction: Prisma.TransactionClient,
  tournamentId: string,
  championParticipantId: string,
) {
  await transaction.participant.update({
    where: { id: championParticipantId },
    data: { status: 'CHAMPION' },
  });

  await transaction.tournament.update({
    where: { id: tournamentId },
    data: {
      status: 'FINISHED',
      championParticipantId,
    },
  });
}

async function upsertNextKnockoutPhase(
  transaction: Prisma.TransactionClient,
  tournamentId: string,
  currentPhase: MatchPhase,
  currentRound: number,
  winnerParticipantIds: string[],
) {
  const nextPhase = getNextKnockoutPhase(currentPhase);

  if (!nextPhase) {
    const championParticipantId = winnerParticipantIds[0];

    if (!championParticipantId) {
      throw new AppError('Tournament champion could not be determined', 400);
    }

    await finishKnockoutTournament(transaction, tournamentId, championParticipantId);
    return;
  }

  const nextRound = currentRound + 1;
  const existingNextMatches = await transaction.match.findMany({
    where: {
      tournamentId,
      phase: nextPhase,
      round: nextRound,
    },
    orderBy: { matchOrder: 'asc' },
  });

  const nextMatchesData = [];

  for (let index = 0; index < winnerParticipantIds.length; index += 2) {
    const homeParticipantId = winnerParticipantIds[index];
    const awayParticipantId = winnerParticipantIds[index + 1];

    if (!homeParticipantId || !awayParticipantId) {
      throw new AppError('Cannot generate next knockout phase without all winners', 409);
    }

    nextMatchesData.push({
      tournamentId,
      phase: nextPhase,
      round: nextRound,
      homeParticipantId,
      awayParticipantId,
      status: 'PENDING' as const,
      matchOrder: index / 2 + 1,
    });
  }

  if (existingNextMatches.length > 0) {
    if (existingNextMatches.length !== nextMatchesData.length) {
      throw new AppError('Next knockout phase already exists with invalid matches', 409);
    }

    for (const nextMatchData of nextMatchesData) {
      const nextMatch = existingNextMatches[nextMatchData.matchOrder - 1];

      if (nextMatch.status !== 'PENDING') {
        const hasDifferentParticipants =
          nextMatch.homeParticipantId !== nextMatchData.homeParticipantId ||
          nextMatch.awayParticipantId !== nextMatchData.awayParticipantId;

        if (hasDifferentParticipants) {
          throw new AppError('Cannot update winners because the next phase has started', 409);
        }

        continue;
      }

      await transaction.match.update({
        where: { id: nextMatch.id },
        data: {
          homeParticipantId: nextMatchData.homeParticipantId,
          awayParticipantId: nextMatchData.awayParticipantId,
        },
      });
    }

    return;
  }

  await transaction.match.createMany({
    data: nextMatchesData,
  });
}

async function progressKnockoutIfPhaseFinished(
  transaction: Prisma.TransactionClient,
  tournamentId: string,
  phase: MatchPhase,
  round: number,
) {
  const phaseMatches = await transaction.match.findMany({
    where: {
      tournamentId,
      phase,
      round,
    },
    orderBy: { matchOrder: 'asc' },
  });

  if (phaseMatches.some((match) => match.status !== 'FINISHED')) {
    return;
  }

  const winnerParticipantIds = phaseMatches.map((match) => {
    if (!match.winnerParticipantId) {
      throw new AppError('Cannot progress knockout phase without all winners', 409);
    }

    return match.winnerParticipantId;
  });

  await upsertNextKnockoutPhase(
    transaction,
    tournamentId,
    phase,
    round,
    winnerParticipantIds,
  );
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
    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const match = await transaction.match.findUnique({
        where: { id },
        include: {
          tournament: {
            select: {
              id: true,
              format: true,
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

      const canUpdateResult =
        match.tournament.status === 'IN_PROGRESS' ||
        (match.tournament.format === 'LEAGUE_KNOCKOUT' &&
          match.tournament.status === 'KNOCKOUT_STAGE' &&
          isKnockoutPhase(match.phase));

      if (!canUpdateResult) {
        throw new AppError('Tournament must be in progress to update match results', 409);
      }

      if (match.status !== 'PENDING' && match.status !== 'FINISHED') {
        throw new AppError('Match result cannot be updated in the current status', 409);
      }

      if (match.phase !== 'LEAGUE' && !isKnockoutPhase(match.phase)) {
        throw new AppError('This match phase cannot receive results yet', 400);
      }

      const winnerParticipantId =
        match.phase === 'LEAGUE'
          ? getLeagueWinnerParticipantId(
              input.homeScore,
              input.awayScore,
              match.homeParticipantId,
              match.awayParticipantId,
            )
          : getKnockoutWinnerParticipantId(
              input.homeScore,
              input.awayScore,
              input.homePenaltyScore,
              input.awayPenaltyScore,
              match.homeParticipantId,
              match.awayParticipantId,
            );
      const penaltyScores = getPenaltyScores({
        phase: match.phase,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        homePenaltyScore: input.homePenaltyScore,
        awayPenaltyScore: input.awayPenaltyScore,
      });

      const updatedMatch = await transaction.match.update({
        where: { id },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          homePenaltyScore: penaltyScores.homePenaltyScore,
          awayPenaltyScore: penaltyScores.awayPenaltyScore,
          status: 'FINISHED',
          playedAt: new Date(),
          winnerParticipantId,
        },
      });

      if (isKnockoutPhase(updatedMatch.phase)) {
        await progressKnockoutIfPhaseFinished(
          transaction,
          updatedMatch.tournamentId,
          updatedMatch.phase,
          updatedMatch.round ?? 1,
        );
      }

      return updatedMatch;
    });
  },
};
