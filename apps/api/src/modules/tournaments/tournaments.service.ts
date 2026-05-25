import { prisma, type TournamentFormat } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import type {
  CreateTournamentInput,
  UpdateTournamentInput,
} from './tournaments.schemas.js';

const TEMP_OWNER_EMAIL = 'local-owner@fifa-tournament-manager.dev';

async function getTemporaryOwnerId() {
  // Temporary owner until real authentication is implemented.
  const owner = await prisma.user.upsert({
    where: { email: TEMP_OWNER_EMAIL },
    update: {},
    create: {
      name: 'Local Owner',
      email: TEMP_OWNER_EMAIL,
      passwordHash: 'temporary-password-hash',
    },
    select: { id: true },
  });

  return owner.id;
}

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

function assertQualifiedCount(format: TournamentFormat, qualifiedCount?: number | null) {
  if (format === 'LEAGUE_KNOCKOUT' && !qualifiedCount) {
    throw new AppError('qualifiedCount is required for LEAGUE_KNOCKOUT tournaments', 400);
  }
}

export const tournamentsService = {
  async create(input: CreateTournamentInput) {
    const ownerId = await getTemporaryOwnerId();
    const slug = await createUniqueSlug(input.name);

    return prisma.tournament.create({
      data: {
        ownerId,
        name: input.name,
        slug,
        description: input.description || null,
        format: input.format,
        status: 'DRAFT',
        isTwoLegged: input.isTwoLegged,
        qualifiedCount: input.format === 'LEAGUE_KNOCKOUT' ? input.qualifiedCount : null,
        hasThirdPlaceMatch: input.hasThirdPlaceMatch,
      },
    });
  },

  async list() {
    return prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return tournament;
  },

  async update(id: string, input: UpdateTournamentInput) {
    const currentTournament = await this.findById(id);
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

  async delete(id: string) {
    await this.findById(id);

    await prisma.tournament.delete({
      where: { id },
    });
  },

  async start(id: string) {
    return prisma.$transaction(async (transaction) => {
      const tournament = await transaction.tournament.findUnique({
        where: { id },
        include: {
          participants: {
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

      if (tournament.format !== 'LEAGUE') {
        throw new AppError('Only LEAGUE tournaments can be started for now', 400);
      }

      if (tournament.participants.length < 3) {
        throw new AppError('Tournament must have at least 3 participants to start', 400);
      }

      const existingMatchesCount = await transaction.match.count({
        where: { tournamentId: id },
      });

      if (existingMatchesCount > 0) {
        throw new AppError('Tournament already has generated matches', 409);
      }

      const matchesToCreate = [];
      let matchOrder = 1;

      for (let homeIndex = 0; homeIndex < tournament.participants.length; homeIndex += 1) {
        for (
          let awayIndex = homeIndex + 1;
          awayIndex < tournament.participants.length;
          awayIndex += 1
        ) {
          const homeParticipant = tournament.participants[homeIndex];
          const awayParticipant = tournament.participants[awayIndex];

          matchesToCreate.push({
            tournamentId: id,
            phase: 'LEAGUE' as const,
            round: matchOrder,
            homeParticipantId: homeParticipant.id,
            awayParticipantId: awayParticipant.id,
            status: 'PENDING' as const,
            matchOrder,
          });
          matchOrder += 1;

          if (tournament.isTwoLegged) {
            matchesToCreate.push({
              tournamentId: id,
              phase: 'LEAGUE' as const,
              round: matchOrder,
              homeParticipantId: awayParticipant.id,
              awayParticipantId: homeParticipant.id,
              status: 'PENDING' as const,
              matchOrder,
            });
            matchOrder += 1;
          }
        }
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
};
