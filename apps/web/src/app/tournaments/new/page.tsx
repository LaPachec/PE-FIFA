'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CreateTournamentForm } from '@/components/tournaments/create-tournament-form';

export default function NewTournamentPage() {
  return (
    <AuthGuard>
      {() => (
        <main className="min-h-screen bg-arena-950 px-6 py-8 text-white">
          <section className="mx-auto w-full max-w-3xl">
            <Link href="/dashboard" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              Voltar para campeonatos
            </Link>
            <div className="mt-8">
              <h1 className="text-3xl font-bold">Criar campeonato</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Defina a base do campeonato. Participantes e partidas entram nas proximas etapas.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-arena-700 bg-arena-900 p-6">
              <CreateTournamentForm />
            </div>
          </section>
        </main>
      )}
    </AuthGuard>
  );
}
