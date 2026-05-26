import { authenticatedRequest } from '@/services/api-client';

export type ParticipantStatus = 'ACTIVE' | 'ELIMINATED' | 'CHAMPION';

export type Participant = {
  id: string;
  tournamentId: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateParticipantPayload = {
  name: string;
  nickname?: string | null;
  teamName?: string | null;
};

export type UpdateParticipantPayload = Partial<CreateParticipantPayload>;

export function getParticipants(tournamentId: string) {
  return authenticatedRequest<Participant[]>(`/tournaments/${tournamentId}/participants`);
}

export function createParticipant(
  tournamentId: string,
  payload: CreateParticipantPayload,
) {
  return authenticatedRequest<Participant>(`/tournaments/${tournamentId}/participants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(id: string, payload: UpdateParticipantPayload) {
  return authenticatedRequest<Participant>(`/participants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(id: string) {
  return authenticatedRequest<void>(`/participants/${id}`, {
    method: 'DELETE',
  });
}
