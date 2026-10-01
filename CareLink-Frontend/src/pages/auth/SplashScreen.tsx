import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.35),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_42%,_#0ea5e9_100%)] px-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.1),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border border-white/20 bg-white/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:h-24 sm:w-24 lg:h-28 lg:w-28">
          <img
            src={logo}
            alt="CareLink Logo"
            className="h-full w-full object-contain object-center"
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          CareLink Ledger
        </h1>

        <p className="mt-4 text-base text-blue-100 sm:text-xl">
          A Decentralized Trust Infrastructure
        </p>

        <p className="text-sm text-blue-100 sm:text-base">
          for Interoperable Healthcare Ecosystem
        </p>

        <div className="mt-10 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-white/35 border-t-white animate-spin" />
        </div>

        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-blue-100">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;