import DashboardLayout from "../../components/DashboardLayout";

function Notifications() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Notifications
      </h1>

      <div className="space-y-5 mt-8">

        <div className="bg-white shadow rounded-2xl p-6">
          🔔 New Patient Registered
        </div>

        <div className="bg-white shadow rounded-2xl p-6">
          📅 New Appointment Booked
        </div>

      </div>

    </DashboardLayout>
  );
}

export default Notifications;