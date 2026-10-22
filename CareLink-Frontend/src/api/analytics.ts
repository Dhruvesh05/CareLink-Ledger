const ANALYTICS_BASE_URL = "/analytics-api/analytics";

export interface AnalyticsColumnMapping {
  source_field: string;
  canonical_field: string;
  match_method: string;
  confidence: number;
}

export interface AnalyticsSchema {
  dataset_name: string;
  row_count: number;
  column_count: number;
  columns: string[];
  data_types: Record<string, string>;
  missing_values: Record<string, number>;
  missing_percentages: Record<string, number>;
  unique_values: Record<string, number>;
  potential_primary_keys: string[];
  statistics: Record<string, unknown>;
  fingerprint: string;
  schema_version: string;
}

export interface AnalyticsMapping {
  mappings: AnalyticsColumnMapping[];
  unmapped_source_fields: string[];
  missing_required_fields: string[];
  is_complete: boolean;
  mapping_count: number;
}

export interface AnalyticsIssue {
  field: string;
  row: number;
  code: string;
  message: string;
  value: unknown;
}

export interface AnalyticsValidation {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  quality_score: number;
  quarantined_rows: number[];
  errors: AnalyticsIssue[];
  warnings: AnalyticsIssue[];
}

export interface AnalyticsResult {
  schema: AnalyticsSchema;
  mapping: AnalyticsMapping;
  validation: AnalyticsValidation;
  fhir: Record<string, unknown> | null;
  fhir_bundles: Record<string, unknown> | null;
  handoffs: Record<string, unknown> | null;
}

async function uploadDataset<T>(
  endpoint: "analyze" | "map",
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${ANALYTICS_BASE_URL}/${endpoint}`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "Unable to reach the analytics service. Check that FastAPI is running.",
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `Analytics request failed (${response.status}).`;

    throw new Error(detail);
  }

  return payload as T;
}

export function analyzeDataset(file: File): Promise<AnalyticsResult> {
  return uploadDataset<AnalyticsResult>("analyze", file);
}

export function mapDataset(
  file: File,
): Promise<{ dataset_name: string; schema: AnalyticsSchema; mapping: AnalyticsMapping }> {
  return uploadDataset("map", file);
}
