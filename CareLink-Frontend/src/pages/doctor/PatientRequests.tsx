import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { createAccessRequest, getAccessRequests, searchEligiblePatients, type AccessRequest } from "../../api/clinical";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

export default function PatientRequests() {
  const [patients, setPatients] = useState<Array<{ _id: string; walletAddress: string }>>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [patientUserId, setPatientUserId] = useState("");
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => getAccessRequests().then(setRequests).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load requests"));
  useEffect(() => { void load(); }, []);
  async function search() { try { setPatients(await searchEligiblePatients(query)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to search eligible patients"); } }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try { await createAccessRequest({ patientUserId, reason, scope: "medical_records" }); setMessage("Request submitted to the patient."); setPatientUserId(""); setReason(""); setPatients([]); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to submit request"); }
  }
  return <DashboardLayout><div className="space-y-8"><PageHeader eyebrow="Privacy controls" title="Patient requests" description="Search is limited to patients associated with your authenticated doctor account." />{error && <ErrorState message={error} />}{message && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}<ContentPanel title="Request access"><form onSubmit={submit} className="space-y-4"><div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient wallet" className="enterprise-input min-w-0 flex-1" /><button type="button" onClick={() => void search()} className="enterprise-button-secondary">Search</button></div><select required value={patientUserId} onChange={(event) => setPatientUserId(event.target.value)} className="enterprise-input w-full"><option value="">Select eligible patient</option>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.walletAddress}</option>)}</select><textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for requesting access" className="enterprise-input h-24 w-full" /><button className="enterprise-button-primary">Submit access request</button></form></ContentPanel><ContentPanel title="Request history" className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Patient</th><th className="p-3">Reason</th><th className="p-3">Status</th><th className="p-3">Created</th></tr></thead><tbody>{requests.map((request) => <tr key={request._id} className="border-b"><td className="p-3 font-mono">{typeof request.patientUserId === "string" ? request.patientUserId : request.patientUserId.walletAddress}</td><td className="p-3">{request.reason}</td><td className="p-3"><StatusBadge tone={request.status === "approved" ? "success" : "warning"}>{request.status}</StatusBadge></td><td className="p-3">{new Date(request.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{requests.length === 0 && <EmptyState title="No requests submitted" />}</ContentPanel></div></DashboardLayout>;
}
