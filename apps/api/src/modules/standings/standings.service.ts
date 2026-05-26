import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';

export type StandingRow = {
  participantId: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
  position: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

type StandingParticipant = {
  id: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
};

type StandingMatch = {
  phase: string;
  status: string;
  homeParticipantId: string | null;
  awayParticipantId: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

function createEmptyStanding(participant: StandingParticipant): StandingRow {
  return {
    participantId: participant.id,
    name: participant.name,
    nickname: participant.nickname,
    teamName: participant.teamName,
    position: 0,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  };
}

function applyMatchResult(
  standing: StandingRow,
  goalsFor: number,
  goalsAgainst: number,
) {
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  standing.goalDifference = standing.goalsFor - standing.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    standing.wins += 1;
    standing.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    standing.draws += 1;
    standing.points += 1;
    return;
  }

  standing.losses += 1;
}

export function calculateLeagueStandings(
  participants: StandingParticipant[],
  matches: StandingMatch[],
) {
  const standingsByParticipantId = new Map(
    participants.map((participant) => [participant.id, createEmptyStanding(participant)]),
  );

  for (const match of matches) {
    if (
      match.phase !== 'LEAGUE' ||
      match.status !== 'FINISHED' ||
      !match.homeParticipantId ||
      !match.awayParticipantId ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      continue;
    }

    const homeStanding = standingsByParticipantId.get(match.homeParticipantId);
    const awayStanding = standingsByParticipantId.get(match.awayParticipantId);

    if (!homeStanding || !awayStanding) {
      continue;
    }

    applyMatchResult(homeStanding, match.homeScore, match.awayScore);
    applyMatchResult(awayStanding, match.awayScore, match.homeScore);
  }

  return Array.from(standingsByParticipantId.values())
    .sort((first, second) => {
      if (second.points !== first.points) {
        return second.points - first.points;
      }

      if (second.wins !== first.wins) {
        return second.wins - first.wins;
      }

      if (second.goalDifference !== first.goalDifference) {
        return second.goalDifference - first.goalDifference;
      }

      if (second.goalsFor !== first.goalsFor) {
        return second.goalsFor - first.goalsFor;
      }

      return first.name.localeCompare(second.name, 'pt-BR');
    })
    .map((standing, index) => ({
      position: index + 1,
      participantId: standing.participantId,
      name: standing.name,
      nickname: standing.nickname,
      teamName: standing.teamName,
      points: standing.points,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsFor: standing.goalsFor,
      goalsAgainst: standing.goalsAgainst,
      goalDifference: standing.goalDifference,
    }));
}

export const standingsService = {
  async getLeagueStandings(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          where: {
            status: { in: ['ACTIVE', 'CHAMPION'] },
          },
          orderBy: { name: 'asc' },
        },
        matches: {
          where: {
            phase: 'LEAGUE',
            status: 'FINISHED',
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.format !== 'LEAGUE' && tournament.format !== 'LEAGUE_KNOCKOUT') {
      throw new AppError(
        'Standings currently support only LEAGUE or LEAGUE_KNOCKOUT tournaments',
        400,
      );
    }

    return calculateLeagueStandings(tournament.participants, tournament.matches);
  },
};
