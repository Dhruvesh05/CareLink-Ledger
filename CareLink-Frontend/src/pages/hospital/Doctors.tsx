import DashboardLayout from "../../components/DashboardLayout";

function Doctors() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Doctors
      </h1>

      <div className="grid grid-cols-2 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-8">
          👨‍⚕️ Dr. Sharma
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          👩‍⚕️ Dr. Mehta
        </div>

      </div>

    </DashboardLayout>
  );
}

export default Doctors;