'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LogoutButton } from '@/components/auth/logout-button';
import { listTournaments, type Tournament } from '@/services/tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTournaments() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setTournaments(await listTournaments());
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar seus campeonatos.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadTournaments();
  }, []);

  return (
    <AuthGuard>
      {(user) => (
        <main className="min-h-screen bg-arena-950 px-6 py-8 text-white">
          <section className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-4 border-b border-arena-700 pb-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                  {user.name}
                </span>
                <h1 className="mt-2 text-3xl font-bold">Campeonatos</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Acompanhe os campeonatos vinculados a sua conta.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tournaments/new"
                  className="rounded-xl bg-gold-500 px-5 py-3 text-center text-sm font-bold text-arena-950 transition hover:bg-gold-400"
                >
                  Criar campeonato
                </Link>
                <LogoutButton />
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {isLoading ? (
                <div className="rounded-xl border border-arena-700 bg-arena-900 p-6 text-sm text-zinc-400">
                  Carregando campeonatos...
                </div>
              ) : errorMessage ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : tournaments.length > 0 ? (
                tournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="rounded-xl border border-arena-700 bg-arena-900 p-5 transition hover:border-gold-500/70"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{tournament.name}</h2>
                        <p className="mt-1 text-sm text-zinc-400">
                          {tournament.description ?? 'Sem descricao'}
                        </p>
                      </div>
                      <div className="text-sm text-zinc-400">
                        {formatLabels[tournament.format]} - {tournament.status}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center">
                  <h2 className="text-lg font-semibold text-white">Nenhum campeonato criado</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Crie o primeiro campeonato para comecar a estruturar o MVP.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      )}
    </AuthGuard>
  );
}
