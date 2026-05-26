import { authenticatedRequest } from '@/services/api-client';

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

export function getTournamentMatches(tournamentId: string) {
  return authenticatedRequest<Match[]>(`/tournaments/${tournamentId}/matches`);
}

export function updateMatchResult(id: string, payload: UpdateMatchResultPayload) {
  return authenticatedRequest<Match>(`/matches/${id}/result`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
