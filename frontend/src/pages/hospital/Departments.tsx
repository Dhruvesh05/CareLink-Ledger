import DashboardLayout from "../../components/DashboardLayout";
import { Heart, Activity, Stethoscope } from "lucide-react";

function Departments() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-red-700">Departments</h1>

      <div className="space-y-5 mt-8">
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-3 font-semibold text-slate-800">
          <Heart className="w-5 h-5 text-red-600" />
          <span>Cardiology</span>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-3 font-semibold text-slate-800">
          <Activity className="w-5 h-5 text-indigo-600" />
          <span>Neurology</span>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-3 font-semibold text-slate-800">
          <Stethoscope className="w-5 h-5 text-amber-600" />
          <span>Orthopedics</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Departments;