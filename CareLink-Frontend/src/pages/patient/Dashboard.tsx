import { useEffect, useMemo, useState } from "react";
import { FileText, Calendar, Users, HeartPulse } from "lucide-react";

import { getPatientRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import RecordFileActions from "../../components/RecordFileActions";
import { getAppointments, getInvoices } from "../../api/operations";
import { ContentPanel, EmptyState, MetricCard, PageHeader, StatusBadge } from "../../components/ui";
import { BarChart, DonutChart, LineChart } from "../../components/charts";

function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Awaited<ReturnType<typeof getAppointments>>>([]);

  useEffect(() => {
    if (!user?.walletAddress) {
      setRecords([]);
      return;
    }

    let isMounted = true;
    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const nextRecords = await getPatientRecords(user.walletAddress);
        if (isMounted) setRecords(nextRecords);
      } catch {
        if (isMounted) setRecords([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRecords();
    void getAppointments().then((items) => {
      setAppointments(items);
      setAppointmentCount(items.filter((item) => item.status === "requested" || item.status === "confirmed").length);
    }).catch(() => { setAppointmentCount(null); setAppointments([]); });
    void getInvoices().then((items) => setOutstandingInvoices(items.filter((item) => item.status === "issued").length)).catch(() => setOutstandingInvoices(null));

    return () => {
      isMounted = false;
    };
  }, [user?.walletAddress]);

  const stats = useMemo(() => [
    { title: "Medical Records", value: String(records.length), icon: FileText, tone: "bg-blue-50 text-blue-700" },
    { title: "Upcoming Appointments", value: appointmentCount === null ? "—" : String(appointmentCount), icon: Calendar, tone: "bg-emerald-50 text-emerald-700" },
    { title: "Outstanding Invoices", value: outstandingInvoices === null ? "—" : String(outstandingInvoices), icon: Users, tone: "bg-violet-50 text-violet-700" },
    { title: "Health Summary", value: records.some((record) => record.emergency) ? "High priority" : "Stable", icon: HeartPulse, tone: "bg-rose-50 text-rose-700" },
  ], [appointmentCount, outstandingInvoices, records]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((record) => {
      const category = record.category ?? "Other";
      map.set(category, (map.get(category) ?? 0) + 1);
    });
    return [...map.entries()].map(([label, count]) => ({ label, count: String(count) }));
  }, [records]);

  const recordTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    records.forEach((record) => {
      const rawDate = record.createdAt ?? record.timestamp;
      if (!rawDate) return;
      const label = rawDate.slice(0, 10);
      byDate.set(label, (byDate.get(label) ?? 0) + 1);
    });
    return [...byDate.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, value]) => ({ label, value }));
  }, [records]);

  const recentRecords = records.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Patient overview" title="Good to see you" description={isLoading ? "Loading your care activity…" : "Your care activity, authorized records and upcoming appointments in one secure workspace."} />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return <MetricCard key={item.title} label={item.title} value={item.value} icon={Icon} tone="cyan" />;
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <ContentPanel title="Recent records" subtitle="Your latest blockchain-backed medical activity.">

            <div className="space-y-4">
              {recentRecords.length === 0 ? (
                <EmptyState title="No recent records" description="Upload a record to populate this view." />
              ) : (
                recentRecords.map((record) => (
                  <div key={record.recordId ?? record.id ?? record.cid ?? record.fileName ?? Math.random()} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{record.fileName ?? "Medical record"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{record.category ?? "General"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{record.createdAt ?? record.timestamp ?? "Recent"}</p>
                      <StatusBadge tone={record.emergency ? "warning" : "success"}>{record.emergency ? "Emergency" : "Standard"}</StatusBadge>
                    </div><RecordFileActions record={record} compact />
                  </div>
                ))
              )}
            </div>
          </ContentPanel>

          <ContentPanel title="Record categories" subtitle="A summary of your available records.">
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {categorySummary.length === 0 ? (
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No categories available yet.</div>
              ) : (
                categorySummary.map((record) => (
                  <div key={record.label} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{record.label}</span>
                    <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-bold">{record.count}</span>
                  </div>
                ))
              )}
            </div>
          </ContentPanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ContentPanel title="Record activity" subtitle="Available records grouped by category.">
            <BarChart items={categorySummary.map((item) => ({ label: item.label, value: Number(item.count) }))} />
          </ContentPanel>
          <ContentPanel title="Appointment distribution" subtitle="Current appointment statuses returned by your care team.">
            <DonutChart items={["requested", "confirmed", "completed", "cancelled"].map((status) => ({ label: status, value: appointments.filter((item) => item.status === status).length })).filter((item) => item.value > 0)} />
          </ContentPanel>
          <ContentPanel title="Recent record trend" subtitle="Records with a valid date are plotted chronologically.">
            <LineChart items={recordTrend} />
          </ContentPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;