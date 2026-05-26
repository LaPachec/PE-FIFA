import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicTournamentBySlug } from '@/services/public-tournaments';

const formatLabels = {
  LEAGUE: 'Liga',
  KNOCKOUT: 'Mata-mata',
  LEAGUE_KNOCKOUT: 'Liga + mata-mata',
};

const statusLabels = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  KNOCKOUT_STAGE: 'Mata-mata',
  FINISHED: 'Finalizado',
};

const phaseLabels = {
  LEAGUE: 'Liga',
  ROUND_OF_16: 'Oitavas',
  QUARTER_FINAL: 'Quartas',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Terceiro lugar',
  FINAL: 'Final',
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
    <main className="min-h-screen bg-pitch-950 px-6 py-8 text-slate-50">
      <section className="mx-auto w-full max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-lime-300 hover:text-lime-200">
          FIFA Tournament Manager
        </Link>

        <div className="mt-8 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
                Pagina publica
              </p>
              <h1 className="mt-3 text-4xl font-bold text-white">{tournament.name}</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                {tournament.description ?? 'Campeonato sem descricao.'}
              </p>
            </div>
            <span className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white">
              {statusLabels[tournament.status]}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Formato</span>
            <strong className="mt-2 block text-lg text-white">
              {formatLabels[tournament.format]}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Status</span>
            <strong className="mt-2 block text-lg text-white">
              {statusLabels[tournament.status]}
            </strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Participantes</span>
            <strong className="mt-2 block text-lg text-white">{participants.length}</strong>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-5">
            <span className="text-sm text-slate-400">Partidas</span>
            <strong className="mt-2 block text-lg text-white">{matches.length}</strong>
          </div>
        </div>

        {tournament.status === 'FINISHED' && champion ? (
          <section className="mt-8 rounded-md border border-lime-300/30 bg-lime-400/10 p-6">
            <span className="text-xs font-semibold uppercase text-lime-200">
              Campeao
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white">{champion.name}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {champion.teamName ?? 'Time nao informado'}
            </p>
          </section>
        ) : null}

        {tournament.status === 'IN_PROGRESS' ? (
          <div className="mt-8 rounded-md border border-lime-300/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-100">
            Campeonato em andamento.
          </div>
        ) : null}

        <section className="mt-10 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-white">Participantes</h2>
          <div className="mt-5">
            {participants.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
                Nenhum participante cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-md border border-white/10 bg-white/5 p-4"
                  >
                    <strong className="block text-white">{participant.name}</strong>
                    <span className="mt-1 block text-sm text-slate-300">
                      {participant.nickname ?? 'Sem apelido'} - {participant.teamName ?? 'Sem time'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-white">Classificacao</h2>
          <div className="mt-5 overflow-x-auto rounded-md border border-white/10">
            {standings.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-300">
                Nenhum participante cadastrado ainda.
              </div>
            ) : (
              <table className="w-full min-w-[780px] border-collapse text-sm">
                <thead className="bg-white/10 text-xs uppercase text-slate-400">
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
                <tbody className="divide-y divide-white/10">
                  {standings.map((standing) => {
                    const isChampion = standing.participantId === champion?.id;

                    return (
                      <tr
                        key={standing.participantId}
                        className={isChampion ? 'bg-lime-400/10' : 'bg-white/[0.03]'}
                      >
                        <td className="px-3 py-3 font-bold text-white">{standing.position}</td>
                        <td className="px-3 py-3 font-semibold text-white">{standing.name}</td>
                        <td className="px-3 py-3 text-slate-200">{standing.teamName ?? '-'}</td>
                        <td className="px-3 py-3 text-right font-bold text-lime-200">
                          {standing.points}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.played}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.wins}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.draws}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.losses}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.goalsFor}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
                          {standing.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-200">
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

        <section className="mt-10 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-white">Partidas</h2>
          <div className="mt-5">
            {matches.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
                Campeonato sem partidas.
              </div>
            ) : (
              <div className="grid gap-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-4 rounded-md border border-white/10 bg-white/5 p-4 lg:grid-cols-[1.3fr_0.7fr_1.3fr_0.8fr_0.8fr] lg:items-center"
                  >
                    <div>
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Mandante
                      </span>
                      <strong className="mt-1 block text-white">
                        {getParticipantName(match.homeParticipantId)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Placar
                      </span>
                      <strong className="mt-1 block text-white">
                        {getScore(match.homeScore, match.awayScore)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Visitante
                      </span>
                      <strong className="mt-1 block text-white">
                        {getParticipantName(match.awayParticipantId)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Fase
                      </span>
                      <span className="mt-1 block text-slate-200">
                        {phaseLabels[match.phase]}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Status
                      </span>
                      <span className="mt-1 block text-slate-200">
                        {matchStatusLabels[match.status]}
                      </span>
                    </div>
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
