import DashboardLayout from "../../components/DashboardLayout";

function Departments() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Departments
      </h1>

      <div className="space-y-5 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          ❤️ Cardiology
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          🧠 Neurology
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          🦴 Orthopedics
        </div>

      </div>

    </DashboardLayout>
  );
}

export default Departments;