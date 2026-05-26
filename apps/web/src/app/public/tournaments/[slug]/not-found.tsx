import Link from 'next/link';

export default function PublicTournamentNotFound() {
  return (
    <main className="min-h-screen bg-arena-950 px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-arena-700 bg-arena-900 p-8">
          <h1 className="text-2xl font-bold text-white">Campeonato nao encontrado</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Verifique se o link publico esta correto.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400"
          >
            Voltar ao inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
