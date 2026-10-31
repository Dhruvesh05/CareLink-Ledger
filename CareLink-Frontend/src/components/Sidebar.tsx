import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Lock,
  Bell,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/patient-dashboard" },
    { title: "Medical Records", icon: FileText, path: "/medical-records" },
    { title: "Appointments", icon: Calendar, path: "/appointments" },
    { title: "Access Management", icon: Lock, path: "/access-management" },
    { title: "Notifications", icon: Bell, path: "/notifications" },
    { title: "Profile", icon: User, path: "/profile" },
    { title: "Settings", icon: Settings, path: "/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/help-support" },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 dark:bg-black text-slate-300 md:w-72 border-r border-slate-800/80 dark:border-white/10">
      <div className="border-b border-slate-800/80 dark:border-white/10 p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm">
            CL
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CareLink Ledger</h1>
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">Portal Navigation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.path;
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 text-left px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800/80 dark:border-white/10 p-4">
        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-xl bg-rose-500/10 border border-rose-500/20 py-3 font-semibold text-sm text-rose-400 transition hover:bg-rose-600 hover:text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;