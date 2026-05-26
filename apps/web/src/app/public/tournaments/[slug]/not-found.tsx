import Link from 'next/link';

export default function PublicTournamentNotFound() {
  return (
    <main className="min-h-screen bg-pitch-950 px-6 py-8 text-slate-50">
      <section className="mx-auto w-full max-w-3xl">
        <div className="rounded-md border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-bold text-white">Campeonato nao encontrado</h1>
          <p className="mt-3 text-sm text-slate-300">
            Verifique se o link publico esta correto.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-lime-400 px-5 py-3 text-sm font-bold text-pitch-950 transition hover:bg-lime-300"
          >
            Voltar ao inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
