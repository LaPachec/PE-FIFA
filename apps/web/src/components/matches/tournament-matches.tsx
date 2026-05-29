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
  generateKnockoutStage,
  getTournament,
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
  qualifiedCount: number | null;
  championParticipantId: string | null;
  onMatchesChanged?: () => void;
  onTournamentStatusChanged?: (tournament: Tournament) => void;
};

type ResultFormState = {
  homeScore: string;
  awayScore: string;
  homePenaltyScore: string;
  awayPenaltyScore: string;
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
  homePenaltyScore: '',
  awayPenaltyScore: '',
};

function isKnockoutPhase(phase: Match['phase']) {
  return phase !== 'LEAGUE';
}

function hasNormalTimeTie(form: ResultFormState) {
  return (
    form.homeScore.trim().length > 0 &&
    form.awayScore.trim().length > 0 &&
    /^\d+$/.test(form.homeScore.trim()) &&
    /^\d+$/.test(form.awayScore.trim()) &&
    Number(form.homeScore) === Number(form.awayScore)
  );
}

function getResultFormError(form: ResultFormState, match: Match) {
  if (!form.homeScore.trim() || !form.awayScore.trim()) {
    return 'Informe o placar do mandante e do visitante.';
  }

  if (!/^\d+$/.test(form.homeScore.trim()) || !/^\d+$/.test(form.awayScore.trim())) {
    return 'O placar deve ser um numero inteiro maior ou igual a zero.';
  }

  if (isKnockoutPhase(match.phase) && hasNormalTimeTie(form)) {
    if (!form.homePenaltyScore.trim() || !form.awayPenaltyScore.trim()) {
      return 'Informe os penaltis do mandante e do visitante.';
    }

    if (
      !/^\d+$/.test(form.homePenaltyScore.trim()) ||
      !/^\d+$/.test(form.awayPenaltyScore.trim())
    ) {
      return 'Os penaltis devem ser numeros inteiros maiores ou iguais a zero.';
    }

    if (Number(form.homePenaltyScore) === Number(form.awayPenaltyScore)) {
      return 'A disputa de pênaltis precisa ter um vencedor.';
    }
  }

  return null;
}

function getMatchScoreLabel(match: Match) {
  if (match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) {
    return 'x';
  }

  if (match.homePenaltyScore !== null && match.awayPenaltyScore !== null) {
    return `${match.homeScore} (${match.homePenaltyScore}) x (${match.awayPenaltyScore}) ${match.awayScore}`;
  }

  return `${match.homeScore} x ${match.awayScore}`;
}

export function TournamentMatches({
  tournamentId,
  tournamentFormat,
  tournamentStatus,
  qualifiedCount,
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
  const [isGeneratingKnockoutStage, setIsGeneratingKnockoutStage] = useState(false);
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
  const leagueMatches = matches.filter((match) => match.phase === 'LEAGUE');
  const knockoutMatches = matches.filter((match) => match.phase !== 'LEAGUE');
  const hasPendingMatches = matches.some((match) => match.status === 'PENDING');
  const hasPendingLeagueMatches = leagueMatches.some((match) => match.status === 'PENDING');
  const canGenerateKnockoutStage =
    tournamentFormat === 'LEAGUE_KNOCKOUT' &&
    currentStatus === 'IN_PROGRESS' &&
    leagueMatches.length > 0 &&
    !hasPendingLeagueMatches &&
    knockoutMatches.length === 0 &&
    !isGeneratingKnockoutStage;
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
    const confirmed = window.confirm(
      'Deseja iniciar este campeonato? Depois disso os participantes nao poderao mais ser alterados.',
    );

    if (!confirmed) {
      return;
    }

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

  async function handleGenerateKnockoutStage() {
    const confirmed = window.confirm(
      'Deseja gerar a fase mata-mata agora? Use esta acao somente depois de conferir a classificacao final da Liga.',
    );

    if (!confirmed) {
      return;
    }

    setIsGeneratingKnockoutStage(true);
    setFeedback(null);

    try {
      const tournament = await generateKnockoutStage(tournamentId);
      setCurrentStatus(tournament.status);
      await loadMatches();
      onMatchesChanged?.();
      onTournamentStatusChanged?.(tournament);
      router.refresh();
      setFeedback({ type: 'success', message: 'Fase mata-mata gerada com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel gerar a fase mata-mata.',
      });
    } finally {
      setIsGeneratingKnockoutStage(false);
    }
  }

  function getParticipantName(participantId: string | null) {
    if (!participantId) {
      return 'A definir';
    }

    return participantNameById.get(participantId) ?? 'Participante removido';
  }

  function getScoreLabel(match: Match) {
    return getMatchScoreLabel(match);
  }

  function startResultEditing(match: Match) {
    setEditingResultMatchId(match.id);
    setResultForm({
      homeScore: match.homeScore === null ? '' : String(match.homeScore),
      awayScore: match.awayScore === null ? '' : String(match.awayScore),
      homePenaltyScore:
        match.homePenaltyScore === null ? '' : String(match.homePenaltyScore),
      awayPenaltyScore:
        match.awayPenaltyScore === null ? '' : String(match.awayPenaltyScore),
    });
    setFeedback(null);
  }

  function cancelResultEditing() {
    setEditingResultMatchId(null);
    setResultForm(emptyResultForm);
    setFeedback(null);
  }

  function canEditMatchResult(match: Match) {
    if (currentStatus === 'FINISHED') {
      return false;
    }

    if (
      tournamentFormat === 'LEAGUE_KNOCKOUT' &&
      currentStatus === 'KNOCKOUT_STAGE' &&
      match.phase === 'LEAGUE'
    ) {
      return false;
    }

    return true;
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
      const shouldSendPenaltyScores =
        isKnockoutPhase(currentMatch.phase) && hasNormalTimeTie(resultForm);
      await updateMatchResult(matchId, {
        homeScore: Number(resultForm.homeScore),
        awayScore: Number(resultForm.awayScore),
        ...(shouldSendPenaltyScores
          ? {
              homePenaltyScore: Number(resultForm.homePenaltyScore),
              awayPenaltyScore: Number(resultForm.awayPenaltyScore),
            }
          : {}),
      });

      const updatedTournament = await getTournament(tournamentId);
      setCurrentStatus(updatedTournament.status);
      setCurrentChampionParticipantId(updatedTournament.championParticipantId);
      await loadMatches();
      setEditingResultMatchId(null);
      setResultForm(emptyResultForm);
      onMatchesChanged?.();
      onTournamentStatusChanged?.(updatedTournament);
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
          : tournamentFormat === 'LEAGUE_KNOCKOUT'
            ? 'Inicie a Liga e gere o mata-mata quando todos os jogos da fase inicial terminarem.'
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

          {tournamentFormat === 'LEAGUE_KNOCKOUT' && currentStatus === 'IN_PROGRESS' ? (
            <button
              type="button"
              onClick={() => void handleGenerateKnockoutStage()}
              disabled={!canGenerateKnockoutStage}
              className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingKnockoutStage ? 'Gerando...' : 'Gerar fase mata-mata'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void loadMatches()}
            disabled={isLoading || isStarting || isFinishing || isGeneratingKnockoutStage}
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

      {tournamentFormat === 'LEAGUE_KNOCKOUT' && currentStatus === 'IN_PROGRESS' ? (
        <div className="rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          {hasPendingLeagueMatches
            ? 'Finalize todas as partidas da Liga antes de gerar o mata-mata.'
            : `A Liga terminou. Gere a fase mata-mata com ${qualifiedCount ?? '-'} classificados.`}
        </div>
      ) : null}

      {tournamentFormat === 'KNOCKOUT' && currentStatus === 'DRAFT' ? (
        <div className="mt-5 rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          Campeonatos mata-mata exigem exatamente 4, 8 ou 16 participantes.
        </div>
      ) : null}

      {(tournamentFormat === 'KNOCKOUT' || tournamentFormat === 'LEAGUE_KNOCKOUT') &&
      currentStatus === 'FINISHED' &&
      championParticipant ? (
        <div className="mt-5 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            Campeao
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
          <div className="grid gap-8">
            {matchGroups.map((group) => (
              <div key={group.phase} className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {tournamentFormat === 'LEAGUE_KNOCKOUT' ? (
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {group.phase === 'LEAGUE' ? 'Fase de Liga' : 'Mata-mata'}
                      </span>
                    ) : null}
                    <h3
                      className={`text-sm font-bold uppercase tracking-[0.18em] ${
                        group.phase === 'FINAL' ? 'text-gold-400' : 'text-zinc-400'
                      }`}
                    >
                      {phaseLabels[group.phase]}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {group.matches.length} jogo{group.matches.length === 1 ? '' : 's'}
                  </span>
                </div>

                {group.matches.map((match) => {
                  const isEditingResult = editingResultMatchId === match.id;
                  const resultActionLabel =
                    match.status === 'FINISHED' ? 'Editar resultado' : 'Registrar resultado';
                  const isFinal = match.phase === 'FINAL';
                  const shouldShowPenaltyFields =
                    isEditingResult && isKnockoutPhase(match.phase) && hasNormalTimeTie(resultForm);

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
                          {canEditMatchResult(match) ? (
                            <button
                              type="button"
                              onClick={() => startResultEditing(match)}
                              disabled={isSavingResult}
                              className="rounded-lg border border-arena-700 px-3 py-2 text-xs font-bold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {resultActionLabel}
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-500">
                              {currentStatus === 'FINISHED' ? 'Encerrado' : 'Somente leitura'}
                            </span>
                          )}
                        </div>
                      </div>

                      {isEditingResult ? (
                        <form
                          onSubmit={(event) => void handleSaveResult(event, match.id)}
                          className="mt-4 grid gap-4 border-t border-arena-700 pt-4"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
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
                          </div>

                          {shouldShowPenaltyFields ? (
                            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">
                                Decisão por pênaltis
                              </span>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  inputMode="numeric"
                                  value={resultForm.homePenaltyScore}
                                  onChange={(event) =>
                                    setResultForm((current) => ({
                                      ...current,
                                      homePenaltyScore: event.target.value,
                                    }))
                                  }
                                  className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                                  placeholder="Pênaltis do mandante"
                                  required
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  inputMode="numeric"
                                  value={resultForm.awayPenaltyScore}
                                  onChange={(event) =>
                                    setResultForm((current) => ({
                                      ...current,
                                      awayPenaltyScore: event.target.value,
                                    }))
                                  }
                                  className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                                  placeholder="Pênaltis do visitante"
                                  required
                                />
                              </div>
                            </div>
                          ) : null}

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
