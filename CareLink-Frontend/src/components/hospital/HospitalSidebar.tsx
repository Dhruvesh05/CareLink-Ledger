import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Building,
  Calendar,
  Bell,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";
import RoleSidebar from "../RoleSidebar";

function HospitalSidebar() {
  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/hospital/dashboard" },
    { title: "Doctors Management", icon: UserCheck, path: "/hospital/doctors" },
    { title: "Patient Management", icon: UserCheck, path: "/hospital/patients" },
    { title: "Authorized Medical Records", icon: FileText, path: "/hospital/patient-records" },
    { title: "Departments", icon: Building, path: "/hospital/departments" },
    { title: "Appointments", icon: Calendar, path: "/hospital/appointments" },
    { title: "Billing & Invoices", icon: Calendar, path: "/hospital/billing" },
    { title: "Hospital Analytics", icon: Building, path: "/hospital/analytics" },
    { title: "Activity Logs", icon: Bell, path: "/hospital/activity-logs" },
    { title: "Profile", icon: User, path: "/hospital/profile" },
    { title: "Settings", icon: Settings, path: "/hospital/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/hospital/help-support" },
  ];

  return <RoleSidebar roleLabel="Hospital" items={menu} accent="teal" />;
}

export default HospitalSidebar;