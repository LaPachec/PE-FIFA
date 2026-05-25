import Link from 'next/link';
import { CreateTournamentForm } from '@/components/tournaments/create-tournament-form';

export default function NewTournamentPage() {
  return (
    <main className="min-h-screen bg-pitch-950 px-6 py-8 text-slate-50">
      <section className="mx-auto w-full max-w-3xl">
        <Link href="/dashboard" className="text-sm font-semibold text-lime-300 hover:text-lime-200">
          Voltar para campeonatos
        </Link>
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Criar campeonato</h1>
          <p className="mt-2 text-sm text-slate-300">
            Defina a base do campeonato. Participantes e partidas entram nas próximas etapas.
          </p>
        </div>
        <div className="mt-8 rounded-md border border-white/10 bg-white/5 p-6">
          <CreateTournamentForm />
        </div>
      </section>
    </main>
  );
}
