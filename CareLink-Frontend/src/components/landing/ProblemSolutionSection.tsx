import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
  EthereumLogo,
  ZKPLogo,
  FHIRLogo,
  LegacyEHRLogo,
  RansomwareLogo,
  SlowTransferLogo,
} from "./OfficialLogos";

export const ProblemSolutionSection: React.FC = () => {
  const problems = [
    {
      title: "Siloed EHR Systems",
      desc: "Hospitals lock records in isolated software. Doctors lack crucial patient histories in emergencies.",
      icon: LegacyEHRLogo,
    },
    {
      title: "Ransomware & Breach Risks",
      desc: "Centralized servers are targets for attacks, exposing unencrypted health records.",
      icon: RansomwareLogo,
    },
    {
      title: "Sluggish Record Transfers",
      desc: "Sharing records between clinics requires manual approvals or insecure email attachments.",
      icon: SlowTransferLogo,
    },
  ];

  const solutions = [
    {
      title: "Tri-Network Cross-Chain Mesh",
      desc: "Bridges Ethereum's trust, Polygon's speed, and Fabric's private consortium for 100% availability.",
      icon: EthereumLogo,
      colorClass: "bg-blue-600",
    },
    {
      title: "ZK-SNARK & IPFS Sharding",
      desc: "Medical images are AES-256 encrypted, split into IPFS shards, and verified via Zero-Knowledge keys.",
      icon: ZKPLogo,
      colorClass: "bg-purple-600",
    },
    {
      title: "HL7 FHIR R4 Native Standard",
      desc: "Guarantees universal schema alignment across labs, pharmacy systems, and consoles.",
      icon: FHIRLogo,
      colorClass: "bg-cyan-600",
    },
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        {/* <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 block">
          Architecture Shift
        </span> */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Healthcare Fragmentation <br />
          <span className="text-cyan-600 dark:text-cyan-400">Solves with Decentralized Trust.</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 font-medium">
          Compare legacy siloed health networks against CareLink Ledger's high-speed cross-chain consortium.
        </p>
      </motion.div>

      {/* Grid Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Legacy Problem */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="p-8 rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 relative"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Legacy Healthcare Failure</h3>
              <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Fragile & Siloed</span>
            </div>
          </div>

          <div className="space-y-4">
            {problems.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 h-fit shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{p.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: CareLink Solution */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="p-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/5 relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">CareLink Fix</h3>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">Zero-Knowledge Mesh</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              Active Protocol
            </span>
          </div>

          <div className="space-y-4">
            {solutions.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all duration-300"
                >
                  <div className={`p-2.5 rounded-xl ${s.colorClass} text-white shrink-0`}>
                    <Icon className="w-5 h-5" color="white" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
