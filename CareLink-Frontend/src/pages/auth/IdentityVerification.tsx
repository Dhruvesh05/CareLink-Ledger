import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import logo from "../../assets/images/logo.png";

function IdentityVerification() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-[#edf5ff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#dfeafc] bg-white shadow-[0_35px_90px_rgba(17,73,179,0.14)] ring-1 ring-white/80">
        <div className="flex items-center justify-between gap-4 border-b border-[#eaf1ff] bg-[#f8fbff] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white p-1.5 shadow-sm sm:h-14 sm:w-14">
              <img src={logo} alt="CareLink Ledger Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#0f2b6d] sm:text-xl">CareLink Ledger</h1>
              <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Identity verification</p>
            </div>
          </div>

          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
            Not configured
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#123a8a] to-[#1c6ae6] p-6 text-white sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
              Identity proof
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">This backend does not expose a real identity-verification endpoint.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
              The wallet-authenticated session is the real authorization source. Identity verification remains pending or not configured by the backend contract/service.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Status</h3>
              <p className="mt-2 text-sm text-slate-500">No real identity verification API was found in the existing backend; this page is intentionally informational.</p>
            </div>

            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              The app will continue with wallet-based login and backend role validation instead of a fabricated identity flow.
            </div>

            <button
              type="button"
              onClick={() => navigate(role ? "/login" : "/welcome")}
              className="mt-8 w-full rounded-xl bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_25px_rgba(37,99,235,0.25)] transition hover:bg-blue-800"
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