import { useEffect, useState } from "react";

import {
  getPatientRecords,
  getMedicalRecordFile,
  analyzeMedicalRecord,
  getFhirProcessingResult,
  uploadPatientMedicalRecord,
  type FhirProcessingResult,
  type MedicalRecordSummary,
} from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import {
  createOrLoadAuthenticatedDid,
  createSsiAuthorizationPresentation,
  requestSsiAuthorizationChallenge,
} from "../../api/ssi";
import { env } from "../../config/env";
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
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [fhirResults, setFhirResults] = useState<Record<string, FhirProcessingResult>>({});
  const [fhirProcessingIds, setFhirProcessingIds] = useState<Record<string, string>>({});
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("Patient upload");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1500);
  };

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
          setFhirProcessingIds(
            Object.fromEntries(
              nextRecords
                .filter((record) => record.recordId && record.fhirProcessingId)
                .map((record) => [String(record.recordId), record.fhirProcessingId as string]),
            ),
          );
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

  const handleAnalyze = async (record: MedicalRecordSummary) => {
    const recordId = record.recordId ?? record.id;
    if (typeof recordId !== "number" || !Number.isSafeInteger(recordId) || recordId <= 0) {
      setAnalysisMessage("This record does not have a valid record ID.");
      return;
    }

    setAnalysisMessage(null);
    setActiveFileAction(`analyze:${recordId}`);
    try {
      const processing = await analyzeMedicalRecord(recordId, record.fileName);
      setFhirProcessingIds((current) => ({ ...current, [String(recordId)]: processing.processingId }));
      setAnalysisMessage(`FHIR processing started for record ${recordId}.`);
    } catch (err) {
      setAnalysisMessage(getErrorMessage(err, "Unable to start FHIR processing."));
    } finally {
      setActiveFileAction(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadMessage("Select a PDF, PNG, JPEG, or DICOM file first.");
      return;
    }
    setActiveFileAction("upload");
    setUploadMessage(null);
    try {
      await createOrLoadAuthenticatedDid();
      const challenge = await requestSsiAuthorizationChallenge();
      const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);
      const result = await uploadPatientMedicalRecord(uploadFile, uploadCategory, false, presentation, challenge.challengeId);
      setFhirProcessingIds((current) => ({ ...current, [String(result.record.recordId)]: result.processingId }));
      setUploadMessage(`Uploaded. IPFS CID: ${result.record.cid}. FHIR: ${result.fhirStatus}.`);
      setUploadFile(null);
      const nextRecords = user?.walletAddress ? await getPatientRecords(user.walletAddress) : [];
      setRecords(nextRecords);
    } catch (err) {
      setUploadMessage(getErrorMessage(err, "Unable to upload the medical record."));
    } finally {
      setActiveFileAction(null);
    }
  };

  const handleLoadFhir = async (recordId: number) => {
    const processingId = fhirProcessingIds[String(recordId)];
    if (!processingId) {
      setAnalysisMessage("FHIR processing not available for this record.");
      return;
    }
    setActiveFileAction(`fhir:${recordId}`);
    try {
      const result = await getFhirProcessingResult(recordId, processingId);
      setFhirResults((current) => ({ ...current, [String(recordId)]: result }));
    } catch (err) {
      setAnalysisMessage(getErrorMessage(err, "Unable to load FHIR output."));
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

        {analysisMessage && (
          <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">{analysisMessage}</p>
        )}

        <ContentPanel>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Upload medical record</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.dcm,application/pdf,image/png,image/jpeg,application/dicom"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                disabled={activeFileAction === "upload"}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Category</span>
              <input className="rounded border border-slate-300 px-3 py-2" value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} />
            </label>
            <button type="button" onClick={() => void handleUpload()} disabled={!uploadFile || activeFileAction === "upload"} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              {activeFileAction === "upload" ? "Uploading…" : "Upload"}
            </button>
          </div>
          {uploadMessage && <p className="mt-3 text-sm text-slate-700">{uploadMessage}</p>}
        </ContentPanel>

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
                        <td className="py-3 pr-4 text-slate-700">
                          <div>{record.fileName ?? "—"}</div>
                          {record.cid && (
                            <div className="mt-2 max-w-xs text-xs text-slate-500">
                              <div className="font-medium">IPFS CID</div>
                              <code className="break-all">{record.cid}</code>
                              <button type="button" className="ml-2 text-blue-700 underline" onClick={() => void copyValue(record.cid!)}>
                                {copiedValue === record.cid ? "Copied" : "Copy"}
                              </button>
                              {env.ipfsGatewayUrl && (
                                <a
                                  className="ml-2 text-blue-700 underline"
                                  href={`${env.ipfsGatewayUrl.replace(/\/$/, "")}/${encodeURIComponent(record.cid)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open
                                </a>
                              )}
                              {record.fileHash && <div className="mt-1 break-all">SHA-256: {record.fileHash}</div>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {record.doctorWallet ?? record.doctor ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge tone={record.blockchainStatus === "not_anchored" ? "warning" : "success"}>{record.status ?? (record.blockchainStatus === "not_anchored" ? "Not anchored on blockchain" : "Verified")}</StatusBadge>
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
                            {/\.(csv|xlsx?|json)$/i.test(record.fileName ?? "") && (
                              <button
                                type="button"
                                onClick={() => void handleAnalyze(record)}
                                disabled={isWorking || !recordId}
                                className="rounded-lg border border-indigo-700 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {activeFileAction === `analyze:${recordId}` ? "Processing…" : "Analyze"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleDownload(record)}
                              disabled={isWorking || !recordId}
                              className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {activeFileAction === `download:${recordId}` ? "Downloading…" : "Download"}
                            </button>
                            {fhirProcessingIds[String(recordId)] && (
                              <button
                                type="button"
                                onClick={() => void handleLoadFhir(recordId as number)}
                                disabled={isWorking || !recordId}
                                className="rounded-lg border border-indigo-700 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                              >
                                {activeFileAction === `fhir:${recordId}` ? "Loading…" : "FHIR"}
                              </button>
                            )}
                          </div>
                          {recordId && fhirResults[String(recordId)] && (
                            <div className="mt-3 max-w-xl rounded-lg bg-slate-50 p-3 text-xs">
                              <div className="font-semibold">FHIR output</div>
                              <div>Status: {fhirResults[String(recordId)].status}</div>
                              <div>
                                Original CID: {fhirResults[String(recordId)].originalCid}
                                {record.cid === fhirResults[String(recordId)].originalCid ? " (matched)" : " (mismatch)"}
                              </div>
                              {fhirResults[String(recordId)].errorMessage && (
                                <div className="text-red-700">{fhirResults[String(recordId)].errorMessage}</div>
                              )}
                              {fhirResults[String(recordId)].result && (
                                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">
                                  {JSON.stringify(fhirResults[String(recordId)].result, null, 2)}
                                </pre>
                              )}
                              {fhirResults[String(recordId)].result && (
                                <button
                                  type="button"
                                  className="mt-2 text-blue-700 underline"
                                  onClick={() => void copyValue(JSON.stringify(fhirResults[String(recordId)].result, null, 2))}
                                >
                                  Copy FHIR JSON
                                </button>
                              )}
                            </div>
                          )}
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
