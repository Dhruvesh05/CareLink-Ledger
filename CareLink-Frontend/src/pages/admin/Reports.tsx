import DashboardLayout from "../../components/DashboardLayout";

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

      <p className="text-gray-500 mt-2">
        Generate and view system reports.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {reports.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="text-4xl">📄</div>

            <h2 className="text-xl font-bold mt-4">
              {report.title}
            </h2>

            <p className="text-gray-500 mt-2">
              {report.date}
            </p>

            <button className="mt-5 text-purple-700 font-semibold">
              View Report →
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Reports;