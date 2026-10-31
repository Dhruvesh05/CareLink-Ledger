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
import RoleSidebar from "../RoleSidebar";

function AdminSidebar() {
  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { title: "User Management", icon: Users, path: "/admin/users" },
    { title: "Hospital Verification", icon: Building2, path: "/admin/hospitals" },
    { title: "Doctor Verification", icon: UserCheck, path: "/admin/doctors" },
    { title: "Patient Management", icon: User, path: "/admin/patients" },
    { title: "Platform Analytics", icon: BarChart3, path: "/admin/analytics" },
    { title: "Audit Logs", icon: FileCheck2, path: "/admin/audit-logs" },
    { title: "Blockchain Monitor", icon: LinkIcon, path: "/admin/blockchain" },
    { title: "IPFS Monitor", icon: Cloud, path: "/admin/ipfs" },
    { title: "System Reports", icon: FileText, path: "/admin/reports" },
    { title: "Notifications", icon: Bell, path: "/admin/notifications" },
    { title: "Profile", icon: User, path: "/admin/profile" },
    { title: "Settings", icon: Settings, path: "/admin/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/admin/help-support" },
  ];

  return <RoleSidebar roleLabel="Admin" items={menu} accent="indigo" />;
}

export default AdminSidebar;