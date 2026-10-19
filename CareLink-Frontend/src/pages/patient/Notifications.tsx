import DashboardLayout from "../../components/DashboardLayout";
import { Bell, Calendar, Lock } from "lucide-react";

function Notifications() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-blue-800">Notifications</h1>

      <div className="space-y-5 mt-8">
        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 text-slate-800">
          <Bell className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Your medical record has been verified.</span>
        </div>

        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 text-slate-800">
          <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Appointment confirmed with Dr. Sharma.</span>
        </div>

        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 text-slate-800">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Hospital requested access to your records.</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;