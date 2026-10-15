import DashboardLayout from "../../components/DashboardLayout";
import { Calendar } from "lucide-react";

function Appointments() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-red-700">Hospital Appointments</h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8 flex items-center gap-3 font-semibold text-slate-800">
        <Calendar className="w-5 h-5 text-red-600" />
        <span>Appointment Schedule</span>
      </div>
    </DashboardLayout>
  );
}

export default Appointments;