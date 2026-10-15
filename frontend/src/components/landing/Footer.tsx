import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Shield, Award } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] pt-16 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[var(--border-color)]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-600 p-[1px]">
                <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                CareLink <span className="apple-gradient-text font-black">Ledger</span>
              </span>
            </Link>

            <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
              Decentralized cross-chain trust infrastructure connecting Ethereum, Polygon, and Hyperledger Fabric with HL7 FHIR standards and zero-knowledge privacy.
            </p>

            {/* Status Pill */}
            {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>All Systems Operational</span>
            </div> */}
          </div>

          {/* Column 1: Ecosystem */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li><a href="#network" className="hover:text-[var(--text-primary)] transition-colors">Cross-Chain Mesh</a></li>
              <li><a href="#solutions" className="hover:text-[var(--text-primary)] transition-colors">Architecture Fix</a></li>
              <li><a href="#pipeline" className="hover:text-[var(--text-primary)] transition-colors">6-Stage Pipeline</a></li>
              <li><a href="#verification" className="hover:text-[var(--text-primary)] transition-colors">Verification Flow</a></li>
            </ul>
          </div>

          {/* Column 2: Protocol Specs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">Protocol</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li><span className="hover:text-[var(--text-primary)] cursor-pointer">Ethereum Mainnet</span></li>
              <li><span className="hover:text-[var(--text-primary)] cursor-pointer">Polygon zkEVM</span></li>
              <li><span className="hover:text-[var(--text-primary)] cursor-pointer">Hyperledger Fabric</span></li>
              <li><span className="hover:text-[var(--text-primary)] cursor-pointer">IPFS File Sharding</span></li>
            </ul>
          </div>

          {/* Column 3: Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">Compliance</h4>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Award className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> HIPAA Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> GDPR Ready
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> HL7 FHIR R4
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Award className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> ISO/IEC 27001
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <p>© {new Date().getFullYear()} CareLink Ledger Inc. All rights reserved. Apple-inspired design architecture.</p>
          <div className="flex items-center gap-6">
            <Link to="/welcome/login" className="hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
            <Link to="/welcome/signup" className="hover:text-[var(--text-primary)] transition-colors">Register</Link>
            <span className="text-[var(--border-color)]">|</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Decentralized Healthcare Trust</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
