import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  CheckCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  DIDLogo,
  ZKPLogo,
  FHIRLogo,
  EthereumLogo,
  PolygonLogo,
  IPFSLogo,
} from "./OfficialLogos";

export const PipelineSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const steps = [
    {
      id: 0,
      title: "User / Identity",
      subtitle: "DID Consent & ECDSA Sign",
      icon: DIDLogo,
      colorClass: "bg-cyan-600",
      details: {
        layer: "Client Authentication",
        protocol: "W3C Verifiable Credentials / EIP-712 Signature",
        crypto: "secp256k1 Curve",
        description:
          "The patient or authorized doctor initiates a medical record request or update by cryptographically signing an EIP-712 payload using their private key.",
        codeSnippet: `{
  "action": "GRANT_RECORD_ACCESS",
  "patientId": "did:carelink:0x90a218f",
  "grantee": "did:carelink:doc_hospital_ny",
  "scope": ["FHIR_DiagnosticReport", "IPFS_MRI_Scans"],
  "signature": "0x4b78912e9a...3c21a"
}`,
      },
    },
    {
      id: 1,
      title: "Frontend Client",
      subtitle: "AES-256 & ZK Proof Gen",
      icon: ZKPLogo,
      colorClass: "bg-teal-600",
      details: {
        layer: "Browser / Desktop Client",
        protocol: "AES-256-GCM + SnarkJS / Groth16",
        crypto: "Zero-Knowledge Circuit",
        description:
          "Sensitive clinical records are encrypted locally in the web/electron client. A zero-knowledge proof is generated to prove data validity without leaking patient identity.",
        codeSnippet: `// Client-Side ZK Proof Generation
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  { recordHash: "0x89ab...", patientSecret: "0x12ff..." },
  "carelink_circuit.wasm",
  "circuit_final.zkey"
);`,
      },
    },
    {
      id: 2,
      title: "Backend Gateway",
      subtitle: "HL7 FHIR R4 Validation",
      icon: FHIRLogo,
      colorClass: "bg-indigo-600",
      details: {
        layer: "API Dispatch Gateway",
        protocol: "HL7 FHIR R4 RESTful API",
        crypto: "TLS 1.3 + JWT Token",
        description:
          "CareLink's high-speed backend validates the payload against standard HL7 FHIR R4 schemas before dispatching to the blockchain.",
        codeSnippet: `POST /api/v1/fhir/Observation HTTP/1.1
Content-Type: application/fhir+json
Authorization: Bearer eyJhbGciOi...

{
  "resourceType": "Observation",
  "status": "final",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4" }] }
}`,
      },
    },
    {
      id: 3,
      title: "Trust Layer",
      subtitle: "Cross-Chain Relayer",
      icon: EthereumLogo,
      colorClass: "bg-purple-600",
      details: {
        layer: "Interoperability Engine",
        protocol: "CareLink Relay Bridge Consensus",
        crypto: "Threshold ECDSA Multi-Sig",
        description:
          "Cross-chain relay nodes intercept the request, verify consensus rules across multi-sig nodes, and route execution payloads to target chains.",
        codeSnippet: `event CrossChainSyncRequested(
    bytes32 indexed txHash,
    uint256 indexed sourceChainId,
    uint256 indexed targetChainId,
    bytes payloadHash
);`,
      },
    },
    {
      id: 4,
      title: "Ledger Mesh",
      subtitle: "Eth ↔ Poly ↔ Fabric",
      icon: PolygonLogo,
      colorClass: "bg-blue-600",
      details: {
        layer: "Tri-Chain Ledger Execution",
        protocol: "EVM Smart Contracts + Hyperledger Chaincode",
        crypto: "Raft Consortium + PoS / ZK",
        description:
          "Polygon executes high-speed access logs, Hyperledger Fabric stores private hospital consortium data, and Ethereum anchors the global state proof root.",
        codeSnippet: `// CareLinkTrustBridge.sol
function commitRecordAnchor(
    bytes32 recordHash,
    bytes memory zkProof
) external returns (bool) {
    require(verifyProof(zkProof), "Invalid ZK Proof");
    emit RecordAnchored(recordHash, block.timestamp);
    return true;
}`,
      },
    },
    {
      id: 5,
      title: "Storage & DB",
      subtitle: "IPFS + MongoDB + FHIR",
      icon: IPFSLogo,
      colorClass: "bg-emerald-600",
      details: {
        layer: "Encrypted Storage Layer",
        protocol: "IPFS Cluster + Encrypted MongoDB",
        crypto: "Sharded Ciphertext Storage",
        description:
          "Heavy DICOM images and lab PDFs are sharded across IPFS nodes. Metadata is indexed in MongoDB with pointers back to FHIR resources.",
        codeSnippet: `{
  "ipfsHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "shardCount": 12,
  "encryptionAlgorithm": "AES-256-GCM",
  "status": "PINNED_AND_VERIFIED"
}`,
      },
    },
  ];

  const activeData = steps[activeStep];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeData.details.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        {/* <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 block">
          Execution Lifecycle
        </span> */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Interactive Pipeline: <br />
          <span className="text-cyan-600 dark:text-cyan-400">How Data Moves Across Chains</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 font-medium">
          Click through each step of the 6-stage verification flow from client-side signing to cross-chain storage.
        </p>
      </motion.div>

      {/* Stepper Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
      >
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border relative ${isActive
                  ? "bg-white dark:bg-black border-cyan-500 scale-[1.03]"
                  : "bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-white/10 opacity-80 hover:opacity-100"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${step.colorClass} flex items-center justify-center text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400"
                    }`}
                >
                  0{step.id + 1}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{step.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{step.subtitle}</p>

              {step.id < 5 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Detail Inspector Box */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-black border border-slate-200 dark:border-white/10"
      >
        {/* Left Column: Stage Specs */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <CheckCircle className="w-3.5 h-3.5" />
              Stage 0{activeData.id + 1}: {activeData.details.layer}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeData.title} Protocol Spec
            </h3>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed font-medium">
              {activeData.details.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/10 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Protocol Standard</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{activeData.details.protocol}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Cryptography</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{activeData.details.crypto}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 5))}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-transparent border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
            >
              ← Previous Step
            </button>
            <button
              onClick={() => setActiveStep((prev) => (prev < 5 ? prev + 1 : 0))}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 transition-all"
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Right Column: Code Payload Viewer */}
        <div className="lg:col-span-6 bg-slate-950 dark:bg-zinc-950 rounded-2xl p-5 border border-slate-800 flex flex-col font-mono text-xs text-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-sans text-xs font-bold">
              <Code2 className="w-4 h-4" />
              <span>Pipeline Inspection Payload</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy Payload</span>
                </>
              )}
            </button>
          </div>

          <pre className="mt-4 overflow-x-auto text-cyan-300 leading-relaxed font-mono p-2">
            <code>{activeData.details.codeSnippet}</code>
          </pre>

          <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span>Status: Payload Signed & Validated</span>
            <span className="text-emerald-400 font-bold">✓ 100% FHIR R4 Compliant</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
