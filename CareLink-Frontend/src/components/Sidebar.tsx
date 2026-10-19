import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Upload,
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
    { title: "Upload Record", icon: Upload, path: "/upload-record" },
    { title: "Appointments", icon: Calendar, path: "/appointments" },
    { title: "Access Management", icon: Lock, path: "/access-management" },
    { title: "Notifications", icon: Bell, path: "/notifications" },
    { title: "Profile", icon: User, path: "/profile" },
    { title: "Settings", icon: Settings, path: "/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/help-support" },
  ];

  return (
    <div className="w-72 h-screen bg-blue-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">CareLink Ledger</h1>
        <p className="text-sm text-blue-200 mt-1">Patient Portal</p>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 text-left px-4 py-3 rounded-xl hover:bg-blue-700 transition mb-2"
            >
              <Icon className="w-5 h-5 text-blue-200" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl font-medium transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;