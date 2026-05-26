import type { Match } from '@/services/matches';
import type { Participant } from '@/services/participants';
import type { StandingRow } from '@/services/standings';
import type { Tournament } from '@/services/tournaments';

export type PublicTournament = Omit<Tournament, 'ownerId'>;

export type PublicTournamentDetails = {
  tournament: PublicTournament;
  participants: Participant[];
  matches: Match[];
  standings: StandingRow[];
  champion: Participant | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function getPublicTournamentBySlug(slug: string) {
  const response = await fetch(`${apiUrl}/public/tournaments/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Erro ao carregar campeonato publico');
  }

  return response.json() as Promise<PublicTournamentDetails>;
}
