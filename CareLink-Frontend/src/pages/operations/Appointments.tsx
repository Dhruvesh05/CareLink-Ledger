import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../auth/AuthContext";
import { createAppointment, getAppointments, updateAppointment, type Appointment, type AppointmentStatus } from "../../api/operations";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

export default function Appointments() {
  const { role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorUserId, setDoctorUserId] = useState("");
  const [patientUserId, setPatientUserId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const load = () => getAppointments().then(setAppointments).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load appointments")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await createAppointment({ doctorUserId: role === "Patient" ? doctorUserId : undefined, patientUserId: role === "Doctor" ? patientUserId : undefined, scheduledAt, durationMinutes: Number(durationMinutes), reason });
      setDoctorUserId(""); setPatientUserId(""); setScheduledAt(""); setReason(""); setDurationMinutes("30"); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create appointment"); }
  }

  async function changeStatus(id: string, status: AppointmentStatus) {
    try { await updateAppointment(id, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update appointment"); }
  }

  async function reschedule(id: string) {
    if (!rescheduleDate) return;
    try {
      await updateAppointment(id, { scheduledAt: rescheduleDate });
      setRescheduling(null); setRescheduleDate(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to reschedule appointment"); }
  }

  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Care coordination" title="Appointments" description="Appointments are persistent records shared only with their participants." />
    {error && <ErrorState message={error} />}
    {(role === "Patient" || role === "Doctor") && <ContentPanel title="Request appointment"><form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
      {role === "Patient" ? <input value={doctorUserId} onChange={(e) => setDoctorUserId(e.target.value)} required placeholder="Doctor user ID" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /> : <input value={patientUserId} onChange={(e) => setPatientUserId(e.target.value)} required placeholder="Patient user ID" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />}
      <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <input type="number" min="15" max="240" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required placeholder="Minutes" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Reason" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Request appointment</button>
    </form></ContentPanel>}
    <ContentPanel title="Appointment history" className="overflow-x-auto">{loading ? <LoadingState label="Loading appointments…" /> : appointments.length === 0 ? <EmptyState title="No appointments found" /> : <table className="min-w-full text-left text-sm"><thead><tr><th className="p-4">Scheduled</th><th className="p-4">Patient</th><th className="p-4">Doctor</th><th className="p-4">Reason</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{appointments.map((item) => <tr key={item._id} className="border-t border-slate-100"><td className="p-4">{new Date(item.scheduledAt).toLocaleString()}<span className="block text-xs text-slate-500">{item.durationMinutes} minutes</span></td><td className="p-4 font-mono">{item.patientUserId?.walletAddress ?? "—"}</td><td className="p-4 font-mono">{item.doctorUserId?.walletAddress ?? "—"}</td><td className="p-4">{item.reason}</td><td className="p-4"><StatusBadge tone={item.status === "confirmed" ? "success" : item.status === "cancelled" ? "danger" : "warning"}>{item.status}</StatusBadge></td><td className="p-4">{item.status === "requested" && (role === "Doctor" || role === "Hospital") && <button onClick={() => void changeStatus(item._id, "confirmed")} className="text-emerald-700">Confirm</button>}{item.status !== "cancelled" && item.status !== "completed" && <><button onClick={() => void changeStatus(item._id, "cancelled")} className="ml-3 text-rose-700">Cancel</button><button onClick={() => { setRescheduling(item._id); setRescheduleDate(item.scheduledAt.slice(0, 16)); }} className="ml-3 text-cyan-700">Reschedule</button></>}{rescheduling === item._id && <span className="mt-2 flex gap-2"><input type="datetime-local" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="rounded border px-2 py-1 text-xs" /><button onClick={() => void reschedule(item._id)} className="text-emerald-700">Save</button></span>}</td></tr>)}</tbody></table>}</ContentPanel>
  </div></DashboardLayout>;
}
