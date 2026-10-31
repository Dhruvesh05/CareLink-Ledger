import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminUsers, searchAdminUsers, type AdminUser } from "../../api/admin";
import { apiPatch } from "../../api/client";
import { getToken } from "../../api/auth";
import { ContentPanel, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui";

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  useEffect(() => { getAdminUsers().then(setUsers).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load users")); }, []);
  const filterUsers = () => searchAdminUsers({ q: query, role, active }).then(setUsers).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to filter users"));
  const setStatus = async (user: AdminUser) => {
    try { await apiPatch(`/admin/users/${user._id}/status`, { active: !user.active }, getToken() ?? undefined); await filterUsers(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update account status"); }
  };
  const filtered = useMemo(() => users.filter((user) => `${user.displayName} ${user.walletAddress} ${user.role}`.toLowerCase().includes(query.toLowerCase())), [query, users]);
  return <DashboardLayout><div className="space-y-6"><PageHeader title="User Management" description="Account status and role metadata; medical contents are not returned." />{error && <ErrorState message={error} />}<ContentPanel title="Directory" subtitle="Filter administrative account metadata."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet or name" className="rounded-xl border px-4 py-3 text-sm lg:col-span-2" /><select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border px-3 py-2 text-sm"><option value="">All roles</option><option>Patient</option><option>Doctor</option><option>Hospital</option><option>Admin</option></select><select value={active} onChange={(event) => setActive(event.target.value)} className="rounded-xl border px-3 py-2 text-sm"><option value="">All statuses</option><option value="true">Active</option><option value="false">Suspended</option></select><button onClick={() => void filterUsers()} className="rounded-xl bg-[#0F8B78] px-4 py-3 text-sm font-bold text-white">Apply filters</button></div><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b text-[#697586]"><tr><th className="p-3">Name</th><th className="p-3">Wallet</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{filtered.map((user) => <tr key={user._id} className="border-b"><td className="p-3">{user.displayName || "Unnamed account"}</td><td className="p-3 font-mono text-xs">{user.walletAddress}</td><td className="p-3">{user.role}</td><td className="p-3"><StatusBadge tone={user.active ? "success" : "warning"}>{user.active ? "Active" : "Suspended"}</StatusBadge></td><td className="p-3"><button onClick={() => void setStatus(user)} className="font-bold text-[#0F8B78]">{user.active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState title="No users found" description="No accounts match the selected filters." />}</div></ContentPanel>
  </div></DashboardLayout>;
}

export default Users;
