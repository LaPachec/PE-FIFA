'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTournamentMatches,
  updateMatchResult,
  type Match,
} from '@/services/matches';
import { getParticipants, type Participant } from '@/services/participants';
import {
  finishTournament,
  startTournament,
  type Tournament,
  type TournamentFormat,
  type TournamentStatus,
} from '@/services/tournaments';
import { SectionShell } from '@/components/tournaments/tournament-visuals';

type TournamentMatchesProps = {
  tournamentId: string;
  tournamentFormat: TournamentFormat;
  tournamentStatus: TournamentStatus;
  championParticipantId: string | null;
  onMatchesChanged?: () => void;
  onTournamentStatusChanged?: (tournament: Tournament) => void;
};

type ResultFormState = {
  homeScore: string;
  awayScore: string;
};

const phaseLabels: Record<Match['phase'], string> = {
  LEAGUE: 'Liga',
  ROUND_OF_16: 'Oitavas de final',
  QUARTER_FINAL: 'Quartas de final',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Terceiro lugar',
  FINAL: 'Final',
};

const phaseOrder: Record<Match['phase'], number> = {
  LEAGUE: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

const statusLabels: Record<Match['status'], string> = {
  PENDING: 'Pendente',
  FINISHED: 'Finalizada',
};

const emptyResultForm: ResultFormState = {
  homeScore: '',
  awayScore: '',
};

function isKnockoutPhase(phase: Match['phase']) {
  return phase !== 'LEAGUE';
}

function getResultFormError(form: ResultFormState, match: Match) {
  if (!form.homeScore.trim() || !form.awayScore.trim()) {
    return 'Informe o placar do mandante e do visitante.';
  }

  if (!/^\d+$/.test(form.homeScore.trim()) || !/^\d+$/.test(form.awayScore.trim())) {
    return 'O placar deve ser um numero inteiro maior ou igual a zero.';
  }

  if (
    isKnockoutPhase(match.phase) &&
    Number(form.homeScore) === Number(form.awayScore)
  ) {
    return 'Partidas de mata-mata precisam ter um vencedor.';
  }

  return null;
}

export function TournamentMatches({
  tournamentId,
  tournamentFormat,
  tournamentStatus,
  championParticipantId,
  onMatchesChanged,
  onTournamentStatusChanged,
}: TournamentMatchesProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TournamentStatus>(tournamentStatus);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentChampionParticipantId, setCurrentChampionParticipantId] = useState<string | null>(
    championParticipantId,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [savingResultMatchId, setSavingResultMatchId] = useState<string | null>(null);
  const [editingResultMatchId, setEditingResultMatchId] = useState<string | null>(null);
  const [resultForm, setResultForm] = useState<ResultFormState>(emptyResultForm);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const participantNameById = useMemo(() => {
    return new Map(
      participants.map((participant) => [
        participant.id,
        participant.nickname || participant.name,
      ]),
    );
  }, [participants]);

  const championParticipant = useMemo(() => {
    if (!currentChampionParticipantId) {
      return null;
    }

    return (
      participants.find((participant) => participant.id === currentChampionParticipantId) ?? null
    );
  }, [currentChampionParticipantId, participants]);

  const matchGroups = useMemo(() => {
    const groups = new Map<Match['phase'], Match[]>();

    for (const match of matches) {
      const currentGroup = groups.get(match.phase) ?? [];
      currentGroup.push(match);
      groups.set(match.phase, currentGroup);
    }

    return Array.from(groups.entries())
      .sort(([phaseA], [phaseB]) => phaseOrder[phaseA] - phaseOrder[phaseB])
      .map(([phase, phaseMatches]) => ({
        phase,
        matches: [...phaseMatches].sort((matchA, matchB) => {
          if ((matchA.round ?? 0) !== (matchB.round ?? 0)) {
            return (matchA.round ?? 0) - (matchB.round ?? 0);
          }

          return matchA.matchOrder - matchB.matchOrder;
        }),
      }));
  }, [matches]);

  const canStartTournament = currentStatus === 'DRAFT' && !isStarting;
  const hasPendingMatches = matches.some((match) => match.status === 'PENDING');
  const canFinishTournament =
    tournamentFormat === 'LEAGUE' &&
    currentStatus === 'IN_PROGRESS' &&
    matches.length > 0 &&
    !hasPendingMatches &&
    !isFinishing;
  const isSavingResult = savingResultMatchId !== null;

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const [nextMatches, nextParticipants] = await Promise.all([
        getTournamentMatches(tournamentId),
        getParticipants(tournamentId),
      ]);

      setMatches(nextMatches);
      setParticipants(nextParticipants);
      setEditingResultMatchId(null);
      setResultForm(emptyResultForm);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar as partidas.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setCurrentStatus(tournamentStatus);
  }, [tournamentStatus]);

  useEffect(() => {
    setCurrentChampionParticipantId(championParticipantId);
  }, [championParticipantId]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  async function handleStartTournament() {
    setIsStarting(true);
    setFeedback(null);

    try {
      const tournament = await startTournament(tournamentId);
      setCurrentStatus(tournament.status);
      await loadMatches();
      onMatchesChanged?.();
      onTournamentStatusChanged?.(tournament);
      router.refresh();
      setFeedback({ type: 'success', message: 'Campeonato iniciado com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel iniciar o campeonato.',
      });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleFinishTournament() {
    const confirmed = window.confirm(
      'Deseja finalizar este campeonato? Esta acao define o campeao pela classificacao atual.',
    );

    if (!confirmed) {
      return;
    }

    setIsFinishing(true);
    setFeedback(null);

    try {
      const tournament = await finishTournament(tournamentId);
      setCurrentStatus(tournament.status);
      onMatchesChanged?.();
      onTournamentStatusChanged?.(tournament);
      router.refresh();
      setFeedback({ type: 'success', message: 'Campeonato finalizado com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel finalizar o campeonato.',
      });
    } finally {
      setIsFinishing(false);
    }
  }

  function getParticipantName(participantId: string | null) {
    if (!participantId) {
      return 'A definir';
    }

    return participantNameById.get(participantId) ?? 'Participante removido';
  }

  function getScoreLabel(match: Match) {
    if (match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) {
      return 'x';
    }

    return `${match.homeScore} x ${match.awayScore}`;
  }

  function startResultEditing(match: Match) {
    setEditingResultMatchId(match.id);
    setResultForm({
      homeScore: match.homeScore === null ? '' : String(match.homeScore),
      awayScore: match.awayScore === null ? '' : String(match.awayScore),
    });
    setFeedback(null);
  }

  function cancelResultEditing() {
    setEditingResultMatchId(null);
    setResultForm(emptyResultForm);
    setFeedback(null);
  }

  async function handleSaveResult(event: FormEvent<HTMLFormElement>, matchId: string) {
    event.preventDefault();
    setFeedback(null);

    const currentMatch = matches.find((match) => match.id === matchId);

    if (!currentMatch) {
      setFeedback({ type: 'error', message: 'Partida nao encontrada na tela.' });
      return;
    }

    const validationError = getResultFormError(resultForm, currentMatch);

    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }

    setSavingResultMatchId(matchId);

    try {
      const match = await updateMatchResult(matchId, {
        homeScore: Number(resultForm.homeScore),
        awayScore: Number(resultForm.awayScore),
      });

      if (tournamentFormat === 'KNOCKOUT' && match.phase === 'FINAL' && match.winnerParticipantId) {
        setCurrentStatus('FINISHED');
        setCurrentChampionParticipantId(match.winnerParticipantId);
      }

      await loadMatches();
      setEditingResultMatchId(null);
      setResultForm(emptyResultForm);
      onMatchesChanged?.();
      router.refresh();
      setFeedback({ type: 'success', message: 'Resultado salvo com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel salvar o resultado.',
      });
    } finally {
      setSavingResultMatchId(null);
    }
  }

  return (
    <SectionShell
      title="Partidas"
      description={
        tournamentFormat === 'KNOCKOUT'
          ? 'Inicie o campeonato para gerar a primeira fase do mata-mata.'
          : 'Inicie o campeonato para gerar a tabela de jogos da liga.'
      }
      action={
        <div className="flex flex-wrap gap-2">
          {currentStatus === 'DRAFT' ? (
            <button
              type="button"
              onClick={() => void handleStartTournament()}
              disabled={!canStartTournament}
              className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? 'Iniciando...' : 'Iniciar campeonato'}
            </button>
          ) : null}

          {tournamentFormat === 'LEAGUE' && currentStatus === 'IN_PROGRESS' ? (
            <button
              type="button"
              onClick={() => void handleFinishTournament()}
              disabled={!canFinishTournament}
              className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFinishing ? 'Finalizando...' : 'Finalizar campeonato'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void loadMatches()}
            disabled={isLoading || isStarting || isFinishing}
            className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
      }
    >

      {tournamentFormat === 'LEAGUE' && currentStatus === 'IN_PROGRESS' && hasPendingMatches ? (
        <div className="rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          Finalize todas as partidas antes de encerrar o campeonato.
        </div>
      ) : null}

      {tournamentFormat === 'KNOCKOUT' && currentStatus === 'DRAFT' ? (
        <div className="mt-5 rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          Campeonatos mata-mata exigem exatamente 4, 8 ou 16 participantes.
        </div>
      ) : null}

      {tournamentFormat === 'KNOCKOUT' && currentStatus === 'FINISHED' && championParticipant ? (
        <div className="mt-5 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            Campeao do mata-mata
          </span>
          <strong className="mt-2 block text-2xl text-white">{championParticipant.name}</strong>
          <span className="mt-1 block text-sm text-zinc-400">
            {championParticipant.teamName ?? 'Time nao informado'}
          </span>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-gold-500/30 bg-gold-500/10 text-gold-400'
              : 'border-red-500/30 bg-red-500/10 text-red-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-arena-700 bg-arena-850 p-6 text-sm text-zinc-400">
            Carregando partidas...
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
            Nenhuma partida gerada ainda.
          </div>
        ) : (
          <div className="grid gap-6">
            {matchGroups.map((group) => (
              <div key={group.phase} className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`text-sm font-bold uppercase tracking-[0.18em] ${
                      group.phase === 'FINAL' ? 'text-gold-400' : 'text-zinc-400'
                    }`}
                  >
                    {phaseLabels[group.phase]}
                  </h3>
                  <span className="text-xs font-semibold text-zinc-500">
                    {group.matches.length} jogo{group.matches.length === 1 ? '' : 's'}
                  </span>
                </div>

                {group.matches.map((match) => {
                  const isEditingResult = editingResultMatchId === match.id;
                  const resultActionLabel =
                    match.status === 'FINISHED' ? 'Editar resultado' : 'Registrar resultado';
                  const isFinal = match.phase === 'FINAL';

                  return (
                    <div
                      key={match.id}
                      className={`rounded-xl border bg-arena-850 p-4 ${
                        isFinal ? 'border-gold-500/40' : 'border-arena-700'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_1.3fr_0.8fr_0.7fr_0.8fr_auto] lg:items-center">
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Mandante
                          </span>
                          <strong className="mt-1 block text-white">
                            {getParticipantName(match.homeParticipantId)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Placar
                          </span>
                          <strong className="mt-1 block text-gold-400">
                            {getScoreLabel(match)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Visitante
                          </span>
                          <strong className="mt-1 block text-white">
                            {getParticipantName(match.awayParticipantId)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Fase
                          </span>
                          <span className="mt-1 block text-zinc-300">
                            {phaseLabels[match.phase]}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Rodada
                          </span>
                          <span className="mt-1 block text-zinc-300">
                            {match.round ?? '-'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Status
                          </span>
                          <span className="mt-1 inline-flex rounded-full border border-arena-700 px-2 py-1 text-xs font-bold text-zinc-100">
                            {statusLabels[match.status]}
                          </span>
                        </div>
                        <div className="flex justify-start lg:justify-end">
                          {currentStatus !== 'FINISHED' ? (
                            <button
                              type="button"
                              onClick={() => startResultEditing(match)}
                              disabled={isSavingResult}
                              className="rounded-lg border border-arena-700 px-3 py-2 text-xs font-bold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {resultActionLabel}
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-500">Encerrado</span>
                          )}
                        </div>
                      </div>

                      {isEditingResult ? (
                        <form
                          onSubmit={(event) => void handleSaveResult(event, match.id)}
                          className="mt-4 grid gap-3 border-t border-arena-700 pt-4 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={resultForm.homeScore}
                            onChange={(event) =>
                              setResultForm((current) => ({
                                ...current,
                                homeScore: event.target.value,
                              }))
                            }
                            className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                            placeholder="Gols do mandante"
                            required
                          />
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={resultForm.awayScore}
                            onChange={(event) =>
                              setResultForm((current) => ({
                                ...current,
                                awayScore: event.target.value,
                              }))
                            }
                            className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                            placeholder="Gols do visitante"
                            required
                          />
                          <div className="flex gap-2 sm:justify-end">
                            <button
                              type="submit"
                              disabled={savingResultMatchId === match.id}
                              className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingResultMatchId === match.id ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelResultEditing}
                              disabled={savingResultMatchId === match.id}
                              className="rounded-lg border border-arena-700 px-4 py-2 text-xs font-bold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
