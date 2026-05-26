'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LogoutButton } from '@/components/auth/logout-button';
import {
  getDashboardSummary,
  type DashboardSummary,
  type DashboardTournamentSummary,
} from '@/services/dashboard';
import type { TournamentStatus } from '@/services/tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  KNOCKOUT_STAGE: 'Fase mata-mata',
  FINISHED: 'Finalizado',
};

const phaseLabels = {
  LEAGUE: 'Liga',
  ROUND_OF_16: 'Oitavas',
  QUARTER_FINAL: 'Quartas',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Terceiro lugar',
  FINAL: 'Final',
};

type DashboardFilter = 'ALL' | TournamentStatus;

const filters: Array<{ value: DashboardFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'KNOCKOUT_STAGE', label: 'Fase mata-mata' },
  { value: 'FINISHED', label: 'Finalizados' },
];

const emptySummary: DashboardSummary = {
  stats: {
    totalTournaments: 0,
    draftTournaments: 0,
    inProgressTournaments: 0,
    knockoutStageTournaments: 0,
    finishedTournaments: 0,
  },
  tournaments: [],
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-arena-700 bg-arena-900 p-5">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <strong className="mt-3 block text-3xl text-white">{value}</strong>
    </div>
  );
}

function StatusPill({ status }: { status: TournamentStatus }) {
  const isFinished = status === 'FINISHED';
  const isActive = status === 'IN_PROGRESS' || status === 'KNOCKOUT_STAGE';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
        isFinished
          ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
          : isActive
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-arena-700 bg-arena-850 text-zinc-300'
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}

function TournamentCard({ tournament }: { tournament: DashboardTournamentSummary }) {
  const progressLabel =
    tournament.totalMatches === 0
      ? 'Sem partidas'
      : `${tournament.finishedMatches}/${tournament.totalMatches} partidas finalizadas`;

  return (
    <article className="rounded-2xl border border-arena-700 bg-arena-900 p-5 transition hover:border-gold-500/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={tournament.status} />
            <span className="text-sm font-semibold text-gold-400">
              {formatLabels[tournament.format]}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">{tournament.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {tournament.description ?? 'Campeonato sem descricao.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-arena-950 transition hover:bg-gold-400"
          >
            Gerenciar
          </Link>
          <Link
            href={tournament.publicPath}
            className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400"
          >
            Pagina publica
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Participantes
          </span>
          <strong className="mt-2 block text-xl text-white">{tournament.totalParticipants}</strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Progresso
          </span>
          <strong className="mt-2 block text-sm text-white">{progressLabel}</strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Pendentes
          </span>
          <strong className="mt-2 block text-xl text-white">{tournament.pendingMatches}</strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Campeao
          </span>
          <strong className="mt-2 block truncate text-sm text-white">
            {tournament.champion?.name ?? 'A definir'}
          </strong>
        </div>
      </div>

      {tournament.nextPendingMatch ? (
        <div className="mt-4 rounded-xl border border-gold-700/40 bg-gold-700/10 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
            Proxima partida
          </span>
          <p className="mt-2 text-sm font-semibold text-white">
            {tournament.nextPendingMatch.homeParticipantName} x{' '}
            {tournament.nextPendingMatch.awayParticipantName}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {phaseLabels[tournament.nextPendingMatch.phase]} - Rodada{' '}
            {tournament.nextPendingMatch.round ?? '-'}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setSummary(await getDashboardSummary());
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar o resumo do dashboard.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const filteredTournaments = useMemo(() => {
    if (activeFilter === 'ALL') {
      return summary.tournaments;
    }

    return summary.tournaments.filter((tournament) => tournament.status === activeFilter);
  }, [activeFilter, summary.tournaments]);

  return (
    <AuthGuard>
      {(user) => (
        <main className="min-h-screen bg-arena-950 px-6 py-8 text-white">
          <section className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-4 border-b border-arena-700 pb-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                  {user.email}
                </span>
                <h1 className="mt-2 text-3xl font-bold">Ola, {user.name}</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Uma visao rapida dos seus campeonatos e proximas partidas.
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total" value={summary.stats.totalTournaments} />
              <StatCard label="Em rascunho" value={summary.stats.draftTournaments} />
              <StatCard
                label="Em andamento"
                value={summary.stats.inProgressTournaments + summary.stats.knockoutStageTournaments}
              />
              <StatCard label="Finalizados" value={summary.stats.finishedTournaments} />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-gold-500 bg-gold-500 text-arena-950'
                        : 'border-arena-700 text-zinc-300 hover:border-gold-500 hover:text-gold-400'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4">
              {isLoading ? (
                <div className="rounded-xl border border-arena-700 bg-arena-900 p-6 text-sm text-zinc-400">
                  Carregando resumo do dashboard...
                </div>
              ) : errorMessage ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : summary.tournaments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-arena-700 p-8 text-center">
                  <h2 className="text-lg font-semibold text-white">Nenhum campeonato criado</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Crie o primeiro campeonato para comecar a acompanhar seus torneios.
                  </p>
                  <Link
                    href="/tournaments/new"
                    className="mt-5 inline-flex rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400"
                  >
                    Criar campeonato
                  </Link>
                </div>
              ) : filteredTournaments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-arena-700 p-8 text-center">
                  <h2 className="text-lg font-semibold text-white">Nada neste filtro</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Escolha outro status para ver seus campeonatos.
                  </p>
                </div>
              ) : (
                filteredTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))
              )}
            </div>
          </section>
        </main>
      )}
    </AuthGuard>
  );
}
