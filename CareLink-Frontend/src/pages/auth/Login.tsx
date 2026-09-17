import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function Login() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "Patient";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogin = () => {
    if (!email || !password) {
      setFeedback({ type: "error", text: "Please enter both email and password." });
      return;
    }

    setFeedback({ type: "success", text: `Login successful for ${role}. Redirecting...` });

    setTimeout(() => {
      if (role === "Patient") {
        navigate("/patient-dashboard");
      } else if (role === "Doctor") {
        navigate("/doctor/dashboard");
      } else if (role === "Hospital") {
        navigate("/hospital/dashboard");
      } else if (role === "Admin") {
        navigate("/admin/dashboard");
      }
    }, 900);
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
              <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Secure healthcare access</p>
            </div>
          </div>

          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
            {role} Portal
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#123a8a] to-[#1c6ae6] p-6 text-white sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
              Trusted access
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">Welcome back to your secure workspace.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
              Manage your patient journey, clinical data, and healthcare operations with confidence.
            </p>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="rounded-[18px] bg-white p-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current role</p>
                    <p className="mt-1 text-lg font-bold text-[#0f2b6d]">{role}</p>
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
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Login</h3>
              <p className="mt-2 text-sm text-slate-500">Enter your details to continue as {role}.</p>
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

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                Remember me
              </label>

              <button type="button" className="font-medium text-blue-700 hover:text-blue-900">
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              className="mt-7 w-full rounded-xl bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_25px_rgba(37,99,235,0.25)] transition hover:bg-blue-800"
            >
              Login as {role}
            </button>

            <button
              onClick={() => navigate("/register")}
              className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-base font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Create account
            </button>

            <button
              onClick={() => navigate("/role-selection")}
              className="mt-5 text-sm font-medium text-slate-500 transition hover:text-blue-700"
            >
              ← Change role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;