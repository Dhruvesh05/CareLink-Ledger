import { useNavigate } from "react-router-dom";
import { User, Stethoscope, Building2, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "../../assets/images/logo.png";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Patient",
      description: "Manage your health records, appointments, and access requests.",
      icon: User,
      color: "from-cyan-500 to-blue-600",
      badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
    },
    {
      title: "Doctor",
      description: "Review patient activity, records, and treatment workflows.",
      icon: Stethoscope,
      color: "from-emerald-500 to-teal-700",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    },
    {
      title: "Hospital",
      description: "Oversee departments, doctors, records, and operations.",
      icon: Building2,
      color: "from-blue-600 to-indigo-700",
      badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    },
    {
      title: "Admin",
      description: "Monitor system health, users, blockchain, and analytics.",
      icon: ShieldAlert,
      color: "from-violet-600 to-purple-700",
      badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    },
  ];

  const handleRoleSelect = (role: string) => {
    localStorage.setItem("role", role);
    navigate("/welcome/login");
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-300">
      {/* Background Ambient Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-950/80 shadow-2xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl ring-1 ring-slate-100/80 dark:ring-white/5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/welcome")}
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none"
              aria-label="Go back to welcome"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-black p-1.5 shadow-sm">
                <img src={logo} alt="CareLink Ledger Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">CareLink Ledger</h1>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">Trusted healthcare access platform</p>
              </div>
            </div>
          </div>

          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Secure Access
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Select your role</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Choose the right access path</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.title}
                  onClick={() => handleRoleSelect(role.title)}
                  className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-5 text-left shadow-sm hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-lg dark:hover:shadow-cyan-950/20 hover:-translate-y-1 transition-all duration-200 focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} text-white shadow-md shadow-cyan-600/10 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{role.title}</h3>
                      </div>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${role.badge}`}>
                      Open
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{role.description}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3">
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">Continue as {role.title}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 transition group-hover:bg-cyan-500/10 group-hover:text-cyan-500">
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 dark:border-white/10 pt-5 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
            <span>Already have an account?</span>
            <button onClick={() => navigate("/login")} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;