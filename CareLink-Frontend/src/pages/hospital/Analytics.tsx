import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getHospitalStats, type HospitalStats } from "../../api/organization";
import { ContentPanel, ErrorState, LoadingState, PageHeader } from "../../components/ui";

function BarChart({ items, color = "bg-teal-500" }: { items: Array<{ label: string; value: number }>; color?: string }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) return <p className="text-sm text-slate-500">Not enough historical data to display this chart.</p>;
  return <div className="space-y-4">{items.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs font-medium text-slate-600"><span>{item.label}</span><span>{item.value}</span></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.max((item.value / maximum) * 100, item.value ? 4 : 0)}%` }} /></div></div>)}</div>;
}

export default function Analytics() {
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getHospitalStats().then(setStats).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load hospital analytics")); }, []);
  const monthly = useMemo(() => (stats?.monthlyAppointments ?? []).map((item) => ({ label: item.month, value: item.count })), [stats]);
  const appointmentStatuses = useMemo(() => (stats?.appointmentStatus ?? []).map((item) => ({ label: item.status, value: item.count })), [stats]);
  const departments = useMemo(() => (stats?.doctorsByDepartment ?? []).map((item) => ({ label: item.name, value: item.count })), [stats]);
  const invoices = useMemo(() => stats?.invoiceStatus
    ? stats.invoiceStatus.map((item) => ({ label: item.status, value: item.count }))
    : (stats?.invoices ?? []).map((item) => ({ label: item._id, value: item.count })), [stats]);
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Hospital intelligence" title="Hospital Analytics" description="Charts are calculated from persisted appointments, associations and invoices for this hospital." />{error && <ErrorState message={error} />}{!stats && !error ? <LoadingState label="Loading analytics…" /> : <div className="grid gap-5 lg:grid-cols-2"><ContentPanel title="Monthly appointments"><BarChart items={monthly} /></ContentPanel><ContentPanel title="Appointments by status"><BarChart items={appointmentStatuses} color="bg-indigo-500" /></ContentPanel><ContentPanel title="Doctors by department"><BarChart items={departments} color="bg-cyan-500" /></ContentPanel><ContentPanel title="Invoices by status"><BarChart items={invoices} color="bg-amber-500" /></ContentPanel></div>}</div></DashboardLayout>;
}
