import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminUsers, getVerificationStatus, revokeVerification, verifyUser, type AdminUser } from "../../api/admin";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

function Hospitals() {
  const [hospitals, setHospitals] = useState<AdminUser[]>([]);
  const [verified, setVerified] = useState<Record<string, boolean | null>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = async () => {
    try {
      const users = (await getAdminUsers()).filter((user) => user.role === "Hospital");
      setHospitals(users);
      setVerified(Object.fromEntries(users.map((user) => [user._id, null])));
      const results = await Promise.all(users.map(async (user) => [user._id, await getVerificationStatus("Hospital", user.walletAddress)] as const));
      setVerified(Object.fromEntries(results));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load hospital verification data"); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => hospitals.filter((hospital) => `${hospital.displayName} ${hospital.walletAddress}`.toLowerCase().includes(query.toLowerCase())), [hospitals, query]);
  const update = async (hospital: AdminUser, action: "verify" | "revoke") => {
    setBusy(hospital._id); setError("");
    try { if (action === "verify") await verifyUser("Hospital", hospital.walletAddress); else await revokeVerification("Hospital", hospital.walletAddress); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Verification operation failed"); }
    finally { setBusy(""); }
  };
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Hospital Verification" description="Hospital status is read from the existing registry; no identity data is modified by this view." />{error && <ErrorState message={error} onRetry={() => void load()} />}<ContentPanel title="Hospital registry" subtitle="Search by display name or wallet address."><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or wallet" className="w-full rounded-xl border px-4 py-3 text-sm" /><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b text-[#697586]"><tr><th className="p-3">Hospital</th><th className="p-3">Wallet</th><th className="p-3">Account</th><th className="p-3">Registry</th><th className="p-3">Action</th></tr></thead><tbody>{filtered.map((hospital) => { const isVerified = verified[hospital._id]; return <tr key={hospital._id} className="border-b"><td className="p-3">{hospital.displayName || "Unnamed hospital"}</td><td className="p-3 font-mono text-xs">{hospital.walletAddress}</td><td className="p-3">{hospital.active ? "Active" : "Suspended"}</td><td className="p-3"><StatusBadge tone={isVerified ? "success" : isVerified === null ? "neutral" : "warning"}>{isVerified === null ? "Loading" : isVerified ? "Verified" : "Pending"}</StatusBadge></td><td className="p-3">{isVerified ? <button disabled={busy === hospital._id} onClick={() => void update(hospital, "revoke")} className="font-bold text-rose-700 disabled:opacity-50">Revoke</button> : <button disabled={busy === hospital._id || isVerified === null} onClick={() => void update(hospital, "verify")} className="font-bold text-[#0F8B78] disabled:opacity-50">Verify</button>}</td></tr>; })}</tbody></table>{filtered.length === 0 && <EmptyState title="No hospitals found" description="No hospital accounts match the current search." />}</div></ContentPanel>
  </div></DashboardLayout>;
}

export default Hospitals;
