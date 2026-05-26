'use client';

import { useCallback, useEffect, useState } from 'react';
import { StandingsTable } from '@/components/standings/standings-table';
import {
  getTournamentStandings,
  type StandingRow,
} from '@/services/standings';
import type { TournamentStatus } from '@/services/tournaments';

type StandingsSectionProps = {
  tournamentId: string;
  tournamentStatus: TournamentStatus;
  refreshKey: number;
};

export function StandingsSection({
  tournamentId,
  tournamentStatus,
  refreshKey,
}: StandingsSectionProps) {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const champion = tournamentStatus === 'FINISHED' ? standings[0] : null;

  const loadStandings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextStandings = await getTournamentStandings(tournamentId);
      setStandings(nextStandings);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar a classificacao.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void loadStandings();
  }, [loadStandings, refreshKey]);

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Classificacao</h2>
          <p className="mt-1 text-sm text-slate-300">
            Tabela calculada pela API a partir das partidas finalizadas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStandings()}
          disabled={isLoading}
          className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-lime-300 hover:text-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-md border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Carregando classificacao...
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : standings.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
            Nenhum participante cadastrado ainda.
          </div>
        ) : (
          <>
            {champion ? (
              <div className="mb-5 rounded-md border border-lime-300/30 bg-lime-400/10 p-5">
                <span className="text-xs font-semibold uppercase text-lime-200">
                  Campeao da Liga
                </span>
                <strong className="mt-2 block text-2xl text-white">{champion.name}</strong>
                <p className="mt-1 text-sm text-slate-300">
                  {champion.teamName ?? 'Time nao informado'} - {champion.points} pontos
                </p>
              </div>
            ) : null}
            <StandingsTable standings={standings} championParticipantId={champion?.participantId} />
          </>
        )}
      </div>
    </section>
  );
}
