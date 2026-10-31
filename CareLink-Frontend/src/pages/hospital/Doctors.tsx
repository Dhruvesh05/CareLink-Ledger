import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { createHospitalAssociation, getDepartments, getHospitalDoctors, updateHospitalAssociation, type HospitalDepartment, type HospitalDoctor } from "../../api/organization";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

function Doctors() {
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [query, setQuery] = useState("");
  const [doctorUserId, setDoctorUserId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<HospitalDepartment[]>([]);
  const [error, setError] = useState("");
  const load = () => getHospitalDoctors(query).then(setDoctors).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load doctors"));
  useEffect(() => { void load(); void getDepartments().then(setDepartments).catch(() => undefined); }, []);
  async function associate(event: FormEvent) {
    event.preventDefault();
    try { await createHospitalAssociation(doctorUserId, departmentId || undefined); setDoctorUserId(""); setDepartmentId(""); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to associate doctor"); }
  }
  async function setAssociation(doctor: HospitalDoctor, status: "active" | "revoked") {
    if (!doctor.association) return;
    try { await updateHospitalAssociation(doctor.association._id, status); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update association"); }
  }
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Hospital operations" title="Doctors Management" description="Only doctor associations belonging to this hospital are shown." />
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    <ContentPanel title="Associate doctor"><form onSubmit={associate} className="grid gap-3 md:grid-cols-3"><input value={doctorUserId} onChange={(event) => setDoctorUserId(event.target.value)} required placeholder="Doctor user ID" className="enterprise-input" /><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="enterprise-input"><option value="">No department</option>{departments.filter((department) => department.active).map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select><button className="rounded-lg bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">Associate doctor</button></form></ContentPanel>
    <ContentPanel title="Doctor directory" action={<div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet or DID" className="enterprise-input" /><button onClick={() => void load()} className="rounded-lg border border-[#E4E8EC] px-4 py-2 text-sm font-bold text-[#17212F]">Search</button></div>}>
    <div className="overflow-x-auto"><table className="enterprise-table"><thead><tr><th>Wallet</th><th>DID</th><th>Department</th><th>Verification</th><th>Association</th><th>Action</th></tr></thead><tbody>{doctors.map((doctor) => <tr key={doctor._id}><td className="font-mono">{doctor.walletAddress}</td><td className="font-mono text-xs">{doctor.did ?? "—"}</td><td>{doctor.association?.departmentId?.name ?? "Unassigned"}</td><td><StatusBadge tone={doctor.verificationStatus === "verified" ? "success" : "warning"}>{doctor.verificationStatus}</StatusBadge></td><td><StatusBadge tone={doctor.association?.status === "active" ? "success" : "neutral"}>{doctor.association?.status ?? "not associated"}</StatusBadge></td><td>{doctor.association?.status === "active" && <button onClick={() => void setAssociation(doctor, "revoked")} className="font-bold text-rose-700">Remove</button>}{doctor.association?.status === "revoked" && <button onClick={() => void setAssociation(doctor, "active")} className="font-bold text-emerald-700">Restore</button>}</td></tr>)}</tbody></table>{doctors.length === 0 && <EmptyState title="No doctors found" />}</div></ContentPanel>
  </div></DashboardLayout>;
}

export default Doctors;
