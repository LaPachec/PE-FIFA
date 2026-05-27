'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  regenerateInviteCode,
  updateInviteSettings,
  type Tournament,
} from '@/services/tournaments';
import {
  getTournamentInvite,
  type TournamentInvite,
} from '@/services/public-tournaments';

type InviteLinkCardProps = {
  tournament: Tournament;
  onTournamentUpdated?: (tournament: Tournament) => void;
};

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

function getInvitePath(tournament: Tournament) {
  return `/join/${tournament.inviteCode ?? tournament.slug}`;
}

export function InviteLinkCard({
  tournament,
  onTournamentUpdated,
}: InviteLinkCardProps) {
  const canEditInvite = tournament.status === 'DRAFT';
  const [invite, setInvite] = useState<TournamentInvite | null>(null);
  const [inviteEnabled, setInviteEnabled] = useState(tournament.inviteEnabled);
  const [maxParticipants, setMaxParticipants] = useState(
    tournament.maxParticipants?.toString() ?? '',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const invitePath = getInvitePath(tournament);
  const inviteUrl = useMemo(() => {
    if (publicAppUrl) {
      return `${publicAppUrl.replace(/\/$/, '')}${invitePath}`;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}${invitePath}`;
    }

    return invitePath;
  }, [invitePath]);

  const loadInvite = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextInvite = await getTournamentInvite(tournament.inviteCode ?? tournament.slug);
      setInvite(nextInvite);
      setInviteEnabled(nextInvite?.inviteEnabled ?? tournament.inviteEnabled);
      setMaxParticipants(nextInvite?.maxParticipants?.toString() ?? '');
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel carregar o convite.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tournament.inviteCode, tournament.inviteEnabled, tournament.slug]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  async function copyInviteLink() {
    try {
      await window.navigator.clipboard.writeText(inviteUrl);
      setFeedback({ type: 'success', message: 'Link copiado.' });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Nao foi possivel copiar automaticamente.',
      });
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    const parsedMaxParticipants =
      maxParticipants.trim().length > 0 ? Number(maxParticipants) : null;

    try {
      const updatedTournament = await updateInviteSettings(tournament.id, {
        inviteEnabled,
        maxParticipants: parsedMaxParticipants,
      });

      onTournamentUpdated?.(updatedTournament);
      setFeedback({ type: 'success', message: 'Configuracoes do convite atualizadas.' });
      await loadInvite();
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o convite.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerateInviteCode() {
    const confirmed = window.confirm(
      'Deseja regenerar o link de convite? O link anterior deixara de ser o recomendado para compartilhamento.',
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setIsRegenerating(true);

    try {
      const updatedTournament = await regenerateInviteCode(tournament.id);
      onTournamentUpdated?.(updatedTournament);
      setFeedback({ type: 'success', message: 'Codigo de convite regenerado.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel regenerar o convite.',
      });
    } finally {
      setIsRegenerating(false);
    }
  }

  const isLimitReached =
    invite?.remainingSlots !== null && invite?.remainingSlots !== undefined
      ? invite.remainingSlots <= 0
      : false;

  return (
    <section className="mt-8 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Link de convite
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {inviteEnabled && canEditInvite ? 'Inscricoes abertas' : 'Convite controlado'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Compartilhe o link para amigos se cadastrarem como participantes. Inscricoes por
            convite entram como pendentes ate aprovacao.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyInviteLink()}
          className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        >
          Copiar link
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-sm text-zinc-300">
        <span className="block break-all">{inviteUrl}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Status
          </span>
          <strong className={inviteEnabled ? 'mt-2 block text-gold-400' : 'mt-2 block text-zinc-300'}>
            {inviteEnabled ? 'Ativo' : 'Inativo'}
          </strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Participantes
          </span>
          <strong className="mt-2 block text-white">
            {isLoading ? '...' : invite?.currentParticipants ?? 0}
          </strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Limite
          </span>
          <strong className="mt-2 block text-white">
            {invite?.maxParticipants ?? 'Sem limite'}
          </strong>
        </div>
        <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Vagas
          </span>
          <strong className={isLimitReached ? 'mt-2 block text-red-100' : 'mt-2 block text-white'}>
            {invite?.remainingSlots ?? 'Ilimitadas'}
          </strong>
        </div>
      </div>

      {!canEditInvite ? (
        <div className="mt-5 rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          As inscricoes foram encerradas porque o campeonato ja foi iniciado.
        </div>
      ) : null}

      {isLimitReached ? (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Limite de participantes atingido.
        </div>
      ) : null}

      {canEditInvite ? (
        <form onSubmit={handleSave} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <label className="flex items-center gap-3 rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-sm font-semibold text-zinc-100">
            <input
              type="checkbox"
              checked={inviteEnabled}
              onChange={(event) => setInviteEnabled(event.target.checked)}
              className="h-4 w-4 accent-gold-500"
            />
            Convite ativo
          </label>

          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Limite maximo
            <input
              type="number"
              min={1}
              step={1}
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(event.target.value)}
              className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-gold-500"
              placeholder="Sem limite"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>

          <button
            type="button"
            onClick={() => void handleRegenerateInviteCode()}
            disabled={isRegenerating}
            className="rounded-xl border border-arena-700 px-5 py-3 text-sm font-bold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRegenerating ? 'Gerando...' : 'Regenerar link'}
          </button>
        </form>
      ) : null}

      {feedback ? (
        <p
          className={`mt-3 text-sm font-semibold ${
            feedback.type === 'success' ? 'text-gold-400' : 'text-red-100'
          }`}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
