import {
  prisma,
  type MatchPhase,
  type MatchStatus,
  type TournamentFormat,
  type TournamentStatus,
} from '@fifa-tournament-manager/database';

type DashboardParticipant = {
  id: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
};

type DashboardMatch = {
  id: string;
  phase: MatchPhase;
  round: number | null;
  status: MatchStatus;
  homeParticipantId: string | null;
  awayParticipantId: string | null;
  matchOrder: number;
};

type DashboardTournament = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  championParticipantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: DashboardParticipant[];
  matches: DashboardMatch[];
};

type DashboardStats = {
  totalTournaments: number;
  draftTournaments: number;
  inProgressTournaments: number;
  knockoutStageTournaments: number;
  finishedTournaments: number;
};

const emptyStats: DashboardStats = {
  totalTournaments: 0,
  draftTournaments: 0,
  inProgressTournaments: 0,
  knockoutStageTournaments: 0,
  finishedTournaments: 0,
};

function incrementStatusCounter(stats: DashboardStats, status: TournamentStatus) {
  if (status === 'DRAFT') {
    stats.draftTournaments += 1;
    return;
  }

  if (status === 'IN_PROGRESS') {
    stats.inProgressTournaments += 1;
    return;
  }

  if (status === 'KNOCKOUT_STAGE') {
    stats.knockoutStageTournaments += 1;
    return;
  }

  if (status === 'FINISHED') {
    stats.finishedTournaments += 1;
  }
}

function getParticipantNameById(tournament: DashboardTournament) {
  return new Map(
    tournament.participants.map((participant) => [
      participant.id,
      participant.nickname || participant.name,
    ]),
  );
}

export const dashboardService = {
  async getSummary(userId: string) {
    const tournaments = await prisma.tournament.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        format: true,
        status: true,
        championParticipantId: true,
        createdAt: true,
        updatedAt: true,
        participants: {
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
            phase: true,
            round: true,
            status: true,
            homeParticipantId: true,
            awayParticipantId: true,
            matchOrder: true,
          },
        },
      },
    });

    const stats = { ...emptyStats };
    stats.totalTournaments = tournaments.length;

    const summaryTournaments = tournaments.map((tournament) => {
      incrementStatusCounter(stats, tournament.status);

      const participantNameById = getParticipantNameById(tournament);
      const finishedMatches = tournament.matches.filter(
        (match) => match.status === 'FINISHED',
      ).length;
      const pendingMatches = tournament.matches.filter(
        (match) => match.status === 'PENDING',
      ).length;
      const nextPendingMatch = tournament.matches.find(
        (match) => match.status === 'PENDING',
      );
      const champion =
        tournament.championParticipantId === null
          ? null
          : tournament.participants.find(
              (participant) => participant.id === tournament.championParticipantId,
            ) ?? null;

      return {
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        description: tournament.description,
        format: tournament.format,
        status: tournament.status,
        createdAt: tournament.createdAt,
        updatedAt: tournament.updatedAt,
        champion: champion
          ? {
              id: champion.id,
              name: champion.name,
              nickname: champion.nickname,
              teamName: champion.teamName,
            }
          : null,
        totalParticipants: tournament.participants.length,
        totalMatches: tournament.matches.length,
        finishedMatches,
        pendingMatches,
        publicPath: `/public/tournaments/${tournament.slug}`,
        nextPendingMatch: nextPendingMatch
          ? {
              id: nextPendingMatch.id,
              homeParticipantName:
                participantNameById.get(nextPendingMatch.homeParticipantId ?? '') ??
                'A definir',
              awayParticipantName:
                participantNameById.get(nextPendingMatch.awayParticipantId ?? '') ??
                'A definir',
              phase: nextPendingMatch.phase,
              round: nextPendingMatch.round,
            }
          : null,
      };
    });

    return {
      stats,
      tournaments: summaryTournaments,
    };
  },
};
