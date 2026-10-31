import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminUsers, getVerificationStatus, revokeVerification, verifyUser, type AdminUser } from "../../api/admin";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

type VerificationState = "loading" | "verified" | "pending" | "error";

function Doctors() {
  const [doctors, setDoctors] = useState<AdminUser[]>([]);
  const [statuses, setStatuses] = useState<Record<string, VerificationState>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const users = (await getAdminUsers()).filter((user) => user.role === "Doctor");
      setDoctors(users);
      setStatuses(Object.fromEntries(users.map((user) => [user._id, "loading"])));
      const results = await Promise.all(users.map(async (user) => [user._id, await getVerificationStatus("Doctor", user.walletAddress)] as const));
      setStatuses(Object.fromEntries(results.map(([id, verified]) => [id, verified ? "verified" : "pending"])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load doctor verification data");
    }
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => doctors.filter((doctor) => `${doctor.displayName} ${doctor.walletAddress}`.toLowerCase().includes(query.toLowerCase())), [doctors, query]);
  const update = async (doctor: AdminUser, action: "verify" | "revoke") => {
    setBusy(doctor._id);
    setError("");
    try {
      if (action === "verify") await verifyUser("Doctor", doctor.walletAddress);
      else await revokeVerification("Doctor", doctor.walletAddress);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Verification operation failed");
    } finally { setBusy(""); }
  };

  return <DashboardLayout><div className="space-y-6"><PageHeader title="Doctor Verification" description="Registry status is read from the configured blockchain network. Only administrators can change it." />{error && <ErrorState message={error} onRetry={() => void load()} />}<ContentPanel title="Doctor registry" subtitle="Search by display name or wallet address."><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or wallet" className="w-full rounded-xl border px-4 py-3 text-sm" /><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b text-[#697586]"><tr><th className="p-3">Doctor</th><th className="p-3">Wallet</th><th className="p-3">Account</th><th className="p-3">Registry</th><th className="p-3">Action</th></tr></thead><tbody>{filtered.map((doctor) => { const status = statuses[doctor._id] ?? "loading"; return <tr key={doctor._id} className="border-b"><td className="p-3">{doctor.displayName || "Unnamed doctor"}</td><td className="p-3 font-mono text-xs">{doctor.walletAddress}</td><td className="p-3">{doctor.active ? "Active" : "Suspended"}</td><td className="p-3"><StatusBadge tone={status === "verified" ? "success" : status === "pending" ? "warning" : "neutral"}>{status}</StatusBadge></td><td className="p-3">{status === "verified" ? <button disabled={busy === doctor._id} onClick={() => void update(doctor, "revoke")} className="font-bold text-rose-700 disabled:opacity-50">Revoke</button> : <button disabled={busy === doctor._id || status === "loading"} onClick={() => void update(doctor, "verify")} className="font-bold text-[#0F8B78] disabled:opacity-50">Verify</button>}</td></tr>; })}</tbody></table>{filtered.length === 0 && <EmptyState title="No doctors found" description="No doctor accounts match the current search." />}</div></ContentPanel>
  </div></DashboardLayout>;
}

export default Doctors;
