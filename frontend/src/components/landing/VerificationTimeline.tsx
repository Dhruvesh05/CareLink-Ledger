import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Play, RefreshCw } from "lucide-react";
import {
  DIDLogo,
  FHIRLogo,
  IPFSLogo,
  ZKPLogo,
  EthereumLogo,
} from "./OfficialLogos";

export const VerificationTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(5);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const timelineSteps = [
    {
      step: 1,
      title: "Patient DID & Biometric Auth",
      subtitle: "EIP-712 Signature Validation",
      icon: DIDLogo,
      status: "PASSED",
      hash: "0x892f...3a10",
      desc: "Patient hardware key verifies authority to grant access to attending doctor.",
    },
    {
      step: 2,
      title: "HL7 FHIR R4 Schema Inspection",
      subtitle: "LOINC & SNOMED CT Standard Check",
      icon: FHIRLogo,
      status: "PASSED",
      hash: "0x11a9...902c",
      desc: "Clinical observation payload verified against international HL7 FHIR R4 diagnostic standards.",
    },
    {
      step: 3,
      title: "IPFS Decryption & Shard Assembly",
      subtitle: "AES-256-GCM Cryptographic Reassembly",
      icon: IPFSLogo,
      status: "PASSED",
      hash: "QmXoyp...6uco",
      desc: "Distributed storage nodes return 12 encrypted chunks; client decrypts MRI/CT scan payloads locally.",
    },
    {
      step: 4,
      title: "ZK-SNARK Zero-Knowledge Circuit",
      subtitle: "Groth16 Proof Validation",
      icon: ZKPLogo,
      status: "PASSED",
      hash: "zkProof_valid_0x99",
      desc: "Verifies patient record authenticity without exposing private PII data to public nodes.",
    },
    {
      step: 5,
      title: "Tri-Chain Consensus Anchor Commit",
      subtitle: "Fabric ➔ Polygon ➔ Ethereum L1 Finality",
      icon: EthereumLogo,
      status: "COMMITTED",
      hash: "0x7f9a...3c21",
      desc: "State commitment finalized across all 3 networks with immutable root proof.",
    },
  ];

  const startVerificationTest = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setActiveStep(1);

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setIsVerifying(false);
          return 5;
        }
        return prev + 1;
      });
    }, 800);
  };

  return (
    <section id="verification" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
      >
        <div>
          {/* <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 block">
            Cryptographic Integrity
          </span> */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            End-to-End Record <br />
            <span className="text-cyan-600 dark:text-cyan-400">Verification Lifecycle</span>
          </h2>
        </div>

        <button
          onClick={startVerificationTest}
          disabled={isVerifying}
          className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${isVerifying
              ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
              : "bg-cyan-600 text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 active:scale-95"
            }`}
        >
          {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Play className="w-4 h-4 fill-current text-white" />}
          <span className="text-white">{isVerifying ? "Executing Verification..." : "Run Live Verification Demo"}</span>
        </button>
      </motion.div>

      {/* Vertical Step Timeline */}
      <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
        {timelineSteps.map((item) => {
          const Icon = item.icon;
          const isPassed = activeStep >= item.step;
          const isCurrent = activeStep === item.step && isVerifying;

          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: item.step * 0.08 }}
              className="relative flex items-start gap-4 sm:gap-6 group"
            >
              {/* Step Node */}
              <div
                className={`absolute -left-6 sm:-left-10 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isPassed
                    ? "bg-cyan-600 border-cyan-400 text-white"
                    : "bg-white dark:bg-black border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {isCurrent ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs font-bold">{item.step}</span>
                )}
              </div>

              {/* Card Content */}
              <div
                className={`flex-1 rounded-2xl p-5 sm:p-6 transition-all duration-300 bg-white dark:bg-black border ${isCurrent
                    ? "border-cyan-500 ring-2 ring-cyan-500/20"
                    : "border-slate-200 dark:border-white/10"
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{item.hash}</span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isPassed
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                    >
                      {isPassed ? "VERIFIED" : "PENDING"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">{item.subtitle}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
