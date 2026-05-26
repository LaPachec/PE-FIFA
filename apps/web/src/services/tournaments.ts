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

  return response.json() as Promise<TResponse>;
}

export function listTournaments() {
  return request<Tournament[]>('/tournaments');
}

export function getTournament(id: string) {
  return request<Tournament>(`/tournaments/${id}`);
}

export function createTournament(payload: CreateTournamentPayload) {
  return request<Tournament>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function startTournament(id: string) {
  return request<Tournament>(`/tournaments/${id}/start`, {
    method: 'POST',
  });
}

export function finishTournament(id: string) {
  return request<Tournament>(`/tournaments/${id}/finish`, {
    method: 'POST',
  });
}

export function generateKnockoutStage(id: string) {
  return request<Tournament>(`/tournaments/${id}/generate-knockout-stage`, {
    method: 'POST',
  });
}
