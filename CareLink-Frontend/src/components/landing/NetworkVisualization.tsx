import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  Activity,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Terminal,
} from "lucide-react";
import {
  EthereumLogo,
  PolygonLogo,
  HyperledgerLogo,
} from "./OfficialLogos";

export const NetworkVisualization: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<"ethereum" | "polygon" | "fabric">("ethereum");
  const [activeTxType, setActiveTxType] = useState<string>("HL7 FHIR Consent Sync");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>("0x7f9a8421c902b4d83e1a0b5912c48d2e61a8f93012a");

  const txTypes = [
    { id: "HL7 FHIR Consent Sync", label: "HL7 FHIR Sync", payload: "Consent/R4/90218", speed: "1.2s", icon: Activity },
    { id: "IPFS EHR Shard Verification", label: "IPFS EHR Verification", payload: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", speed: "0.8s", icon: ShieldCheck },
    { id: "ZK Audit Proof", label: "ZK-SNARK Proof", payload: "zkProof_Groth16_v4", speed: "0.3s", icon: Zap },
  ];

  const chains = {
    ethereum: {
      name: "Ethereum L1/L2",
      badge: "Root Trust Layer",
      icon: EthereumLogo,
      colorClass: "bg-blue-600 text-white",
      accent: "#3B82F6",
      tps: "125 TPS",
      finality: "12.0s",
      gas: "$0.02 / Tx",
      consensus: "Proof of Stake (PoS)",
      desc: "Anchors global root hashes, state commitments, and immutable ZK proof certificates for audit compliance.",
    },
    polygon: {
      name: "Polygon CDK / zkEVM",
      badge: "Fast Settlement",
      icon: PolygonLogo,
      colorClass: "bg-purple-600 text-white",
      accent: "#8B5CF6",
      tps: "4,500 TPS",
      finality: "1.2s",
      gas: "<$0.001 / Tx",
      consensus: "zkRollup Validation",
      desc: "Handles ultra-fast micro-transactions, instant access delegation, and real-time event logs across clinics.",
    },
    fabric: {
      name: "Hyperledger Fabric",
      badge: "Private Enterprise",
      icon: HyperledgerLogo,
      colorClass: "bg-cyan-600 text-white",
      accent: "#06B6D4",
      tps: "10,000+ TPS",
      finality: "<180ms",
      gas: "$0.00 (Tokenless)",
      consensus: "Raft Endorsement Policy",
      desc: "Permissioned hospital consortium network storing sensitive HIPAA/GDPR clinical records in Private Data Collections.",
    },
  };

  const currentTx = txTypes.find((t) => t.id === activeTxType) || txTypes[0];

  const handleSimulate = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(1);

    // Generate random mock hash
    const randomHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setTxHash(randomHash);

    setTimeout(() => setSimulationStep(2), 700);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => {
      setSimulationStep(4);
      setIsSimulating(false);
    }, 2100);
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div id="network" className="w-full my-12 rounded-3xl p-6 sm:p-10 relative overflow-hidden bg-white dark:bg-black border border-slate-200 dark:border-white/10 backdrop-blur-2xl transition-colors duration-300">
      {/* Dynamic Ambient Background Glowing Orbs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 dark:bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 mb-3 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>Live Tri-Network Mesh</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Cross-Chain Healthcare Interoperability
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
            Simulate real-time HL7 FHIR clinical record consensus moving seamlessly across Ethereum, Polygon, and Hyperledger Fabric.
          </p>
        </div>

        {/* Transaction Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full md:w-auto bg-slate-100/90 dark:bg-zinc-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
          {txTypes.map((tx) => {
            const Icon = tx.icon;
            const isActive = activeTxType === tx.id;
            return (
              <button
                key={tx.id}
                onClick={() => setActiveTxType(tx.id)}
                className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 text-center whitespace-nowrap ${isActive
                  ? "bg-cyan-600 dark:bg-cyan-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
                  }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tx.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Interactive Diagram Area */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 my-8 z-10">
        {/* SVG Flow Connections for desktop */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full" overflow="visible">
            {/* Connecting lines between chain cards */}
            <path
              d="M 280 120 Q 420 40 560 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="text-slate-300 dark:text-slate-800"
            />
            <path
              d="M 560 140 Q 420 220 280 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="text-slate-300 dark:text-slate-800"
            />
            {isSimulating && (
              <path
                d="M 280 120 Q 420 40 560 120"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                className="animate-flow"
              />
            )}
          </svg>
        </div>

        {/* Chain 1: Ethereum */}
        {(Object.keys(chains) as Array<keyof typeof chains>).map((key) => {
          const c = chains[key];
          const Icon = c.icon;
          const isSelected = selectedChain === key;

          return (
            <motion.div
              key={key}
              onClick={() => setSelectedChain(key)}
              whileHover={{ y: -4, scale: 1.015 }}
              transition={{ duration: 0.2 }}
              className={`relative z-10 cursor-pointer rounded-2xl p-6 transition-all duration-300 border ${isSelected
                ? "bg-white dark:bg-black border-cyan-500 ring-2 ring-cyan-500/20"
                : "bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-cyan-400/40"
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${c.colorClass} flex items-center justify-center text-white`}
                >
                  <Icon className="w-6 h-6" color="white" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  {c.badge}
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {c.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 min-h-[3rem] leading-relaxed">
                {c.desc}
              </p>

              {/* Node Metrics Mini Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/10 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Finality</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{c.finality}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Est. Cost</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.gas}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Throughput</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{c.tps}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Consensus</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{c.consensus}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Node Synchronized & Active</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Transaction Payload Inspector Card */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-950/90 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium block">Active Payload Standard</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{currentTx.payload}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400 font-sans">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Relay Latency</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentTx.speed}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Consensus Mode</span>
              <span className="font-bold text-slate-900 dark:text-white">Tri-Mesh Sync</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Live Simulation Control Panel */}
      <div className="relative z-10 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl p-5 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className={`w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-sm transition-all ${isSimulating
              ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-slate-400 cursor-not-allowed"
              : "bg-cyan-600 text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-white dark:hover:bg-cyan-400 active:scale-95"
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
            <span className="text-white">{isSimulating ? "Relaying Across Chains..." : "Trigger Test Cross-Chain Sync"}</span>
          </button>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Hash</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">{txHash.slice(0, 16)}...</span>
              <button
                onClick={copyHash}
                title="Copy Transaction Hash"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulation Status Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${simulationStep >= 1 ? "text-cyan-600 dark:text-white font-extrabold" : "text-slate-500 dark:text-white"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${simulationStep >= 1 ? "bg-cyan-500 text-white font-bold" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-white"}`}>
              1
            </span>
            <span>Eth Sign</span>
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />

          <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${simulationStep >= 2 ? "text-purple-600 dark:text-white font-extrabold" : "text-slate-500 dark:text-white"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${simulationStep >= 2 ? "bg-purple-500 text-white font-bold" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-white"}`}>
              2
            </span>
            <span>Poly zkRollup</span>
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />

          <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${simulationStep >= 3 ? "text-teal-600 dark:text-white font-extrabold" : "text-slate-500 dark:text-white"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${simulationStep >= 3 ? "bg-teal-500 text-white font-bold" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-white"}`}>
              3
            </span>
            <span>Fabric Commit</span>
          </div>

          {simulationStep === 4 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-white font-extrabold ml-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified!</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
