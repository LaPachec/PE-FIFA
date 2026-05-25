import Link from 'next/link';
import { listTournaments } from '@/services/tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

export default async function DashboardPage() {
  const tournaments = await listTournaments().catch(() => []);

  return (
    <main className="min-h-screen bg-pitch-950 px-6 py-8 text-slate-50">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campeonatos</h1>
            <p className="mt-2 text-sm text-slate-300">
              Acompanhe os campeonatos criados no ambiente local.
            </p>
          </div>
          <Link
            href="/tournaments/new"
            className="rounded-md bg-lime-400 px-5 py-3 text-center text-sm font-bold text-pitch-950 transition hover:bg-lime-300"
          >
            Criar campeonato
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="rounded-md border border-white/10 bg-white/5 p-5 transition hover:border-lime-300/70"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{tournament.name}</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {tournament.description ?? 'Sem descrição'}
                    </p>
                  </div>
                  <div className="text-sm text-slate-300">
                    {formatLabels[tournament.format]} · {tournament.status}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/15 p-8 text-center">
              <h2 className="text-lg font-semibold text-white">Nenhum campeonato criado</h2>
              <p className="mt-2 text-sm text-slate-300">
                Crie o primeiro campeonato para começar a estruturar o MVP.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
