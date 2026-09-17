import { useNavigate } from "react-router-dom";

function DoctorSidebar() {
  const navigate = useNavigate();

  const menu = [
    {
      title: "Dashboard",
      icon: "🏠",
      path: "/doctor/dashboard",
    },
    {
      title: "Patient Requests",
      icon: "📩",
      path: "/doctor/patient-requests",
    },
    {
      title: "My Patients",
      icon: "👥",
      path: "/doctor/my-patients",
    },
    {
      title: "Medical Records",
      icon: "📁",
      path: "/doctor/medical-records",
    },
    {
      title: "Treatment Notes",
      icon: "📝",
      path: "/doctor/treatment-notes",
    },
    {
      title: "Notifications",
      icon: "🔔",
      path: "/doctor/notifications",
    },
    {
      title: "Profile",
      icon: "👤",
      path: "/doctor/profile",
    },
    {
      title: "Settings",
      icon: "⚙️",
      path: "/doctor/settings",
    },
    {
      title: "Help & Support",
      icon: "❓",
      path: "/doctor/help-support",
    },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-sky-700 via-blue-700 to-indigo-800 text-white shadow-[8px_0_30px_rgba(37,99,235,0.18)] md:w-72">

      <div className="border-b border-white/15 p-6">
        <h1 className="text-2xl font-bold tracking-wide">
          CareLink Ledger
        </h1>

        <p className="mt-1 text-sm text-sky-100">
          Doctor Portal
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {menu.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 text-left px-4 py-3 rounded-xl hover:bg-white/10 transition mb-2 text-sky-50"
          >
            <span className="text-xl">{item.icon}</span>

            <span>{item.title}</span>
          </button>
        ))}

      </div>

      <div className="mt-auto border-t border-white/15 p-4">
        <button
          onClick={() => {
            localStorage.removeItem("role");
            navigate("/welcome");
          }}
          className="w-full rounded-xl bg-red-500/90 py-3 font-medium transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>

    </div>
  );
}

export default DoctorSidebar;