import { useEffect, useState } from "react";

import {
  getPatientRecords,
  getMedicalRecordFile,
  type MedicalRecordSummary,
} from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import FabricLedgerRecords from "../../components/FabricLedgerRecords";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const [activeFileAction, setActiveFileAction] = useState<string | null>(null);

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
          setError(getErrorMessage(err, "Unable to load your records."));
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

  const handleView = async (record: MedicalRecordSummary) => {
    const recordId = record.recordId ?? record.id;

    if (typeof recordId !== "number" || !Number.isSafeInteger(recordId) || recordId <= 0) {
      setFileActionError("This record does not have a valid record ID.");
      return;
    }

    // Open synchronously from the click so popup blockers are less likely
    // to block the PDF preview after the authenticated fetch completes.
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setFileActionError("Your browser blocked the preview tab. Allow pop-ups and click View again.");
      return;
    }

    previewWindow.opener = null;
    setFileActionError(null);
    setActiveFileAction(`view:${recordId}`);

    try {
      const file = await getMedicalRecordFile(
        recordId,
        "inline",
        record.fileName,
      );

      if (file.mimeType.toLowerCase().split(";")[0].trim() !== "application/pdf") {
        previewWindow.close();
        setFileActionError("In-browser preview is currently supported for PDF files. Use Download for this file.");
        return;
      }

      const objectUrl = URL.createObjectURL(file.blob);
      previewWindow.location.replace(objectUrl);

      // Keep the URL alive while the browser PDF viewer loads the document.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10 * 60 * 1000);
    } catch (err) {
      if (!previewWindow.closed) {
        previewWindow.close();
      }
      setFileActionError(getErrorMessage(err, "Unable to open this medical record."));
    } finally {
      setActiveFileAction(null);
    }
  };

  const handleDownload = async (record: MedicalRecordSummary) => {
    const recordId = record.recordId ?? record.id;

    if (typeof recordId !== "number" || !Number.isSafeInteger(recordId) || recordId <= 0) {
      setFileActionError("This record does not have a valid record ID.");
      return;
    }

    setFileActionError(null);
    setActiveFileAction(`download:${recordId}`);

    try {
      const file = await getMedicalRecordFile(
        recordId,
        "attachment",
        record.fileName,
      );

      const objectUrl = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.fileName || `medical-record-${recordId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
    } catch (err) {
      setFileActionError(getErrorMessage(err, "Unable to download this medical record."));
    } finally {
      setActiveFileAction(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Patient records" title="Medical records" description="View and manage all records associated with your wallet." />

        {error && (
          <ErrorState message={error} />
        )}

        {fileActionError && (
          <ErrorState message={fileActionError} />
        )}

        <ContentPanel>
          {isLoading ? (
            <LoadingState label="Loading medical records…" />
          ) : records.length === 0 ? (
            <EmptyState title="No medical records found" description="Upload a record to create the first blockchain-backed entry." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-3 pr-4">Record ID</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">File</th>
                    <th className="py-3 pr-4">Doctor</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Emergency</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const recordId = record.recordId ?? record.id;
                    const rowKey =
                      record.transactionHash ??
                      `${recordId ?? "record"}-${record.cid ?? record.fileName ?? "file"}`;
                    const isWorking = activeFileAction !== null;

                    return (
                      <tr key={rowKey} className="border-b border-slate-100 align-top">
                        <td className="py-3 pr-4 text-slate-700">{recordId ?? "—"}</td>
                        <td className="py-3 pr-4 text-slate-700">{record.category ?? "—"}</td>
                        <td className="py-3 pr-4 text-slate-700">{record.fileName ?? "—"}</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {record.doctorWallet ?? record.doctor ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge tone="success">{record.status ?? "Verified"}</StatusBadge>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {record.emergency ? "Yes" : "No"}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleView(record)}
                              disabled={isWorking || !recordId}
                              className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {activeFileAction === `view:${recordId}` ? "Opening…" : "View"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDownload(record)}
                              disabled={isWorking || !recordId}
                              className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {activeFileAction === `download:${recordId}` ? "Downloading…" : "Download"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ContentPanel>
      </div>
          <FabricLedgerRecords />
    </DashboardLayout>
  );
}

export default MedicalRecords;
