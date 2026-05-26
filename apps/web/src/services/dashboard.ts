import { authenticatedRequest } from '@/services/api-client';
import type { MatchPhase } from '@/services/matches';
import type { TournamentFormat, TournamentStatus } from '@/services/tournaments';

export type DashboardChampion = {
  id: string;
  name: string;
  nickname: string | null;
  teamName: string | null;
};

export type DashboardNextPendingMatch = {
  id: string;
  homeParticipantName: string;
  awayParticipantName: string;
  phase: MatchPhase;
  round: number | null;
};

export type DashboardTournamentSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
  champion: DashboardChampion | null;
  totalParticipants: number;
  totalMatches: number;
  finishedMatches: number;
  pendingMatches: number;
  publicPath: string;
  nextPendingMatch: DashboardNextPendingMatch | null;
};

export type DashboardStats = {
  totalTournaments: number;
  draftTournaments: number;
  inProgressTournaments: number;
  knockoutStageTournaments: number;
  finishedTournaments: number;
};

export type DashboardSummary = {
  stats: DashboardStats;
  tournaments: DashboardTournamentSummary[];
};

export function getDashboardSummary() {
  return authenticatedRequest<DashboardSummary>('/dashboard/summary');
}
