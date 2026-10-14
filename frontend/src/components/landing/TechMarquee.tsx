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

export const TechMarquee: React.FC = () => {
  const techItems = [
    { name: "Ethereum", desc: "Layer-1 Settlement", Logo: EthereumLogo },
    { name: "Polygon", desc: "zkEVM L2 Scaling", Logo: PolygonLogo },
    { name: "Hyperledger Fabric", desc: "Private EHR Consortium", Logo: HyperledgerLogo },
    { name: "IPFS", desc: "Decentralized File Sharding", Logo: IPFSLogo },
    { name: "HL7 FHIR R4", desc: "Standardized Health APIs", Logo: FHIRLogo },
    { name: "Zero-Knowledge Proofs", desc: "Groth16 & Plonk ZKPs", Logo: ZKPLogo },
    { name: "W3C DIDs", desc: "Self-Sovereign Identity", Logo: DIDLogo },
  ];

  // Repeat array twice to create a long track
  const trackItems = [...techItems, ...techItems];

  return (
    <section className="w-full py-6 border-y border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden relative font-dm-sans">
      {/* Fade Gradients at Left & Right Edges */}
      <div className="absolute top-0 bottom-0 left-0 w-28 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-28 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none" />

      {/* 100% Seamless Continuous Infinite Marquee Container */}
      <div className="flex overflow-hidden select-none w-full">
        <motion.div
          className="flex items-center shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            },
          }}
        >
          {/* Track 1 */}
          <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 shrink-0">
            {trackItems.map((item, idx) => {
              const LogoComponent = item.Logo;
              return (
                <div
                  key={`t1-${idx}`}
                  className="flex items-center gap-3.5 shrink-0 hover:opacity-80 transition-opacity duration-200 cursor-default"
                >
                  <LogoComponent className="w-7 h-7 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 2 (Identical Duplicate for Perfect Seamless Subpixel Loop) */}
          <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 shrink-0" aria-hidden="true">
            {trackItems.map((item, idx) => {
              const LogoComponent = item.Logo;
              return (
                <div
                  key={`t2-${idx}`}
                  className="flex items-center gap-3.5 shrink-0 hover:opacity-80 transition-opacity duration-200 cursor-default"
                >
                  <LogoComponent className="w-7 h-7 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                      {item.desc}
                    </span>
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
