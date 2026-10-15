import DashboardLayout from "../../components/DashboardLayout";
import { FileText, ArrowRight } from "lucide-react";

function Reports() {
  const reports = [
    {
      title: "Monthly System Report",
      date: "August 2026",
    },
    {
      title: "Blockchain Transaction Report",
      date: "August 2026",
    },
    {
      title: "Hospital Verification Report",
      date: "August 2026",
    },
    {
      title: "User Activity Report",
      date: "August 2026",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Reports
      </h1>

      <p className="text-slate-500 mt-2">
        Generate and view system reports.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {reports.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-2xl shadow p-6 border border-slate-100"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <FileText className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold mt-4 text-slate-800">
              {report.title}
            </h2>

            <p className="text-slate-500 mt-2 text-sm">
              {report.date}
            </p>

            <button className="mt-5 text-purple-700 font-semibold inline-flex items-center gap-1.5 hover:text-purple-900 transition">
              <span>View Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Reports;