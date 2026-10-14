import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { confirmMedicalRecord, prepareMedicalRecord } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { connectWallet, ensurePolygonAmoy, sendMetaMaskTransaction } from "../../api/wallet";

function UploadRecord() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [patientWallet, setPatientWallet] = useState(user?.walletAddress ?? "");
  const [category, setCategory] = useState("General");
  const [emergency, setEmergency] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<{ recordId?: number; transactionHash?: string; cid?: string } | null>(null);

  const handleSubmit = async () => {
    if (role !== "Doctor") {
      setFeedback({ type: "error", text: "Medical record creation is restricted to authenticated doctors." });
      return;
    }

    if (!file) {
      setFeedback({ type: "error", text: "Please choose a medical record file to upload." });
      return;
    }

    if (!user?.walletAddress) {
      setFeedback({ type: "error", text: "You must be signed in with a doctor wallet to upload records." });
      return;
    }

    if (!patientWallet.trim()) {
      setFeedback({ type: "error", text: "A patient wallet address is required." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setResult(null);

    try {
      const connectedWallet = await connectWallet();

      if (connectedWallet.toLowerCase() !== user.walletAddress.toLowerCase()) {
        throw new Error("MetaMask must be connected to the authenticated doctor wallet.");
      }

      const preparedForm = new FormData();
      preparedForm.append("file", file);
      preparedForm.append("patient", patientWallet.trim());
      preparedForm.append("category", category);
      preparedForm.append("emergency", String(emergency));

      const prepared = await prepareMedicalRecord(preparedForm);

      await ensurePolygonAmoy();

      const hash = await sendMetaMaskTransaction({
        from: connectedWallet,
        to: prepared.transaction.to,
        data: prepared.transaction.data,
        value: prepared.transaction.value,
        chainId: prepared.transaction.chainId,
      });

      const confirmed = await confirmMedicalRecord(prepared.preparationId, hash);
      setResult({
        recordId: confirmed.recordId,
        transactionHash: confirmed.transactionHash,
        cid: confirmed.cid,
      });
      setFeedback({
        type: "success",
        text: `Medical record uploaded and confirmed successfully. Record #${confirmed.recordId} is now live.`,
      });
      navigate("/doctor/medical-records", { replace: true });
    } catch (error) {
      console.error("[medical-record-upload] FULL ERROR:", error);
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Medical record upload failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Doctor Record Upload</h1>
          <p className="mt-2 text-gray-500">Prepare and confirm a patient medical record using the authenticated doctor wallet and the hospital-backed transaction flow.</p>
        </div>

        {feedback && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {feedback.text}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-white p-8 shadow">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="font-medium text-slate-700">Patient wallet</label>
              <input
                type="text"
                value={patientWallet}
                onChange={(event) => setPatientWallet(event.target.value)}
                placeholder="0x..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option>General</option>
                <option>Lab</option>
                <option>Prescription</option>
                <option>Imaging</option>
                <option>Surgery</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                Emergency
                <input
                  type="checkbox"
                  checked={emergency}
                  onChange={(event) => setEmergency(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="font-medium text-slate-700">Upload file</label>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-8 rounded-xl bg-blue-700 px-8 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Preparing and confirming…" : "Upload Record"}
          </button>

          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Upload confirmed</p>
              <p className="mt-1">Record ID: {result.recordId ?? "pending"}</p>
              <p className="mt-1">Transaction: {result.transactionHash ?? "pending"}</p>
              <p className="mt-1">IPFS CID: {result.cid ?? "pending"}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UploadRecord;