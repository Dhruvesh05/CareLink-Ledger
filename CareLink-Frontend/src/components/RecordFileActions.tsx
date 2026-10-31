import { useState } from "react";

import {
  getMedicalRecordFile,
  type MedicalRecordSummary,
} from "../api/medicalRecords";

type Props = {
  record: Pick<MedicalRecordSummary, "recordId" | "id" | "fileName">;
  compact?: boolean;
};

export default function RecordFileActions({ record, compact = false }: Props) {
  const [busy, setBusy] = useState<"view" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordId = Number(record.recordId ?? record.id);
  const validId = Number.isSafeInteger(recordId) && recordId > 0;

  const handleAction = async (action: "view" | "download") => {
    setError(null);
    if (!validId) {
      setError("This record does not have a valid record ID.");
      return;
    }

    // Open synchronously on click so browsers do not block the preview while
    // the authenticated request is still running.
    const previewWindow = action === "view" ? window.open("about:blank", "_blank") : null;
    if (action === "view" && !previewWindow) {
      setError("Allow pop-ups to preview this PDF, or use Download.");
      return;
    }
    if (previewWindow) previewWindow.opener = null;

    setBusy(action);
    try {
      // This API uses authenticated backend retrieval and decryption. Do not
      // download a public IPFS gateway URL: that URL serves encrypted bytes.
      const file = await getMedicalRecordFile(
        recordId,
        action === "view" ? "inline" : "attachment",
        record.fileName ?? undefined,
      );
      const mimeType = (file.mimeType || file.blob.type || "application/octet-stream")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (action === "view" && mimeType !== "application/pdf") {
        previewWindow?.close();
        setError("Inline preview is supported for PDF files. Use Download for this file type.");
        return;
      }

      const url = URL.createObjectURL(file.blob);
      if (action === "view") {
        if (!previewWindow) {
          URL.revokeObjectURL(url);
          setError("The preview tab could not be opened. Please allow pop-ups.");
          return;
        }
        previewWindow.location.replace(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 600_000);
      } else {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.fileName || record.fileName || `medical-record-${recordId}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
      }
    } catch (err) {
      previewWindow?.close();
      setError(err instanceof Error ? err.message : "Unable to retrieve this medical record.");
    } finally {
      setBusy(null);
    }
  };

  const buttonClass = compact
    ? "rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    : "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} disabled={!validId || busy !== null}
        onClick={() => void handleAction("view")}>
        {busy === "view" ? "Opening…" : "View"}
      </button>
      <button type="button" className={buttonClass} disabled={!validId || busy !== null}
        onClick={() => void handleAction("download")}>
        {busy === "download" ? "Downloading…" : "Download"}
      </button>
      {error && <p className="w-full text-xs text-red-600" role="status">{error}</p>}
    </div>
  );
}
