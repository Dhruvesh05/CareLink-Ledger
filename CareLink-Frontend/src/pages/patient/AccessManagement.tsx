import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { approveAccessRequest, getAccessRequests, rejectAccessRequest, revokeAccessRequest, type AccessRequest } from "../../api/clinical";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

function doctorLabel(request: AccessRequest) {
  return typeof request.doctorUserId === "string" ? request.doctorUserId : request.doctorUserId.walletAddress;
}

export default function AccessManagement() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => getAccessRequests().then(setRequests).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load access requests")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  async function act(id: string, operation: () => Promise<unknown>) {
    setBusy(id); setError("");
    try { await operation(); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "The authorization operation failed"); } finally { setBusy(""); }
  }
  const pending = requests.filter((request) => request.status === "pending");
  const active = requests.filter((request) => request.status === "active");
  const history = requests.filter((request) => !["pending", "active"].includes(request.status));
  return <DashboardLayout><div className="space-y-8"><PageHeader eyebrow="Privacy controls" title="Access management" description="Approvals and revocations require the connected patient wallet and are confirmed against authorization." />{error && <ErrorState message={error} />}{loading ? <LoadingState label="Loading access requests…" /> : <><RequestSection title="Pending requests" requests={pending} action={(request) => <><button disabled={busy === request._id} onClick={() => void act(request._id, () => approveAccessRequest(request._id))} className="enterprise-button-primary">{busy === request._id ? "Waiting…" : "Approve with wallet"}</button><button disabled={busy === request._id} onClick={() => void act(request._id, () => rejectAccessRequest(request._id))} className="enterprise-button-secondary">Reject</button></>} /><RequestSection title="Active permissions" requests={active} action={(request) => <button disabled={busy === request._id} onClick={() => void act(request._id, () => revokeAccessRequest(request._id))} className="enterprise-button-danger">{busy === request._id ? "Waiting…" : "Revoke with wallet"}</button>} /><RequestSection title="Access history" requests={history} /></>}</div></DashboardLayout>;
}

function RequestSection({ title, requests, action }: { title: string; requests: AccessRequest[]; action?: (request: AccessRequest) => React.ReactNode }) {
  return <ContentPanel title={title} className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Doctor</th><th className="p-3">Permission</th><th className="p-3">Records</th><th className="p-3">Reason</th><th className="p-3">Expiry</th><th className="p-3">Requested</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{requests.map((request) => <tr key={request._id} className="border-b last:border-0"><td className="p-3 font-mono">{doctorLabel(request)}</td><td className="p-3">{request.permissionType}</td><td className="p-3">{(request.recordIds ?? []).join(", ")}</td><td className="max-w-xs p-3">{request.reason}</td><td className="p-3">{request.expiresAt ? new Date(request.expiresAt).toLocaleString() : "No expiry"}</td><td className="p-3">{new Date(request.createdAt).toLocaleString()}</td><td className="p-3"><StatusBadge tone={request.status === "active" ? "success" : request.status === "pending" ? "warning" : "neutral"}>{request.status}</StatusBadge></td><td className="space-x-2 p-3">{action?.(request)}</td></tr>)}</tbody></table>{requests.length === 0 && <EmptyState title="No requests in this section" />}</ContentPanel>;
}
