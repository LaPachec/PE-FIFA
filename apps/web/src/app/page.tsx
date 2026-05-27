import Link from 'next/link';

const formats = [
  {
    name: 'Liga',
    description: 'Todos contra todos, classificacao por pontos e campeao definido pela tabela.',
  },
  {
    name: 'Mata-mata',
    description: 'Chave eliminatoria com avanco automatico, final e decisao por penaltis.',
  },
  {
    name: 'Liga + Mata-mata',
    description: 'Fase de Liga para definir classificados e fase final para decidir o campeao.',
  },
];

const steps = [
  'Crie o campeonato',
  'Compartilhe o convite',
  'Aprove os participantes',
  'Registre resultados',
];

const features = [
  'Convite publico com aprovacao',
  'Resultados com penaltis no mata-mata',
  'Classificacao e estatisticas',
  'Pagina publica compartilhavel',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-arena-950 text-white">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-12 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-10">
        <div>
          <nav className="mb-16 flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-black uppercase tracking-[0.22em] text-gold-400">
              FTM
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-bold text-white transition hover:border-gold-500 hover:text-gold-400"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-arena-950 transition hover:bg-gold-400"
              >
                Criar conta
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
              Campeonatos de EA FC entre amigos
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              FIFA Tournament Manager
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Crie campeonatos de EA FC, convide amigos, aprove participantes,
              registre resultados e acompanhe classificacao, mata-mata,
              estatisticas e campeao em uma pagina publica.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-xl bg-gold-500 px-6 py-3 text-center text-sm font-black text-arena-950 transition hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              >
                Ir para dashboard
              </Link>
              <Link
                href="/tournaments/new"
                className="rounded-xl border border-arena-700 px-6 py-3 text-center text-sm font-black text-white transition hover:border-gold-500 hover:text-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                Criar campeonato
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-sm font-semibold text-zinc-200"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="pb-8 lg:pb-0">
          <div className="rounded-2xl border border-arena-700 bg-arena-900 p-4 shadow-2xl shadow-black/30 sm:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-arena-700 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                  Copa dos Amigos
                </span>
                <h2 className="mt-2 text-2xl font-black text-white">Final em andamento</h2>
              </div>
              <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-400">
                Ao vivo
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-arena-700 bg-arena-850 p-4">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Participantes
                </span>
                <strong className="mt-2 block text-2xl text-white">8</strong>
              </div>
              <div className="rounded-xl border border-arena-700 bg-arena-850 p-4">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Gols
                </span>
                <strong className="mt-2 block text-2xl text-white">42</strong>
              </div>
              <div className="rounded-xl border border-arena-700 bg-arena-850 p-4">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Media
                </span>
                <strong className="mt-2 block text-2xl text-white">3.5</strong>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <strong className="text-left text-white">Lucas</strong>
                <span className="rounded-lg bg-arena-950 px-4 py-2 font-black text-gold-400">
                  2 (5) x (4) 2
                </span>
                <strong className="text-right text-white">Pedro</strong>
              </div>
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
                Decidido nos penaltis
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-arena-700">
              <div className="grid grid-cols-[48px_1fr_80px] bg-arena-800 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                <span>#</span>
                <span>Participante</span>
                <span className="text-right">Pts</span>
              </div>
              {[
                ['1', 'Lucas', '12'],
                ['2', 'Pedro', '10'],
                ['3', 'Rafael', '7'],
              ].map(([position, name, points]) => (
                <div
                  key={name}
                  className="grid grid-cols-[48px_1fr_80px] border-t border-arena-700 bg-arena-850 px-4 py-3 text-sm"
                >
                  <span className={position === '1' ? 'font-black text-gold-400' : 'text-zinc-400'}>
                    {position}
                  </span>
                  <span className="font-semibold text-white">{name}</span>
                  <span className="text-right font-black text-gold-400">{points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-arena-700 bg-arena-900/70 px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
              Fluxo simples
            </span>
            <h2 className="mt-3 text-3xl font-black text-white">Do convite ao campeao</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-xl border border-arena-700 bg-arena-850 p-4">
                <span className="text-sm font-black text-gold-400">0{index + 1}</span>
                <strong className="mt-3 block text-white">{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
              Formatos disponiveis
            </span>
            <h2 className="mt-3 text-3xl font-black text-white">
              Escolha o modelo do campeonato
            </h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {formats.map((format) => (
              <div key={format.name} className="rounded-2xl border border-arena-700 bg-arena-900 p-5">
                <h3 className="text-xl font-black text-white">{format.name}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{format.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
