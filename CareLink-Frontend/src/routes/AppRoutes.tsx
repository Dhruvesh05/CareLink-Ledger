import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth Pages
import SplashScreen from "../pages/auth/SplashScreen";
import Welcome from "../pages/auth/Welcome";
import RoleSelection from "../pages/auth/RoleSelection";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import IdentityVerification from "../pages/auth/IdentityVerification";

// Patient Pages
import PatientDashboard from "../pages/patient/Dashboard";
import MedicalRecords from "../pages/patient/MedicalRecords";
import UploadRecord from "../pages/patient/UploadRecord";
import Appointments from "../pages/patient/Appointments";
import AccessManagement from "../pages/patient/AccessManagement";
import Notifications from "../pages/patient/Notifications";
import Profile from "../pages/patient/Profile";
import Settings from "../pages/patient/Settings";
import HelpSupport from "../pages/patient/HelpSupport";

// Doctor Pages
import DoctorDashboard from "../pages/doctor/Dashboard";
import PatientRequests from "../pages/doctor/PatientRequests";
import MyPatients from "../pages/doctor/MyPatients";
import MedicalRecordsDoctor from "../pages/doctor/MedicalRecords";
import TreatmentNotes from "../pages/doctor/TreatmentNotes";
import NotificationsDoctor from "../pages/doctor/Notifications";
import ProfileDoctor from "../pages/doctor/Profile";
import SettingsDoctor from "../pages/doctor/Settings";
import HelpSupportDoctor from "../pages/doctor/HelpSupport";
// Hospital Pages
import HospitalDashboard from "../pages/hospital/Dashboard";
import PatientRecords from "../pages/hospital/PatientRecords";
import Doctors from "../pages/hospital/Doctors";
import Departments from "../pages/hospital/Departments";
import HospitalAppointments from "../pages/hospital/Appointments";
import Billing from "../pages/hospital/Billing";
import HospitalNotifications from "../pages/hospital/Notifications";
import HospitalProfile from "../pages/hospital/Profile";
import HospitalSettings from "../pages/hospital/Settings";
import HospitalHelpSupport from "../pages/hospital/HelpSupport";
// Admin Pages

import AdminDashboard from "../pages/admin/Dashboard";
import Users from "../pages/admin/Users";
import Hospitals from "../pages/admin/Hospitals";
import DoctorsAdmin from "../pages/admin/Doctors";
import Patients from "../pages/admin/Patients";
import Analytics from "../pages/admin/Analytics";
import AuditLogs from "../pages/admin/AuditLogs";
import Blockchain from "../pages/admin/Blockchain";
import IPFS from "../pages/admin/IPFS";
import Reports from "../pages/admin/Reports";
import NotificationsAdmin from "../pages/admin/Notifications";
import ProfileAdmin from "../pages/admin/Profile";
import SettingsAdmin from "../pages/admin/Settings";
import HelpSupportAdmin from "../pages/admin/HelpSupport";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/identity-verification"
          element={<IdentityVerification />}
        />

        {/* Patient */}
        <Route
          path="/patient-dashboard"
          element={<PatientDashboard />}
        />
        <Route
          path="/medical-records"
          element={<MedicalRecords />}
        />
        <Route
          path="/upload-record"
          element={<UploadRecord />}
        />
        <Route
          path="/appointments"
          element={<Appointments />}
        />
        <Route
          path="/access-management"
          element={<AccessManagement />}
        />
        <Route
          path="/notifications"
          element={<Notifications />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/settings"
          element={<Settings />}
        />
        <Route
          path="/help-support"
          element={<HelpSupport />}
        />

        {/* Doctor */}
        <Route
          path="/doctor/dashboard"
          element={<DoctorDashboard />}
        />
        <Route
          path="/doctor/patient-requests"
          element={<PatientRequests />}
        />
        <Route
          path="/doctor/my-patients"
          element={<MyPatients />}
        />
        <Route
          path="/doctor/medical-records"
          element={<MedicalRecordsDoctor />}
        />
        <Route
          path="/doctor/treatment-notes"
          element={<TreatmentNotes />}
        />
        <Route
          path="/doctor/notifications"
          element={<NotificationsDoctor />}
        />
        <Route
          path="/doctor/profile"
          element={<ProfileDoctor />}
        />
        <Route
          path="/doctor/settings"
          element={<SettingsDoctor />}
        />
        <Route
          path="/doctor/help-support"
          element={<HelpSupportDoctor />}
        />
        {/* Hospital */}

        <Route
          path="/hospital/dashboard"
          element={<HospitalDashboard />}
        />

        <Route
          path="/hospital/patient-records"
          element={<PatientRecords />}
        />

        <Route
          path="/hospital/doctors"
          element={<Doctors />}
        />

        <Route
          path="/hospital/departments"
          element={<Departments />}
        />

        <Route
          path="/hospital/appointments"
          element={<HospitalAppointments />}
        />

        <Route
          path="/hospital/billing"
          element={<Billing />}
        />

        <Route
          path="/hospital/notifications"
          element={<HospitalNotifications />}
        />

        <Route
          path="/hospital/profile"
          element={<HospitalProfile />}
        />

        <Route
          path="/hospital/settings"
          element={<HospitalSettings />}
        />

        <Route
          path="/hospital/help-support"
          element={<HospitalHelpSupport />}
        />
        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<Users />} />

          <Route path="/admin/hospitals" element={<Hospitals />} />

          <Route path="/admin/doctors" element={<DoctorsAdmin />} />

          <Route path="/admin/patients" element={<Patients />} />

          <Route path="/admin/analytics" element={<Analytics />} />

          <Route path="/admin/audit-logs" element={<AuditLogs />} />

          <Route path="/admin/blockchain" element={<Blockchain />} />

          <Route path="/admin/ipfs" element={<IPFS />} />

          <Route path="/admin/reports" element={<Reports />} />

          <Route path="/admin/notifications" element={<NotificationsAdmin />} />

          <Route path="/admin/profile" element={<ProfileAdmin />} />

          <Route path="/admin/settings" element={<SettingsAdmin />} />

          <Route path="/admin/help-support" element={<HelpSupportAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;