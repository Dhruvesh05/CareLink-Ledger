import { useEffect, useState } from "react";
import {
  getMyFabricRecords,
  getFabricMedicalRecordFile,
  type FabricMedicalRecord,
  type FabricMedicalRecordFileDisposition,
} from "../api/fabricRecords";

function shortHash(value: string): string {
  if (!value) return "—";
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function FabricLedgerRecords() {
  const [records, setRecords] = useState<FabricMedicalRecord[]>([]);
  const [channel, setChannel] = useState("carelinkchannel");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const [activeFileAction, setActiveFileAction] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyFabricRecords()
      .then((response) => {
        if (!active) return;
        setRecords(response.records ?? []);
        setChannel(response.channel || "carelinkchannel");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load Fabric records.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);


  const handleFileAction = async (
    record: FabricMedicalRecord,
    action: "view" | "download",
  ) => {
    let previewWindow: Window | null = null;
    setFileActionError(null);

    if (action === "view") {
      previewWindow = window.open("about:blank", "_blank");
      if (!previewWindow) {
        setFileActionError("Allow pop-ups to preview this PDF, or use Download.");
        return;
      }
      previewWindow.opener = null;
    }

    setActiveFileAction(`${action}:${record.id}`);

    try {
      const disposition: FabricMedicalRecordFileDisposition =
        action === "view" ? "inline" : "attachment";

      const file = await getFabricMedicalRecordFile(
        record.id,
        disposition,
        `medical-record-${record.id}`,
      );

      const mimeType = (file.mimeType || file.blob.type || "application/octet-stream")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (action === "view" && mimeType !== "application/pdf") {
        previewWindow?.close();
        setFileActionError(
          "In-browser preview is supported for PDF files. Use Download for this file type.",
        );
        return;
      }

      const objectUrl = URL.createObjectURL(file.blob);

      if (action === "view") {
        if (!previewWindow || previewWindow.closed) {
          URL.revokeObjectURL(objectUrl);
          setFileActionError("The preview tab was closed before the document loaded.");
          return;
        }

        previewWindow.location.replace(objectUrl);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10 * 60 * 1000);
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.fileName || `medical-record-${record.id}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch (reason) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      setFileActionError(
        reason instanceof Error
          ? reason.message
          : "Unable to retrieve this Fabric medical record.",
      );
    } finally {
      setActiveFileAction(null);
    }
  };

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-blue-800">
          Hyperledger Fabric Records
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Active records read from the {channel} channel through the CareLink backend.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow">
        {loading ? (
          <p className="text-slate-500">Loading Fabric ledger records…</p>
        ) : !error && records.length === 0 ? (
          <p className="text-slate-600">
            No active Fabric records were found for this wallet.
          </p>
        ) : records.length > 0 ? (
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-600">
                <th className="py-3 pr-4">Fabric Record ID</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">File Hash</th>
                <th className="py-3 pr-4">Emergency</th>
                <th className="py-3 pr-4">Version</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 align-top text-sm"
                >
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {record.id}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {record.category || "—"}
                  </td>
                  <td
                    className="py-3 pr-4 font-mono text-slate-600"
                    title={record.fileHash}
                  >
                    {shortHash(record.fileHash)}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {record.emergency ? "Yes" : "No"}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {record.version}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        disabled={activeFileAction !== null}
                        onClick={() => void handleFileAction(record, "view")}
                      >
                        {activeFileAction === `view:${record.id}` ? "Opening…" : "View"}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        disabled={activeFileAction !== null}
                        onClick={() => void handleFileAction(record, "download")}
                      >
                        {activeFileAction === `download:${record.id}` ? "Downloading…" : "Download"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {fileActionError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {fileActionError}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-500">
          File retrieval uses the authenticated CareLink backend, verifies encrypted
          content integrity, and requires matching encryption metadata. PDF files can
          be previewed; other file types are downloaded.
        </p>
      </div>
    </section>
  );
}
