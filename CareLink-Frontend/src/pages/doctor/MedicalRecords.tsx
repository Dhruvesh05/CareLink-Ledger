import { useEffect, useState } from "react";

import { getDoctorRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import RecordFileActions from "../../components/RecordFileActions";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

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
          <PageHeader eyebrow="Clinical records" title="My medical records" description="Records returned by the authenticated doctor wallet." />
        </div>
        {error && <ErrorState message={error} />}
        <ContentPanel title="Authorized records">
          {isLoading ? <LoadingState label="Loading records…" /> : records.length === 0 ? (
            <EmptyState title="No medical records found" description="No records were returned for this doctor." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead><tr className="border-b border-slate-200 text-slate-600"><th className="py-3 pr-4">Record ID</th><th className="py-3 pr-4">Patient</th><th className="py-3 pr-4">Category</th><th className="py-3 pr-4">File</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Actions</th></tr></thead>
                <tbody>{records.map((record) => <tr key={record.recordId ?? record.id ?? record.cid ?? record.fileName} className="border-b border-slate-100"><td className="py-3 pr-4">{record.recordId ?? record.id ?? "—"}</td><td className="py-3 pr-4">{record.patientWallet ?? record.patient ?? "—"}</td><td className="py-3 pr-4">{record.category ?? "—"}</td><td className="py-3 pr-4">{record.fileName ?? "—"}</td>                <td className="py-3 pr-4"><StatusBadge tone="success">{record.status ?? "Returned"}</StatusBadge></td><td className="py-3 pr-4"><RecordFileActions record={record} /></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </ContentPanel>
      </div>
    </DashboardLayout>
  );
}

export default MedicalRecords;