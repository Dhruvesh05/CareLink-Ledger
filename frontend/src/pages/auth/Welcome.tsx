import { useState, useEffect } from "react";
import { Navbar } from "../../components/landing/Navbar";
import { HeroSection } from "../../components/landing/HeroSection";
import { TechMarquee } from "../../components/landing/TechMarquee";
import { ProblemSolutionSection } from "../../components/landing/ProblemSolutionSection";
import { PipelineSection } from "../../components/landing/PipelineSection";
import { ArchitectureFlow } from "../../components/landing/ArchitectureFlow";
import { MetricsGrid } from "../../components/landing/MetricsGrid";
import { VerificationTimeline } from "../../components/landing/VerificationTimeline";
import { Footer } from "../../components/landing/Footer";

function Welcome() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("carelink-theme");
    return saved !== null ? saved === "dark" : true; // default dark mode per Apple-style dark gradient default
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("carelink-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("carelink-theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navbar */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Main Content */}
      <main>
        {/* Hero Section with Network Visualization Widget */}
        <HeroSection />

        {/* Tech Marquee Banner */}
        <TechMarquee />

        {/* Problem & Solution Bento Grid */}
        <ProblemSolutionSection />

        {/* Interactive 6-Stage Pipeline */}
        <PipelineSection />

        {/* Standalone Cross-Chain Architecture Data Flow Component */}
        <ArchitectureFlow />

        {/* 6 Verified Interoperability Directions Metrics Grid */}
        <MetricsGrid />

        {/* End-to-End Record Verification Lifecycle Timeline */}
        <VerificationTimeline />
      </main>

      {/* Footer with Operational Status Pill */}
      <Footer />
    </div>
  );
}

export default Welcome;