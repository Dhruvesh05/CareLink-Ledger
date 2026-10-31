import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminReport } from "../../api/admin";
import { ContentPanel, ErrorState, PageHeader } from "../../components/ui";

const reportTypes = [
  ["users", "User registrations"],
  ["appointments", "Appointments"],
  ["invoices", "Invoices"],
  ["medical-records", "Medical-record metadata"],
  ["blockchain", "Blockchain transfers"],
  ["verifications", "Verification history"],
  ["audit", "Audit events"],
  ["hospital-activity", "Hospital activity"],
];

export default function Reports() {
  const [error, setError] = useState("");
  async function download(type: string) {
    try {
      const csv = await getAdminReport(type);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `carelink-${type}-report.csv`; link.click();
      URL.revokeObjectURL(url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to generate report"); }
  }
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Reports" description="Reports are generated from currently available backend data. CSV export is provided; PDF export is not configured." />{error && <ErrorState message={error} />}<div className="grid gap-4 md:grid-cols-2">{reportTypes.map(([type, title]) => <ContentPanel key={type} title={title} subtitle="Download the latest persisted records."><button onClick={() => void download(type)} className="rounded-xl bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">Download CSV</button></ContentPanel>)}</div></div></DashboardLayout>;
}
