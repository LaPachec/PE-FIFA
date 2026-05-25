'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createParticipant,
  deleteParticipant,
  getParticipants,
  updateParticipant,
  type Participant,
} from '@/services/participants';

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
  const [form, setForm] = useState<ParticipantFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ParticipantFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      const nextParticipants = await getParticipants(tournamentId);
      setParticipants(nextParticipants);
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
  }, [tournamentId]);

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

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Participantes</h2>
          <p className="mt-1 text-sm text-slate-300">
            Gerencie os jogadores inscritos neste campeonato.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadParticipants()}
          className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-lime-300 hover:text-lime-200"
        >
          Atualizar
        </button>
      </div>

      {!canManageParticipants ? (
        <div className="mt-5 rounded-md border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Este campeonato ja foi iniciado. Os participantes nao podem mais ser alterados.
        </div>
      ) : (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-4 rounded-md border border-white/10 bg-white/5 p-5 lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300"
            placeholder="Nome"
            required
          />
          <input
            value={form.nickname}
            onChange={(event) =>
              setForm((current) => ({ ...current, nickname: event.target.value }))
            }
            className="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300"
            placeholder="Apelido"
          />
          <input
            value={form.teamName}
            onChange={(event) =>
              setForm((current) => ({ ...current, teamName: event.target.value }))
            }
            className="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300"
            placeholder="Time"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-lime-400 px-5 py-3 text-sm font-bold text-pitch-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      )}

      {feedback ? (
        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-lime-300/30 bg-lime-400/10 text-lime-100'
              : 'border-red-400/30 bg-red-500/10 text-red-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-md border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Carregando participantes...
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
            Nenhum participante cadastrado ainda.
          </div>
        ) : (
          <div className="grid gap-3">
            {participants.map((participant) => {
              const isEditing = editingId === participant.id;

              return (
                <div
                  key={participant.id}
                  className="rounded-md border border-white/10 bg-white/5 p-4"
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
                        className="min-w-0 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-lime-300"
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
                        className="min-w-0 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-lime-300"
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
                        className="min-w-0 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-lime-300"
                        placeholder="Time"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUpdate(participant.id)}
                          disabled={isSaving || editingForm.name.trim().length === 0}
                          className="rounded-md bg-lime-400 px-3 py-2 text-xs font-bold text-pitch-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Nome
                        </span>
                        <strong className="mt-1 block text-white">{participant.name}</strong>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Apelido
                        </span>
                        <span className="mt-1 block text-slate-200">
                          {participant.nickname ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Time
                        </span>
                        <span className="mt-1 block text-slate-200">
                          {participant.teamName ?? '-'}
                        </span>
                      </div>
                      <div className="flex justify-start gap-2 lg:justify-end">
                        {canManageParticipants ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(participant)}
                              className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold text-white transition hover:border-lime-300 hover:text-lime-200"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(participant.id)}
                              disabled={isSaving}
                              className="rounded-md border border-red-400/30 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Bloqueado</span>
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
    </section>
  );
}
