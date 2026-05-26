'use client';

import { useMemo, useState } from 'react';

type InviteLinkCardProps = {
  slug: string;
};

export function InviteLinkCard({ slug }: InviteLinkCardProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `/join/${slug}`;
    }

    return `${window.location.origin}/join/${slug}`;
  }, [slug]);

  async function copyInviteLink() {
    try {
      await window.navigator.clipboard.writeText(inviteUrl);
      setFeedback('Link copiado');
    } catch {
      setFeedback('Nao foi possivel copiar automaticamente');
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Link de convite
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">Inscricoes abertas</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Compartilhe este link para amigos se cadastrarem como participantes enquanto o
            campeonato estiver em rascunho.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyInviteLink()}
          className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400"
        >
          Copiar link
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-sm text-zinc-300">
        <span className="block break-all">{inviteUrl}</span>
      </div>

      {feedback ? <p className="mt-3 text-sm font-semibold text-gold-400">{feedback}</p> : null}
    </section>
  );
}
