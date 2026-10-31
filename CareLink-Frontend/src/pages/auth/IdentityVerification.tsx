import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import logo from "../../assets/images/logo.png";

function IdentityVerification() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-300">
      {/* Background Ambient Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-950/80 shadow-2xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl ring-1 ring-slate-100/80 dark:ring-white/5">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-black p-1.5 shadow-sm">
              <img src={logo} alt="CareLink Ledger Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">CareLink Ledger</h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">Identity verification</p>
            </div>
          </div>

          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Not configured
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-black dark:via-zinc-950 dark:to-black p-6 text-white sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Identity proof
            </div>

            <h2 className="mt-6 text-3xl sm:text-4xl font-black leading-tight tracking-tight">This backend does not expose a real identity-verification endpoint.</h2>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-slate-300">
              The wallet-authenticated session is the real authorization source. Identity verification remains pending or not configured by the backend contract/service.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Status</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No real identity verification API was found in the existing backend; this page is intentionally informational.</p>
            </div>

            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              The app will continue with wallet-based login and backend role validation instead of a fabricated identity flow.
            </div>

            <button
              type="button"
              onClick={() => navigate(role ? "/login" : "/welcome")}
              className="mt-8 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-600/20 transition-all"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IdentityVerification;