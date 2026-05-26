'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createParticipant,
  deleteParticipant,
  getParticipants,
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
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-xl border border-arena-700 bg-arena-850 p-5 lg:grid-cols-[1fr_1fr_1fr_auto]"
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
