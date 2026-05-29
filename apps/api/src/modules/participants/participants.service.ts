import { prisma, type ParticipantStatus } from '@fifa-tournament-manager/database';
import { AppError } from '../../shared/errors/app-error.js';
import type {
  CreateParticipantInput,
  UpdateParticipantInput,
} from './participants.schemas.js';

function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

async function findDraftTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  if (tournament.status !== 'DRAFT') {
    throw new AppError('Participants can only be changed while tournament is in DRAFT status', 409);
  }

  return tournament;
}

async function findParticipantOrThrow(id: string) {
  const participant = await prisma.participant.findUnique({
    where: { id },
  });

  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  return participant;
}

async function findParticipantWithTournamentOrThrow(id: string) {
  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      tournament: {
        select: {
          id: true,
          ownerId: true,
          status: true,
        },
      },
    },
  });

  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  return participant;
}

function assertPendingParticipantAction(input: {
  participantStatus: ParticipantStatus;
  tournamentStatus: string;
  tournamentOwnerId: string;
  userId: string;
}) {
  if (input.tournamentOwnerId !== input.userId) {
    throw new AppError('You do not have permission to manage this participant', 403);
  }

  if (input.tournamentStatus !== 'DRAFT') {
    throw new AppError('Pending participants can only be changed while tournament is in DRAFT status', 409);
  }

  if (input.participantStatus !== 'PENDING') {
    throw new AppError('Only PENDING participants can be approved or rejected', 409);
  }
}

async function assertUniqueParticipantFields(input: {
  tournamentId: string;
  name?: string;
  nickname?: string | null;
  ignoreParticipantId?: string;
}) {
  if (input.name) {
    const participantWithName = await prisma.participant.findFirst({
      where: {
        tournamentId: input.tournamentId,
        name: input.name,
        NOT: input.ignoreParticipantId ? { id: input.ignoreParticipantId } : undefined,
      },
      select: { id: true },
    });

    if (participantWithName) {
      throw new AppError('A participant with this name already exists in this tournament', 409);
    }
  }

  if (input.nickname) {
    const participantWithNickname = await prisma.participant.findFirst({
      where: {
        tournamentId: input.tournamentId,
        nickname: input.nickname,
        NOT: input.ignoreParticipantId ? { id: input.ignoreParticipantId } : undefined,
      },
      select: { id: true },
    });

    if (participantWithNickname) {
      throw new AppError('A participant with this nickname already exists in this tournament', 409);
    }
  }
}

export const participantsService = {
  async create(tournamentId: string, input: CreateParticipantInput) {
    await findDraftTournament(tournamentId);

    const nickname = normalizeOptionalText(input.nickname);
    const teamName = normalizeOptionalText(input.teamName);

    await assertUniqueParticipantFields({
      tournamentId,
      name: input.name,
      nickname,
    });

    return prisma.participant.create({
      data: {
        tournamentId,
        name: input.name,
        nickname,
        teamName,
        status: 'ACTIVE',
      },
    });
  },

  async createPending(tournamentId: string, input: CreateParticipantInput) {
    await findDraftTournament(tournamentId);

    const nickname = normalizeOptionalText(input.nickname);
    const teamName = normalizeOptionalText(input.teamName);

    await assertUniqueParticipantFields({
      tournamentId,
      name: input.name,
      nickname,
    });

    const participant = await prisma.participant.create({
      data: {
        tournamentId,
        name: input.name,
        nickname,
        teamName,
        status: 'PENDING',
      },
    });

    return {
      message: 'Registration received and is awaiting approval',
      participant,
    };
  },

  async listByTournament(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return prisma.participant.findMany({
      where: { tournamentId, status: { in: ['ACTIVE', 'ELIMINATED', 'CHAMPION'] } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async listPendingByTournament(tournamentId: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, ownerId: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.ownerId !== userId) {
      throw new AppError('You do not have permission to manage this tournament', 403);
    }

    return prisma.participant.findMany({
      where: { tournamentId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(id: string) {
    return findParticipantOrThrow(id);
  },

  async update(id: string, input: UpdateParticipantInput) {
    const participant = await findParticipantOrThrow(id);

    await findDraftTournament(participant.tournamentId);

    const nextName = input.name ?? participant.name;
    const nextNickname =
      input.nickname !== undefined
        ? normalizeOptionalText(input.nickname)
        : participant.nickname;
    const nextTeamName =
      input.teamName !== undefined ? normalizeOptionalText(input.teamName) : undefined;

    await assertUniqueParticipantFields({
      tournamentId: participant.tournamentId,
      name: nextName,
      nickname: nextNickname,
      ignoreParticipantId: id,
    });

    return prisma.participant.update({
      where: { id },
      data: {
        name: input.name,
        nickname: input.nickname !== undefined ? nextNickname : undefined,
        teamName: nextTeamName,
      },
    });
  },

  async delete(id: string) {
    const participant = await findParticipantOrThrow(id);

    await findDraftTournament(participant.tournamentId);

    await prisma.participant.delete({
      where: { id },
    });
  },

  async approve(id: string, userId: string) {
    const participant = await findParticipantWithTournamentOrThrow(id);

    assertPendingParticipantAction({
      participantStatus: participant.status,
      tournamentStatus: participant.tournament.status,
      tournamentOwnerId: participant.tournament.ownerId,
      userId,
    });

    return prisma.participant.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  },

  async approveAllPending(tournamentId: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, ownerId: true, status: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.ownerId !== userId) {
      throw new AppError('You do not have permission to manage this tournament', 403);
    }

    if (tournament.status !== 'DRAFT') {
      throw new AppError('Pending participants can only be approved while tournament is in DRAFT status', 409);
    }

    await prisma.participant.updateMany({
      where: { tournamentId, status: 'PENDING' },
      data: { status: 'ACTIVE' },
    });

    return prisma.participant.findMany({
      where: { tournamentId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
  },

  async reject(id: string, userId: string) {
    const participant = await findParticipantWithTournamentOrThrow(id);

    assertPendingParticipantAction({
      participantStatus: participant.status,
      tournamentStatus: participant.tournament.status,
      tournamentOwnerId: participant.tournament.ownerId,
      userId,
    });

    return prisma.participant.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  },
};
