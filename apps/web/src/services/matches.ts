export type MatchPhase =
  | 'LEAGUE'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export type MatchStatus = 'PENDING' | 'FINISHED';

export type Match = {
  id: string;
  tournamentId: string;
  phase: MatchPhase;
  round: number | null;
  homeParticipantId: string | null;
  awayParticipantId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  winnerParticipantId: string | null;
  status: MatchStatus;
  matchOrder: number;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  playedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateMatchResultPayload = {
  homeScore: number;
  awayScore: number;
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

export function getTournamentMatches(tournamentId: string) {
  return request<Match[]>(`/tournaments/${tournamentId}/matches`);
}

export function updateMatchResult(id: string, payload: UpdateMatchResultPayload) {
  return request<Match>(`/matches/${id}/result`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
