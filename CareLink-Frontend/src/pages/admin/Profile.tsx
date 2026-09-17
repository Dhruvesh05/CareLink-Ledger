import { useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

function Profile() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload a valid image file." });
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setMessage({ type: "success", text: "Profile photo updated successfully." });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-purple-700">Admin Profile</h1>

        <p className="mt-2 text-gray-500">Manage your administrator profile.</p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <div className="mb-8 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-purple-100 bg-purple-700 text-2xl font-bold text-white shadow-md">
              {photoPreview ? (
                <img src={photoPreview} alt="Admin profile preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">A</span>
              )}
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100">
              Upload Photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="font-medium">Full Name</label>
              <input type="text" value="System Administrator" readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-gray-50 p-4" />
            </div>

            <div>
              <label className="font-medium">Email</label>
              <input type="email" value="admin@carelink.com" readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-gray-50 p-4" />
            </div>

            <div>
              <label className="font-medium">Role</label>
              <input type="text" value="Administrator" readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-gray-50 p-4" />
            </div>

            <div>
              <label className="font-medium">Organization</label>
              <input type="text" value="CareLink Ledger" readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-gray-50 p-4" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;