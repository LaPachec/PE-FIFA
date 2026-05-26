'use client';

import { useState } from 'react';
import { TournamentMatches } from '@/components/matches/tournament-matches';
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
  championParticipantId: string | null;
};

export function TournamentLeaguePanel({
  tournamentId,
  tournamentFormat,
  tournamentStatus,
  championParticipantId,
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
      {tournamentFormat === 'LEAGUE' ? (
        <StandingsSection
          tournamentId={tournamentId}
          tournamentStatus={currentStatus}
          refreshKey={standingsRefreshKey}
        />
      ) : null}
      <TournamentMatches
        tournamentId={tournamentId}
        tournamentFormat={tournamentFormat}
        tournamentStatus={currentStatus}
        championParticipantId={championParticipantId}
        onMatchesChanged={refreshStandings}
        onTournamentStatusChanged={handleTournamentStatusChanged}
      />
    </>
  );
}
