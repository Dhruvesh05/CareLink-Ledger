import { useMemo, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

type UserRole = "Patient" | "Doctor" | "Hospital";
type UserStatus = "Active" | "Pending";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const initialUsers: User[] = [];

function Users() {
  const users = initialUsers;
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const stats = useMemo(() => {
    const total = users.length;
    const patients = users.filter((user) => user.role === "Patient").length;
    const doctors = users.filter((user) => user.role === "Doctor").length;
    const hospitals = users.filter((user) => user.role === "Hospital").length;

    return { total, patients, doctors, hospitals };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      if (!normalizedQuery) return true;

      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.role.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, users]);

  const statusStyles: Record<UserStatus, string> = {
    Active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    Pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Users</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage all registered users in the CareLink Ledger system.
            </p>
          </div>

          <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">User administration API not configured</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ring-1 ring-white/80">
            <p className="text-sm text-slate-500">Total Users</p>
            <h2 className="mt-3 text-3xl font-bold text-sky-700">{stats.total}</h2>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ring-1 ring-white/80">
            <p className="text-sm text-slate-500">Patients</p>
            <h2 className="mt-3 text-3xl font-bold text-blue-700">{stats.patients}</h2>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ring-1 ring-white/80">
            <p className="text-sm text-slate-500">Doctors</p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-600">{stats.doctors}</h2>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ring-1 ring-white/80">
            <p className="text-sm text-slate-500">Hospitals</p>
            <h2 className="mt-3 text-3xl font-bold text-amber-500">{stats.hospitals}</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm ring-1 ring-white/80 sm:p-5">
          <label className="block text-sm font-medium text-slate-600">Search</label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users by name, email or role..."
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm ring-1 ring-white/80">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Registered Users</h2>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {filteredUsers.length} found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-sky-50/40">
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-200 text-sm font-bold text-sky-700">
                            {user.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{user.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500 sm:px-6">{user.email}</td>

                      <td className="px-4 py-4 sm:px-6">
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-4 sm:px-6">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="font-medium text-sky-700 transition hover:text-sky-800"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      No users match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">User Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-200 text-base font-bold text-sky-700">
                    {selectedUser.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedUser.name}</p>
                    <p className="text-sm text-slate-500">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedUser.email}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selectedUser.status]}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Users;