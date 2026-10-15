import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { performance } from "perf_hooks";
import { join } from "path";

import { UploadService } from "../../src/ipfs/services/UploadService";
import { DownloadService } from "../../src/ipfs/services/DownloadService";
import { getIpfsProvider } from "../../src/ipfs/config/ipfs.config";

/*
 * CareLink Ledger
 * IPFS Upload / Download Performance Benchmark
 *
 * Measures:
 * - Upload latency
 * - Download latency
 * - Upload throughput
 * - Download throughput
 * - SHA-256 integrity
 * - CID consistency
 *
 * Test sizes:
 * - 100 KB
 * - 1 MB
 * - 5 MB
 * - 10 MB
 * - 25 MB
 * - 50 MB
 *
 * Each size is tested multiple times.
 *
 * IMPORTANT:
 * Payload generation happens BEFORE timing starts.
 * Therefore generation time is NOT included in upload latency.
 */

const uploadService = new UploadService();
const downloadService = new DownloadService();

/* =========================
   Benchmark configuration
   ========================= */

const TEST_SIZES = [
    { label: "100KB", bytes: 100 * 1024 },
    { label: "1MB", bytes: 1 * 1024 * 1024 },
    { label: "5MB", bytes: 5 * 1024 * 1024 },
    { label: "10MB", bytes: 10 * 1024 * 1024 },
    { label: "25MB", bytes: 25 * 1024 * 1024 },
    { label: "50MB", bytes: 50 * 1024 * 1024 },
];

const REPETITIONS = 10;

/*
 * UploadService defaults to pin=true.
 * We explicitly specify it here so that the experiment
 * configuration is unambiguous.
 */
const PIN_CONTENT = true;

/* =========================
   Types
   ========================= */

interface DetailedResult {
    timestamp: string;
    provider: string;
    pinEnabled: boolean;

    fileSizeLabel: string;
    fileSizeBytes: number;
    fileSizeMiB: number;

    repetition: number;

    cid: string;

    uploadLatencyMs: number;
    downloadLatencyMs: number;

    uploadThroughputMiBs: number;
    downloadThroughputMiBs: number;

    originalSha256: string;
    downloadedSha256: string;

    integrityVerified: boolean;
    cidPresent: boolean;

    status: "SUCCESS" | "FAILED";
    error: string;
}

interface SummaryResult {
    provider: string;
    pinEnabled: boolean;

    fileSizeLabel: string;
    fileSizeBytes: number;
    fileSizeMiB: number;

    repetitions: number;
    successfulRuns: number;
    failedRuns: number;

    integritySuccessRatePercent: number;

    uploadLatencyMeanMs: number;
    uploadLatencyMedianMs: number;
    uploadLatencyMinMs: number;
    uploadLatencyMaxMs: number;
    uploadLatencyStdDevMs: number;

    downloadLatencyMeanMs: number;
    downloadLatencyMedianMs: number;
    downloadLatencyMinMs: number;
    downloadLatencyMaxMs: number;
    downloadLatencyStdDevMs: number;

    uploadThroughputMeanMiBs: number;
    downloadThroughputMeanMiBs: number;
}

/* =========================
   Utility functions
   ========================= */

function generatePayload(sizeBytes: number): Buffer {
    /*
     * Deterministic payload.
     *
     * Using a repeating pattern avoids allocating random
     * entropy unnecessarily while still creating a real
     * byte payload of the requested size.
     */
    const payload = Buffer.allocUnsafe(sizeBytes);

    const pattern = Buffer.from(
        "CareLink-Ledger-IPFS-Benchmark-Healthcare-Data-"
    );

    for (let offset = 0; offset < sizeBytes; offset += pattern.length) {
        pattern.copy(
            payload,
            offset,
            0,
            Math.min(pattern.length, sizeBytes - offset)
        );
    }

    return payload;
}

function sha256(data: Buffer | Uint8Array): string {
    return createHash("sha256")
        .update(data)
        .digest("hex");
}

function round(value: number, decimals = 3): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    return (
        values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length
    );
}

function median(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort(
        (a, b) => a - b
    );

    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (
            sorted[middle - 1] +
            sorted[middle]
        ) / 2;
    }

    return sorted[middle];
}

function standardDeviation(
    values: number[]
): number {
    if (values.length === 0) {
        return 0;
    }

    const average = mean(values);

    const squaredDifferences =
        values.map(
            value =>
                (value - average) ** 2
        );

    const variance =
        mean(squaredDifferences);

    return Math.sqrt(variance);
}

function min(values: number[]): number {
    return values.length > 0
        ? Math.min(...values)
        : 0;
}

function max(values: number[]): number {
    return values.length > 0
        ? Math.max(...values)
        : 0;
}

function csvEscape(
    value: unknown
): string {
    const stringValue =
        String(value ?? "");

    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;
    }

    return stringValue;
}

function objectToCsv<T extends object>(
    rows: T[]
): string {
    if (rows.length === 0) {
        return "";
    }

    const headers = Object.keys(
        rows[0]
    );

    const lines = [
        headers.join(","),
    ];

    for (const row of rows) {
        lines.push(
            headers
                .map(header =>
                    csvEscape(
                        (row as Record<string, unknown>)[
                            header
                        ]
                    )
                )
                .join(",")
        );
    }

    return lines.join("\n") + "\n";
}

/* =========================
   Benchmark
   ========================= */

async function runBenchmark(): Promise<void> {
    const provider = getIpfsProvider();

    const timestamp =
        new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

    const outputDirectory =
        join(
            process.cwd(),
            "benchmark-results",
            "ipfs"
        );

    await mkdir(
        outputDirectory,
        {
            recursive: true,
        }
    );

    const detailedResults:
        DetailedResult[] = [];

    console.log("");
    console.log(
        "=============================================="
    );
    console.log(
        " CareLink Ledger - IPFS Performance Benchmark"
    );
    console.log(
        "=============================================="
    );
    console.log("");

    console.log(
        `Provider       : ${provider}`
    );

    console.log(
        `Pinning        : ${PIN_CONTENT}`
    );

    console.log(
        `Repetitions    : ${REPETITIONS}`
    );

    console.log(
        `Test sizes     : ${TEST_SIZES.map(
            item => item.label
        ).join(", ")}`
    );

    console.log("");

    if (provider !== "kubo") {
        console.warn(
            "WARNING: The configured IPFS provider is not Kubo."
        );

        console.warn(
            "Current provider:",
            provider
        );

        console.log("");
    }

    /*
     * Generate and test each payload size.
     */
    for (const testSize of TEST_SIZES) {
        console.log(
            "----------------------------------------------"
        );

        console.log(
            `Testing ${testSize.label} (${testSize.bytes.toLocaleString()} bytes)`
        );

        console.log(
            "----------------------------------------------"
        );

        /*
         * Generate payload BEFORE timing.
         */
        const payload =
            generatePayload(
                testSize.bytes
            );

        const originalSha256 =
            sha256(payload);

        console.log(
            `SHA-256: ${originalSha256}`
        );

        for (
            let repetition = 1;
            repetition <= REPETITIONS;
            repetition++
        ) {
            process.stdout.write(
                `Run ${repetition}/${REPETITIONS} ... `
            );

            const startedAt =
                new Date().toISOString();

            let cid = "";
            let uploadLatencyMs = 0;
            let downloadLatencyMs = 0;

            try {
                /*
                 * =========================
                 * UPLOAD
                 * =========================
                 */

                const uploadStart =
                    performance.now();

                const uploadResult =
                    await uploadService.uploadFile(
                        payload,
                        {
                            pin: PIN_CONTENT,
                        }
                    );

                const uploadEnd =
                    performance.now();

                uploadLatencyMs =
                    uploadEnd -
                    uploadStart;

                cid =
                    uploadResult.cid;

                /*
                 * =========================
                 * DOWNLOAD
                 * =========================
                 */

                const downloadStart =
                    performance.now();

                const downloaded =
                    await downloadService.downloadFile(
                        cid
                    );

                const downloadEnd =
                    performance.now();

                downloadLatencyMs =
                    downloadEnd -
                    downloadStart;

                /*
                 * =========================
                 * INTEGRITY
                 * =========================
                 */

                const downloadedSha256 =
                    sha256(downloaded);

                const integrityVerified =
                    originalSha256 ===
                    downloadedSha256;

                const cidPresent =
                    Boolean(cid);

                const fileSizeMiB =
                    testSize.bytes /
                    (1024 * 1024);

                const uploadThroughputMiBs =
                    fileSizeMiB /
                    (uploadLatencyMs / 1000);

                const downloadThroughputMiBs =
                    fileSizeMiB /
                    (downloadLatencyMs / 1000);

                const successful =
                    integrityVerified &&
                    cidPresent;

                detailedResults.push({
                    timestamp: startedAt,

                    provider,

                    pinEnabled:
                        PIN_CONTENT,

                    fileSizeLabel:
                        testSize.label,

                    fileSizeBytes:
                        testSize.bytes,

                    fileSizeMiB:
                        round(
                            fileSizeMiB,
                            6
                        ),

                    repetition,

                    cid,

                    uploadLatencyMs:
                        round(
                            uploadLatencyMs
                        ),

                    downloadLatencyMs:
                        round(
                            downloadLatencyMs
                        ),

                    uploadThroughputMiBs:
                        round(
                            uploadThroughputMiBs
                        ),

                    downloadThroughputMiBs:
                        round(
                            downloadThroughputMiBs
                        ),

                    originalSha256,

                    downloadedSha256,

                    integrityVerified,

                    cidPresent,

                    status:
                        successful
                            ? "SUCCESS"
                            : "FAILED",

                    error:
                        successful
                            ? ""
                            : "SHA-256 integrity verification failed or CID missing",
                });

                console.log(
                    `OK | upload=${uploadLatencyMs.toFixed(
                        2
                    )} ms | download=${downloadLatencyMs.toFixed(
                        2
                    )} ms | integrity=${integrityVerified}`
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);

                const cause =
                    error &&
                    typeof error === "object" &&
                    "cause" in error
                        ? (error as { cause?: unknown }).cause
                        : undefined;

                const causeMessage =
                    cause instanceof Error
                        ? cause.message
                        : cause
                            ? String(cause)
                            : "";

                const detailedError =
                    causeMessage
                        ? `${message} | Cause: ${causeMessage}`
                        : message;

                detailedResults.push({
                    timestamp: startedAt,

                    provider,

                    pinEnabled:
                        PIN_CONTENT,

                    fileSizeLabel:
                        testSize.label,

                    fileSizeBytes:
                        testSize.bytes,

                    fileSizeMiB:
                        round(
                            testSize.bytes /
                                (1024 * 1024),
                            6
                        ),

                    repetition,

                    cid,

                    uploadLatencyMs:
                        round(
                            uploadLatencyMs
                        ),

                    downloadLatencyMs:
                        round(
                            downloadLatencyMs
                        ),

                    uploadThroughputMiBs:
                        0,

                    downloadThroughputMiBs:
                        0,

                    originalSha256,

                    downloadedSha256:
                        "",

                    integrityVerified:
                        false,

                    cidPresent:
                        Boolean(cid),

                    status:
                        "FAILED",

                    error: detailedError,
                });

                console.log(
                    `FAILED | ${detailedError}`
                );
            }
        }

        console.log("");
    }

    /*
     * =========================
     * SUMMARY
     * =========================
     */

    const summaryResults:
        SummaryResult[] = [];

    for (const testSize of TEST_SIZES) {
        const rows =
            detailedResults.filter(
                row =>
                    row.fileSizeBytes ===
                    testSize.bytes
            );

        const successfulRows =
            rows.filter(
                row =>
                    row.status ===
                    "SUCCESS"
            );

        const uploadLatencies =
            successfulRows.map(
                row =>
                    row.uploadLatencyMs
            );

        const downloadLatencies =
            successfulRows.map(
                row =>
                    row.downloadLatencyMs
            );

        const uploadThroughputs =
            successfulRows.map(
                row =>
                    row.uploadThroughputMiBs
            );

        const downloadThroughputs =
            successfulRows.map(
                row =>
                    row.downloadThroughputMiBs
            );

        const successfulRuns =
            successfulRows.length;

        const failedRuns =
            rows.length -
            successfulRuns;

        const integritySuccessRate =
            rows.length === 0
                ? 0
                : (successfulRows.filter(
                      row =>
                          row.integrityVerified
                  ).length /
                      rows.length) *
                  100;

        summaryResults.push({
            provider,

            pinEnabled:
                PIN_CONTENT,

            fileSizeLabel:
                testSize.label,

            fileSizeBytes:
                testSize.bytes,

            fileSizeMiB:
                round(
                    testSize.bytes /
                        (1024 * 1024),
                    6
                ),

            repetitions:
                rows.length,

            successfulRuns,

            failedRuns,

            integritySuccessRatePercent:
                round(
                    integritySuccessRate,
                    2
                ),

            uploadLatencyMeanMs:
                round(
                    mean(uploadLatencies)
                ),

            uploadLatencyMedianMs:
                round(
                    median(
                        uploadLatencies
                    )
                ),

            uploadLatencyMinMs:
                round(
                    min(uploadLatencies)
                ),

            uploadLatencyMaxMs:
                round(
                    max(uploadLatencies)
                ),

            uploadLatencyStdDevMs:
                round(
                    standardDeviation(
                        uploadLatencies
                    )
                ),

            downloadLatencyMeanMs:
                round(
                    mean(
                        downloadLatencies
                    )
                ),

            downloadLatencyMedianMs:
                round(
                    median(
                        downloadLatencies
                    )
                ),

            downloadLatencyMinMs:
                round(
                    min(
                        downloadLatencies
                    )
                ),

            downloadLatencyMaxMs:
                round(
                    max(
                        downloadLatencies
                    )
                ),

            downloadLatencyStdDevMs:
                round(
                    standardDeviation(
                        downloadLatencies
                    )
                ),

            uploadThroughputMeanMiBs:
                round(
                    mean(
                        uploadThroughputs
                    )
                ),

            downloadThroughputMeanMiBs:
                round(
                    mean(
                        downloadThroughputs
                    )
                ),
        });
    }

    /*
     * =========================
     * WRITE CSV FILES
     * =========================
     */

    const detailedCsv =
        objectToCsv(
            detailedResults
        );

    const summaryCsv =
        objectToCsv(
            summaryResults
        );

    const detailedPath =
        join(
            outputDirectory,
            `ipfs-benchmark-detailed-${timestamp}.csv`
        );

    const summaryPath =
        join(
            outputDirectory,
            `ipfs-benchmark-summary-${timestamp}.csv`
        );

    await writeFile(
        detailedPath,
        detailedCsv,
        "utf8"
    );

    await writeFile(
        summaryPath,
        summaryCsv,
        "utf8"
    );

    /*
     * =========================
     * CONSOLE SUMMARY
     * =========================
     */

    console.log("");
    console.log(
        "=============================================="
    );
    console.log(
        " Benchmark Complete"
    );
    console.log(
        "=============================================="
    );

    console.log("");

    console.table(
        summaryResults.map(
            row => ({
                Size:
                    row.fileSizeLabel,

                "Upload Mean (ms)":
                    row.uploadLatencyMeanMs,

                "Download Mean (ms)":
                    row.downloadLatencyMeanMs,

                "Upload MiB/s":
                    row.uploadThroughputMeanMiBs,

                "Download MiB/s":
                    row.downloadThroughputMeanMiBs,

                "Integrity (%)":
                    row.integritySuccessRatePercent,
            })
        )
    );

    console.log(
        `Detailed CSV: ${detailedPath}`
    );

    console.log(
        `Summary CSV : ${summaryPath}`
    );

    console.log("");
}

/* =========================
   Entry point
   ========================= */

runBenchmark().catch(error => {
    console.error("");
    console.error(
        "IPFS BENCHMARK FAILED"
    );
    console.error("");

    console.error(
        error instanceof Error
            ? error.stack ||
                  error.message
            : error
    );

    process.exit(1);
});
