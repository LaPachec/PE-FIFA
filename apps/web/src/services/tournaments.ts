import { authenticatedRequest } from '@/services/api-client';

export type TournamentFormat = 'LEAGUE' | 'KNOCKOUT' | 'LEAGUE_KNOCKOUT';
export type TournamentStatus = 'DRAFT' | 'IN_PROGRESS' | 'KNOCKOUT_STAGE' | 'FINISHED';

export type Tournament = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  isTwoLegged: boolean;
  qualifiedCount: number | null;
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
