'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  approveAllPendingParticipants,
  approveParticipant,
  createParticipant,
  deleteParticipant,
  getPendingParticipants,
  getParticipants,
  rejectParticipant,
  updateParticipant,
  type Participant,
} from '@/services/participants';
import { SectionShell } from '@/components/tournaments/tournament-visuals';

type ParticipantsManagerProps = {
  tournamentId: string;
  tournamentStatus: string;
};

type ParticipantFormState = {
  name: string;
  nickname: string;
  teamName: string;
};

const emptyForm: ParticipantFormState = {
  name: '',
  nickname: '',
  teamName: '',
};

function toPayload(form: ParticipantFormState) {
  return {
    name: form.name.trim(),
    nickname: form.nickname.trim() || null,
    teamName: form.teamName.trim() || null,
  };
}

export function ParticipantsManager({
  tournamentId,
  tournamentStatus,
}: ParticipantsManagerProps) {
  const canManageParticipants = tournamentStatus === 'DRAFT';
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
  const [form, setForm] = useState<ParticipantFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ParticipantFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    type: 'approve' | 'reject';
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const canSubmit = useMemo(
    () => canManageParticipants && form.name.trim().length > 0 && !isSaving,
    [canManageParticipants, form.name, isSaving],
  );

  const loadParticipants = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const [nextParticipants, nextPendingParticipants] = await Promise.all([
        getParticipants(tournamentId),
        canManageParticipants ? getPendingParticipants(tournamentId) : Promise.resolve([]),
      ]);

      setParticipants(nextParticipants);
      setPendingParticipants(nextPendingParticipants);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar os participantes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canManageParticipants, tournamentId]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const participant = await createParticipant(tournamentId, toPayload(form));
      setParticipants((currentParticipants) => [...currentParticipants, participant]);
      setForm(emptyForm);
      setFeedback({ type: 'success', message: 'Participante adicionado com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel adicionar o participante.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(participant: Participant) {
    setEditingId(participant.id);
    setEditingForm({
      name: participant.name,
      nickname: participant.nickname ?? '',
      teamName: participant.teamName ?? '',
    });
    setFeedback(null);
  }

  async function handleUpdate(participantId: string) {
    setFeedback(null);
    setIsSaving(true);

    try {
      const participant = await updateParticipant(participantId, toPayload(editingForm));
      setParticipants((currentParticipants) =>
        currentParticipants.map((currentParticipant) =>
          currentParticipant.id === participant.id ? participant : currentParticipant,
        ),
      );
      setEditingId(null);
      setEditingForm(emptyForm);
      setFeedback({ type: 'success', message: 'Participante atualizado com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o participante.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(participantId: string) {
    const confirmed = window.confirm(
      'Deseja remover este participante? Esta acao nao pode ser desfeita.',
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setIsSaving(true);

    try {
      await deleteParticipant(participantId);
      setParticipants((currentParticipants) =>
        currentParticipants.filter((participant) => participant.id !== participantId),
      );
      setFeedback({ type: 'success', message: 'Participante removido com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel remover o participante.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprove(participantId: string) {
    setFeedback(null);
    setPendingAction({ id: participantId, type: 'approve' });

    try {
      const participant = await approveParticipant(participantId);
      setPendingParticipants((currentParticipants) =>
        currentParticipants.filter((currentParticipant) => currentParticipant.id !== participantId),
      );
      setParticipants((currentParticipants) => [...currentParticipants, participant]);
      setFeedback({ type: 'success', message: 'Inscricao aprovada com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel aprovar a inscricao.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleApproveAllPending() {
    const confirmed = window.confirm(
      'Deseja aprovar todas as inscricoes pendentes deste campeonato?',
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setIsApprovingAll(true);

    try {
      const approvedParticipants = await approveAllPendingParticipants(tournamentId);
      setParticipants(approvedParticipants);
      setPendingParticipants([]);
      setFeedback({ type: 'success', message: 'Todas as inscricoes pendentes foram aprovadas.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel aprovar as inscricoes.',
      });
    } finally {
      setIsApprovingAll(false);
    }
  }

  async function handleReject(participantId: string) {
    setFeedback(null);
    setPendingAction({ id: participantId, type: 'reject' });

    try {
      await rejectParticipant(participantId);
      setPendingParticipants((currentParticipants) =>
        currentParticipants.filter((participant) => participant.id !== participantId),
      );
      setFeedback({ type: 'success', message: 'Inscricao rejeitada com sucesso.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel rejeitar a inscricao.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <SectionShell
      title="Participantes"
      description="Gerencie os jogadores inscritos neste campeonato."
      action={
        <button
          type="button"
          onClick={() => void loadParticipants()}
          className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
        >
          Atualizar
        </button>
      }
    >

      {!canManageParticipants ? (
        <div className="rounded-xl border border-gold-700/40 bg-gold-700/10 px-4 py-3 text-sm text-gold-400">
          Este campeonato ja foi iniciado. Os participantes nao podem mais ser alterados.
        </div>
      ) : (
        <section className="rounded-xl border border-arena-700 bg-arena-850 p-5">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Adicionar participante manualmente</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Use esta opcao para cadastrar jogadores diretamente, sem link de convite.
            </p>
          </div>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-gold-500"
              placeholder="Nome"
              required
            />
            <input
              value={form.nickname}
              onChange={(event) =>
                setForm((current) => ({ ...current, nickname: event.target.value }))
              }
              className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-gold-500"
              placeholder="Apelido"
            />
            <input
              value={form.teamName}
              onChange={(event) =>
                setForm((current) => ({ ...current, teamName: event.target.value }))
              }
              className="rounded-xl border border-arena-700 bg-arena-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-gold-500"
              placeholder="Time"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar
            </button>
          </form>
        </section>
      )}

      {feedback ? (
        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-gold-500/30 bg-gold-500/10 text-gold-400'
              : 'border-red-500/30 bg-red-500/10 text-red-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {canManageParticipants ? (
        <section className="mt-6 rounded-xl border border-arena-700 bg-arena-850 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Inscricoes pendentes</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Aprove ou rejeite participantes inscritos pelo link de convite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex w-fit rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-400">
                {pendingParticipants.length} pendente{pendingParticipants.length === 1 ? '' : 's'}
              </span>
              {pendingParticipants.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleApproveAllPending()}
                  disabled={isApprovingAll || pendingAction !== null}
                  className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isApprovingAll ? 'Aprovando...' : 'Aprovar todos'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="rounded-xl border border-arena-700 bg-arena-900 p-5 text-sm text-zinc-400">
                Carregando inscricoes pendentes...
              </div>
            ) : pendingParticipants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-arena-700 p-6 text-center text-sm text-zinc-400">
                Nenhuma inscricao pendente.
              </div>
            ) : (
              <div className="grid gap-3">
                {pendingParticipants.map((participant) => {
                  const isApproving =
                    pendingAction?.id === participant.id && pendingAction.type === 'approve';
                  const isRejecting =
                    pendingAction?.id === participant.id && pendingAction.type === 'reject';

                  return (
                    <div
                      key={participant.id}
                      className="grid gap-3 rounded-xl border border-arena-700 bg-arena-900 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"
                    >
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Nome
                        </span>
                        <strong className="mt-1 block text-white">{participant.name}</strong>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Apelido
                        </span>
                        <span className="mt-1 block text-zinc-300">
                          {participant.nickname ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Time
                        </span>
                        <span className="mt-1 block text-zinc-300">
                          {participant.teamName ?? '-'}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => void handleApprove(participant.id)}
                          disabled={pendingAction !== null}
                          className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isApproving ? 'Aprovando...' : 'Aprovar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReject(participant.id)}
                          disabled={pendingAction !== null}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRejecting ? 'Rejeitando...' : 'Rejeitar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-arena-700 bg-arena-850 p-6 text-sm text-zinc-400">
            Carregando participantes...
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-arena-700 p-8 text-center text-sm text-zinc-400">
            Nenhum participante cadastrado ainda.
          </div>
        ) : (
          <div className="grid gap-3">
            {participants.map((participant) => {
              const isEditing = editingId === participant.id;

              return (
                <div
                  key={participant.id}
                  className="rounded-xl border border-arena-700 bg-arena-850 p-4"
                >
                  {isEditing ? (
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                      <input
                        value={editingForm.name}
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                        placeholder="Nome"
                      />
                      <input
                        value={editingForm.nickname}
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            nickname: event.target.value,
                          }))
                        }
                        className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                        placeholder="Apelido"
                      />
                      <input
                        value={editingForm.teamName}
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            teamName: event.target.value,
                          }))
                        }
                        className="min-w-0 rounded-xl border border-arena-700 bg-arena-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
                        placeholder="Time"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUpdate(participant.id)}
                          disabled={isSaving || editingForm.name.trim().length === 0}
                          className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-bold text-arena-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-arena-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Nome
                        </span>
                        <strong className="mt-1 block text-white">{participant.name}</strong>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Apelido
                        </span>
                        <span className="mt-1 block text-zinc-300">
                          {participant.nickname ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Time
                        </span>
                        <span className="mt-1 block text-zinc-300">
                          {participant.teamName ?? '-'}
                        </span>
                      </div>
                      <div className="flex justify-start gap-2 lg:justify-end">
                        {canManageParticipants ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(participant)}
                              className="rounded-lg border border-arena-700 px-3 py-2 text-xs font-bold text-white transition hover:border-gold-500 hover:text-gold-400"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(participant.id)}
                              disabled={isSaving}
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
