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

type FormData = {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@gmail.com",
    role: "Patient",
    status: "Active",
  },
  {
    id: 2,
    name: "Dr. Priya Patil",
    email: "priya@carelink.com",
    role: "Doctor",
    status: "Active",
  },
  {
    id: 3,
    name: "City Care Hospital",
    email: "admin@citycare.com",
    role: "Hospital",
    status: "Active",
  },
  {
    id: 4,
    name: "Sneha Kulkarni",
    email: "sneha@gmail.com",
    role: "Patient",
    status: "Pending",
  },
];

const defaultForm: FormData = {
  name: "",
  email: "",
  role: "Patient",
  status: "Active",
};

function Users() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.role) {
      nextErrors.role = "Please select a role.";
    }

    if (!formData.status) {
      nextErrors.status = "Please select a status.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!validateForm()) {
      setNotice({ type: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      setUsers((currentUsers) => [
        {
          id: Date.now(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          status: formData.status,
        },
        ...currentUsers,
      ]);

      setIsSubmitting(false);
      setShowForm(false);
      setFormData(defaultForm);
      setErrors({});
      setNotice({ type: "success", message: "User added successfully." });
    }, 700);
  };

  const handleRemoveUser = (userId: number) => {
    const userToRemove = users.find((user) => user.id === userId);

    if (!userToRemove) return;

    const confirmed = window.confirm(`Remove ${userToRemove.name} from the user list?`);
    if (!confirmed) return;

    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    setSelectedUser((current) => (current?.id === userId ? null : current));
    setNotice({ type: "success", message: `${userToRemove.name} was removed.` });
  };

  const statusStyles: Record<UserStatus, string> = {
    Active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    Pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {notice && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.message}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Users</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage all registered users in the CareLink Ledger system.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:translate-y-[-1px] hover:shadow-xl"
          >
            + Add User
          </button>
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
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(user.id)}
                            className="font-medium text-rose-600 transition hover:text-rose-700"
                          >
                            Remove
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

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Create user</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">Add New User</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                    setFormData(defaultForm);
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
                      Role
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(event) => handleChange("role", event.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Hospital">Hospital</option>
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
                  </div>

                  <div>
                    <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(event) => handleChange("status", event.target.value as UserStatus)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                    </select>
                    {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status}</p>}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setErrors({});
                      setFormData(defaultForm);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Saving..." : "Save User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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