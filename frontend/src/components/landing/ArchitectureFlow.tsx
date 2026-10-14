import React, { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import {
  Building2,
  FileText,
  UserCheck,
  ShieldCheck,
  Layers,
  Zap,
  Server,
  Lock,
  Sparkles,
} from "lucide-react";

// Google Font DM Sans dynamic injection
const DM_SANS_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

  .font-dm-sans {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }
`;

export const ArchitectureFlow: React.FC = () => {
  const [activeHoveredNode, setActiveHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());

  // Mouse Parallax Motion Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 25 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setActiveHoveredNode(null);
  };

  // SVG Conduit paths for Desktop architecture diagram (viewBox: 0 0 800 460)
  const topPaths = [
    {
      id: "hospital",
      path: "M 160 105 C 160 170, 320 150, 320 195",
      shadowPath: "M 160 109 C 160 174, 320 154, 320 199",
      color: "#00F2FE",
      glowColor: "rgba(0, 242, 254, 0.8)",
      label: "FHIR Payload",
    },
    {
      id: "fhir",
      path: "M 400 105 C 400 150, 400 150, 400 195",
      shadowPath: "M 400 109 C 400 154, 400 154, 400 199",
      color: "#38BDF8",
      glowColor: "rgba(56, 189, 248, 0.8)",
      label: "EMR Stream",
    },
    {
      id: "doctor",
      path: "M 640 105 C 640 170, 480 150, 480 195",
      shadowPath: "M 640 109 C 640 174, 480 154, 480 199",
      color: "#818CF8",
      glowColor: "rgba(129, 140, 248, 0.8)",
      label: "Digital Signature",
    },
  ];

  const bottomPaths = [
    {
      id: "ethereum",
      path: "M 320 265 C 320 310, 160 290, 160 355",
      shadowPath: "M 320 269 C 320 314, 160 294, 160 359",
      color: "#38BDF8",
      glowColor: "rgba(56, 189, 248, 0.8)",
      label: "Proof Anchor",
    },
    {
      id: "polygon",
      path: "M 400 265 C 400 310, 400 310, 400 355",
      shadowPath: "M 400 269 C 400 314, 400 314, 400 359",
      color: "#C084FC",
      glowColor: "rgba(192, 132, 252, 0.8)",
      label: "Fast State Commit",
    },
    {
      id: "hyperledger",
      path: "M 480 265 C 480 310, 640 290, 640 355",
      shadowPath: "M 480 269 C 480 314, 640 294, 640 359",
      color: "#6366F1",
      glowColor: "rgba(99, 102, 241, 0.8)",
      label: "Private Access Log",
    },
  ];

  const isTrustHovered = activeHoveredNode === "trust-layer";

  return (
    <section
      className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden font-dm-sans"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{DM_SANS_STYLE}</style>

      {/* Layer 1: Ambient Background Lighting & Grid Plane */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        {/* Soft Radial Gradient Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[350px] bg-cyan-400/10 dark:bg-cyan-500/15 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-[550px] h-[380px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-300/10 dark:bg-blue-600/10 blur-[150px] rounded-full" />

        {/* Subtle Tech Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 mb-5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>Cross-Chain Architecture</span>
        </motion.div> */}

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]"
        >
          Unified Health Data{" "}
          <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">
            Flow Pipeline
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
        >
          Ingesting HL7 FHIR records from medical providers, validating trust in real-time, and
          anchoring cryptographic proofs across distributed ledgers.
        </motion.p>
      </div>

      {/* Main 3D Architecture Canvas Stage */}
      <div className="w-full max-w-5xl mx-auto [perspective:1200px]" ref={containerRef}>
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: shouldReduceMotion ? 0 : rotateX,
            rotateY: shouldReduceMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full rounded-[32px] p-6 sm:p-10 md:p-12 bg-white dark:bg-black border border-slate-200 dark:border-white/10 transition-colors duration-500 overflow-hidden"
        >
          {/* Top Sheen Reflection Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 dark:via-cyan-400/40 to-transparent pointer-events-none" />

          {/* Subdued Glass Depth Texture Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Desktop SVG 3D Conduit Overlay */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-10 [transform:translateZ(10px)]">
            <svg className="w-full h-full" viewBox="0 0 800 460" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* SVG Glow Filter */}
                <filter id="conduit-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Top Conduits (Sources -> Trust Layer) */}
              {topPaths.map((item, index) => {
                const isHovered = activeHoveredNode === item.id || isTrustHovered;
                return (
                  <React.Fragment key={item.id}>
                    {/* Secondary Reflection Shadow Path */}
                    <path
                      d={item.shadowPath}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.04)"
                      strokeWidth="3"
                      className="dark:stroke-black/20"
                    />

                    {/* Subtle Dashed Background Track */}
                    <path
                      d={item.path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-300/60 dark:text-slate-700/60 transition-colors duration-300"
                      strokeDasharray="4 4"
                    />

                    {/* Main Animated Conduit Path */}
                    <motion.path
                      d={item.path}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? 3.5 : 2.2}
                      filter={isHovered ? "url(#conduit-glow)" : undefined}
                      initial={{ pathLength: 0, opacity: 0.3 }}
                      animate={{
                        pathLength: 1,
                        opacity: isHovered ? 1 : 0.65,
                      }}
                      transition={{ duration: 1.4, delay: index * 0.15 }}
                    />

                    {/* Primary Animated Data Particle */}
                    {!shouldReduceMotion && (
                      <motion.g
                        style={{ offsetPath: `path('${item.path}')` }}
                        animate={{ offsetDistance: ["0%", "100%"] }}
                        transition={{
                          duration: isHovered ? 1.2 : 2.4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.4,
                        }}
                      >
                        <circle
                          r={isHovered ? 5.5 : 4}
                          fill={item.color}
                          filter="url(#particle-glow)"
                        />
                        <circle r={isHovered ? 2.5 : 2} fill="#FFFFFF" />
                      </motion.g>
                    )}

                    {/* Secondary Trailing Data Particle */}
                    {!shouldReduceMotion && (
                      <motion.g
                        style={{ offsetPath: `path('${item.path}')` }}
                        animate={{ offsetDistance: ["0%", "100%"] }}
                        transition={{
                          duration: isHovered ? 1.2 : 2.4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.4 + 1.2,
                        }}
                      >
                        <circle
                          r={isHovered ? 4 : 3}
                          fill={item.color}
                          opacity={0.6}
                          filter="url(#particle-glow)"
                        />
                      </motion.g>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Bottom Conduits (Trust Layer -> Ledgers) */}
              {bottomPaths.map((item, index) => {
                const isHovered = activeHoveredNode === item.id || isTrustHovered;
                return (
                  <React.Fragment key={item.id}>
                    {/* Reflection Shadow Path */}
                    <path
                      d={item.shadowPath}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.04)"
                      strokeWidth="3"
                      className="dark:stroke-black/20"
                    />

                    {/* Subtle Dashed Track */}
                    <path
                      d={item.path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-300/60 dark:text-slate-700/60 transition-colors duration-300"
                      strokeDasharray="4 4"
                    />

                    {/* Main Animated Conduit Path */}
                    <motion.path
                      d={item.path}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? 3.5 : 2.2}
                      filter={isHovered ? "url(#conduit-glow)" : undefined}
                      initial={{ pathLength: 0, opacity: 0.3 }}
                      animate={{
                        pathLength: 1,
                        opacity: isHovered ? 1 : 0.65,
                      }}
                      transition={{ duration: 1.4, delay: 0.5 + index * 0.15 }}
                    />

                    {/* Primary Animated Data Particle */}
                    {!shouldReduceMotion && (
                      <motion.g
                        style={{ offsetPath: `path('${item.path}')` }}
                        animate={{ offsetDistance: ["0%", "100%"] }}
                        transition={{
                          duration: isHovered ? 1.2 : 2.4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 0.5 + index * 0.4,
                        }}
                      >
                        <circle
                          r={isHovered ? 5.5 : 4}
                          fill={item.color}
                          filter="url(#particle-glow)"
                        />
                        <circle r={isHovered ? 2.5 : 2} fill="#FFFFFF" />
                      </motion.g>
                    )}

                    {/* Secondary Trailing Data Particle */}
                    {!shouldReduceMotion && (
                      <motion.g
                        style={{ offsetPath: `path('${item.path}')` }}
                        animate={{ offsetDistance: ["0%", "100%"] }}
                        transition={{
                          duration: isHovered ? 1.2 : 2.4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 0.5 + index * 0.4 + 1.2,
                        }}
                      >
                        <circle
                          r={isHovered ? 4 : 3}
                          fill={item.color}
                          opacity={0.6}
                          filter="url(#particle-glow)"
                        />
                      </motion.g>
                    )}
                  </React.Fragment>
                );
              })}
            </svg>
          </div>

          {/* DOM Interactive 3D Nodes Container */}
          <div className="relative z-20 flex flex-col justify-between min-h-[460px] md:h-[460px] py-2 gap-8 md:gap-0">
            {/* LEVEL 1: SOURCE NODES (Top Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center [transform:translateZ(30px)]">
              {/* Hospital Network */}
              <NodeCard
                id="hospital"
                title="Hospital Network"
                subtitle="EHR / EMR Providers"
                Icon={Building2}
                iconColor="text-cyan-500 dark:text-cyan-400"
                glowBg="from-cyan-500/20 to-sky-500/5"
                borderColor="group-hover:border-cyan-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />

              {/* HL7 FHIR Records */}
              <NodeCard
                id="fhir"
                title="HL7 FHIR Records"
                subtitle="Patient Data Payloads"
                Icon={FileText}
                iconColor="text-sky-500 dark:text-sky-400"
                glowBg="from-sky-500/20 to-blue-500/5"
                borderColor="group-hover:border-sky-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />

              {/* Doctor / Practitioner */}
              <NodeCard
                id="doctor"
                title="Doctor / Practitioner"
                subtitle="Signed Prescriptions"
                Icon={UserCheck}
                iconColor="text-indigo-500 dark:text-indigo-400"
                glowBg="from-indigo-500/20 to-purple-500/5"
                borderColor="group-hover:border-indigo-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />
            </div>

            {/* LEVEL 2: CENTRAL CARELINK TRUST LAYER (Middle Row - Main Focal Point) */}
            <div className="flex justify-center items-center my-auto my-4 md:my-0 [transform:translateZ(55px)]">
              <motion.div
                onHoverStart={() => setActiveHoveredNode("trust-layer")}
                onHoverEnd={() => setActiveHoveredNode(null)}
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                      y: [0, -4, 0],
                    }
                }
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                      scale: 1.03,
                      translateZ: 70,
                    }
                }
                className="relative cursor-pointer group w-full max-w-md sm:w-auto"
              >
                {/* Layered Outer Volumetric Glow */}
                <div
                  className={`absolute -inset-3 rounded-3xl bg-cyan-500/20 blur-2xl transition-opacity duration-500 ${isTrustHovered ? "opacity-70 scale-105" : "opacity-35"
                    }`}
                />

                {/* Subtle Outer Rotating Accent Ring */}
                {!shouldReduceMotion && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 rounded-[28px] border border-dashed border-cyan-400/40 dark:border-cyan-400/30 pointer-events-none"
                  />
                )}

                {/* Main 3D Floating Capsule Surface */}
                <div className="relative px-6 py-4 sm:px-10 sm:py-5 rounded-2xl bg-white dark:bg-black border-2 border-cyan-500/80 dark:border-cyan-400/60 backdrop-blur-2xl flex items-center gap-4 sm:gap-5">
                  {/* Sheen Highlight */}
                  <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

                  {/* 3D Central Icon Pedestal */}
                  <div className="relative p-3 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" />
                    <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-cyan-200 animate-pulse" />
                  </div>

                  {/* Text Information */}
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base sm:text-lg font-extrabold tracking-wide text-slate-900 dark:text-white uppercase">
                        CareLink Trust Layer
                      </span>
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                    </div>

                    {/* Subtitle - Accurate Technical Claim without ZK Proof */}
                    <span className="mt-0.5 text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      Consent & Cross-Chain Validation Hub
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* LEVEL 3: LEDGER NODES (Bottom Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center [transform:translateZ(30px)]">
              {/* Ethereum L1 */}
              <NodeCard
                id="ethereum"
                title="Ethereum L1"
                subtitle="Settlement Layer"
                Icon={Layers}
                iconColor="text-sky-500 dark:text-sky-400"
                glowBg="from-sky-500/20 to-blue-500/5"
                borderColor="group-hover:border-sky-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />

              {/* Polygon PoS */}
              <NodeCard
                id="polygon"
                title="Polygon PoS"
                subtitle="High-Speed Scaling"
                Icon={Zap}
                iconColor="text-purple-500 dark:text-purple-400"
                glowBg="from-purple-500/20 to-fuchsia-500/5"
                borderColor="group-hover:border-purple-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />

              {/* Hyperledger Fabric */}
              <NodeCard
                id="hyperledger"
                title="Hyperledger Fabric"
                subtitle="Private Consortium"
                Icon={Server}
                iconColor="text-indigo-500 dark:text-indigo-400"
                glowBg="from-indigo-500/20 to-slate-500/5"
                borderColor="group-hover:border-indigo-500/60"
                setActiveHoveredNode={setActiveHoveredNode}
                shouldReduceMotion={shouldReduceMotion}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* Internal Helper Component: 3D Reusable Node Card */
interface NodeCardProps {
  id: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  glowBg: string;
  borderColor: string;
  setActiveHoveredNode: (id: string | null) => void;
  shouldReduceMotion: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({
  id,
  title,
  subtitle,
  Icon,
  iconColor,
  glowBg,
  borderColor,
  setActiveHoveredNode,
  shouldReduceMotion,
}) => {
  return (
    <motion.div
      onHoverStart={() => setActiveHoveredNode(id)}
      onHoverEnd={() => setActiveHoveredNode(null)}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
            y: -6,
            scale: 1.03,
            translateZ: 45,
          }
      }
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative flex flex-col items-center cursor-pointer group"
    >
      {/* Background Soft Glow */}
      <div
        className={`absolute -inset-2 rounded-3xl bg-gradient-to-b ${glowBg} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* 3D Glass Module Card */}
      <div
        className={`relative w-full py-5 px-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/20 ${borderColor} backdrop-blur-xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden`}
      >
        {/* Card Top Reflection Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

        {/* Glass Icon Pedestal */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon className={`w-7 h-7 ${iconColor} transition-transform duration-300`} />
        </div>

        {/* Node Labels */}
        <span className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </span>
        <span className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
};
