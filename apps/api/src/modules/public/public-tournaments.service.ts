import {
  prisma,
  type MatchPhase,
  type MatchStatus,
  type ParticipantStatus,
  type TournamentFormat,
  type TournamentStatus,
} from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import { participantsService } from '../participants/participants.service.js';
import type { CreateParticipantInput } from '../participants/participants.schemas.js';
import { calculateLeagueStandings } from '../standings/standings.service.js';

type PublicParticipant = {
  id: string;
  tournamentId: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
  status: ParticipantStatus;
  createdAt: Date;
  updatedAt: Date;
};

type PublicMatch = {
  id: string;
  tournamentId: string;
  phase: MatchPhase;
  round: number | null;
  homeParticipantId: string | null;
  awayParticipantId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  winnerParticipantId: string | null;
  status: MatchStatus;
  matchOrder: number;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  playedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PublicTournament = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  isTwoLegged: boolean;
  qualifiedCount: number | null;
  hasThirdPlaceMatch: boolean;
  championParticipantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: PublicParticipant[];
  matches: PublicMatch[];
};

export const publicTournamentsService = {
  async findBySlug(slug: string) {
    const tournament: PublicTournament | null = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        format: true,
        status: true,
        isTwoLegged: true,
        qualifiedCount: true,
        hasThirdPlaceMatch: true,
        championParticipantId: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: {
            status: { in: ['ACTIVE', 'CHAMPION'] },
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            tournamentId: true,
            name: true,
            nickname: true,
            teamName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
          select: {
            id: true,
            tournamentId: true,
            phase: true,
            round: true,
            homeParticipantId: true,
            awayParticipantId: true,
            homeScore: true,
            awayScore: true,
            homePenaltyScore: true,
            awayPenaltyScore: true,
            winnerParticipantId: true,
            status: true,
            matchOrder: true,
            nextMatchId: true,
            nextMatchSlot: true,
            playedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    const { participants, matches, ...publicTournament } = tournament;
    const standings =
      tournament.format === 'LEAGUE'
        ? calculateLeagueStandings(participants, matches)
        : [];
    const champion =
      tournament.championParticipantId === null
        ? null
        : participants.find(
            (participant: PublicParticipant) =>
              participant.id === tournament.championParticipantId,
          ) ?? null;

    return {
      tournament: publicTournament,
      participants,
      matches,
      standings,
      champion,
    };
  },

  async getInvite(slug: string) {
    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [{ slug }, { inviteCode: slug }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        inviteCode: true,
        description: true,
        format: true,
        status: true,
        inviteEnabled: true,
        maxParticipants: true,
        _count: {
          select: {
            participants: {
              where: { status: { in: ['ACTIVE', 'PENDING'] } },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    const currentParticipants = tournament._count.participants;
    const remainingSlots =
      tournament.maxParticipants === null
        ? null
        : Math.max(tournament.maxParticipants - currentParticipants, 0);
    const hasAvailableSlot =
      tournament.maxParticipants === null || currentParticipants < tournament.maxParticipants;
    const canJoin =
      tournament.status === 'DRAFT' && tournament.inviteEnabled && hasAvailableSlot;

    return {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      inviteCode: tournament.inviteCode,
      description: tournament.description,
      format: tournament.format,
      status: tournament.status,
      inviteEnabled: tournament.inviteEnabled,
      maxParticipants: tournament.maxParticipants,
      currentParticipants,
      remainingSlots,
      totalParticipants: currentParticipants,
      canJoin,
    };
  },

  async join(slug: string, input: CreateParticipantInput) {
    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [{ slug }, { inviteCode: slug }],
      },
      select: {
        id: true,
        status: true,
        inviteEnabled: true,
        maxParticipants: true,
        _count: {
          select: {
            participants: {
              where: { status: { in: ['ACTIVE', 'PENDING'] } },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.status !== 'DRAFT') {
      throw new AppError('Tournament registrations are closed', 409);
    }

    if (!tournament.inviteEnabled) {
      throw new AppError('Tournament invite is disabled', 409);
    }

    if (
      tournament.maxParticipants !== null &&
      tournament._count.participants >= tournament.maxParticipants
    ) {
      throw new AppError('Tournament participant limit has been reached', 409);
    }

    return participantsService.createPending(tournament.id, input);
  },
};
