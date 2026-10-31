import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminAudit, getAdminAuditStats, getAdminReport, type AdminAuditEvent } from "../../api/admin";
import { ContentPanel, EmptyState, ErrorState, MetricCard, PageHeader, StatusBadge } from "../../components/ui";
import { Activity, FileCheck2, ShieldCheck, XCircle } from "lucide-react";

function AuditLogs() {
  const [logs, setLogs] = useState<AdminAuditEvent[]>([]);
  const [stats, setStats] = useState<{ total: number; failures: number; access: number; consent: number } | null>(null);
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const load = () => Promise.all([getAdminAudit({ category, q: query, page }), getAdminAuditStats()]).then(([audit, nextStats]) => { setLogs(audit.events); setPages(audit.pages); setStats(nextStats); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load audit data"));
  useEffect(() => { void load(); }, [category, page]);
  async function exportCsv() { try { const csv = await getAdminReport("audit"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const link = document.createElement("a"); link.href = url; link.download = "carelink-audit-report.csv"; link.click(); URL.revokeObjectURL(url); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to export audit data"); } }

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Audit & compliance" title="Audit logs" description="Monitor healthcare access activity, consent, verification events and platform operations." action={<button onClick={() => void exportCsv()} className="rounded-xl bg-[#0F8B78] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0B7565]">Export CSV</button>} />
      {error && <ErrorState message={error} />}
      <div className="grid gap-4 sm:grid-cols-4">{[["Total events", stats?.total ?? "—", Activity], ["Access", stats?.access ?? "—", ShieldCheck], ["Consent", stats?.consent ?? "—", FileCheck2], ["Failures", stats?.failures ?? "—", XCircle]].map(([label, value, Icon]) => <MetricCard key={String(label)} label={String(label)} value={String(value)} icon={Icon as typeof Activity} tone={label === "Failures" ? "indigo" : "teal"} />)}</div>
      <ContentPanel className="mt-6" title="Event history" subtitle="Backend-backed events. No immutability or certification claim is made.">
      <div className="mb-5 flex flex-wrap gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setPage(1); void load(); } }} placeholder="Search events, resources or transaction references" className="enterprise-input min-w-64 flex-1 text-sm" /><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="enterprise-input text-sm"><option value="">All events</option><option value="access">Access</option><option value="consent">Consent</option><option value="medical-records">Medical records</option><option value="verification">Verification</option><option value="blockchain">Blockchain</option><option value="administration">Administration</option><option value="failure">Failures</option></select></div>
        {logs.map((log) => (
          <div
            key={log._id}
            className="p-6 border-b last:border-b-0"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-[#17212F]">{log.event}</h3>

                <p className="text-gray-500 mt-1">
                  {log.actorUserId?.walletAddress ?? "Unknown actor"} · {log.actorRole ?? log.actorUserId?.role ?? "Unknown role"} · {log.resource} · {log.result}{log.transactionReference ? ` · ${log.transactionReference}` : ""}
                </p>
              </div>
              <StatusBadge tone={log.result?.toLowerCase() === "failure" ? "danger" : "success"}>
                {log.result}
              </StatusBadge>
              <span className="text-sm text-gray-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {!logs.length && <EmptyState title="No audit events match these filters" />}
        <div className="mt-4 flex items-center justify-between text-sm text-[#697586]"><span>Page {page} of {pages}</span><div className="space-x-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#E4E8EC] px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#E4E8EC] px-3 py-1 disabled:opacity-40">Next</button></div></div>
      </ContentPanel>
    </DashboardLayout>
  );
}

export default AuditLogs;