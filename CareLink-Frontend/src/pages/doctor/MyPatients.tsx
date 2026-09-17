import DashboardLayout from "../../components/DashboardLayout";

function MyPatients() {

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold text-green-700">
        My Patients
      </h1>

      <div className="grid grid-cols-2 gap-6 mt-8">

        <div className="bg-white shadow rounded-2xl p-8">
          👤 Rahul Patil
        </div>

        <div className="bg-white shadow rounded-2xl p-8">
          👤 Sneha Joshi
        </div>

      </div>

    </DashboardLayout>

  );

}

export default MyPatients;