import { useEffect, useState } from "react";

import { getHospitalRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import RecordFileActions from "../../components/RecordFileActions";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

function PatientRecords() {
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
        const nextRecords = await getHospitalRecords(user.walletAddress);
        if (mounted) setRecords(nextRecords);
      } catch (err) {
        if (mounted) {
          setRecords([]);
          setError(err instanceof Error ? err.message : "Unable to load hospital records.");
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
        <PageHeader eyebrow="Hospital operations" title="Patient Records" description="Records returned for the authenticated hospital wallet." />
        {error && <ErrorState message={error} />}
        <ContentPanel title="Medical record directory">
          {isLoading ? <LoadingState label="Loading records…" /> : records.length === 0 ? (
            <EmptyState title="No medical records returned" />
          ) : (
            <div className="overflow-x-auto">
              <table className="enterprise-table min-w-[700px]">
                <thead><tr><th>Record ID</th><th>Patient</th><th>Doctor</th><th>Category</th><th>File</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{records.map((record) => <tr key={record.recordId ?? record.id ?? record.cid ?? record.fileName}><td>{record.recordId ?? record.id ?? "—"}</td><td>{record.patientWallet ?? record.patient ?? "—"}</td><td>{record.doctorWallet ?? record.doctor ?? "—"}</td><td>{record.category ?? "—"}</td><td>{record.fileName ?? "—"}</td><td><StatusBadge tone="info">{record.status ?? "Returned"}</StatusBadge></td><td><RecordFileActions record={record} /></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </ContentPanel>
      </div>
    </DashboardLayout>
  );
}

export default PatientRecords;