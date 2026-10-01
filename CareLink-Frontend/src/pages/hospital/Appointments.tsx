import DashboardLayout from "../../components/DashboardLayout";

function Appointments() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Hospital Appointments
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        📅 Appointment Schedule
      </div>

    </DashboardLayout>
  );
}

export default Appointments;