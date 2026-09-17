import { useState, type ReactNode } from "react";

import Header from "./Header";

import PatientSidebar from "./patient/PatientSidebar";
import DoctorSidebar from "./doctor/DoctorSidebar";
import HospitalSidebar from "./hospital/HospitalSidebar";
import AdminSidebar from "./admin/AdminSidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  const role = localStorage.getItem("role");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderSidebar = () => {
    if (role === "Patient") return <PatientSidebar />;
    if (role === "Doctor") return <DoctorSidebar />;
    if (role === "Hospital") return <HospitalSidebar />;
    if (role === "Admin") return <AdminSidebar />;
    return null;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_transparent_30%),linear-gradient(180deg,_#f5fafe_0%,_#eef6ff_100%)] text-slate-800">
      <div className="hidden md:block fixed left-0 top-0 z-40 h-screen w-72 overflow-y-auto overflow-x-hidden border-r border-sky-100 bg-white/80 backdrop-blur-xl shadow-[12px_0_30px_rgba(30,64,175,0.08)]">
        {renderSidebar()}
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative h-screen w-[82vw] max-w-sm overflow-hidden bg-white shadow-2xl">
            {renderSidebar()}
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

        <main className="w-full min-h-[calc(100vh-5rem)] p-3 sm:p-4 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] rounded-[32px] border border-sky-100 bg-white/80 p-3 shadow-[0_25px_70px_rgba(14,116,144,0.08)] ring-1 ring-white/70 backdrop-blur-sm sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;