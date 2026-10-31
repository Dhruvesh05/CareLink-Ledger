import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminIpfsCid, getAdminMonitoring, type AdminNetworkMonitoring } from "../../api/admin";
import { ContentPanel, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

export default function IPFS() {
  const [monitoring, setMonitoring] = useState<AdminNetworkMonitoring | null>(null);
  const [cid, setCid] = useState("");
  const [result, setResult] = useState<{ cid: string; pinned: boolean; retrievable: boolean; gateway: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getAdminMonitoring().then(setMonitoring).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load IPFS health")); }, []);
  async function lookup() { if (!cid.trim()) { setError("Enter a CID."); return; } try { setError(""); setResult(await getAdminIpfsCid(cid.trim())); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to check CID"); } }
  const ipfs = monitoring?.ipfs;
  return <DashboardLayout><div className="space-y-6"><PageHeader title="IPFS Monitor" description="Read-only Kubo/Pinata health and CID status. Private content and encryption keys are never exposed." />{error && <ErrorState message={error} />}{!monitoring && !error ? <LoadingState label="Loading IPFS health…" /> : <><div className="grid gap-4 md:grid-cols-3">{[["Provider", ipfs?.provider ?? "Unavailable"], ["API", ipfs?.api.status ?? "Unavailable"], ["Gateway", ipfs?.gateway.status ?? "Unavailable"]].map(([label, value]) => <ContentPanel key={label} title={label} action={<StatusBadge tone={value === "connected" || value === "ready" ? "success" : "neutral"}>{value}</StatusBadge>}><p className="break-all text-xs text-[#697586]">{label === "API" ? ipfs?.api.endpoint : label === "Gateway" ? ipfs?.gateway.endpoint : "Configured provider"}</p></ContentPanel>)}</div><ContentPanel title="CID lookup" subtitle="Check pin and gateway retrieval status for a persisted CID."><div className="flex flex-col gap-3 sm:flex-row"><input value={cid} onChange={(event) => setCid(event.target.value)} placeholder="bafy..." className="min-w-0 flex-1 rounded-xl border p-3" /><button onClick={() => void lookup()} className="rounded-xl bg-[#0F8B78] px-5 py-3 font-bold text-white">Check status</button></div>{result && <div className="mt-5 grid gap-3 rounded-xl bg-[#F4F7F8] p-4 text-sm sm:grid-cols-3"><span><strong>CID:</strong> {result.cid}</span><span><strong>Pin:</strong> {result.pinned ? "Pinned" : "Not pinned"}</span><span><strong>Retrieval:</strong> {result.retrievable ? "Available" : "Unavailable"}</span></div>}</ContentPanel></>}</div></DashboardLayout>;
}
