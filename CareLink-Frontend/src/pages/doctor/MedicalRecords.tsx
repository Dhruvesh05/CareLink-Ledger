import DashboardLayout from "../../components/DashboardLayout";

function MedicalRecords() {

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold text-green-700">
        Patient Medical Records
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <p>📁 View Patient Records</p>

      </div>

    </DashboardLayout>

  );

}

export default MedicalRecords;