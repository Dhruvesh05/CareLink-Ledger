import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminStats, type AdminStats } from "../../api/admin";
import { ContentPanel, ErrorState, LoadingState, MetricCard, PageHeader } from "../../components/ui";
import { Activity, Building2, FileCheck2, Link2, Users } from "lucide-react";
import { BarChart, DonutChart, LineChart } from "../../components/charts";

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getAdminStats().then(setStats).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load platform metrics")); }, []);
  const cards = stats ? [["Users", stats.users], ["Patients", stats.patients], ["Doctors", stats.doctors], ["Hospitals", stats.hospitals], ["Medical records", stats.medicalRecords], ["Cross-chain events", stats.crossChain], ["Failed operations", stats.failedOperations]] : [];
  const roleData = stats?.roleDistribution ?? [];
  const icons = [Users, Users, Users, Building2, FileCheck2, Link2, Activity];
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Platform governance" title="Admin dashboard" description="Infrastructure and account metadata only. Private medical record contents remain outside the admin view." />
    {error && <ErrorState message={error} />}
    {!stats && !error && <LoadingState label="Loading platform metrics…" />}
    {stats && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value], index) => <MetricCard key={label} label={String(label)} value={value} icon={icons[index]} tone="indigo" />)}</div><div className="grid gap-5 lg:grid-cols-2"><ContentPanel title="Users by role"><DonutChart items={roleData.map((item) => ({ label: item._id, value: item.count }))} /></ContentPanel><ContentPanel title="Registration trend"><LineChart items={(stats.registrationTrend ?? []).map((item) => ({ label: item._id, value: item.count }))} /></ContentPanel><ContentPanel title="Cross-chain transaction status"><BarChart items={(stats.transactionStatus ?? []).map((item) => ({ label: item._id, value: item.count }))} /></ContentPanel><ContentPanel title="Platform activity categories"><BarChart items={(stats.auditCategory ?? []).map((item) => ({ label: item._id, value: item.count }))} /></ContentPanel></div></>}
  </div></DashboardLayout>;
}

export default Dashboard;
