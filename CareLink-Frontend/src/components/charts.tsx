import { EmptyState } from "./ui";

export type ChartDatum = { label: string; value: number };

function ChartEmpty({ title = "Not enough data for this view" }: { title?: string }) {
  return <EmptyState title={title} description="This visualization will appear when the service returns sufficient data." />;
}

export function BarChart({ items, color = "var(--cl-primary)" }: { items: ChartDatum[]; color?: string }) {
  if (!items.length) return <ChartEmpty />;
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between gap-3 text-xs font-semibold text-[var(--cl-text-secondary)]">
            <span className="truncate">{item.label}</span>
            <span className="text-[var(--cl-text)]">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--cl-surface-muted)]">
            <div className="h-2 rounded-full transition-all" style={{ width: `${item.value ? Math.max((item.value / maximum) * 100, 4) : 0}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ items, color = "var(--cl-primary)" }: { items: ChartDatum[]; color?: string }) {
  if (items.length < 2) return <ChartEmpty title="Not enough trend data" />;
  const maximum = Math.max(...items.map((item) => item.value), 1);
  const points = items.map((item, index) => {
    const x = (index / (items.length - 1)) * 600 + 20;
    const y = 170 - (item.value / maximum) * 135;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="min-w-0">
      <svg viewBox="0 0 640 210" className="h-52 w-full overflow-visible" role="img" aria-label="Trend chart">
        <line x1="20" y1="170" x2="620" y2="170" stroke="var(--cl-border)" />
        <line x1="20" y1="102" x2="620" y2="102" stroke="var(--cl-border-subtle)" strokeDasharray="4 6" />
        <line x1="20" y1="35" x2="620" y2="35" stroke="var(--cl-border-subtle)" strokeDasharray="4 6" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => {
          const x = (index / (items.length - 1)) * 600 + 20;
          const y = 170 - (item.value / maximum) * 135;
          return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="4" fill="var(--cl-surface)" stroke={color} strokeWidth="3" />;
        })}
      </svg>
      <div className="flex justify-between gap-2 text-[10px] font-medium text-[var(--cl-text-muted)]">
        {items.map((item) => <span key={item.label} className="truncate">{item.label}</span>)}
      </div>
    </div>
  );
}

export function DonutChart({ items }: { items: ChartDatum[] }) {
  if (!items.length) return <ChartEmpty />;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <ChartEmpty title="No activity recorded" />;
  const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#f59e0b", "#22c55e"];
  let offset = 0;
  const gradient = items.map((item, index) => {
    const start = offset;
    offset += (item.value / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${offset}deg`;
  }).join(", ");
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[var(--cl-surface)]">
          <strong className="font-display text-2xl text-[var(--cl-text)]">{total}</strong>
          <span className="text-[10px] uppercase tracking-wider text-[var(--cl-text-muted)]">Total</span>
        </div>
      </div>
      <div className="w-full space-y-2">
        {items.map((item, index) => <div key={item.label} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-[var(--cl-text-secondary)]"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /> <span className="truncate">{item.label}</span></span><strong className="text-[var(--cl-text)]">{item.value}</strong></div>)}
      </div>
    </div>
  );
}
