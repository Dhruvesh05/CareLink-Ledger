import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getSelectedChainId } from "../../api/network";

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
  const [patientName, setPatientName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [gender, setGender] = useState("Male");

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


  const handleSepoliaPatientRegistration = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    let registrationTxHash: string | undefined;

    try {
      if (getSelectedChainId() !== 11155111) {
        throw new Error("Select Ethereum Sepolia in CareLink first.");
      }
      if (!patientName.trim() || !patientDob || !bloodGroup || !gender) {
        throw new Error("Enter all patient registration details.");
      }

      const registryAddress = import.meta.env.VITE_PATIENT_REGISTRY_ADDRESS as string | undefined;
      if (!registryAddress || !ethers.isAddress(registryAddress)) {
        throw new Error("Sepolia PatientRegistry address is not configured. Restart Vite after configuring .env.local.");
      }

      const injected = (window as Window & { ethereum?: any }).ethereum;
      if (!injected) {
        throw new Error("MetaMask is not available.");
      }

      const accounts = await injected.request({ method: "eth_requestAccounts" }) as string[];
      const connected = accounts?.[0];
      if (!connected || !ethers.isAddress(connected)) {
        throw new Error("Connect your Patient MetaMask wallet.");
      }
      if (walletAddress && connected.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("The connected MetaMask account differs from the wallet address shown on the page.");
      }

      const chainIdHex = await injected.request({ method: "eth_chainId" }) as string;
      if (Number.parseInt(chainIdHex, 16) !== 11155111) {
        throw new Error("Switch MetaMask to Ethereum Sepolia (chain ID 11155111).");
      }

      setWalletAddress(connected);

      const provider = new ethers.BrowserProvider(injected);
      const signer = await provider.getSigner();
      const registry = new ethers.Contract(
        registryAddress,
        [
          "function registerPatient(string fullNameHash,string dobHash,string bloodGroup,string gender)",
          "function isPatientActive(address wallet) view returns (bool)"
        ],
        signer
      );

      const alreadyActive = await registry.isPatientActive(connected);
      if (alreadyActive) {
        throw new Error("This wallet already has an active patient record on Sepolia. The missing role likely indicates a contract configuration mismatch; no duplicate registration was submitted.");
      }

      // Store hashes rather than the patient's raw name/date of birth on-chain.
      const fullNameHash = ethers.keccak256(
        ethers.toUtf8Bytes(patientName.trim().normalize("NFKC").toLowerCase())
      );
      const dobHash = ethers.keccak256(
        ethers.toUtf8Bytes(patientDob.trim())
      );

      const tx = await registry.registerPatient(
        fullNameHash,
        dobHash,
        bloodGroup,
        gender
      );
      registrationTxHash = tx.hash;
      setFeedback({
        type: "success",
        text: `Sepolia registration submitted (${tx.hash}). Waiting for confirmation…`
      });

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("Patient registration transaction did not succeed.");
      }

      setFeedback({
        type: "success",
        text: "Patient registration confirmed on Sepolia. Signing in…"
      });

      const challenge = await requestChallenge(connected);
      const signature = await signMessage(challenge.message, connected);
      const session = await verifyChallenge(connected, challenge.message, signature);

      login(session);
      navigate(getDashboardPathByRole(session.user.role), { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Patient registration failed.";
      setFeedback({
        type: "error",
        text: registrationTxHash
          ? `Registration transaction: ${registrationTxHash}. Next step failed: ${message}`
          : message
      });
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
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">Create your secure healthcare account</p>
            </div>
          </div>

          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Wallet onboarding
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-black dark:via-zinc-950 dark:to-black p-6 text-white sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Trusted onboarding
            </div>

            <h2 className="mt-6 text-3xl sm:text-4xl font-black leading-tight tracking-tight">Create your wallet-backed CareLink account.</h2>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-slate-300">
              Use your MetaMask wallet and the backend challenge flow to prove ownership before access is granted.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Connect your wallet and authenticate with the backend to complete onboarding.</p>
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

            <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Register Patient on Ethereum Sepolia
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Use the same patient details as your existing CareLink profile. Name and date of birth are hashed before being submitted.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
                  <input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    autoComplete="name"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Patient full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of birth</label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Blood group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm"
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(value => <option key={value}>{value}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm"
                    >
                      {["Male", "Female", "Other", "Prefer not to say"].map(value => <option key={value}>{value}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSepoliaPatientRegistration}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Registering…" : "Register Patient on Sepolia & Continue"}
              </button>
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
              onClick={handleRegister}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-600/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Registering…" : "Create account"}
            </button>

            <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/welcome/login")} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
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