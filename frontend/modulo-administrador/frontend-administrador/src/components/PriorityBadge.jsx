import { PRIORITY_BADGE_STYLES, PRIORITY_LABELS } from '../data/mockUdintData';

export default function PriorityBadge({ prioridad }) {
  const styleClass =
    PRIORITY_BADGE_STYLES[prioridad] ||
    'border bg-slate-700/40 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styleClass}`}
    >
      {PRIORITY_LABELS[prioridad] || prioridad}
    </span>
  );
}
