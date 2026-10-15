import React from "react";
import { motion } from "framer-motion";
import {
  EthereumLogo,
  PolygonLogo,
  HyperledgerLogo,
  IPFSLogo,
  FHIRLogo,
  ZKPLogo,
  DIDLogo,
} from "./OfficialLogos";

export const MetricsGrid: React.FC = () => {
  const directions = [
    {
      pairName: "ETH / POLYGON",
      LeftLogo: EthereumLogo,
      RightLogo: PolygonLogo,
      badge: "STATE & SETTLEMENT",
      desc: "L1 Merkle roots ↔ Polygon zkEVM finality",
      metric: "1.2s Finality",
      detail: "Settlement Speed",
    },
    {
      pairName: "POLYGON / FABRIC",
      LeftLogo: PolygonLogo,
      RightLogo: HyperledgerLogo,
      badge: "PUBLIC-PRIVATE BRIDGE",
      desc: "Fabric hospital data ↔ Polygon zkEVM proof",
      metric: "0 Data Leaks",
      detail: "Zero-Knowledge Isolation",
    },
    {
      pairName: "FABRIC / ETHEREUM",
      LeftLogo: HyperledgerLogo,
      RightLogo: EthereumLogo,
      badge: "INSTITUTIONAL AUDIT",
      desc: "HIPAA & GDPR proofs on L1 Mainnet",
      metric: "100% Immutable",
      detail: "Audit Compliance",
    },
    {
      pairName: "FHIR / IPFS",
      LeftLogo: FHIRLogo,
      RightLogo: IPFSLogo,
      badge: "CLINICAL SHARDING",
      desc: "FHIR resources & DICOM scans sharded on IPFS",
      metric: "AES-256 Encrypted",
      detail: "Storage Protocol",
    },
    {
      pairName: "DID / EHR",
      LeftLogo: DIDLogo,
      RightLogo: ZKPLogo,
      badge: "SELF-SOVEREIGN AUTH",
      desc: "EIP-712 hardware keys for patient consent",
      metric: "Granular Keys",
      detail: "Permission Scope",
    },
    {
      pairName: "LAB / DOCTOR",
      LeftLogo: FHIRLogo,
      RightLogo: ZKPLogo,
      badge: "REAL-TIME SYNC",
      desc: "Pathology diagnostic sync to specialist consoles",
      metric: "<200ms Relay",
      detail: "Real-Time Sync",
    },
  ];

  return (
    <section id="technology" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        {/* <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 block">
          Interoperability Matrix
        </span> */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          6 Verified Directions of <br />
          <span className="text-cyan-600 dark:text-cyan-400">Cross-Chain Healthcare Data Flow</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 font-medium">
          Every route in CareLink Ledger is secured by threshold cryptography, smart contract bridges, and native HL7 FHIR compliance.
        </p>
      </motion.div>

      {/* 6 Grid Cards */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
      >
        {directions.map((dir, idx) => {
          const LeftLogo = dir.LeftLogo;
          const RightLogo = dir.RightLogo;

          return (
            <motion.div
              key={idx}
              className="bg-white dark:bg-black border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors duration-200 rounded-2xl p-6 flex flex-col items-center text-center group relative"
            >
              {/* Overlapping Dual Icons */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 z-0">
                  <LeftLogo className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-black border border-slate-200 dark:border-white/10 -ml-3.5 flex items-center justify-center p-2 z-10">
                  <RightLogo className="w-5 h-5" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
                {dir.pairName}
              </h3>

              {/* Badge */}
              <div className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider mb-4">
                <span>{dir.badge}</span>
              </div>

              {/* Metric Section */}
              <div className="my-auto flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-0.5">
                  {dir.detail}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight block">
                  {dir.metric}
                </span>
              </div>

              {/* Secondary Subtext */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/10 w-full text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>{dir.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
