import DashboardLayout from "../../components/DashboardLayout";
import { Bell, FileText } from "lucide-react";

function Notifications() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-green-700">Notifications</h1>

      <div className="space-y-5 mt-8">
        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 font-semibold text-slate-800">
          <Bell className="w-5 h-5 text-green-600" />
          <span>New Patient Request Received</span>
        </div>

        <div className="bg-white shadow rounded-2xl p-6 flex items-center gap-3 font-semibold text-slate-800">
          <FileText className="w-5 h-5 text-green-600" />
          <span>Patient uploaded new report.</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;