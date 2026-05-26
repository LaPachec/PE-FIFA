'use client';

import { useState } from 'react';
import { TournamentMatches } from '@/components/matches/tournament-matches';
import { StandingsSection } from '@/components/standings/standings-section';
import type { Tournament, TournamentStatus } from '@/services/tournaments';

type TournamentLeaguePanelProps = {
  tournamentId: string;
  tournamentStatus: TournamentStatus;
};

export function TournamentLeaguePanel({
  tournamentId,
  tournamentStatus,
}: TournamentLeaguePanelProps) {
  const [standingsRefreshKey, setStandingsRefreshKey] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<TournamentStatus>(tournamentStatus);

  function refreshStandings() {
    setStandingsRefreshKey((currentKey) => currentKey + 1);
  }

  function handleTournamentStatusChanged(tournament: Tournament) {
    setCurrentStatus(tournament.status);
    refreshStandings();
  }

  return (
    <>
      <StandingsSection
        tournamentId={tournamentId}
        tournamentStatus={currentStatus}
        refreshKey={standingsRefreshKey}
      />
      <TournamentMatches
        tournamentId={tournamentId}
        tournamentStatus={currentStatus}
        onMatchesChanged={refreshStandings}
        onTournamentStatusChanged={handleTournamentStatusChanged}
      />
    </>
  );
}
