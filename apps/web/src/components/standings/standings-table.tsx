import type { StandingRow } from '@/services/standings';

type StandingsTableProps = {
  standings: StandingRow[];
  championParticipantId?: string;
};

const columns = [
  { key: 'position', label: '#', align: 'text-left' },
  { key: 'participant', label: 'Participante', align: 'text-left' },
  { key: 'teamName', label: 'Time', align: 'text-left' },
  { key: 'points', label: 'Pts', align: 'text-right' },
  { key: 'played', label: 'J', align: 'text-right' },
  { key: 'wins', label: 'V', align: 'text-right' },
  { key: 'draws', label: 'E', align: 'text-right' },
  { key: 'losses', label: 'D', align: 'text-right' },
  { key: 'goalsFor', label: 'GP', align: 'text-right' },
  { key: 'goalsAgainst', label: 'GC', align: 'text-right' },
  { key: 'goalDifference', label: 'SG', align: 'text-right' },
];

export function StandingsTable({
  standings,
  championParticipantId,
}: StandingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-arena-700 bg-arena-850">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <thead className="bg-arena-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-3 font-semibold ${column.align}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-arena-700">
          {standings.map((standing) => {
            const isChampion = standing.participantId === championParticipantId;

            return (
              <tr
                key={standing.participantId}
                className={isChampion ? 'bg-gold-500/10' : 'bg-arena-850'}
              >
              <td className={`px-3 py-3 font-bold ${isChampion ? 'text-gold-400' : 'text-white'}`}>
                {standing.position}
              </td>
              <td className="px-3 py-3">
                <span className="block font-semibold text-white">
                  {standing.name}
                  {isChampion ? (
                    <span className="ml-2 rounded-full border border-gold-500/40 px-2 py-0.5 text-xs text-gold-400">
                      Campeao
                    </span>
                  ) : null}
                </span>
                {standing.nickname ? (
                  <span className="mt-1 block text-xs text-zinc-500">{standing.nickname}</span>
                ) : null}
              </td>
              <td className="px-3 py-3 text-zinc-300">{standing.teamName ?? '-'}</td>
              <td className="px-3 py-3 text-right font-bold text-gold-400">
                {standing.points}
              </td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.played}</td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.wins}</td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.draws}</td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.losses}</td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.goalsFor}</td>
              <td className="px-3 py-3 text-right text-zinc-300">{standing.goalsAgainst}</td>
              <td className="px-3 py-3 text-right text-zinc-300">
                {standing.goalDifference}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
