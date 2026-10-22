import { useEffect, useState } from "react";

import { getDoctorCount, getHospitalCount } from "../../api/admin";
import { getTotalRecords } from "../../api/medicalRecords";
import {
  analyzeDataset,
  mapDataset,
  type AnalyticsResult,
} from "../../api/analytics";
import DashboardLayout from "../../components/DashboardLayout";

type MappingPreview = Awaited<ReturnType<typeof mapDataset>>;

function Analytics() {
  const [counts, setCounts] = useState({
    hospitals: 0,
    doctors: 0,
    records: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [preview, setPreview] = useState<MappingPreview | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "schema" | "mapping" | "validation" | "fhir"
  >("schema");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getHospitalCount(),
      getDoctorCount(),
      getTotalRecords(),
    ])
      .then(([hospitals, doctors, records]) => {
        if (mounted) setCounts({ hospitals, doctors, records });
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ecosystem metrics.",
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = (number: number) =>
    isLoading ? "…" : String(number);

  const selectFile = (selected: File | null) => {
    setFile(selected);
    setResult(null);
    setPreview(null);
    setUploadError(null);
  };

  const validateFile = (): boolean => {
    if (!file) {
      setUploadError("Choose a dataset file first.");
      return false;
    }

    const supportedExtensions = [".csv", ".xlsx", ".xls", ".json"];
    const filename = file.name.toLowerCase();

    if (!supportedExtensions.some((extension) => filename.endsWith(extension))) {
      setUploadError("Supported formats are CSV, XLSX, XLS and JSON.");
      return false;
    }

    if (file.size === 0) {
      setUploadError("The selected file is empty.");
      return false;
    }

    setUploadError(null);
    return true;
  };

  const previewMapping = async () => {
    if (!validateFile() || !file) return;

    setIsProcessing(true);
    setUploadError(null);
    setResult(null);
    setPreview(null);

    try {
      setPreview(await mapDataset(file));
      setActiveTab("mapping");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Unable to preview field mappings.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysis = async () => {
    if (!validateFile() || !file) return;

    setIsProcessing(true);
    setUploadError(null);
    setPreview(null);
    setResult(null);

    try {
      setResult(await analyzeDataset(file));
      setActiveTab("schema");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Dataset analysis failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const schema = result?.schema ?? preview?.schema;
  const mapping = result?.mapping ?? preview?.mapping;
  const validation = result?.validation;

  const tabs = [
    { id: "schema", label: "Schema" },
    { id: "mapping", label: "Field Mapping" },
    { id: "validation", label: "Validation" },
    { id: "fhir", label: "FHIR Output" },
  ] as const;

  const jsonOutput =
    activeTab === "fhir"
      ? result?.fhir_bundles ?? result?.fhir ?? result?.handoffs
      : null;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        <header>
          <h1 className="text-3xl font-bold text-purple-700">
            Analytics
          </h1>
          <p className="mt-2 text-gray-500">
            Monitor the CareLink Ledger ecosystem and process healthcare
            datasets through the analytics pipeline.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load ecosystem metrics: {error}
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Users", display: "Not available" },
            { label: "Hospitals", display: value(counts.hospitals) },
            { label: "Doctors", display: value(counts.doctors) },
            { label: "Records", display: value(counts.records) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-purple-700">
                {item.display}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
              Data Analytics Layer
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Dataset Processing Workspace
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Upload a healthcare dataset to inspect its schema, map source
              fields, validate data quality and generate FHIR output.
            </p>
          </div>

          <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
            <label
              htmlFor="analytics-dataset"
              className="block text-sm font-semibold text-gray-800"
            >
              Select a dataset
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Accepted formats: CSV, XLSX, XLS and JSON
            </p>

            <input
              id="analytics-dataset"
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              disabled={isProcessing}
              onChange={(event) =>
                selectFile(event.target.files?.[0] ?? null)
              }
              className="mt-4 block w-full cursor-pointer text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:font-semibold file:text-purple-700 hover:file:bg-purple-200 disabled:opacity-50"
            />

            {file && (
              <div className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-700 ring-1 ring-gray-200">
                <p className="font-semibold">{file.name}</p>
                <p className="mt-1 text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={previewMapping}
                className="rounded-lg border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Preview Mapping
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={runAnalysis}
                className="rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Processing dataset…" : "Run Full Analysis"}
              </button>
            </div>

            {isProcessing && (
              <p role="status" className="mt-4 text-sm text-purple-700">
                The analytics service is processing your file. Please wait.
              </p>
            )}

            {uploadError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {uploadError}
              </div>
            )}
          </div>

          {(schema || mapping || result) && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900">
                Processing Results
              </h3>

              {validation && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Data Quality",
                      value: `${validation.quality_score}%`,
                    },
                    { label: "Total Rows", value: validation.total_rows },
                    { label: "Valid Rows", value: validation.valid_rows },
                    { label: "Invalid Rows", value: validation.invalid_rows },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {validation && (
                <div
                  className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                    validation.is_valid
                      ? "bg-green-50 text-green-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {validation.is_valid
                    ? "Validation completed: no invalid rows were reported."
                    : "Validation completed with invalid data. Review the reported errors."}
                  {" "}
                  {validation.errors.length} error(s),{" "}
                  {validation.warnings.length} warning(s).
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                      activeTab === tab.id
                        ? "border-purple-700 text-purple-700"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {activeTab === "schema" && (
                  schema ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-sm text-gray-500">Dataset</p>
                          <p className="mt-1 break-all font-semibold">
                            {schema.dataset_name}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-sm text-gray-500">Rows</p>
                          <p className="mt-1 font-semibold">
                            {schema.row_count}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-sm text-gray-500">Columns</p>
                          <p className="mt-1 font-semibold">
                            {schema.column_count}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-4 py-3">Column</th>
                              <th className="px-4 py-3">Detected Type</th>
                              <th className="px-4 py-3">Missing Values</th>
                              <th className="px-4 py-3">Unique Values</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {schema.columns.map((column) => (
                              <tr key={column}>
                                <td className="px-4 py-3 font-medium">
                                  {column}
                                </td>
                                <td className="px-4 py-3">
                                  {schema.data_types[column] ?? "Unknown"}
                                </td>
                                <td className="px-4 py-3">
                                  {schema.missing_values[column] ?? 0}
                                  {" "}(
                                  {schema.missing_percentages[column] ?? 0}%)
                                </td>
                                <td className="px-4 py-3">
                                  {schema.unique_values[column] ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {schema.potential_primary_keys.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Potential primary keys:{" "}
                          <span className="font-medium">
                            {schema.potential_primary_keys.join(", ")}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Schema results will appear here after processing.
                    </p>
                  )
                )}

                {activeTab === "mapping" && (
                  mapping ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        {mapping.mapping_count} field mapping(s) identified.
                        {" "}
                        Mapping status:{" "}
                        <span className="font-semibold">
                          {mapping.is_complete ? "Complete" : "Incomplete"}
                        </span>
                      </p>

                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-4 py-3">Source Field</th>
                              <th className="px-4 py-3">Canonical Field</th>
                              <th className="px-4 py-3">Match Method</th>
                              <th className="px-4 py-3">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {mapping.mappings.map((item, index) => (
                              <tr key={`${item.source_field}-${index}`}>
                                <td className="px-4 py-3">
                                  {item.source_field}
                                </td>
                                <td className="px-4 py-3">
                                  {item.canonical_field}
                                </td>
                                <td className="px-4 py-3">
                                  {item.match_method}
                                </td>
                                <td className="px-4 py-3">
                                  {(item.confidence * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {mapping.unmapped_source_fields.length > 0 && (
                        <p className="text-sm text-amber-700">
                          Unmapped fields:{" "}
                          {mapping.unmapped_source_fields.join(", ")}
                        </p>
                      )}

                      {mapping.missing_required_fields.length > 0 && (
                        <p className="text-sm text-red-700">
                          Missing required fields:{" "}
                          {mapping.missing_required_fields.join(", ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Preview mapping or run full analysis to view field mappings.
                    </p>
                  )
                )}

                {activeTab === "validation" && (
                  validation ? (
                    <div className="space-y-6">
                      {[
                        { title: "Errors", items: validation.errors },
                        { title: "Warnings", items: validation.warnings },
                      ].map((group) => (
                        <div key={group.title}>
                          <h4 className="font-semibold text-gray-900">
                            {group.title} ({group.items.length})
                          </h4>

                          {group.items.length === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">
                              No {group.title.toLowerCase()} reported.
                            </p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {group.items.map((item, index) => (
                                <div
                                  key={`${item.code}-${item.row}-${index}`}
                                  className="rounded-lg border border-gray-200 p-3 text-sm"
                                >
                                  <p className="font-semibold">
                                    {item.code} — {item.field || "General"}
                                  </p>
                                  <p className="mt-1 text-gray-600">
                                    {item.message}
                                  </p>
                                  <p className="mt-1 text-gray-500">
                                    Row: {item.row} · Value:{" "}
                                    {item.value == null
                                      ? "—"
                                      : String(item.value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {validation.quarantined_rows.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Quarantined rows:{" "}
                          {validation.quarantined_rows.join(", ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Run full analysis to view validation results.
                    </p>
                  )
                )}

                {activeTab === "fhir" && (
                  result ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Inspect the generated FHIR output and patient handoffs.
                        The JSON below displays the first available output.
                      </p>
                      <pre className="max-h-[32rem] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-green-300">
                        {JSON.stringify(
                          jsonOutput ?? result.fhir ?? result.handoffs ?? null,
                          null,
                          2,
                        )}
                      </pre>

                      <details className="rounded-lg border border-gray-200 p-4">
                        <summary className="cursor-pointer font-semibold">
                          View all returned outputs
                        </summary>
                        <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-green-300">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Run full analysis to inspect the generated FHIR output.
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            System Activity
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Detailed ecosystem activity is not exposed by the current
            application backend contract.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
