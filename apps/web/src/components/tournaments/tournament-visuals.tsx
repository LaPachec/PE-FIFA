import type { ReactNode } from 'react';
import type { TournamentStatus } from '@/services/tournaments';

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  KNOCKOUT_STAGE: 'Mata-mata',
  FINISHED: 'Finalizado',
};

type StatusBadgeProps = {
  status: TournamentStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const isFinished = status === 'FINISHED';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
        isFinished
          ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
          : 'border-arena-700 bg-arena-850 text-zinc-200'
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}

type StatCardProps = {
  label: string;
  value: ReactNode;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-arena-700 bg-arena-850 p-5">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <strong className="mt-3 block text-lg text-white">{value}</strong>
    </div>
  );
}

type SectionShellProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionShell({
  title,
  description,
  action,
  children,
}: SectionShellProps) {
  return (
    <section className="mt-10 rounded-2xl border border-arena-700 bg-arena-900/80 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
