import type {
  BiggestWin,
  HighestScoringMatch,
  ParticipantStatistics,
  TournamentStatistics,
} from '@/services/statistics';
import { SectionShell, StatCard } from '@/components/tournaments/tournament-visuals';

type StatisticsPanelProps = {
  statistics: TournamentStatistics;
  isPublic?: boolean;
};

function formatParticipantList(participants: ParticipantStatistics[]) {
  if (participants.length === 0) {
    return 'Sem dados';
  }

  return participants.map((participant) => participant.name).join(', ');
}

function HighlightCard({
  label,
  participants,
  metric,
}: {
  label: string;
  participants: ParticipantStatistics[];
  metric: (participant: ParticipantStatistics) => string | number;
}) {
  return (
    <div className="rounded-xl border border-arena-700 bg-arena-850 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <strong className="mt-3 block text-white">{formatParticipantList(participants)}</strong>
      {participants.length > 0 ? (
        <span className="mt-2 block text-sm font-semibold text-gold-400">
          {metric(participants[0])}
        </span>
      ) : null}
    </div>
  );
}

function MatchHighlightCard({
  label,
  match,
}: {
  label: string;
  match: HighestScoringMatch | BiggestWin | null;
}) {
  return (
    <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-400">
        {label}
      </span>
      {match ? (
        <>
          <strong className="mt-3 block text-white">
            {match.homeParticipantName} {match.homeScore} x {match.awayScore}{' '}
            {match.awayParticipantName}
          </strong>
          <span className="mt-2 block text-sm text-zinc-300">
            {'totalGoals' in match
              ? `${match.totalGoals} gols`
              : `${match.goalDifference} gols de diferenca - vencedor: ${match.winnerName}`}
          </span>
        </>
      ) : (
        <strong className="mt-3 block text-zinc-400">Sem dados</strong>
      )}
    </div>
  );
}

export function StatisticsPanel({ statistics, isPublic = false }: StatisticsPanelProps) {
  const hasFinishedMatches = statistics.finishedMatches > 0;

  return (
    <SectionShell
      title="Estatisticas"
      description={
        isPublic
          ? 'Numeros gerais do campeonato para acompanhamento publico.'
          : 'Resumo calculado a partir das partidas finalizadas.'
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total de gols" value={statistics.totalGoals} />
        <StatCard label="Media de gols" value={statistics.averageGoalsPerMatch} />
        <StatCard label="Partidas jogadas" value={statistics.finishedMatches} />
        <StatCard label="Partidas pendentes" value={statistics.pendingMatches} />
        <StatCard label="Participantes" value={statistics.totalParticipants} />
      </div>

      {!hasFinishedMatches ? (
        <div className="mt-6 rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
          As estatisticas aparecerao apos o registro dos primeiros resultados.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <HighlightCard
              label="Artilheiro(s)"
              participants={statistics.highlights.topScorers}
              metric={(participant) => `${participant.goalsFor} gols`}
            />
            <HighlightCard
              label="Melhor ataque"
              participants={statistics.highlights.bestAttacks}
              metric={(participant) => `${participant.goalsFor} gols pro`}
            />
            <HighlightCard
              label="Melhor defesa"
              participants={statistics.highlights.bestDefenses}
              metric={(participant) => `${participant.goalsAgainst} gols contra`}
            />
            <HighlightCard
              label="Mais vitorias"
              participants={statistics.highlights.mostWinsPlayers}
              metric={(participant) => `${participant.wins} vitorias`}
            />
            <HighlightCard
              label="Maior saldo"
              participants={statistics.highlights.bestGoalDifferences}
              metric={(participant) => `${participant.goalDifference} saldo`}
            />
            <MatchHighlightCard
              label="Maior goleada"
              match={statistics.biggestWin}
            />
            <MatchHighlightCard
              label="Partida com mais gols"
              match={statistics.highestScoringMatch}
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-arena-700 bg-arena-850">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-arena-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-3 py-3 text-left">Participante</th>
                  <th className="px-3 py-3 text-left">Time</th>
                  <th className="px-3 py-3 text-right">J</th>
                  <th className="px-3 py-3 text-right">V</th>
                  <th className="px-3 py-3 text-right">E</th>
                  <th className="px-3 py-3 text-right">D</th>
                  <th className="px-3 py-3 text-right">GP</th>
                  <th className="px-3 py-3 text-right">GC</th>
                  <th className="px-3 py-3 text-right">SG</th>
                  <th className="px-3 py-3 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-700">
                {statistics.participantStatistics.map((participant) => (
                  <tr key={participant.participantId} className="bg-arena-850">
                    <td className="px-3 py-3 font-semibold text-white">
                      {participant.name}
                      {participant.nickname ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          {participant.nickname}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{participant.teamName ?? '-'}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {participant.matchesPlayed}
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">{participant.wins}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">{participant.draws}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">{participant.losses}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">{participant.goalsFor}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {participant.goalsAgainst}
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {participant.goalDifference}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gold-400">
                      {participant.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionShell>
  );
}
