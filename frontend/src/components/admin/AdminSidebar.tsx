import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  User,
  BarChart3,
  FileCheck2,
  Link as LinkIcon,
  Cloud,
  FileText,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

function AdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { title: "Users", icon: Users, path: "/admin/users" },
    { title: "Hospitals", icon: Building2, path: "/admin/hospitals" },
    { title: "Doctors", icon: UserCheck, path: "/admin/doctors" },
    { title: "Patients", icon: User, path: "/admin/patients" },
    { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { title: "Audit Logs", icon: FileCheck2, path: "/admin/audit-logs" },
    { title: "Blockchain", icon: LinkIcon, path: "/admin/blockchain" },
    { title: "IPFS", icon: Cloud, path: "/admin/ipfs" },
    { title: "Reports", icon: FileText, path: "/admin/reports" },
    { title: "Notifications", icon: Bell, path: "/admin/notifications" },
    { title: "Profile", icon: User, path: "/admin/profile" },
    { title: "Settings", icon: Settings, path: "/admin/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/admin/help-support" },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-purple-900 text-white md:w-72">
      <div className="flex-shrink-0 border-b border-purple-700 p-6">
        <h1 className="text-2xl font-bold">CareLink Ledger</h1>
        <p className="mt-1 text-sm text-purple-200">Admin Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.title} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 text-left px-4 py-3 rounded-xl hover:bg-purple-700 transition mb-2">
              <Icon className="w-5 h-5 text-purple-200 shrink-0" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex-shrink-0 border-t border-purple-700 p-4">
        <button onClick={() => { logout(); navigate("/login"); }} className="w-full rounded-xl bg-red-500 py-3 font-medium transition hover:bg-red-600">
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;