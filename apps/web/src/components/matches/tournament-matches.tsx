'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTournamentMatches, type Match } from '@/services/matches';
import { getParticipants, type Participant } from '@/services/participants';
import { startTournament, type TournamentStatus } from '@/services/tournaments';

type TournamentMatchesProps = {
  tournamentId: string;
  tournamentStatus: TournamentStatus;
};

const phaseLabels: Record<Match['phase'], string> = {
  LEAGUE: 'Liga',
  ROUND_OF_16: 'Oitavas',
  QUARTER_FINAL: 'Quartas',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Terceiro lugar',
  FINAL: 'Final',
};

const statusLabels: Record<Match['status'], string> = {
  PENDING: 'Pendente',
  FINISHED: 'Finalizada',
};

export function TournamentMatches({
  tournamentId,
  tournamentStatus,
}: TournamentMatchesProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TournamentStatus>(tournamentStatus);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
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

  const canStartTournament = currentStatus === 'DRAFT' && !isStarting;

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
    void loadMatches();
  }, [loadMatches]);

  async function handleStartTournament() {
    setIsStarting(true);
    setFeedback(null);

    try {
      const tournament = await startTournament(tournamentId);
      setCurrentStatus(tournament.status);
      await loadMatches();
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

  function getParticipantName(participantId: string | null) {
    if (!participantId) {
      return 'A definir';
    }

    return participantNameById.get(participantId) ?? 'Participante removido';
  }

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Partidas</h2>
          <p className="mt-1 text-sm text-slate-300">
            Inicie o campeonato para gerar a tabela de jogos da liga.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentStatus === 'DRAFT' ? (
            <button
              type="button"
              onClick={() => void handleStartTournament()}
              disabled={!canStartTournament}
              className="rounded-md bg-lime-400 px-4 py-2 text-sm font-bold text-pitch-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? 'Iniciando...' : 'Iniciar campeonato'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void loadMatches()}
            disabled={isLoading || isStarting}
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-lime-300 hover:text-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-lime-300/30 bg-lime-400/10 text-lime-100'
              : 'border-red-400/30 bg-red-500/10 text-red-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-md border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Carregando partidas...
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
            Nenhuma partida gerada ainda.
          </div>
        ) : (
          <div className="grid gap-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="grid gap-4 rounded-md border border-white/10 bg-white/5 p-4 lg:grid-cols-[1.4fr_1.4fr_0.8fr_0.7fr_0.8fr] lg:items-center"
              >
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Mandante
                  </span>
                  <strong className="mt-1 block text-white">
                    {getParticipantName(match.homeParticipantId)}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Visitante
                  </span>
                  <strong className="mt-1 block text-white">
                    {getParticipantName(match.awayParticipantId)}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Fase
                  </span>
                  <span className="mt-1 block text-slate-200">
                    {phaseLabels[match.phase]}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Rodada
                  </span>
                  <span className="mt-1 block text-slate-200">
                    {match.round ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Status
                  </span>
                  <span className="mt-1 inline-flex rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-slate-100">
                    {statusLabels[match.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
