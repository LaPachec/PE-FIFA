export type StandingRow = {
  position: number;
  participantId: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
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

export function getTournamentStandings(tournamentId: string) {
  return request<StandingRow[]>(`/tournaments/${tournamentId}/standings`);
}
