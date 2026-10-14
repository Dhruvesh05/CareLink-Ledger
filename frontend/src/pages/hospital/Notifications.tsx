import DashboardLayout from "../../components/DashboardLayout";
import { Bell, Calendar } from "lucide-react";

function Notifications() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-red-700">Notifications</h1>

      <div className="space-y-5 mt-8">
        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 text-slate-800">
          <Bell className="w-5 h-5 text-red-600 shrink-0" />
          <span>New Patient Registered</span>
        </div>

        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 text-slate-800">
          <Calendar className="w-5 h-5 text-red-600 shrink-0" />
          <span>New Appointment Booked</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;