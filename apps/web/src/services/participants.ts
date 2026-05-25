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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function request<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Erro ao comunicar com a API');
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export function getParticipants(tournamentId: string) {
  return request<Participant[]>(`/tournaments/${tournamentId}/participants`);
}

export function createParticipant(
  tournamentId: string,
  payload: CreateParticipantPayload,
) {
  return request<Participant>(`/tournaments/${tournamentId}/participants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(id: string, payload: UpdateParticipantPayload) {
  return request<Participant>(`/participants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(id: string) {
  return request<void>(`/participants/${id}`, {
    method: 'DELETE',
  });
}
