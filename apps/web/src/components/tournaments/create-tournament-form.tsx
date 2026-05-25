'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import {
  createTournament,
  type TournamentFormat,
} from '@/services/tournaments';

const formatOptions: Array<{ value: TournamentFormat; label: string }> = [
  { value: 'LEAGUE', label: 'Liga' },
  { value: 'KNOCKOUT', label: 'Mata-mata' },
  { value: 'LEAGUE_KNOCKOUT', label: 'Liga + mata-mata' },
];

const qualifiedOptions = [2, 4, 8, 16];

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('LEAGUE');
  const [isTwoLegged, setIsTwoLegged] = useState(false);
  const [qualifiedCount, setQualifiedCount] = useState('4');
  const [hasThirdPlaceMatch, setHasThirdPlaceMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresQualifiedCount = format === 'LEAGUE_KNOCKOUT';
  const canSubmit = useMemo(() => name.trim().length > 0 && !isSubmitting, [name, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tournament = await createTournament({
        name: name.trim(),
        description: description.trim() || null,
        format,
        isTwoLegged,
        qualifiedCount: requiresQualifiedCount ? Number(qualifiedCount) : null,
        hasThirdPlaceMatch,
      });

      router.push(`/tournaments/${tournament.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível criar o campeonato',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-semibold text-slate-100">
          Nome
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-lime-300"
          placeholder="Copa dos Amigos"
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-semibold text-slate-100">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-28 rounded-md border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-lime-300"
          placeholder="Campeonato local entre amigos."
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="format" className="text-sm font-semibold text-slate-100">
          Formato
        </label>
        <select
          id="format"
          value={format}
          onChange={(event) => setFormat(event.target.value as TournamentFormat)}
          className="rounded-md border border-white/10 bg-pitch-900 px-4 py-3 text-white outline-none transition focus:border-lime-300"
        >
          {formatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {requiresQualifiedCount ? (
        <div className="grid gap-2">
          <label htmlFor="qualifiedCount" className="text-sm font-semibold text-slate-100">
            Quantidade de classificados
          </label>
          <select
            id="qualifiedCount"
            value={qualifiedCount}
            onChange={(event) => setQualifiedCount(event.target.value)}
            className="rounded-md border border-white/10 bg-pitch-900 px-4 py-3 text-white outline-none transition focus:border-lime-300"
          >
            {qualifiedOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
          <input
            type="checkbox"
            checked={isTwoLegged}
            onChange={(event) => setIsTwoLegged(event.target.checked)}
            className="h-4 w-4 accent-lime-400"
          />
          Ida e volta
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
          <input
            type="checkbox"
            checked={hasThirdPlaceMatch}
            onChange={(event) => setHasThirdPlaceMatch(event.target.checked)}
            className="h-4 w-4 accent-lime-400"
          />
          Disputa de terceiro lugar
        </label>
      </div>

      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-lime-400 px-6 py-3 text-sm font-bold text-pitch-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Criando...' : 'Criar campeonato'}
      </button>
    </form>
  );
}
