'use client';

import { useState } from 'react';
import { TournamentMatches } from '@/components/matches/tournament-matches';
import { StatisticsSection } from '@/components/statistics/statistics-section';
import { StandingsSection } from '@/components/standings/standings-section';
import type {
  Tournament,
  TournamentFormat,
  TournamentStatus,
} from '@/services/tournaments';

type TournamentLeaguePanelProps = {
  tournamentId: string;
  tournamentFormat: TournamentFormat;
  tournamentStatus: TournamentStatus;
  qualifiedCount: number | null;
  championParticipantId: string | null;
};

export function TournamentLeaguePanel({
  tournamentId,
  tournamentFormat,
  tournamentStatus,
  qualifiedCount,
  championParticipantId,
}: TournamentLeaguePanelProps) {
  const [standingsRefreshKey, setStandingsRefreshKey] = useState(0);
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<TournamentStatus>(tournamentStatus);

  function refreshData() {
    setStandingsRefreshKey((currentKey) => currentKey + 1);
    setStatisticsRefreshKey((currentKey) => currentKey + 1);
  }

  function handleTournamentStatusChanged(tournament: Tournament) {
    setCurrentStatus(tournament.status);
    refreshData();
  }

  return (
    <>
      <StatisticsSection
        tournamentId={tournamentId}
        refreshKey={statisticsRefreshKey}
      />
      {tournamentFormat === 'LEAGUE' || tournamentFormat === 'LEAGUE_KNOCKOUT' ? (
        <StandingsSection
          tournamentId={tournamentId}
          tournamentFormat={tournamentFormat}
          tournamentStatus={currentStatus}
          qualifiedCount={qualifiedCount}
          refreshKey={standingsRefreshKey}
        />
      ) : null}
      <TournamentMatches
        tournamentId={tournamentId}
        tournamentFormat={tournamentFormat}
        tournamentStatus={currentStatus}
        qualifiedCount={qualifiedCount}
        championParticipantId={championParticipantId}
        onMatchesChanged={refreshData}
        onTournamentStatusChanged={handleTournamentStatusChanged}
      />
    </>
  );
}
