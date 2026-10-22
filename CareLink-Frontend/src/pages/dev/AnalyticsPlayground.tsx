import { useState } from "react";
import {
  analyzeDataset,
  mapDataset,
  type AnalyticsResult,
} from "../../api/analytics";

type MappingPreview = Awaited<ReturnType<typeof mapDataset>>;

export default function AnalyticsPlayground() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [preview, setPreview] = useState<MappingPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(mode: "map" | "analyze") {
    if (!file) {
      setError("Select a CSV, XLSX, XLS or JSON file first.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setPreview(null);

    try {
      if (mode === "map") {
        setPreview(await mapDataset(file));
      } else {
        setResult(await analyzeDataset(file));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analytics request failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">CareLink Ledger Analytics</h1>
          <p className="mt-2 text-slate-600">
            Development playground for testing the analytics API without admin
            wallet authentication.
          </p>
        </header>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <label className="mb-3 block font-semibold" htmlFor="dataset-file">
            Select healthcare dataset
          </label>
          <input
            id="dataset-file"
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
              setPreview(null);
              setError("");
            }}
            className="block w-full rounded-lg border border-slate-300 p-3"
          />

          {file && (
            <p className="mt-2 text-sm text-slate-600">
              Selected: {file.name} ({file.size.toLocaleString()} bytes)
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!file || busy}
              onClick={() => void run("map")}
              className="rounded-lg bg-blue-700 px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              {busy ? "Processing..." : "Preview Mapping"}
            </button>
            <button
              type="button"
              disabled={!file || busy}
              onClick={() => void run("analyze")}
              className="rounded-lg bg-emerald-700 px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              {busy ? "Processing..." : "Run Full Analysis"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}
        </section>

        {preview && (
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Mapping Preview</h2>
            <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-green-300">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </section>
        )}

        {result && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Rows" value={result.schema.row_count} />
              <Metric label="Columns" value={result.schema.column_count} />
              <Metric label="Mapping Count" value={result.mapping.mapping_count} />
              <Metric
                label="Data Quality"
                value={`${result.validation.quality_score}%`}
              />
            </div>

            <ResultPanel title="Schema Analysis" data={result.schema} />
            <ResultPanel title="Canonical Field Mapping" data={result.mapping} />
            <ResultPanel title="Data Validation" data={result.validation} />
            <ResultPanel title="FHIR Output" data={result.fhir} />
            <ResultPanel title="Patient FHIR Bundles" data={result.fhir_bundles} />
            <ResultPanel title="Blockchain Handoffs" data={result.handoffs} />
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ResultPanel({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <pre className="max-h-[30rem] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-green-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}
