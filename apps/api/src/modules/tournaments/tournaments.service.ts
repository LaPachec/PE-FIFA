import { randomBytes } from 'node:crypto';
import {
  prisma,
  type MatchPhase,
  type MatchStatus,
  type Prisma,
  type TournamentFormat,
} from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import { calculateLeagueStandings } from '../standings/standings.service.js';
import type {
  CreateTournamentInput,
  UpdateInviteSettingsInput,
  UpdateTournamentInput,
} from './tournaments.schemas.js';

function createSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUniqueSlug(name: string) {
  const baseSlug = createSlug(name) || 'tournament';
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.tournament.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function createUniqueInviteCode() {
  let inviteCode = randomBytes(6).toString('hex');

  while (
    await prisma.tournament.findUnique({
      where: { inviteCode },
      select: { id: true },
    })
  ) {
    inviteCode = randomBytes(6).toString('hex');
  }

  return inviteCode;
}

function assertQualifiedCount(format: TournamentFormat, qualifiedCount?: number | null) {
  if (format === 'LEAGUE_KNOCKOUT' && !qualifiedCount) {
    throw new AppError('qualifiedCount is required for LEAGUE_KNOCKOUT tournaments', 400);
  }
}

function assertLeagueKnockoutStartRules(
  qualifiedCount: number | null,
  participantsCount: number,
) {
  if (!qualifiedCount) {
    throw new AppError('qualifiedCount is required for LEAGUE_KNOCKOUT tournaments', 400);
  }

  if (![2, 4, 8, 16].includes(qualifiedCount)) {
    throw new AppError('qualifiedCount must be 2, 4, 8 or 16', 400);
  }

  if (qualifiedCount > participantsCount) {
    throw new AppError('qualifiedCount cannot be greater than participants count', 400);
  }
}

function assertMaxParticipantsRules(input: {
  format: TournamentFormat;
  qualifiedCount: number | null;
  maxParticipants: number | null | undefined;
  currentJoinableParticipants: number;
}) {
  if (input.maxParticipants === null || input.maxParticipants === undefined) {
    return;
  }

  if (input.maxParticipants < input.currentJoinableParticipants) {
    throw new AppError(
      'maxParticipants cannot be lower than current active and pending participants count',
      400,
    );
  }

  if (input.format === 'KNOCKOUT' && ![4, 8, 16].includes(input.maxParticipants)) {
    throw new AppError('maxParticipants for KNOCKOUT tournaments must be 4, 8 or 16', 400);
  }

  if (
    input.format === 'LEAGUE_KNOCKOUT' &&
    input.qualifiedCount &&
    input.maxParticipants < input.qualifiedCount
  ) {
    throw new AppError('maxParticipants cannot be lower than qualifiedCount', 400);
  }
}

type MatchParticipant = {
  id: string;
};

type GeneratedMatch = {
  tournamentId: string;
  phase: MatchPhase;
  round: number;
  homeParticipantId: string;
  awayParticipantId: string;
  status: 'PENDING';
  matchOrder: number;
};

type TournamentMatch = {
  phase: MatchPhase;
  round: number | null;
  status: MatchStatus;
};

function createLeagueMatches(
  tournamentId: string,
  participants: MatchParticipant[],
  isTwoLegged: boolean,
) {
  const matchesToCreate: GeneratedMatch[] = [];
  let matchOrder = 1;

  for (let homeIndex = 0; homeIndex < participants.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < participants.length; awayIndex += 1) {
      const homeParticipant = participants[homeIndex];
      const awayParticipant = participants[awayIndex];

      matchesToCreate.push({
        tournamentId,
        phase: 'LEAGUE',
        round: matchOrder,
        homeParticipantId: homeParticipant.id,
        awayParticipantId: awayParticipant.id,
        status: 'PENDING',
        matchOrder,
      });
      matchOrder += 1;

      if (isTwoLegged) {
        matchesToCreate.push({
          tournamentId,
          phase: 'LEAGUE',
          round: matchOrder,
          homeParticipantId: awayParticipant.id,
          awayParticipantId: homeParticipant.id,
          status: 'PENDING',
          matchOrder,
        });
        matchOrder += 1;
      }
    }
  }

  return matchesToCreate;
}

function getKnockoutPhase(participantsCount: number): MatchPhase {
  if (participantsCount === 4) {
    return 'SEMI_FINAL';
  }

  if (participantsCount === 8) {
    return 'QUARTER_FINAL';
  }

  if (participantsCount === 16) {
    return 'ROUND_OF_16';
  }

  throw new AppError('KNOCKOUT tournaments must have exactly 4, 8 or 16 participants', 400);
}

function getLeagueKnockoutPhase(qualifiedCount: number): MatchPhase {
  if (qualifiedCount === 2) {
    return 'FINAL';
  }

  if (qualifiedCount === 4) {
    return 'SEMI_FINAL';
  }

  if (qualifiedCount === 8) {
    return 'QUARTER_FINAL';
  }

  if (qualifiedCount === 16) {
    return 'ROUND_OF_16';
  }

  throw new AppError('qualifiedCount must be 2, 4, 8 or 16', 400);
}

function createKnockoutFirstRoundMatches(
  tournamentId: string,
  participants: MatchParticipant[],
) {
  const phase = getKnockoutPhase(participants.length);
  const matchesToCreate: GeneratedMatch[] = [];

  for (let index = 0; index < participants.length / 2; index += 1) {
    const homeParticipant = participants[index];
    const awayParticipant = participants[participants.length - 1 - index];
    const matchOrder = index + 1;

    if (homeParticipant.id === awayParticipant.id) {
      throw new AppError('Cannot create a match with the same participant twice', 400);
    }

    matchesToCreate.push({
      tournamentId,
      phase,
      round: 1,
      homeParticipantId: homeParticipant.id,
      awayParticipantId: awayParticipant.id,
      status: 'PENDING',
      matchOrder,
    });
  }

  return matchesToCreate;
}

function createLeagueKnockoutStageMatches(
  tournamentId: string,
  participants: MatchParticipant[],
  qualifiedCount: number,
  round: number,
) {
  const phase = getLeagueKnockoutPhase(qualifiedCount);
  const matchesToCreate: GeneratedMatch[] = [];

  for (let index = 0; index < participants.length / 2; index += 1) {
    const homeParticipant = participants[index];
    const awayParticipant = participants[participants.length - 1 - index];
    const matchOrder = index + 1;

    if (!homeParticipant || !awayParticipant) {
      throw new AppError('Cannot generate knockout stage without all qualified participants', 409);
    }

    if (homeParticipant.id === awayParticipant.id) {
      throw new AppError('Cannot create a match with the same participant twice', 400);
    }

    matchesToCreate.push({
      tournamentId,
      phase,
      round,
      homeParticipantId: homeParticipant.id,
      awayParticipantId: awayParticipant.id,
      status: 'PENDING',
      matchOrder,
    });
  }

  return matchesToCreate;
}

export const tournamentsService = {
  async create(input: CreateTournamentInput, ownerId: string) {
    const slug = await createUniqueSlug(input.name);
    const inviteCode = await createUniqueInviteCode();

    return prisma.tournament.create({
      data: {
        ownerId,
        name: input.name,
        slug,
        inviteCode,
        description: input.description || null,
        format: input.format,
        status: 'DRAFT',
        isTwoLegged: input.isTwoLegged,
        qualifiedCount: input.format === 'LEAGUE_KNOCKOUT' ? input.qualifiedCount : null,
        hasThirdPlaceMatch: input.hasThirdPlaceMatch,
      },
    });
  },

  async list(ownerId: string) {
    return prisma.tournament.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string, ownerId: string) {
    const tournament = await prisma.tournament.findFirst({
      where: { id, ownerId },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return tournament;
  },

  async update(id: string, input: UpdateTournamentInput, ownerId: string) {
    const currentTournament = await this.findById(id, ownerId);
    const nextFormat = input.format ?? currentTournament.format;
    const nextQualifiedCount =
      input.qualifiedCount !== undefined
        ? input.qualifiedCount
        : currentTournament.qualifiedCount;

    assertQualifiedCount(nextFormat, nextQualifiedCount);

    const slug =
      input.name && input.name !== currentTournament.name
        ? await createUniqueSlug(input.name)
        : undefined;

    return prisma.tournament.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        format: input.format,
        isTwoLegged: input.isTwoLegged,
        qualifiedCount: nextFormat === 'LEAGUE_KNOCKOUT' ? nextQualifiedCount : null,
        hasThirdPlaceMatch: input.hasThirdPlaceMatch,
      },
    });
  },

  async delete(id: string, ownerId: string) {
    await this.findById(id, ownerId);

    await prisma.tournament.delete({
      where: { id },
    });
  },

  async updateInviteSettings(
    id: string,
    input: UpdateInviteSettingsInput,
    ownerId: string,
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
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

    if (tournament.ownerId !== ownerId) {
      throw new AppError('You do not have permission to manage this tournament', 403);
    }

    if (tournament.status !== 'DRAFT') {
      throw new AppError('Invite settings can only be changed while tournament is in DRAFT status', 409);
    }

    const nextMaxParticipants =
      input.maxParticipants !== undefined
        ? input.maxParticipants
        : tournament.maxParticipants;

    assertMaxParticipantsRules({
      format: tournament.format,
      qualifiedCount: tournament.qualifiedCount,
      maxParticipants: nextMaxParticipants,
      currentJoinableParticipants: tournament._count.participants,
    });

    return prisma.tournament.update({
      where: { id },
      data: {
        inviteEnabled: input.inviteEnabled,
        maxParticipants: input.maxParticipants,
      },
    });
  },

  async regenerateInviteCode(id: string, ownerId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.ownerId !== ownerId) {
      throw new AppError('You do not have permission to manage this tournament', 403);
    }

    const inviteCode = await createUniqueInviteCode();

    return prisma.tournament.update({
      where: { id },
      data: { inviteCode },
    });
  },

  async start(id: string, ownerId: string) {
    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const tournament = await transaction.tournament.findFirst({
        where: { id, ownerId },
        include: {
          participants: {
            where: { status: 'ACTIVE' },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!tournament) {
        throw new AppError('Tournament not found', 404);
      }

      if (tournament.status !== 'DRAFT') {
        throw new AppError('Tournament has already been started', 409);
      }

      if (
        (tournament.format === 'LEAGUE' || tournament.format === 'LEAGUE_KNOCKOUT') &&
        tournament.participants.length < 2
      ) {
        throw new AppError('Tournament must have at least 2 active participants to start', 400);
      }

      if (tournament.format === 'LEAGUE_KNOCKOUT') {
        assertLeagueKnockoutStartRules(
          tournament.qualifiedCount,
          tournament.participants.length,
        );
      }

      const existingMatchesCount = await transaction.match.count({
        where: { tournamentId: id },
      });

      if (existingMatchesCount > 0) {
        throw new AppError('Tournament already has generated matches', 409);
      }

      let matchesToCreate: GeneratedMatch[];

      if (tournament.format === 'LEAGUE' || tournament.format === 'LEAGUE_KNOCKOUT') {
        matchesToCreate = createLeagueMatches(
          id,
          tournament.participants,
          tournament.isTwoLegged,
        );
      } else if (tournament.format === 'KNOCKOUT') {
        matchesToCreate = createKnockoutFirstRoundMatches(id, tournament.participants);
      } else {
        throw new AppError('Unsupported tournament format', 400);
      }

      await transaction.match.createMany({
        data: matchesToCreate,
      });

      return transaction.tournament.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
        include: {
          matches: {
            orderBy: { matchOrder: 'asc' },
          },
        },
      });
    });
  },

  async finish(id: string, ownerId: string) {
    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const tournament = await transaction.tournament.findFirst({
        where: { id, ownerId },
        include: {
          participants: {
            where: {
              status: { in: ['ACTIVE', 'CHAMPION'] },
            },
            orderBy: { name: 'asc' },
          },
          matches: true,
        },
      });

      if (!tournament) {
        throw new AppError('Tournament not found', 404);
      }

      if (tournament.format !== 'LEAGUE') {
        throw new AppError('Only LEAGUE tournaments can be finished for now', 400);
      }

      if (tournament.status !== 'IN_PROGRESS') {
        throw new AppError('Tournament must be in progress to be finished', 409);
      }

      if (tournament.participants.length === 0) {
        throw new AppError('Tournament must have participants to be finished', 400);
      }

      if (tournament.matches.length === 0) {
        throw new AppError('Tournament must have matches to be finished', 400);
      }

      const hasPendingMatches = tournament.matches.some(
        (match: TournamentMatch) => match.status === 'PENDING',
      );

      if (hasPendingMatches) {
        throw new AppError('Tournament cannot be finished while matches are pending', 409);
      }

      const standings = calculateLeagueStandings(tournament.participants, tournament.matches);
      const champion = standings[0];

      if (!champion) {
        throw new AppError('Tournament champion could not be determined', 400);
      }

      await transaction.participant.update({
        where: { id: champion.participantId },
        data: { status: 'CHAMPION' },
      });

      return transaction.tournament.update({
        where: { id },
        data: {
          status: 'FINISHED',
          championParticipantId: champion.participantId,
        },
      });
    });
  },

  async generateKnockoutStage(id: string, ownerId: string) {
    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const tournament = await transaction.tournament.findFirst({
        where: { id, ownerId },
        include: {
          participants: {
            where: { status: 'ACTIVE' },
            orderBy: { name: 'asc' },
          },
          matches: true,
        },
      });

      if (!tournament) {
        throw new AppError('Tournament not found', 404);
      }

      if (tournament.format !== 'LEAGUE_KNOCKOUT') {
        throw new AppError('Only LEAGUE_KNOCKOUT tournaments can generate a knockout stage', 400);
      }

      if (tournament.status !== 'IN_PROGRESS') {
        throw new AppError('Tournament must be in progress to generate a knockout stage', 409);
      }

      assertLeagueKnockoutStartRules(
        tournament.qualifiedCount,
        tournament.participants.length,
      );

      const qualifiedCount = tournament.qualifiedCount;

      if (!qualifiedCount) {
        throw new AppError('qualifiedCount is required for LEAGUE_KNOCKOUT tournaments', 400);
      }

      const leagueMatches = tournament.matches.filter(
        (match: TournamentMatch) => match.phase === 'LEAGUE',
      );

      if (leagueMatches.length === 0) {
        throw new AppError('Tournament must have league matches before knockout stage', 400);
      }

      const hasPendingLeagueMatches = leagueMatches.some(
        (match: TournamentMatch) => match.status === 'PENDING',
      );

      if (hasPendingLeagueMatches) {
        throw new AppError('All league matches must be finished before knockout stage', 409);
      }

      const hasKnockoutMatches = tournament.matches.some(
        (match: TournamentMatch) => match.phase !== 'LEAGUE',
      );

      if (hasKnockoutMatches) {
        throw new AppError('Tournament already has knockout stage matches', 409);
      }

      const standings = calculateLeagueStandings(tournament.participants, leagueMatches);
      const qualifiedParticipants = standings
        .slice(0, qualifiedCount)
        .map((standing) => ({ id: standing.participantId }));

      if (qualifiedParticipants.length !== qualifiedCount) {
        throw new AppError('Not enough participants qualified for knockout stage', 400);
      }

      const nextRound =
        Math.max(...leagueMatches.map((match: TournamentMatch) => match.round ?? 0), 0) + 1;
      const matchesToCreate = createLeagueKnockoutStageMatches(
        id,
        qualifiedParticipants,
        qualifiedCount,
        nextRound,
      );

      await transaction.match.createMany({
        data: matchesToCreate,
      });

      return transaction.tournament.update({
        where: { id },
        data: { status: 'KNOCKOUT_STAGE' },
        include: {
          matches: {
            orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
          },
        },
      });
    });
  },
};
