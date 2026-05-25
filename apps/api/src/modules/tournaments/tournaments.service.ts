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
};
