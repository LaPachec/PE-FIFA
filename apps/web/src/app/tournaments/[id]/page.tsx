import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    <main className="min-h-screen bg-pitch-950 px-6 py-8 text-slate-50">
      <section className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard" className="text-sm font-semibold text-lime-300 hover:text-lime-200">
          Voltar para campeonatos
        </Link>

        <div className="mt-8 border-b border-white/10 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            {tournament.status}
          </p>
          <h1 className="mt-3 text-4xl font-bold">{tournament.name}</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            {tournament.description ?? 'Campeonato sem descrição.'}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Formato</span>
            <strong className="mt-2 block text-lg text-white">
              {formatLabels[tournament.format]}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Ida e volta</span>
            <strong className="mt-2 block text-lg text-white">
              {tournament.isTwoLegged ? 'Sim' : 'Não'}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Terceiro lugar</span>
            <strong className="mt-2 block text-lg text-white">
              {tournament.hasThirdPlaceMatch ? 'Sim' : 'Não'}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Classificados</span>
            <strong className="mt-2 block text-lg text-white">
              {tournament.qualifiedCount ?? 'Não se aplica'}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Slug</span>
            <strong className="mt-2 block break-all text-lg text-white">{tournament.slug}</strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Criado em</span>
            <strong className="mt-2 block text-lg text-white">
              {new Intl.DateTimeFormat('pt-BR').format(new Date(tournament.createdAt))}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}
