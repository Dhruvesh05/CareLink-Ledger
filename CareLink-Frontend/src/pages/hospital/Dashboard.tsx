import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getHospitalStats, type HospitalStats } from "../../api/organization";
import { ContentPanel, EmptyState, ErrorState, LoadingState, MetricCard, PageHeader } from "../../components/ui";
import { Building2, Calendar, Users, UserRound } from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getHospitalStats().then(setStats).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load hospital data"));
  }, []);

  const cards = [
    ["Associated doctors", stats?.associatedDoctors ?? 0],
    ["Active doctors", stats?.activeDoctors ?? 0],
    ["Verified doctors", stats?.verifiedDoctors ?? "Unavailable"],
    ["Associated patients", stats?.associatedPatients ?? 0],
    ["Appointments", stats?.appointments ?? 0],
    ["Departments", stats?.departments ?? 0],
    ["Pending requests", stats?.pendingAssociations ?? 0],
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Hospital operations" title="Hospital dashboard" description="Organization metrics are scoped to your hospital and never expose unrelated patient content." />
        {error && <ErrorState message={error} />}
        {!stats && !error ? <LoadingState label="Loading hospital metrics…" /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([label, value], index) => (
                <MetricCard key={label} label={String(label)} value={value} icon={[Users, UserRound, UserRound, Users, Calendar, Building2, Users][index]} tone="teal" />
              ))}
            </div>
            <ContentPanel title="Recent activity" subtitle="Latest organization events returned by the hospital activity service.">
              <div className="mt-4 space-y-3">
                {stats?.recentActivities?.length ? stats.recentActivities.map((activity) => (
                  <div key={activity._id} className="flex justify-between rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-500/10 dark:text-teal-200">
                    <span>{activity.action}</span><span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                )) : <EmptyState title="No recent organization activity" />}
              </div>
            </ContentPanel>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
