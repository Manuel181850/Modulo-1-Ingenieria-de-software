import { STATUS_BADGE_STYLES, STATUS_LABELS } from '../data/mockUdintData';

export default function StatusBadge({ estatus }) {
  const styleClass =
    STATUS_BADGE_STYLES[estatus] || 'bg-slate-700/40 text-slate-300';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styleClass}`}
    >
      {STATUS_LABELS[estatus] || estatus}
    </span>
  );
}
