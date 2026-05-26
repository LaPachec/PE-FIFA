import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import { participantsService } from '../participants/participants.service.js';
import type { CreateParticipantInput } from '../participants/participants.schemas.js';
import { calculateLeagueStandings } from '../standings/standings.service.js';

export const publicTournamentsService = {
  async findBySlug(slug: string) {
    const tournament = await prisma.tournament.findUnique({
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
            (participant) => participant.id === tournament.championParticipantId,
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
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        format: true,
        status: true,
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      description: tournament.description,
      format: tournament.format,
      status: tournament.status,
      totalParticipants: tournament._count.participants,
      canJoin: tournament.status === 'DRAFT',
    };
  },

  async join(slug: string, input: CreateParticipantInput) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return participantsService.create(tournament.id, input);
  },
};
