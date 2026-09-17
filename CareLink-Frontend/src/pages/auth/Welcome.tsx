import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import hero from "../../assets/images/hero.png";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#edf6ff] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl rounded-[32px] border border-sky-100 bg-white/90 shadow-[0_30px_80px_rgba(14,116,144,0.12)] backdrop-blur-sm overflow-hidden">
        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-10 sm:px-10 lg:px-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.28),_transparent_35%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/15 bg-white/95 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.18)] sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                    <img
                      src={logo}
                      alt="CareLink Ledger Logo"
                      className="h-full w-full object-contain object-center"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.8rem]">CareLink Ledger</h1>
                    <p className="text-sm text-blue-100">Secure Healthcare Platform</p>
                  </div>
                </div>

                <div className="max-w-xl">
                  <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-blue-100">
                    Trusted care infrastructure
                  </div>
                  <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                    Connected Healthcare.
                    <span className="mt-2 block text-blue-200">Trusted Data.</span>
                  </h2>
                  <p className="mt-6 max-w-lg text-base leading-relaxed text-blue-100 sm:text-lg">
                    A secure digital ecosystem that empowers patients, doctors, and hospitals to manage,
                    access, and share medical information with confidence.
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                {[
                  { icon: '🔐', text: 'Secure Medical Records' },
                  { icon: '⛓️', text: 'Blockchain-based Trust' },
                  { icon: '☁️', text: 'Decentralized IPFS Storage' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-slate-950/10 backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-blue-50 sm:text-base">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 flex justify-center">
                <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Welcome
                </div>
              </div>

              <div className="mb-8 flex justify-center">
                <div className="relative w-full max-w-[420px] rounded-[24px] bg-gradient-to-br from-sky-50 via-white to-blue-50 p-0 shadow-[0_18px_45px_rgba(14,116,144,0.12)]">
                  <div className="absolute inset-x-10 top-2 h-12 rounded-full bg-sky-200/30 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[18px] bg-transparent">
                    <img
                      src={hero}
                      alt="Healthcare Illustration"
                      className="w-full rounded-[14px] object-contain drop-shadow-[0_24px_36px_rgba(37,99,235,0.14)]"
                    />
                  </div>
                </div>
              </div>

              

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate("/role-selection")}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
                >
                  Get Started
                  <span className="ml-2">→</span>
                </button>

                <div className="flex items-center justify-center gap-2 pt-2 text-sm text-slate-500">
                  <span>Already have an account?</span>
                  <button onClick={() => navigate("/login")} className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;