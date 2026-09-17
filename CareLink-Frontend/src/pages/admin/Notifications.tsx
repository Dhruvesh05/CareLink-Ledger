import DashboardLayout from "../../components/DashboardLayout";

function Notifications() {
  const notifications = [
    {
      title: "New hospital registration",
      message: "City Care Hospital submitted registration.",
      time: "10 minutes ago",
    },
    {
      title: "Doctor verification required",
      message: "A new doctor is waiting for verification.",
      time: "30 minutes ago",
    },
    {
      title: "System backup completed",
      message: "Daily system backup completed successfully.",
      time: "2 hours ago",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Notifications
      </h1>

      <p className="text-gray-500 mt-2">
        Stay updated with important system activities.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="p-6 border-b last:border-b-0"
          >
            <div className="flex gap-4">
              <div className="text-3xl">🔔</div>

              <div>
                <h2 className="font-bold">
                  {notification.title}
                </h2>

                <p className="text-gray-500 mt-1">
                  {notification.message}
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  {notification.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Notifications;