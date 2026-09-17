import { useNavigate } from "react-router-dom";

type HeaderProps = {
  onMenuToggle?: () => void;
};

function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "User";

  const getRoleName = () => {
    switch (role) {
      case "Patient":
        return "Patient";
      case "Doctor":
        return "Doctor";
      case "Hospital":
        return "Hospital";
      case "Admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const getDashboardPath = () => {
    switch (role) {
      case "Patient":
        return "/patient-dashboard";
      case "Doctor":
        return "/doctor/dashboard";
      case "Hospital":
        return "/hospital/dashboard";
      case "Admin":
        return "/admin/dashboard";
      default:
        return "/welcome";
    }
  };

  return (
    <header className="w-full h-20 bg-white/80 border-b border-sky-100 backdrop-blur-md shadow-[0_10px_30px_rgba(14,165,233,0.06)] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">

      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-xl text-sky-700 shadow-sm transition hover:bg-sky-100"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}

        <button
          onClick={() => navigate(getDashboardPath())}
          className="text-left"
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-900 truncate">
            Welcome 👋
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {getRoleName()} Dashboard
          </p>
        </button>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-5 ml-4">

        {/* Notification */}
        <button
          onClick={() => {
            if (role === "Patient") {
              navigate("/notifications");
            } else if (role === "Doctor") {
              navigate("/doctor/notifications");
            } else if (role === "Hospital") {
              navigate("/hospital/notifications");
            } else if (role === "Admin") {
              navigate("/admin/notifications");
            }
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xl sm:text-2xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition shadow-sm"
          title="Notifications"
        >
          🔔
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            if (role === "Patient") {
              navigate("/profile");
            } else if (role === "Doctor") {
              navigate("/doctor/profile");
            } else if (role === "Hospital") {
              navigate("/hospital/profile");
            } else if (role === "Admin") {
              navigate("/admin/profile");
            }
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center text-base sm:text-lg lg:text-xl font-semibold hover:from-sky-700 hover:to-blue-800 transition shadow-md"
          title="Profile"
        >
          {role.charAt(0).toUpperCase()}
        </button>

      </div>

    </header>
  );
}

export default Header;