import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../auth/AuthContext";
import { deleteMyAvatar, getMyProfile, updateMyProfile, uploadMyAvatar, type UserProfile } from "../../api/profile";
import { ContentPanel, ErrorState, LoadingState, PageHeader } from "../ui";

export default function ProfileManager() {
  const { token, user, role, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [professionalBio, setProfessionalBio] = useState("");
  const [website, setWebsite] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!token) return;
    const p = await getMyProfile(token);
    setProfile(p);
    setDisplayName(p.displayName ?? "");
    setEmail(p.email ?? "");
    setPhone(p.phone ?? "");
    setProfessionalBio(p.professionalBio ?? "");
    setWebsite(p.website ?? "");
    setContactAddress(p.contactAddress ?? "");
  };

  useEffect(() => {
    let alive = true;
    if (!token) { setLoading(false); return; }
    getMyProfile(token).then(p => {
      if (!alive) return;
      setProfile(p); setDisplayName(p.displayName ?? ""); setEmail(p.email ?? "");
      setPhone(p.phone ?? ""); setProfessionalBio(p.professionalBio ?? "");
      setWebsite(p.website ?? ""); setContactAddress(p.contactAddress ?? "");
    }).catch(e => { if (alive) setError(e instanceof Error ? e.message : "Unable to load profile"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setMessage(""); setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Use JPEG, PNG or WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image must be 2 MB or smaller."); return; }
    if (!token) { setError("Please sign in again."); return; }
    const url = URL.createObjectURL(file);
    setPreview(url); setUploading(true);
    try {
      await uploadMyAvatar(token, file);
      await load();
      await refreshProfile();
      setPreview(null); setMessage("Profile picture uploaded and saved.");
    } catch (e) { setPreview(null); setError(e instanceof Error ? e.message : "Avatar upload failed."); }
    finally { setUploading(false); }
  };

  const removeAvatar = async () => {
    if (!token) return;
    setUploading(true); setError(""); setMessage("");
    try { await deleteMyAvatar(token); await load(); await refreshProfile(); setMessage("Profile picture removed."); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to remove image."); }
    finally { setUploading(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !displayName.trim()) { setError("Display name is required."); return; }
    setSaving(true); setError(""); setMessage("");
    const data: Record<string, string> = { displayName: displayName.trim(), email: email.trim(), phone: phone.trim() };
    if (role === "Doctor") data.professionalBio = professionalBio;
    if (role === "Hospital") { data.website = website; data.contactAddress = contactAddress; }
    try { await updateMyProfile(token, data); await load(); await refreshProfile(); setMessage("Profile details saved successfully."); }
    catch (e) { setError(e instanceof Error ? e.message : "Profile update failed."); }
    finally { setSaving(false); }
  };

  const title = role === "Doctor" ? "Doctor Profile" : role === "Hospital" ? "Hospital Profile" : role === "Admin" ? "Admin Profile" : "Patient Profile";
  const nameLabel = role === "Hospital" ? "Public hospital name" : role === "Doctor" ? "Professional display name" : "Display name";
  const avatar = preview ?? profile?.avatarDataUrl ?? null;
  const initials = displayName.trim().charAt(0).toUpperCase() || role?.charAt(0) || "U";

  return <DashboardLayout>
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} description="Changes are saved to your authenticated CareLink account." />
      <ContentPanel>
        <div className="mb-7 flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-700 text-2xl font-bold text-white">
            {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">Profile picture</p>
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG or WebP · Maximum 2 MB</p>
            <div className="mt-3 flex gap-2">
              <label className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
                {uploading ? "Uploading…" : "Upload / Replace"}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={handleAvatar} className="hidden" />
              </label>
              {profile?.avatarDataUrl && <button type="button" disabled={uploading} onClick={removeAvatar} className="rounded-lg border px-4 py-2 text-sm dark:border-white/20 dark:text-white">Remove</button>}
            </div>
          </div>
        </div>
        {loading && <div className="mb-4"><LoadingState label="Loading saved profile…" /></div>}
        {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {error && <div className="mb-4"><ErrorState message={error} /></div>}
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{nameLabel}
            <input required maxLength={120} value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email
            <input type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Phone number
            <input type="tel" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
          </label>
          {role === "Doctor" && <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Professional bio
            <textarea rows={4} maxLength={1000} value={professionalBio} onChange={e => setProfessionalBio(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
            <span className="text-xs text-slate-500">Verified specialization and license details are managed separately.</span>
          </label>}
          {role === "Hospital" && <>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Website
              <input type="url" maxLength={250} placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Public contact address
              <textarea rows={3} maxLength={500} value={contactAddress} onChange={e => setContactAddress(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900 dark:border-white/15 dark:bg-zinc-950 dark:text-white" />
              <span className="text-xs text-slate-500">Does not change verified on-chain hospital location.</span>
            </label>
          </>}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
            Wallet: <span className="break-all font-mono">{user?.walletAddress}</span>
          </div>
          <button type="submit" disabled={saving || uploading || loading || !profile} className="rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </ContentPanel>
    </div>
  </DashboardLayout>;
}
