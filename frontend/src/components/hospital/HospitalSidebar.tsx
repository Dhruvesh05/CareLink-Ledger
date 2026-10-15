import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Building,
  Calendar,
  CreditCard,
  Bell,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";

function HospitalSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/hospital/dashboard" },
    { title: "Patient Records", icon: FileText, path: "/hospital/patient-records" },
    { title: "Doctors", icon: UserCheck, path: "/hospital/doctors" },
    { title: "Departments", icon: Building, path: "/hospital/departments" },
    { title: "Appointments", icon: Calendar, path: "/hospital/appointments" },
    { title: "Billing", icon: CreditCard, path: "/hospital/billing" },
    { title: "Notifications", icon: Bell, path: "/hospital/notifications" },
    { title: "Profile", icon: User, path: "/hospital/profile" },
    { title: "Settings", icon: Settings, path: "/hospital/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/hospital/help-support" },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-sky-800 via-cyan-800 to-blue-900 text-white shadow-[8px_0_30px_rgba(14,116,144,0.18)] md:w-72">
      <div className="border-b border-white/15 p-6">
        <h1 className="text-2xl font-bold tracking-wide">CareLink Ledger</h1>
        <p className="mt-1 text-sm text-cyan-100">Hospital Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.title} onClick={() => navigate(item.path)} className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-cyan-50 transition hover:bg-white/10">
              <Icon className="w-5 h-5 text-cyan-200 shrink-0" />
              <span className="whitespace-nowrap">{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/15 p-4">
        <button onClick={() => { logout(); navigate("/login"); }} className="w-full rounded-xl bg-red-500/90 py-3 font-medium transition hover:bg-red-600">
          Logout
        </button>
      </div>
    </div>
  );
}

export default HospitalSidebar;