import { authenticatedRequest } from '@/services/api-client';

export type ParticipantStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ELIMINATED' | 'CHAMPION';

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

export function getPendingParticipants(tournamentId: string) {
  return authenticatedRequest<Participant[]>(
    `/tournaments/${tournamentId}/participants/pending`,
  );
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

export function approveParticipant(id: string) {
  return authenticatedRequest<Participant>(`/participants/${id}/approve`, {
    method: 'PATCH',
  });
}

export function rejectParticipant(id: string) {
  return authenticatedRequest<Participant>(`/participants/${id}/reject`, {
    method: 'PATCH',
  });
}
