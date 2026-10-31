import {
  LayoutDashboard,
  Inbox,
  Users,
  FileText,
  Upload,
  ClipboardList,
  Calendar,
  Bell,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";
import RoleSidebar from "../RoleSidebar";

function DoctorSidebar() {
  const menu = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
    { title: "Patient Requests", icon: Inbox, path: "/doctor/patient-requests" },
    { title: "My Patients", icon: Users, path: "/doctor/my-patients" },
    { title: "Medical Records", icon: FileText, path: "/doctor/medical-records" },
    { title: "Upload Record", icon: Upload, path: "/doctor/upload-record" },
    { title: "Treatment Notes", icon: ClipboardList, path: "/doctor/treatment-notes" },
    { title: "Appointments", icon: Calendar, path: "/doctor/appointments" },
    { title: "Notifications", icon: Bell, path: "/doctor/notifications" },
    { title: "Profile", icon: User, path: "/doctor/profile" },
    { title: "Settings", icon: Settings, path: "/doctor/settings" },
    { title: "Help & Support", icon: HelpCircle, path: "/doctor/help-support" },
  ];

  return <RoleSidebar roleLabel="Doctor" items={menu} accent="green" />;
}

export default DoctorSidebar;