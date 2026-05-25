import { prisma } from '@fifa-tournament-manager/database';
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

  async listByTournament(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return prisma.participant.findMany({
      where: { tournamentId },
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
};
