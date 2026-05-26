'use client';

import { useCallback, useEffect, useState } from 'react';
import { StatisticsPanel } from '@/components/statistics/statistics-panel';
import {
  getTournamentStatistics,
  type TournamentStatistics,
} from '@/services/statistics';
import { SectionShell } from '@/components/tournaments/tournament-visuals';

type StatisticsSectionProps = {
  tournamentId: string;
  refreshKey: number;
};

export function StatisticsSection({ tournamentId, refreshKey }: StatisticsSectionProps) {
  const [statistics, setStatistics] = useState<TournamentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setStatistics(await getTournamentStatistics(tournamentId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar as estatisticas.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics, refreshKey]);

  if (isLoading) {
    return (
      <SectionShell title="Estatisticas" description="Resumo do desempenho do campeonato.">
        <div className="rounded-xl border border-arena-700 bg-arena-850 p-6 text-sm text-zinc-400">
          Carregando estatisticas...
        </div>
      </SectionShell>
    );
  }

  if (errorMessage || !statistics) {
    return (
      <SectionShell title="Estatisticas" description="Resumo do desempenho do campeonato.">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage ?? 'Nao foi possivel carregar as estatisticas.'}
        </div>
      </SectionShell>
    );
  }

  return <StatisticsPanel statistics={statistics} />;
}
