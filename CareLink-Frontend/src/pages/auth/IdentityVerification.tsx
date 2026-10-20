import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import logo from "../../assets/images/logo.png";
import {
  createSsiAuthorizationPresentation,
  getAuthenticatedDid,
  requestSsiAuthorizationChallenge,
  verifySsiAuthorization,
} from "../../api/ssi";

function IdentityVerification() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [status, setStatus] = useState<
    | "idle"
    | "requesting"
    | "creating"
    | "submitting"
    | "authorized"
    | "failed"
  >("idle");
  const [did, setDid] = useState<string | null>(null);
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const requestVerification = async () => {
    setStatus("requesting");
    setError(null);

    try {
      const [authenticatedDid, challenge] = await Promise.all([
        getAuthenticatedDid(),
        requestSsiAuthorizationChallenge(),
      ]);

      setDid(authenticatedDid);
      setChallengeExpiresAt(challenge.expiresAt);
      setStatus("creating");
      const presentation = await createSsiAuthorizationPresentation();
      setStatus("submitting");
      await verifySsiAuthorization(presentation);
      setStatus("authorized");
    } catch (requestError) {
      setStatus("failed");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to start SSI verification."
      );
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
              <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Identity verification</p>
            </div>
          </div>

          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-[10px]">
            Backend connected
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#123a8a] to-[#1c6ae6] p-6 text-white sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
              Identity proof
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">Verify your CareLink identity.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
              The backend will provide the authenticated user&apos;s DID and a short-lived authorization challenge. It remains the authority for SSI and CareLink role verification.
            </p>
          </div>

          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f2b6d] sm:text-3xl">Status</h3>
              <p className="mt-2 text-sm text-slate-500">Start a backend authorization challenge before using protected CareLink operations.</p>
            </div>

            {status === "authorized" && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                SSI authorization verified by the backend for DID {did}. The signed proof was kept in memory and was not persisted.
                {challengeExpiresAt && (
                  <span className="mt-1 block text-xs">
                    Challenge expires at {new Date(challengeExpiresAt).toLocaleString()}.
                  </span>
                )}
              </div>
            )}

            {status === "failed" && error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={requestVerification}
              disabled={status === "requesting"}
              className="w-full rounded-xl bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_25px_rgba(37,99,235,0.25)] transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "requesting"
                ? "Requesting challenge…"
                : status === "creating"
                  ? "Creating authorization proof…"
                  : status === "submitting"
                    ? "Verifying authorization…"
                    : status === "authorized"
                      ? "Authorization verified"
                : "Request verification challenge"}
            </button>

            <button
              type="button"
              onClick={() => navigate(role ? "/login" : "/welcome")}
              className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-base font-semibold text-blue-700 transition hover:bg-blue-100"
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