import type { ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function PageHeader({ title, description, eyebrow, action }: { title: string; description?: string; eyebrow?: string; action?: ReactNode }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--cl-primary)]">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-[var(--cl-text)] sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm text-[var(--cl-text-secondary)]">{description}</p>}</div>
    {action && <div className="shrink-0">{action}</div>}
  </header>;
}

export function MetricCard({ label, value, icon: Icon, tone = "teal" }: { label: string; value: ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: "teal" | "green" | "indigo" | "cyan" }) {
  const tones = { teal: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]", green: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]", indigo: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]", cyan: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]" };
  return <div className="enterprise-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-[var(--cl-text-secondary)]">{label}</p><p className="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--cl-text)]">{value}</p></div>{Icon && <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></span>}</div></div>;
}

export function ContentPanel({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`enterprise-panel p-5 sm:p-6 ${className}`}>{(title || action) && <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div>{title && <h2 className="text-lg font-bold text-[var(--cl-text)]">{title}</h2>}{subtitle && <p className="mt-1 text-sm text-[var(--cl-text-secondary)]">{subtitle}</p>}</div>{action}</div>}{children}</section>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const tones = { success: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300", warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300", info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300", neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title = "No data available", description }: { title?: string; description?: string }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--cl-border)] px-6 py-12 text-center"><Inbox className="h-8 w-8 text-[var(--cl-text-muted)]" /><p className="mt-3 text-sm font-bold text-[var(--cl-text)]">{title}</p>{description && <p className="mt-1 max-w-md text-xs text-[var(--cl-text-secondary)]">{description}</p>}</div>;
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--cl-border)] bg-[var(--cl-surface)] px-6 py-12 text-sm text-[var(--cl-text-secondary)]"><LoaderCircle className="h-4 w-4 animate-spin text-[var(--cl-primary)]" />{label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{message}</span>{onRetry && <button type="button" onClick={onRetry} className="font-bold underline">Retry</button>}</div>;
}
