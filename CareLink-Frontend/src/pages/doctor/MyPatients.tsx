import DashboardLayout from "../../components/DashboardLayout";
import { useEffect, useState } from "react";
import { getDoctorPatients, type ClinicalPatient } from "../../api/clinical";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui";

function MyPatients() {
  const [patients, setPatients] = useState<ClinicalPatient[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getDoctorPatients().then(setPatients).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load patients")).finally(() => setLoading(false)); }, []);
  return (
    <DashboardLayout>
      <PageHeader eyebrow="Clinical relationships" title="My patients" description="Patients associated through your authorized clinical relationships." />
      {error && <ErrorState message={error} />}
      <ContentPanel title="Associated patients" className="overflow-x-auto">{loading ? <LoadingState label="Loading patients…" /> : patients.length ? <table className="min-w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Patient wallet</th><th className="p-3">Appointments</th><th className="p-3">Last appointment</th></tr></thead><tbody>{patients.map((item) => <tr key={item.patient._id} className="border-b"><td className="p-3 font-mono">{item.patient.walletAddress}</td><td className="p-3">{item.appointments}</td><td className="p-3">{new Date(item.lastAppointment).toLocaleString()}</td></tr>)}</tbody></table> : <EmptyState title="No associated patients found" />}</ContentPanel>
    </DashboardLayout>
  );
}

export default MyPatients;