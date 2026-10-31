import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getHospitalPatients, type HospitalPatient } from "../../api/organization";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

export default function Patients() {
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { getHospitalPatients().then(setPatients).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load patients")); }, []);
  const filtered = patients.filter((item) => item.patient.walletAddress.toLowerCase().includes(query.toLowerCase()));
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Hospital operations" title="Patient Management" description="Patients are listed only when they have hospital-scoped appointments. Association does not grant record access." />{error && <ErrorState message={error} />}<ContentPanel title="Patient directory" action={<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient wallet" className="enterprise-input" />}><div className="overflow-x-auto"><table className="enterprise-table"><thead><tr><th>Wallet</th><th>DID</th><th>Appointments</th><th>Last appointment</th><th>Consent</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.patient._id}><td className="font-mono">{item.patient.walletAddress}</td><td className="font-mono text-xs">{item.patient.did ?? "—"}</td><td>{item.appointments}</td><td>{item.lastAppointment ? new Date(item.lastAppointment).toLocaleString() : "—"}</td><td><StatusBadge tone="neutral">Not granted</StatusBadge></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState title="No associated patients found" />}</div></ContentPanel></div></DashboardLayout>;
}
