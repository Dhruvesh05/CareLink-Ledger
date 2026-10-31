import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { createTreatmentNote, getDoctorPatients, getTreatmentNotes, type ClinicalPatient, type TreatmentNote } from "../../api/clinical";
import { ContentPanel, EmptyState, ErrorState, PageHeader } from "../../components/ui";

export default function TreatmentNotes() {
  const [patients, setPatients] = useState<ClinicalPatient[]>([]);
  const [notes, setNotes] = useState<TreatmentNote[]>([]);
  const [patientUserId, setPatientUserId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const load = () => Promise.all([getDoctorPatients(), getTreatmentNotes()]).then(([nextPatients, nextNotes]) => { setPatients(nextPatients); setNotes(nextNotes); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load treatment notes"));
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); try { await createTreatmentNote({ patientUserId, note }); setPatientUserId(""); setNote(""); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save treatment note"); } }
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Clinical documentation" title="Treatment notes" description="Notes are private clinical records and are not automatically published as blockchain medical records." />{error && <ErrorState message={error} />}<ContentPanel title="Create treatment note"><form onSubmit={submit} className="space-y-3"><select value={patientUserId} onChange={(event) => setPatientUserId(event.target.value)} required className="enterprise-input w-full"><option value="">Select an associated patient</option>{patients.map((item) => <option key={item.patient._id} value={item.patient._id}>{item.patient.walletAddress}</option>)}</select><textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={5000} placeholder="Write treatment notes..." className="enterprise-input h-40 w-full" /><button className="enterprise-button-primary">Save note</button></form></ContentPanel><ContentPanel title="Saved notes"><div className="space-y-3">{notes.map((item) => <article key={item._id} className="rounded-xl border border-[#E4E8EC] p-5"><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · {item.patientUserId.walletAddress}</p><p className="mt-3 whitespace-pre-wrap text-sm">{item.note}</p></article>)}</div>{notes.length === 0 && <EmptyState title="No treatment notes yet" />}</ContentPanel></div></DashboardLayout>;
}
