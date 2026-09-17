import DashboardLayout from "../../components/DashboardLayout";

function PatientRecords() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Patient Records
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        📁 View and Manage Patient Records
      </div>

    </DashboardLayout>
  );
}

export default PatientRecords;