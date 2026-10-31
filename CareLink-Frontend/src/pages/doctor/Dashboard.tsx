import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getDoctorPatients, getTreatmentNotes, type ClinicalPatient } from "../../api/clinical";
import { getAppointments } from "../../api/operations";
import { getDoctorRecords } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import { ContentPanel, EmptyState, ErrorState, MetricCard, PageHeader } from "../../components/ui";
import { Calendar, FileText, ClipboardList, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<ClinicalPatient[]>([]);
  const [counts, setCounts] = useState({ appointments: 0, records: 0, notes: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      getDoctorPatients(),
      getAppointments(),
      user?.walletAddress ? getDoctorRecords(user.walletAddress) : Promise.resolve([]),
      getTreatmentNotes(),
    ]).then(([nextPatients, appointments, records, notes]) => {
      setPatients(nextPatients);
      setCounts({ appointments: appointments.filter((item) => item.status === "requested" || item.status === "confirmed").length, records: records.length, notes: notes.length });
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load doctor dashboard"));
  }, [user?.walletAddress]);
  const cards = [["Associated patients", patients.length], ["Authorized records", counts.records], ["Upcoming appointments", counts.appointments], ["Treatment notes", counts.notes]];
  const icons = [Users, FileText, Calendar, ClipboardList];
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Clinical workspace" title="Doctor dashboard" description="Review associated patients, authorized records and clinical activity for your account." />{error && <ErrorState message={error} />}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value], index) => <MetricCard key={label} label={String(label)} value={value} icon={icons[index]} tone="green" />)}</div><ContentPanel title="Recent patients" subtitle="Patients associated through your authorized clinical relationship.">{patients.length ? <div className="grid gap-3 md:grid-cols-2">{patients.slice(0, 6).map((item) => <div key={item.patient._id} className="flex items-center justify-between rounded-xl border border-[#E4E8EC] p-4 text-sm"><span className="truncate font-mono text-[#17212F]">{item.patient.walletAddress}</span><span className="ml-3 text-[#697586]">{item.appointments} appointments</span></div>)}</div> : <EmptyState title="No associated patients" description="Patients will appear here when an authorized relationship is established." />}</ContentPanel></div></DashboardLayout>;
}
