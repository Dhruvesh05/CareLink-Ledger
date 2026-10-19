import DashboardLayout from "../../components/DashboardLayout";
import { UserCheck } from "lucide-react";

function Doctors() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-red-700">Doctors</h1>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3 font-semibold text-slate-800">
          <UserCheck className="w-6 h-6 text-red-600" />
          <span>Dr. Sharma</span>
        </div>

        <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3 font-semibold text-slate-800">
          <UserCheck className="w-6 h-6 text-red-600" />
          <span>Dr. Mehta</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Doctors;