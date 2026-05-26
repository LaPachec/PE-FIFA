import { authenticatedRequest } from '@/services/api-client';
import type { Match } from '@/services/matches';
import type { Participant } from '@/services/participants';

export type ParticipantStatistics = {
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

export type HighestScoringMatch = {
  matchId: string;
  homeParticipantName: string;
  awayParticipantName: string;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
};

export type BiggestWin = {
  matchId: string;
  homeParticipantName: string;
  awayParticipantName: string;
  homeScore: number;
  awayScore: number;
  goalDifference: number;
  winnerName: string;
};

export type TournamentStatistics = {
  totalParticipants: number;
  totalMatches: number;
  finishedMatches: number;
  pendingMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  highestScoringMatch: HighestScoringMatch | null;
  biggestWin: BiggestWin | null;
  participantStatistics: ParticipantStatistics[];
  highlights: {
    topScorers: ParticipantStatistics[];
    bestAttacks: ParticipantStatistics[];
    bestDefenses: ParticipantStatistics[];
    mostWinsPlayers: ParticipantStatistics[];
    bestGoalDifferences: ParticipantStatistics[];
  };
};

function createParticipantStatistics(participant: Participant): ParticipantStatistics {
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

function applyResult(
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

export function getTournamentStatistics(tournamentId: string) {
  return authenticatedRequest<TournamentStatistics>(
    `/tournaments/${tournamentId}/statistics`,
  );
}

export function buildTournamentStatisticsFromPublicData(
  participants: Participant[],
  matches: Match[],
): TournamentStatistics {
  const eligibleParticipants = participants.filter((participant) =>
    ['ACTIVE', 'ELIMINATED', 'CHAMPION'].includes(participant.status),
  );
  const participantNameById = new Map(
    eligibleParticipants.map((participant) => [participant.id, participant.name]),
  );
  const statisticsByParticipantId = new Map(
    eligibleParticipants.map((participant) => [
      participant.id,
      createParticipantStatistics(participant),
    ]),
  );
  const finishedMatches = matches.filter((match) => match.status === 'FINISHED');
  const pendingMatches = matches.filter((match) => match.status === 'PENDING');
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

    const homeStatistics = statisticsByParticipantId.get(match.homeParticipantId);
    const awayStatistics = statisticsByParticipantId.get(match.awayParticipantId);

    if (!homeStatistics || !awayStatistics) {
      continue;
    }

    applyResult(homeStatistics, match.homeScore, match.awayScore);
    applyResult(awayStatistics, match.awayScore, match.homeScore);

    const matchTotalGoals = match.homeScore + match.awayScore;
    totalGoals += matchTotalGoals;

    const matchSummary = {
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

  const participantStatistics = Array.from(statisticsByParticipantId.values()).sort(
    (first, second) => first.name.localeCompare(second.name, 'pt-BR'),
  );
  const hasFinishedMatches = finishedMatches.length > 0;

  return {
    totalParticipants: eligibleParticipants.length,
    totalMatches: matches.length,
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
        ? getTiedLeaders(participantStatistics, (statistics) => statistics.goalsAgainst, {
            lowerIsBetter: true,
            requirePlayed: true,
          })
        : [],
      mostWinsPlayers: hasFinishedMatches
        ? getTiedLeaders(participantStatistics, (statistics) => statistics.wins)
        : [],
      bestGoalDifferences: hasFinishedMatches
        ? getTiedLeaders(participantStatistics, (statistics) => statistics.goalDifference)
        : [],
    },
  };
}
