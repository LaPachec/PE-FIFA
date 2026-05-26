'use client';

import { useCallback, useEffect, useState } from 'react';
import { StandingsTable } from '@/components/standings/standings-table';
import {
  getTournamentStandings,
  type StandingRow,
} from '@/services/standings';
import { SectionShell } from '@/components/tournaments/tournament-visuals';
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
    <SectionShell
      title="Classificacao"
      description="Tabela calculada pela API a partir das partidas finalizadas."
      action={
        <button
          type="button"
          onClick={() => void loadStandings()}
          disabled={isLoading}
          className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Atualizar
        </button>
      }
    >
        {isLoading ? (
          <div className="rounded-xl border border-arena-700 bg-arena-850 p-6 text-sm text-zinc-400">
            Carregando classificacao...
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : standings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
            Nenhum participante cadastrado ainda.
          </div>
        ) : (
          <>
            {champion ? (
              <div className="mb-5 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
                  Campeao da Liga
                </span>
                <strong className="mt-2 block text-2xl text-white">{champion.name}</strong>
                <p className="mt-1 text-sm text-zinc-400">
                  {champion.teamName ?? 'Time nao informado'} - {champion.points} pontos
                </p>
              </div>
            ) : null}
            <StandingsTable standings={standings} championParticipantId={champion?.participantId} />
          </>
        )}
    </SectionShell>
  );
}
