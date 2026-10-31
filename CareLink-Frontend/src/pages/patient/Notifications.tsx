import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getNotifications, markNotificationRead, type Notification } from "../../api/clinical";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getNotifications().then(setItems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load notifications")).finally(() => setLoading(false)); }, []);
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Account activity" title="Notifications" description="Appointment, access and clinical events generated for your account." />{error && <ErrorState message={error} />}{loading ? <LoadingState label="Loading notifications…" /> : <ContentPanel title="Recent notifications">{items.length ? <div className="space-y-3">{items.map((item) => <button key={item._id} onClick={() => markNotificationRead(item._id).then(() => setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry))).catch(() => undefined)} className={`block w-full rounded-xl border p-5 text-left ${item.readAt ? "border-[#E4E8EC]" : "border-cyan-200 bg-cyan-50"}`}><div className="flex items-center justify-between gap-3"><p className="font-semibold text-[#17212F]">{item.title}</p>{!item.readAt && <StatusBadge tone="info">Unread</StatusBadge>}</div><p className="mt-1 text-sm text-[#697586]">{item.message}</p><p className="mt-2 text-xs text-[#9AA4B2]">{new Date(item.createdAt).toLocaleString()}</p></button>)}</div> : <EmptyState title="No notifications" />}</ContentPanel>}</div></DashboardLayout>;
}
