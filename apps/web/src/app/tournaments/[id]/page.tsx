import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ParticipantsManager } from '@/components/participants/participants-manager';
import { TournamentLeaguePanel } from '@/components/tournaments/tournament-league-panel';
import { StatCard, StatusBadge } from '@/components/tournaments/tournament-visuals';
import { getTournament } from '@/services/tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

type TournamentDetailsPageProps = {
  params: {
    id: string;
  };
};

export default async function TournamentDetailsPage({
  params,
}: TournamentDetailsPageProps) {
  const tournament = await getTournament(params.id).catch(() => null);

  if (!tournament) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-arena-950 px-5 py-6 text-white sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard" className="text-sm font-semibold text-gold-500 transition hover:text-gold-400">
          Voltar para campeonatos
        </Link>

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
      </section>
    </main>
  );
}
