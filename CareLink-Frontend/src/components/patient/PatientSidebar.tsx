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
import RoleSidebar from "../RoleSidebar";

function PatientSidebar() {
  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/patient-dashboard" },
    { title: "Medical Records", icon: FileText, path: "/medical-records" },
    { title: "Appointments", icon: Calendar, path: "/appointments" },
    { title: "Billing & Invoices", icon: Calendar, path: "/billing" },
    { title: "Access Management", icon: Lock, path: "/access-management" },
    { title: "Notifications", icon: Bell, path: "/notifications" },
    { title: "Profile", icon: User, path: "/profile" },
    { title: "Settings", icon: Settings, path: "/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/help-support" },
  ];

  return <RoleSidebar roleLabel="Patient" items={menu} accent="cyan" />;
}

export default PatientSidebar;