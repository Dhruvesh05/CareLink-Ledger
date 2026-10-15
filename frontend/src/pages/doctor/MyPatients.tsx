import DashboardLayout from "../../components/DashboardLayout";
import { User } from "lucide-react";

function MyPatients() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-green-700">My Patients</h1>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white shadow rounded-2xl p-8 flex items-center gap-3 font-semibold text-slate-800">
          <User className="w-5 h-5 text-green-600" />
          <span>Rahul Patil</span>
        </div>

        <div className="bg-white shadow rounded-2xl p-8 flex items-center gap-3 font-semibold text-slate-800">
          <User className="w-5 h-5 text-green-600" />
          <span>Sneha Joshi</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MyPatients;