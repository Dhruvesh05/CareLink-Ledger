import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getHospitalActivities, type HospitalActivity } from "../../api/organization";
import { ContentPanel, EmptyState, ErrorState, PageHeader } from "../../components/ui";

export default function ActivityLogs() {
  const [items, setItems] = useState<HospitalActivity[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { getHospitalActivities().then(setItems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load activities")); }, []);
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Hospital governance" title="Activity Logs" description="Organization operations recorded for this hospital only." />{error && <ErrorState message={error} />}<ContentPanel title="Organization activity"><div className="overflow-x-auto"><table className="enterprise-table"><thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Resource</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{new Date(item.createdAt).toLocaleString()}</td><td className="font-mono">{item.actorUserId?.walletAddress ?? "—"}</td><td>{item.actorRole}</td><td>{item.action}</td><td>{item.resource}</td></tr>)}</tbody></table>{items.length === 0 && <EmptyState title="No activity recorded" />}</div></ContentPanel></div></DashboardLayout>;
}
