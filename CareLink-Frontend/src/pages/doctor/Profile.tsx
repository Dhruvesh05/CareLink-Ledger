import { useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

function Profile() {
  const [name, setName] = useState("Dr. Sharma");
  const [specialization, setSpecialization] = useState("Cardiologist");
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage({ type: "success", text: "Doctor profile updated successfully." });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-green-700">Doctor Profile</h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-green-100 bg-green-700 text-xl font-bold text-white shadow-md">
                {photoPreview ? (
                  <img src={photoPreview} alt="Doctor profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">D</span>
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100">
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Doctor Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Specialization</label>
              <input
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            <button type="submit" className="rounded-xl bg-green-700 px-8 py-3 font-medium text-white shadow-lg shadow-green-200 transition hover:bg-green-800">
              Update
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;