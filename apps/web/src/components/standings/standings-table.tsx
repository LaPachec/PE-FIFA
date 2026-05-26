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
    <div className="overflow-x-auto rounded-md border border-white/10">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <thead className="bg-white/10 text-xs uppercase text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-3 font-semibold ${column.align}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {standings.map((standing) => {
            const isChampion = standing.participantId === championParticipantId;

            return (
              <tr
                key={standing.participantId}
                className={isChampion ? 'bg-lime-400/10' : 'bg-white/[0.03]'}
              >
              <td className="px-3 py-3 font-bold text-white">{standing.position}</td>
              <td className="px-3 py-3">
                <span className="block font-semibold text-white">
                  {standing.name}
                  {isChampion ? (
                    <span className="ml-2 rounded-md border border-lime-300/30 px-2 py-0.5 text-xs text-lime-100">
                      Campeao
                    </span>
                  ) : null}
                </span>
                {standing.nickname ? (
                  <span className="mt-1 block text-xs text-slate-400">{standing.nickname}</span>
                ) : null}
              </td>
              <td className="px-3 py-3 text-slate-200">{standing.teamName ?? '-'}</td>
              <td className="px-3 py-3 text-right font-bold text-lime-200">
                {standing.points}
              </td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.played}</td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.wins}</td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.draws}</td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.losses}</td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.goalsFor}</td>
              <td className="px-3 py-3 text-right text-slate-200">{standing.goalsAgainst}</td>
              <td className="px-3 py-3 text-right text-slate-200">
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
