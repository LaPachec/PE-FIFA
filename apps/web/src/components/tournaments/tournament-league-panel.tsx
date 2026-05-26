'use client';

import { useState } from 'react';
import { TournamentMatches } from '@/components/matches/tournament-matches';
import { StandingsSection } from '@/components/standings/standings-section';
import type { TournamentStatus } from '@/services/tournaments';

type TournamentLeaguePanelProps = {
  tournamentId: string;
  tournamentStatus: TournamentStatus;
};

export function TournamentLeaguePanel({
  tournamentId,
  tournamentStatus,
}: TournamentLeaguePanelProps) {
  const [standingsRefreshKey, setStandingsRefreshKey] = useState(0);

  function refreshStandings() {
    setStandingsRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <>
      <StandingsSection tournamentId={tournamentId} refreshKey={standingsRefreshKey} />
      <TournamentMatches
        tournamentId={tournamentId}
        tournamentStatus={tournamentStatus}
        onMatchesChanged={refreshStandings}
      />
    </>
  );
}
