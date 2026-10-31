import { useMemo, useState, type ReactNode } from "react";

import { useAuth } from "../auth/AuthContext";
import Header from "./Header";

import PatientSidebar from "./patient/PatientSidebar";
import DoctorSidebar from "./doctor/DoctorSidebar";
import HospitalSidebar from "./hospital/HospitalSidebar";
import AdminSidebar from "./admin/AdminSidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderSidebar = useMemo(() => {
    if (role === "Patient") return <PatientSidebar />;
    if (role === "Doctor") return <DoctorSidebar />;
    if (role === "Hospital") return <HospitalSidebar />;
    if (role === "Admin") return <AdminSidebar />;
    return null;
  }, [role]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F5F7F8] text-[#17212F] transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-72 overflow-y-auto overflow-x-hidden bg-white shadow-[8px_0_24px_rgba(23,33,47,0.04)] md:block">
        {renderSidebar}
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative h-screen w-[82vw] max-w-sm overflow-hidden bg-white shadow-2xl">
            {renderSidebar}
          </div>
        </div>
      )}

      <div className="md:hidden">
        <Header onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
      </div>

      <div className="min-h-screen md:pl-72">
        <div className="hidden md:block">
          <Header />
        </div>

        <main className="min-h-[calc(100vh-5rem)] w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;