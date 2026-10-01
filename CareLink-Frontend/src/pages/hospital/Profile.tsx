import { useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

function Profile() {
  const [hospitalName, setHospitalName] = useState("City Hospital");
  const [location, setLocation] = useState("Nashik");
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
    setMessage({ type: "success", text: "Hospital profile updated successfully." });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-red-700">Hospital Profile</h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-red-100 bg-red-700 text-xl font-bold text-white shadow-md">
                {photoPreview ? (
                  <img src={photoPreview} alt="Hospital profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">H</span>
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Hospital Name</label>
              <input
                value={hospitalName}
                onChange={(event) => setHospitalName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
              />
            </div>

            <button type="submit" className="rounded-xl bg-red-700 px-8 py-3 font-medium text-white shadow-lg shadow-red-200 transition hover:bg-red-800">
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;