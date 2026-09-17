import { useNavigate } from "react-router-dom";

function PatientSidebar() {
  const navigate = useNavigate();

  const menu = [
    {
      title: "Dashboard",
      icon: "🏠",
      path: "/patient-dashboard",
    },
    {
      title: "Medical Records",
      icon: "📁",
      path: "/medical-records",
    },
    {
      title: "Upload Record",
      icon: "⬆️",
      path: "/upload-record",
    },
    {
      title: "Appointments",
      icon: "📅",
      path: "/appointments",
    },
    {
      title: "Access Management",
      icon: "🔐",
      path: "/access-management",
    },
    {
      title: "Notifications",
      icon: "🔔",
      path: "/notifications",
    },
    {
      title: "Profile",
      icon: "👤",
      path: "/profile",
    },
    {
      title: "Settings",
      icon: "⚙️",
      path: "/settings",
    },
    {
      title: "Help & Support",
      icon: "❓",
      path: "/help-support",
    },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-blue-900 text-white md:w-72">

      <div className="border-b border-blue-700 p-6">
        <h1 className="text-2xl font-bold">
          CareLink Ledger
        </h1>

        <p className="mt-1 text-sm text-blue-200">
          Patient Portal
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {menu.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 text-left px-4 py-3 rounded-xl hover:bg-blue-700 transition mb-2"
          >
            <span className="text-xl">
              {item.icon}
            </span>

            <span>
              {item.title}
            </span>
          </button>
        ))}

      </div>

      <div className="mt-auto border-t border-blue-700 p-4">
        <button
          onClick={() => {
            localStorage.removeItem("role");
            navigate("/welcome");
          }}
          className="w-full rounded-xl bg-red-500 py-3 font-medium transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>

    </div>
  );
}

export default PatientSidebar;