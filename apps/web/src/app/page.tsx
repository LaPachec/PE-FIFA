import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.18),_transparent_34%),linear-gradient(135deg,_#07110b_0%,_#0c1f13_50%,_#101827_100%)] px-6 py-8 text-slate-50">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-lime-400">
            EA FC tournaments
          </p>
          <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">
            FIFA Tournament Manager
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Organize campeonatos de FIFA/EA FC entre amigos, com ligas,
            mata-mata e fases finais automatizadas.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/tournaments/new"
              className="rounded-md bg-lime-400 px-6 py-3 text-center text-sm font-bold text-pitch-950 shadow-lg shadow-lime-950/30 transition hover:bg-lime-300"
            >
              Criar campeonato
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-white/20 bg-white/8 px-6 py-3 text-center text-sm font-bold text-white transition hover:border-lime-300 hover:text-lime-200"
            >
              Ver campeonatos
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 border-t border-white/10 pt-8 text-sm text-slate-300 sm:grid-cols-3">
          <div>
            <strong className="block text-white">API preparada</strong>
            <span>{apiUrl}</span>
          </div>
          <div>
            <strong className="block text-white">Formatos futuros</strong>
            <span>Liga, mata-mata e modelos mistos.</span>
          </div>
          <div>
            <strong className="block text-white">Base escalavel</strong>
            <span>Next.js, Express, Prisma e PostgreSQL.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
