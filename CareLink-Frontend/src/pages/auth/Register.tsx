import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { requestChallenge, verifyChallenge } from "../../api/auth";
import { connectWallet, signMessage } from "../../api/wallet";
import { getDashboardPathByRole, useAuth } from "../../auth/AuthContext";
import logo from "../../assets/images/logo.png";

function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login } = useAuth();
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(getDashboardPathByRole(role), { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const handleRegister = async () => {
    if (!walletAddress) {
      setFeedback({ type: "error", text: "Connect a wallet to register with the backend." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const challenge = await requestChallenge(walletAddress);
      const signature = await signMessage(challenge.message, walletAddress);
      const session = await verifyChallenge(walletAddress, challenge.message, signature);
      login(session);
      setFeedback({ type: "success", text: "Wallet registration/authentication succeeded. Redirecting…" });
      navigate(getDashboardPathByRole(session.user.role), { replace: true });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Registration failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      setFeedback({ type: "success", text: "MetaMask connected. You can register/authenticate with this wallet." });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "MetaMask is required." });
    }
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
            Wallet onboarding
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#123a8a] to-[#1c6ae6] p-6 text-white sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
              Trusted onboarding
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">Create your wallet-backed CareLink account.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
              Use your MetaMask wallet and the backend challenge flow to prove ownership before access is granted.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Create Account</h3>
              <p className="mt-2 text-sm text-slate-500">Connect your wallet and authenticate with the backend to complete onboarding.</p>
            </div>

            {feedback && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {feedback.text}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Wallet address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              className="mt-7 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-base font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Connect MetaMask
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_25px_rgba(37,99,235,0.25)] transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Registering…" : "Create account"}
            </button>

            <div className="mt-5 text-center text-sm text-slate-500">
              Already have an account? <button type="button" onClick={() => navigate("/login")} className="font-semibold text-blue-700 hover:text-blue-900">Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;