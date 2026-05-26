import { authenticatedRequest } from '@/services/api-client';

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

export function getTournamentStandings(tournamentId: string) {
  return authenticatedRequest<StandingRow[]>(`/tournaments/${tournamentId}/standings`);
}
