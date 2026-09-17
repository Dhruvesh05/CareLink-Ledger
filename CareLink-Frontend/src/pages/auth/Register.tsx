import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function Register() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRegister = () => {
    setFeedback({ type: "success", text: "Registration successful. Redirecting to verification..." });

    setTimeout(() => {
      navigate("/identity-verification");
    }, 1000);
  };

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
              <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Create your secure healthcare account</p>
            </div>
          </div>

          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
            Register
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#123a8a] to-[#1c6ae6] p-6 text-white sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
              Trusted onboarding
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">Create your account and begin securely.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
              Join a trusted digital healthcare network built for secure collaboration and seamless access.
            </p>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="rounded-[18px] bg-white p-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Account setup</p>
                    <p className="mt-1 text-lg font-bold text-[#0f2b6d]">Easy and secure</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl text-blue-700">
                    ✓
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Create Account</h3>
              <p className="mt-2 text-sm text-slate-500">Fill in the details below to continue.</p>
            </div>

            {feedback && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Mobile number</label>
                <input
                  type="tel"
                  placeholder="Enter mobile"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Select role</label>
                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option>Patient</option>
                  <option>Doctor</option>
                  <option>Hospital</option>
                  <option>Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              className="mt-7 w-full rounded-xl bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_25px_rgba(37,99,235,0.25)] transition hover:bg-blue-800"
            >
              Create account
            </button>

            <div className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button onClick={() => navigate("/login")} className="font-semibold text-blue-700 hover:text-blue-900">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;