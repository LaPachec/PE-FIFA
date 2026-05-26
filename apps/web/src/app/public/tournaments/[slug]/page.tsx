import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge, StatCard } from '@/components/tournaments/tournament-visuals';
import type { Match } from '@/services/matches';
import { getPublicTournamentBySlug } from '@/services/public-tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

const phaseLabels = {
  LEAGUE: 'Liga',
  ROUND_OF_16: 'Oitavas de final',
  QUARTER_FINAL: 'Quartas de final',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Terceiro lugar',
  FINAL: 'Final',
};

const phaseOrder: Record<Match['phase'], number> = {
  LEAGUE: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

const matchStatusLabels = {
  PENDING: 'Pendente',
  FINISHED: 'Finalizada',
};

type PublicTournamentPageProps = {
  params: {
    slug: string;
  };
};

export default async function PublicTournamentPage({
  params,
}: PublicTournamentPageProps) {
  const details = await getPublicTournamentBySlug(params.slug).catch(() => null);

  if (!details) {
    notFound();
  }

  const { tournament, participants, matches, standings, champion } = details;
  const matchGroups = Array.from(
    matches.reduce((groups, match) => {
      const currentGroup = groups.get(match.phase) ?? [];
      currentGroup.push(match);
      groups.set(match.phase, currentGroup);

      return groups;
    }, new Map<Match['phase'], Match[]>()),
  )
    .sort(([phaseA], [phaseB]) => phaseOrder[phaseA] - phaseOrder[phaseB])
    .map(([phase, phaseMatches]) => ({
      phase,
      matches: phaseMatches.sort((matchA, matchB) => {
        if ((matchA.round ?? 0) !== (matchB.round ?? 0)) {
          return (matchA.round ?? 0) - (matchB.round ?? 0);
        }

        return matchA.matchOrder - matchB.matchOrder;
      }),
    }));
  const participantNameById = new Map(
    participants.map((participant) => [
      participant.id,
      participant.nickname || participant.name,
    ]),
  );

  function getParticipantName(participantId: string | null) {
    if (!participantId) {
      return 'A definir';
    }

    return participantNameById.get(participantId) ?? 'Participante removido';
  }

  function getScore(homeScore: number | null, awayScore: number | null) {
    if (homeScore === null || awayScore === null) {
      return 'x';
    }

    return `${homeScore} x ${awayScore}`;
  }

  return (
    <main className="min-h-screen bg-arena-950 px-5 py-6 text-white sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-gold-500 transition hover:text-gold-400">
          FIFA Tournament Manager
        </Link>

        <div className="mt-8 rounded-3xl border border-arena-700 bg-arena-900 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <StatusBadge status={tournament.status} />
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
                {tournament.name}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
                {tournament.description ?? 'Campeonato sem descricao.'}
              </p>
            </div>
            {champion ? (
              <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5 lg:min-w-72">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                  Campeao
                </span>
                <strong className="mt-3 block text-2xl text-white">{champion.name}</strong>
                <span className="mt-1 block text-sm text-zinc-400">
                  {champion.teamName ?? 'Time nao informado'}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Formato" value={formatLabels[tournament.format]} />
          <StatCard label="Participantes" value={participants.length} />
          <StatCard label="Partidas" value={matches.length} />
          <StatCard
            label="Atualizado em"
            value={new Intl.DateTimeFormat('pt-BR').format(new Date(tournament.updatedAt))}
          />
        </div>

        {tournament.status === 'IN_PROGRESS' ? (
          <div className="mt-8 rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
            Campeonato em andamento.
          </div>
        ) : null}

        {tournament.format === 'LEAGUE' ? (
          <section className="mt-10 rounded-2xl border border-arena-700 bg-arena-900/80 p-5 sm:p-6">
            <h2 className="text-2xl font-bold text-white">Classificacao</h2>
            <div className="mt-6 overflow-x-auto rounded-xl border border-arena-700 bg-arena-850">
              {standings.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  Nenhum participante cadastrado ainda.
                </div>
              ) : (
                <table className="w-full min-w-[780px] border-collapse text-sm">
                  <thead className="bg-arena-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
                    <tr>
                      <th className="px-3 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Participante</th>
                      <th className="px-3 py-3 text-left">Time</th>
                      <th className="px-3 py-3 text-right">Pts</th>
                      <th className="px-3 py-3 text-right">J</th>
                      <th className="px-3 py-3 text-right">V</th>
                      <th className="px-3 py-3 text-right">E</th>
                      <th className="px-3 py-3 text-right">D</th>
                      <th className="px-3 py-3 text-right">GP</th>
                      <th className="px-3 py-3 text-right">GC</th>
                      <th className="px-3 py-3 text-right">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arena-700">
                    {standings.map((standing) => {
                      const isChampion = standing.participantId === champion?.id;

                      return (
                        <tr
                          key={standing.participantId}
                          className={isChampion ? 'bg-gold-500/10' : 'bg-arena-850'}
                        >
                          <td className={`px-3 py-3 font-bold ${isChampion ? 'text-gold-400' : 'text-white'}`}>
                            {standing.position}
                          </td>
                          <td className="px-3 py-3 font-semibold text-white">{standing.name}</td>
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
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-2xl border border-arena-700 bg-arena-900/80 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-white">Partidas</h2>
          <div className="mt-6">
            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
                Campeonato sem partidas.
              </div>
            ) : (
              <div className="grid gap-6">
                {matchGroups.map((group) => (
                  <div key={group.phase} className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`text-sm font-bold uppercase tracking-[0.18em] ${
                          group.phase === 'FINAL' ? 'text-gold-400' : 'text-zinc-400'
                        }`}
                      >
                        {phaseLabels[group.phase]}
                      </h3>
                      <span className="text-xs font-semibold text-zinc-500">
                        {group.matches.length} jogo{group.matches.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {group.matches.map((match) => {
                      const isFinal = match.phase === 'FINAL';

                      return (
                        <div
                          key={match.id}
                          className={`grid gap-4 rounded-xl border bg-arena-850 p-4 lg:grid-cols-[1.3fr_0.7fr_1.3fr_0.8fr_0.8fr] lg:items-center ${
                            isFinal ? 'border-gold-500/40' : 'border-arena-700'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Mandante
                            </span>
                            <strong className="mt-1 block text-white">
                              {getParticipantName(match.homeParticipantId)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Placar
                            </span>
                            <strong className="mt-1 block text-gold-400">
                              {getScore(match.homeScore, match.awayScore)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Visitante
                            </span>
                            <strong className="mt-1 block text-white">
                              {getParticipantName(match.awayParticipantId)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Fase
                            </span>
                            <span className="mt-1 block text-zinc-300">
                              {phaseLabels[match.phase]}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Status
                            </span>
                            <span className="mt-1 block text-zinc-300">
                              {matchStatusLabels[match.status]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-arena-700 bg-arena-900/80 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-white">Participantes</h2>
          <div className="mt-6">
            {participants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
                Nenhum participante cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-xl border border-arena-700 bg-arena-850 p-4"
                  >
                    <strong className="block text-white">{participant.name}</strong>
                    <span className="mt-1 block text-sm text-zinc-400">
                      {participant.nickname ?? 'Sem apelido'} - {participant.teamName ?? 'Sem time'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
