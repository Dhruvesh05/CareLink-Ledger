import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(188,220,255,0.34),_transparent_32%),linear-gradient(135deg,_#06172e_0%,_#102d5e_30%,_#0b4dbd_58%,_#39bdf8_100%)] px-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.08),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[26px] border border-white/20 bg-white/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:h-28 sm:w-28 lg:h-32 lg:w-32">
          <img src={logo} alt="CareLink Logo" className="h-full w-full object-contain object-center" />
        </div>

        <h1 className="text-4xl font-black tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">
          CareLink
        </h1>

        <div className="mt-4 flex items-center justify-center gap-4 text-blue-100">
          <span className="h-px w-16 bg-white/50" />
          <span className="text-base font-semibold uppercase tracking-[0.35em] sm:text-lg">Ledger</span>
          <span className="h-px w-16 bg-white/50" />
        </div>

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