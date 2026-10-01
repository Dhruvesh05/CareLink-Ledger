import DashboardLayout from "../../components/DashboardLayout";

function Notifications() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Notifications
      </h1>

      <div className="space-y-5 mt-8">

        <div className="bg-white shadow rounded-2xl p-6">
          🔔 Your medical record has been verified.
        </div>

        <div className="bg-white shadow rounded-2xl p-6">
          📅 Appointment confirmed with Dr. Sharma.
        </div>

        <div className="bg-white shadow rounded-2xl p-6">
          🔐 Hospital requested access to your records.
        </div>

      </div>

    </DashboardLayout>
  );
}

export default Notifications;