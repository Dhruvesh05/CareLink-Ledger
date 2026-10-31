import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminStats, type AdminStats } from "../../api/admin";
import { ContentPanel, EmptyState, ErrorState, LoadingState, MetricCard, PageHeader } from "../../components/ui";
import { Activity, Building2, FileCheck2, Link2, Users } from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getAdminStats().then(setStats).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load platform metrics")); }, []);
  const cards = stats ? [["Users", stats.users], ["Patients", stats.patients], ["Doctors", stats.doctors], ["Hospitals", stats.hospitals], ["Medical records", stats.medicalRecords], ["Cross-chain events", stats.crossChain], ["Failed operations", stats.failedOperations]] : [];
  const roleData = stats?.roleDistribution ?? [];
  const maxRole = Math.max(...roleData.map((item) => item.count), 1);
  const icons = [Users, Users, Users, Building2, FileCheck2, Link2, Activity];
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Platform governance" title="Admin dashboard" description="Infrastructure and account metadata only. Private medical record contents remain outside the admin view." />
    {error && <ErrorState message={error} />}
    {!stats && !error && <LoadingState label="Loading platform metrics…" />}
    {stats && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value], index) => <MetricCard key={label} label={String(label)} value={value} icon={icons[index]} tone="indigo" />)}</div><div className="grid gap-5 lg:grid-cols-2"><ContentPanel title="Users by role">{roleData.length ? roleData.map((item) => <div key={item._id} className="mb-4"><div className="mb-1 flex justify-between text-xs font-semibold text-[#697586]"><span>{item._id}</span><span>{item.count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(item.count / maxRole) * 100}%` }} /></div></div>) : <EmptyState title="No role history available" />}</ContentPanel><ContentPanel title="Registration trend">{stats.registrationTrend?.length ? <div className="flex min-h-40 items-end gap-3">{stats.registrationTrend.map((item) => { const max = Math.max(...(stats.registrationTrend ?? []).map((entry) => entry.count), 1); return <div key={item._id} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t bg-[#0F8B78]" style={{ height: `${Math.max((item.count / max) * 120, 4)}px` }} /><span className="text-[10px] text-[#697586]">{item._id}</span></div>; })}</div> : <EmptyState title="No historical registration data" />}</ContentPanel><ContentPanel title="Cross-chain transaction status">{stats.transactionStatus?.length ? stats.transactionStatus.map((item) => <div key={item._id} className="mb-2 flex justify-between rounded-xl bg-[#F5F7F8] p-3 text-sm"><span>{item._id}</span><strong>{item.count}</strong></div>) : <EmptyState title="No cross-chain transactions" />}</ContentPanel><ContentPanel title="Platform activity categories">{stats.auditCategory?.length ? stats.auditCategory.map((item) => <div key={item._id} className="mb-2 flex justify-between rounded-xl bg-[#F5F7F8] p-3 text-sm"><span>{item._id}</span><strong>{item.count}</strong></div>) : <EmptyState title="No audit activity" />}</ContentPanel></div></>}
  </div></DashboardLayout>;
}

export default Dashboard;
