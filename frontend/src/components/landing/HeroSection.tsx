import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { NetworkVisualization } from "./NetworkVisualization";
import { EthereumLogo, PolygonLogo, HyperledgerLogo, IPFSLogo, FHIRLogo } from "./OfficialLogos";

export const HeroSection: React.FC = () => {
  return (
    <section id="home" className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Massive Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="apple-heading text-4xl sm:text-7xl lg:text-8xl tracking-tight max-w-6xl text-[var(--text-primary)] font-black leading-[1.05]"
      >
        Connected Healthcare. <br />
        <span className="apple-gradient-text">Trusted Data.</span> <br />
        Interoperable Networks.
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 text-lg sm:text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl font-medium leading-relaxed"
      >
        Decentralized cross-chain trust infrastructure connecting Ethereum, Polygon, and Hyperledger Fabric with HL7 FHIR standards and zero-knowledge IPFS file encryption.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/welcome/signup"
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 transition-all duration-300"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <a
          href="#network"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300"
        >
          <span>Interactive Demo</span>
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-current" />
        </a>
      </motion.div>

      {/* Supported Tech Icons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-6 opacity-90 hover:opacity-100 transition-opacity"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
          Powered By Official Tech:
        </span>
        <EthereumLogo className="w-6 h-6" />
        <PolygonLogo className="w-6 h-6" />
        <HyperledgerLogo className="w-6 h-6" />
        <IPFSLogo className="w-6 h-6" />
        <FHIRLogo className="w-6 h-6" />
      </motion.div>

      {/* Live Stats Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl"
      >
        {[
          { stat: "99.99%", label: "Cross-Chain Uptime" },
          { stat: "<350ms", label: "Consensus Latency" },
          { stat: "HL7 FHIR", label: "Native Compliance" },
          { stat: "Zero-Knowledge", label: "Privacy Engine" },
        ].map((item, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400">{item.stat}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">{item.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Network Visualization Section Widget */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="w-full mt-12"
      >
        <NetworkVisualization />
      </motion.div>
    </section>
  );
};
