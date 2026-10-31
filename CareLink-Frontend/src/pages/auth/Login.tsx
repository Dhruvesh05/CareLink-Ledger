import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { getDashboardPathByRole, useAuth } from "../../auth/AuthContext";
import { requestChallenge, verifyChallenge } from "../../api/auth";
import { connectWallet } from "../../api/wallet";
import logo from "../../assets/images/logo.png";

function Login() {
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

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      setFeedback({ type: "success", text: "MetaMask connected successfully." });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to connect MetaMask." });
    }
  };

  const handleLogin = async () => {
    if (!walletAddress) {
      setFeedback({ type: "error", text: "Connect a wallet before continuing." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const challenge = await requestChallenge(walletAddress);
      const signature = await (await import("../../api/wallet")).signMessage(challenge.message, walletAddress);
      const session = await verifyChallenge(walletAddress, challenge.message, signature);
      login(session);
      setFeedback({ type: "success", text: "Login successful. Redirecting…" });
      navigate(getDashboardPathByRole(session.user.role), { replace: true });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Authentication failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">Secure healthcare access</p>
            </div>
          </div>

          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Wallet auth
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-black dark:via-zinc-950 dark:to-black p-6 text-white sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Trusted access
            </div>

            <h2 className="mt-6 text-3xl sm:text-4xl font-black leading-tight tracking-tight">Sign in with your CareLink wallet.</h2>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-slate-300">
              This backend validates the connected wallet via a signed challenge and authorizes access by the blockchain role assigned to that wallet.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Login</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Connect your wallet to authenticate.</p>
            </div>

            {feedback && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
                {feedback.text}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Wallet address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              className="mt-7 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-base font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Connect MetaMask
            </button>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Authenticating…" : "Login with wallet"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/welcome/signup")}
              className="mt-4 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-base font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Create account
            </button>

            <button
              type="button"
              onClick={() => navigate("/role-selection")}
              className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change role</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;