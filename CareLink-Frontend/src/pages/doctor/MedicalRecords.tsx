import { useEffect, useState } from "react";

import { getDoctorRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";

function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.walletAddress) return;
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const nextRecords = await getDoctorRecords(user.walletAddress);
        if (mounted) setRecords(nextRecords);
      } catch (err) {
        if (mounted) {
          setRecords([]);
          setError(err instanceof Error ? err.message : "Unable to load doctor records.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, [user?.walletAddress]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-green-700">My Medical Records</h1>
          <p className="mt-2 text-gray-500">Records returned by the authenticated doctor wallet.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="rounded-2xl bg-white p-6 shadow">
          {isLoading ? <p className="text-slate-500">Loading records…</p> : records.length === 0 ? (
            <p className="text-slate-500">No medical records were returned for this doctor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead><tr className="border-b border-slate-200 text-slate-600"><th className="py-3 pr-4">Record ID</th><th className="py-3 pr-4">Patient</th><th className="py-3 pr-4">Category</th><th className="py-3 pr-4">File</th><th className="py-3 pr-4">Status</th></tr></thead>
                <tbody>{records.map((record) => <tr key={record.recordId ?? record.id ?? record.cid ?? record.fileName} className="border-b border-slate-100"><td className="py-3 pr-4">{record.recordId ?? record.id ?? "—"}</td><td className="py-3 pr-4">{record.patientWallet ?? record.patient ?? "—"}</td><td className="py-3 pr-4">{record.category ?? "—"}</td><td className="py-3 pr-4">{record.fileName ?? "—"}</td><td className="py-3 pr-4">{record.status ?? "Returned"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MedicalRecords;