import DashboardLayout from "../../components/DashboardLayout";

function AuditLogs() {
  const logs = [
    {
      action: "New patient registered",
      user: "Rahul Sharma",
      time: "10 minutes ago",
    },
    {
      action: "Medical record uploaded",
      user: "Dr. Priya Patil",
      time: "25 minutes ago",
    },
    {
      action: "Hospital verified",
      user: "City Care Hospital",
      time: "1 hour ago",
    },
    {
      action: "Access permission granted",
      user: "Sneha Joshi",
      time: "2 hours ago",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Audit Logs
      </h1>

      <p className="text-gray-500 mt-2">
        Track important activities performed in the system.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8">
        {logs.map((log, index) => (
          <div
            key={index}
            className="p-6 border-b last:border-b-0"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold">
                  {log.action}
                </h3>

                <p className="text-gray-500 mt-1">
                  User: {log.user}
                </p>
              </div>

              <span className="text-sm text-gray-400">
                {log.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default AuditLogs;