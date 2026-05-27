import { authenticatedRequest } from '@/services/api-client';

export type TournamentFormat = 'LEAGUE' | 'KNOCKOUT' | 'LEAGUE_KNOCKOUT';
export type TournamentStatus = 'DRAFT' | 'IN_PROGRESS' | 'KNOCKOUT_STAGE' | 'FINISHED';

export type Tournament = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  inviteCode: string | null;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  isTwoLegged: boolean;
  qualifiedCount: number | null;
  maxParticipants: number | null;
  inviteEnabled: boolean;
  hasThirdPlaceMatch: boolean;
  championParticipantId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTournamentPayload = {
  name: string;
  description?: string | null;
  format: TournamentFormat;
  isTwoLegged: boolean;
  qualifiedCount?: number | null;
  hasThirdPlaceMatch: boolean;
};

export type UpdateInviteSettingsPayload = {
  inviteEnabled?: boolean;
  maxParticipants?: number | null;
};

export function listTournaments() {
  return authenticatedRequest<Tournament[]>('/tournaments');
}

export function getTournament(id: string) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}`);
}

export function createTournament(payload: CreateTournamentPayload) {
  return authenticatedRequest<Tournament>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function startTournament(id: string) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}/start`, {
    method: 'POST',
  });
}

export function finishTournament(id: string) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}/finish`, {
    method: 'POST',
  });
}

export function generateKnockoutStage(id: string) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}/generate-knockout-stage`, {
    method: 'POST',
  });
}

export function updateInviteSettings(
  id: string,
  payload: UpdateInviteSettingsPayload,
) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}/invite-settings`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function regenerateInviteCode(id: string) {
  return authenticatedRequest<Tournament>(`/tournaments/${id}/regenerate-invite-code`, {
    method: 'POST',
  });
}
