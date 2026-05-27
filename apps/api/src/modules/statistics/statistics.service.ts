import { prisma, type MatchStatus } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';

type StatisticsParticipant = {
  id: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
};

type ParticipantStatistics = {
  participantId: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type ParticipantStatisticsMap = Record<string, ParticipantStatistics>;

type StatisticsMatch = {
  id: string;
  status: MatchStatus;
  homeParticipantId: string | null;
  awayParticipantId: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

type StatisticsTournament = {
  participants: StatisticsParticipant[];
  matches: StatisticsMatch[];
};

type MatchSummary = {
  matchId: string;
  homeParticipantName: string;
  awayParticipantName: string;
  homeScore: number;
  awayScore: number;
};

type HighestScoringMatch = MatchSummary & {
  totalGoals: number;
};

type BiggestWin = MatchSummary & {
  goalDifference: number;
  winnerName: string;
};

function createParticipantStatistics(
  participant: StatisticsParticipant,
): ParticipantStatistics {
  return {
    participantId: participant.id,
    name: participant.name,
    nickname: participant.nickname,
    teamName: participant.teamName,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyParticipantResult(
  statistics: ParticipantStatistics,
  goalsFor: number,
  goalsAgainst: number,
) {
  statistics.matchesPlayed += 1;
  statistics.goalsFor += goalsFor;
  statistics.goalsAgainst += goalsAgainst;
  statistics.goalDifference = statistics.goalsFor - statistics.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    statistics.wins += 1;
    statistics.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    statistics.draws += 1;
    statistics.points += 1;
    return;
  }

  statistics.losses += 1;
}

function getTiedLeaders(
  participantStatistics: ParticipantStatistics[],
  valueSelector: (statistics: ParticipantStatistics) => number,
  options: { lowerIsBetter?: boolean; requirePlayed?: boolean } = {},
) {
  const eligibleStatistics = options.requirePlayed
    ? participantStatistics.filter((statistics) => statistics.matchesPlayed > 0)
    : participantStatistics;

  if (eligibleStatistics.length === 0) {
    return [];
  }

  const leaderValue = options.lowerIsBetter
    ? Math.min(...eligibleStatistics.map(valueSelector))
    : Math.max(...eligibleStatistics.map(valueSelector));

  return eligibleStatistics.filter(
    (statistics) => valueSelector(statistics) === leaderValue,
  );
}

export const statisticsService = {
  async getTournamentStatistics(tournamentId: string, ownerId: string) {
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, ownerId },
      include: {
        participants: {
          where: {
            status: { in: ['ACTIVE', 'ELIMINATED', 'CHAMPION'] },
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            nickname: true,
            teamName: true,
          },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
          select: {
            id: true,
            status: true,
            homeParticipantId: true,
            awayParticipantId: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    const participantNameById = new Map(
      tournament.participants.map((participant: StatisticsParticipant) => [
        participant.id,
        participant.name,
      ]),
    );
    const typedTournament: StatisticsTournament = tournament;
    const statisticsByParticipantId: ParticipantStatisticsMap =
      typedTournament.participants.reduce<ParticipantStatisticsMap>(
        (statisticsMap, participant: StatisticsParticipant) => {
          statisticsMap[participant.id] = createParticipantStatistics(participant);
          return statisticsMap;
        },
        {},
      );

    const finishedMatches = typedTournament.matches.filter(
      (match: StatisticsMatch) => match.status === 'FINISHED',
    );
    const pendingMatches = typedTournament.matches.filter(
      (match: StatisticsMatch) => match.status === 'PENDING',
    );

    let totalGoals = 0;
    let highestScoringMatch: HighestScoringMatch | null = null;
    let biggestWin: BiggestWin | null = null;

    for (const match of finishedMatches) {
      if (
        !match.homeParticipantId ||
        !match.awayParticipantId ||
        match.homeScore === null ||
        match.awayScore === null
      ) {
        continue;
      }

      const homeStatistics = statisticsByParticipantId[match.homeParticipantId];
      const awayStatistics = statisticsByParticipantId[match.awayParticipantId];

      if (!homeStatistics || !awayStatistics) {
        continue;
      }

      applyParticipantResult(homeStatistics, match.homeScore, match.awayScore);
      applyParticipantResult(awayStatistics, match.awayScore, match.homeScore);

      const matchTotalGoals = match.homeScore + match.awayScore;
      totalGoals += matchTotalGoals;

      const matchSummary: MatchSummary = {
        matchId: match.id,
        homeParticipantName:
          participantNameById.get(match.homeParticipantId) ?? 'Participante removido',
        awayParticipantName:
          participantNameById.get(match.awayParticipantId) ?? 'Participante removido',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      };

      if (!highestScoringMatch || matchTotalGoals > highestScoringMatch.totalGoals) {
        highestScoringMatch = {
          ...matchSummary,
          totalGoals: matchTotalGoals,
        };
      }

      const goalDifference = Math.abs(match.homeScore - match.awayScore);

      if (goalDifference > 0 && (!biggestWin || goalDifference > biggestWin.goalDifference)) {
        biggestWin = {
          ...matchSummary,
          goalDifference,
          winnerName:
            match.homeScore > match.awayScore
              ? matchSummary.homeParticipantName
              : matchSummary.awayParticipantName,
        };
      }
    }

    const participantStatistics = (
      Object.values(statisticsByParticipantId) as ParticipantStatistics[]
    ).sort(
      (first: ParticipantStatistics, second: ParticipantStatistics) =>
        first.name.localeCompare(second.name, 'pt-BR'),
    );
    const hasFinishedMatches = finishedMatches.length > 0;

    return {
      totalParticipants: typedTournament.participants.length,
      totalMatches: typedTournament.matches.length,
      finishedMatches: finishedMatches.length,
      pendingMatches: pendingMatches.length,
      totalGoals,
      averageGoalsPerMatch:
        finishedMatches.length > 0
          ? Number((totalGoals / finishedMatches.length).toFixed(2))
          : 0,
      highestScoringMatch,
      biggestWin,
      participantStatistics,
      highlights: {
        topScorers: hasFinishedMatches
          ? getTiedLeaders(participantStatistics, (statistics) => statistics.goalsFor)
          : [],
        bestAttacks: hasFinishedMatches
          ? getTiedLeaders(participantStatistics, (statistics) => statistics.goalsFor)
          : [],
        bestDefenses: hasFinishedMatches
          ? getTiedLeaders(
              participantStatistics,
              (statistics) => statistics.goalsAgainst,
              { lowerIsBetter: true, requirePlayed: true },
            )
          : [],
        mostWinsPlayers: hasFinishedMatches
          ? getTiedLeaders(participantStatistics, (statistics) => statistics.wins)
          : [],
        bestGoalDifferences: hasFinishedMatches
          ? getTiedLeaders(
              participantStatistics,
              (statistics) => statistics.goalDifference,
            )
          : [],
      },
    };
  },
};
