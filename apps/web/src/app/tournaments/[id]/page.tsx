'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ParticipantsManager } from '@/components/participants/participants-manager';
import { InviteLinkCard } from '@/components/tournaments/invite-link-card';
import { TournamentLeaguePanel } from '@/components/tournaments/tournament-league-panel';
import { StatCard, StatusBadge } from '@/components/tournaments/tournament-visuals';
import { getTournament, type Tournament } from '@/services/tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

export default function TournamentDetailsPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTournament() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setTournament(await getTournament(params.id));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar o campeonato.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadTournament();
  }, [params.id]);

  return (
    <AuthGuard>
      {() => (
        <main className="min-h-screen bg-arena-950 px-5 py-6 text-white sm:px-6 sm:py-8">
          <section className="mx-auto w-full max-w-5xl">
            <Link href="/dashboard" className="text-sm font-semibold text-gold-500 transition hover:text-gold-400">
              Voltar para campeonatos
            </Link>

            {isLoading ? (
              <div className="mt-8 rounded-2xl border border-arena-700 bg-arena-900 p-6 text-sm text-zinc-400">
                Carregando campeonato...
              </div>
            ) : errorMessage || !tournament ? (
              <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage ?? 'Campeonato nao encontrado.'}
              </div>
            ) : (
              <>
                <div className="mt-8 rounded-3xl border border-arena-700 bg-arena-900 p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <StatusBadge status={tournament.status} />
                      <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        {tournament.name}
                      </h1>
                      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                        {tournament.description ?? 'Campeonato sem descricao.'}
                      </p>
                    </div>
                    <Link
                      href={`/public/tournaments/${tournament.slug}`}
                      className="rounded-xl border border-gold-500/40 px-4 py-2 text-center text-sm font-bold text-gold-400 transition hover:border-gold-400 hover:bg-gold-500/10 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    >
                      Ver pagina publica
                    </Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard label="Formato" value={formatLabels[tournament.format]} />
                  <StatCard label="Ida e volta" value={tournament.isTwoLegged ? 'Sim' : 'Nao'} />
                  <StatCard label="Terceiro lugar" value={tournament.hasThirdPlaceMatch ? 'Sim' : 'Nao'} />
                  <StatCard label="Classificados" value={tournament.qualifiedCount ?? 'Nao se aplica'} />
                  <StatCard label="Slug" value={<span className="break-all">{tournament.slug}</span>} />
                  <StatCard
                    label="Criado em"
                    value={new Intl.DateTimeFormat('pt-BR').format(new Date(tournament.createdAt))}
                  />
                </div>

                {tournament.status === 'DRAFT' ? (
                  <InviteLinkCard slug={tournament.slug} />
                ) : null}

                <ParticipantsManager
                  tournamentId={tournament.id}
                  tournamentStatus={tournament.status}
                />

                <TournamentLeaguePanel
                  tournamentId={tournament.id}
                  tournamentFormat={tournament.format}
                  tournamentStatus={tournament.status}
                  qualifiedCount={tournament.qualifiedCount}
                  championParticipantId={tournament.championParticipantId}
                />
              </>
            )}
          </section>
        </main>
      )}
    </AuthGuard>
  );
}
