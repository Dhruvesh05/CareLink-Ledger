import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Patient",
      description: "Manage your health records, appointments, and access requests.",
      icon: "👤",
      color: "from-blue-500 to-blue-700",
      badge: "bg-blue-50 text-blue-700",
      border: "border-blue-100 hover:border-blue-300",
    },
    {
      title: "Doctor",
      description: "Review patient activity, records, and treatment workflows.",
      icon: "👨‍⚕️",
      color: "from-emerald-500 to-emerald-700",
      badge: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-100 hover:border-emerald-300",
    },
    {
      title: "Hospital",
      description: "Oversee departments, doctors, records, and operations.",
      icon: "🏥",
      color: "from-violet-500 to-violet-700",
      badge: "bg-violet-50 text-violet-700",
      border: "border-violet-100 hover:border-violet-300",
    },
    {
      title: "Admin",
      description: "Monitor system health, users, blockchain, and analytics.",
      icon: "👨‍💼",
      color: "from-amber-500 to-orange-600",
      badge: "bg-orange-50 text-orange-700",
      border: "border-orange-100 hover:border-orange-300",
    },
  ];

  const handleRoleSelect = (role: string) => {
    localStorage.setItem("role", role);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#edf5ff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#dfeafc] bg-white shadow-[0_35px_100px_rgba(17,73,179,0.16)] ring-1 ring-white/80">
        <div className="flex items-center justify-between gap-3 border-b border-[#eaf1ff] bg-[#f8fbff] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/welcome")}
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-[0_8px_20px_rgba(14,116,144,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-[0_12px_24px_rgba(14,116,144,0.14)] focus:outline-none focus:ring-4 focus:ring-sky-100"
              aria-label="Go back to welcome"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white p-1.5 shadow-sm sm:h-14 sm:w-14">
                <img src={logo} alt="CareLink Ledger Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-[#0f2b6d] sm:text-xl">CareLink Ledger</h1>
                <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Trusted healthcare access platform</p>
              </div>
            </div>
          </div>

          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
            Secure Access
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mb-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 sm:text-[11px]">Select your role</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Choose the right access path</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <button
                key={role.title}
                onClick={() => handleRoleSelect(role.title)}
                className={`group rounded-[24px] border bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_38px_rgba(37,99,235,0.12)] ${role.border} focus:outline-none focus:ring-4 focus:ring-blue-100`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${role.color} text-2xl shadow-sm sm:h-14 sm:w-14`}>
                      {role.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0f2b6d] sm:text-xl">{role.title}</h3>
                    </div>
                  </div>

                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${role.badge}`}>
                    Open
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-500">{role.description}</p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-blue-700">Continue as {role.title}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row">
            <span>Already have an account?</span>
            <button onClick={() => navigate("/login")} className="font-semibold text-blue-700 transition hover:text-blue-900">
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;