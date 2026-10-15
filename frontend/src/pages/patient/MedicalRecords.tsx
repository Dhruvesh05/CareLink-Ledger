import { useEffect, useState } from "react";

import { getPatientRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";

function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.walletAddress) {
      setRecords([]);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextRecords = await getPatientRecords(user.walletAddress);
        if (isMounted) {
          setRecords(nextRecords);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load your records.");
          setRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [user?.walletAddress]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Medical Records</h1>
          <p className="mt-2 text-gray-500">View and manage all records associated with your wallet.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow">
          {isLoading ? (
            <p className="text-slate-500">Loading records…</p>
          ) : records.length === 0 ? (
            <div className="space-y-2">
              <p className="text-slate-700">No medical records were returned for this wallet.</p>
              <p className="text-sm text-slate-500">Upload a record from the upload flow to create the first blockchain-backed entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-3 pr-4">Record ID</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">File</th>
                    <th className="py-3 pr-4">Doctor</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Emergency</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.recordId ?? record.id ?? record.cid ?? record.fileName ?? Math.random()} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 text-slate-700">{record.recordId ?? record.id ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-700">{record.category ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-700">{record.fileName ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-700">{record.doctorWallet ?? record.doctor ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {record.status ?? "Verified"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{record.emergency ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MedicalRecords;