import type { ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function PageHeader({ title, description, eyebrow, action }: { title: string; description?: string; eyebrow?: string; action?: ReactNode }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F8B78]">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-[#17212F] dark:text-white sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm text-[#697586]">{description}</p>}</div>
    {action && <div className="shrink-0">{action}</div>}
  </header>;
}

export function MetricCard({ label, value, icon: Icon, tone = "teal" }: { label: string; value: ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: "teal" | "green" | "indigo" | "cyan" }) {
  const tones = { teal: "bg-[#E4F4F0] text-[#0F6F61]", green: "bg-emerald-50 text-emerald-700", indigo: "bg-indigo-50 text-indigo-700", cyan: "bg-cyan-50 text-cyan-700" };
  return <div className="enterprise-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-[#697586]">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-[#17212F] dark:text-white">{value}</p></div>{Icon && <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span>}</div></div>;
}

export function ContentPanel({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`enterprise-panel p-5 sm:p-6 ${className}`}>{(title || action) && <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div>{title && <h2 className="text-lg font-bold text-[#17212F] dark:text-white">{title}</h2>}{subtitle && <p className="mt-1 text-sm text-[#697586]">{subtitle}</p>}</div>{action}</div>}{children}</section>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const tones = { success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", danger: "bg-rose-50 text-rose-700", info: "bg-cyan-50 text-cyan-700", neutral: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title = "No data available", description }: { title?: string; description?: string }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E8EC] px-6 py-12 text-center"><Inbox className="h-8 w-8 text-[#9AA4B2]" /><p className="mt-3 text-sm font-bold text-[#17212F]">{title}</p>{description && <p className="mt-1 max-w-md text-xs text-[#697586]">{description}</p>}</div>;
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E4E8EC] bg-white px-6 py-12 text-sm text-[#697586]"><LoaderCircle className="h-4 w-4 animate-spin text-[#0F8B78]" />{label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{message}</span>{onRetry && <button type="button" onClick={onRetry} className="font-bold underline">Retry</button>}</div>;
}
