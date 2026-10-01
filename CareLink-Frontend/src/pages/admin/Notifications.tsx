import DashboardLayout from "../../components/DashboardLayout";

function Notifications() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Notifications
      </h1>

      <p className="text-gray-500 mt-2">
        Stay updated with important system activities.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8 p-8">
        <p className="text-slate-500">Notifications are not exposed by the current backend contract.</p>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;