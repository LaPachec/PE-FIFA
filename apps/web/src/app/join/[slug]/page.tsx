'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  getTournamentInvite,
  joinTournamentByInvite,
  type TournamentInvite,
} from '@/services/public-tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

const statusLabels = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  KNOCKOUT_STAGE: 'Mata-mata',
  FINISHED: 'Finalizado',
};

function getClosedInviteMessage(invite: TournamentInvite) {
  if (invite.status !== 'DRAFT') {
    return 'Este campeonato ja foi iniciado.';
  }

  if (!invite.inviteEnabled) {
    return 'As inscricoes para este campeonato estao fechadas.';
  }

  if (invite.remainingSlots !== null && invite.remainingSlots <= 0) {
    return 'Todas as vagas deste campeonato ja foram preenchidas.';
  }

  return 'As inscricoes nao estao mais abertas.';
}

export default function JoinTournamentPage() {
  const params = useParams<{ slug: string }>();
  const [invite, setInvite] = useState<TournamentInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    async function loadInvite() {
      setIsLoading(true);
      setErrorMessage(null);
      setNotFound(false);

      try {
        const nextInvite = await getTournamentInvite(params.slug);

        if (!nextInvite) {
          setNotFound(true);
          return;
        }

        setInvite(nextInvite);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Nao foi possivel carregar o convite.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInvite();
  }, [params.slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await joinTournamentByInvite(params.slug, {
        name: name.trim(),
        nickname: nickname.trim() || null,
        teamName: teamName.trim() || null,
      });

      setSuccessMessage(
        'Inscricao enviada com sucesso! Aguarde a aprovacao do organizador.',
      );
      setName('');
      setNickname('');
      setTeamName('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel realizar a inscricao.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-arena-950 px-5 py-10 text-white">
      <section className="w-full max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-gold-400 transition hover:text-gold-300">
          FIFA Tournament Manager
        </Link>

        <div className="mt-6 rounded-3xl border border-arena-700 bg-arena-900 p-6 sm:p-8">
          {isLoading ? (
            <div className="rounded-xl border border-arena-700 bg-arena-950 p-6 text-sm text-zinc-400">
              Carregando convite...
            </div>
          ) : notFound ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Campeonato nao encontrado.
            </div>
          ) : invite ? (
            <>
              <div>
                <span className="inline-flex rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                  Convite
                </span>
                <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
                  {invite.name}
                </h1>
                <p className="mt-4 text-base leading-7 text-zinc-400">
                  {invite.description ?? 'Campeonato sem descricao.'}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Formato
                  </span>
                  <strong className="mt-2 block text-white">{formatLabels[invite.format]}</strong>
                </div>
                <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Status
                  </span>
                  <strong className="mt-2 block text-white">{statusLabels[invite.status]}</strong>
                </div>
                <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Participantes
                  </span>
                  <strong className="mt-2 block text-white">{invite.currentParticipants}</strong>
                </div>
                <div className="rounded-xl border border-arena-700 bg-arena-950 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Vagas
                  </span>
                  <strong className="mt-2 block text-white">
                    {invite.remainingSlots ?? 'Ilimitadas'}
                  </strong>
                </div>
              </div>

              {successMessage ? (
                <div className="mt-6 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm font-semibold text-gold-400">
                  {successMessage}
                </div>
              ) : invite.canJoin ? (
                <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-semibold text-zinc-100">
                      Nome
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="nickname" className="text-sm font-semibold text-zinc-100">
                      Apelido
                    </label>
                    <input
                      id="nickname"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="teamName" className="text-sm font-semibold text-zinc-100">
                      Time
                    </label>
                    <input
                      id="teamName"
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                      placeholder="Real Madrid"
                    />
                  </div>

                  {errorMessage ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {errorMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting || name.trim().length === 0}
                    className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar inscricao'}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
                  {getClosedInviteMessage(invite)}
                </div>
              )}

              {errorMessage && !invite.canJoin ? (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
