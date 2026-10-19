import React from "react";

// Official SVGs for Ethereum, Polygon, Hyperledger Fabric, IPFS, HL7 FHIR, ZKPs, W3C DIDs, and Healthcare Security
export const EthereumLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 784 1277" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M392.07 0L383.5 29.11V872.25L392.07 880.8L784.13 649.54L392.07 0Z" fill={color || "#627EEA"} />
    <path d="M392.07 0L0 649.54L392.07 880.8V471.6V0Z" fill={color ? "currentColor" : "#8A92B2"} opacity={color ? 0.8 : 1} />
    <path d="M392.07 955.15L387.24 961.02V1261.9L392.07 1276.7L784.37 724.08L392.07 955.15Z" fill={color || "#627EEA"} />
    <path d="M392.07 1276.7V955.15L0 724.08L392.07 1276.7Z" fill={color ? "currentColor" : "#8A92B2"} opacity={color ? 0.8 : 1} />
    <path d="M392.07 880.8L784.13 649.54L392.07 471.6V880.8Z" fill={color ? "currentColor" : "#454A75"} opacity={color ? 0.9 : 1} />
    <path d="M0 649.54L392.07 880.8V471.6L0 649.54Z" fill={color || "#627EEA"} />
  </svg>
);

export const PolygonLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M29.2 11.4C28.2 10.8 27 10.8 26 11.4L20.8 14.4L15.6 11.4C14.6 10.8 13.4 10.8 12.4 11.4L7.2 14.4C6.2 15 5.6 16.1 5.6 17.2V23.2C5.6 24.3 6.2 25.4 7.2 26L12.4 29C13.4 29.6 14.6 29.6 15.6 29L20.8 26L26 29C27 29.6 28.2 29.6 29.2 29L34.4 26C35.4 25.4 36 24.3 36 23.2V17.2C36 16.1 35.4 15 34.4 14.4L29.2 11.4Z" fill={color || "#8247E5"} />
    <path d="M19 0L24.2 3C25.2 3.6 25.8 4.7 25.8 5.8V11.8L20.6 8.8L19 7.9L17.4 8.8L12.2 11.8V5.8C12.2 4.7 12.8 3.6 13.8 3L19 0Z" fill={color || "#8247E5"} opacity={color ? 0.85 : 1} />
  </svg>
);

export const HyperledgerLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M128 0L16 64.7v126.6L128 256l112-64.7V64.7L128 0zm-8.8 30.6l84.4 48.7-36.2 20.9-84.4-48.7 36.2-20.9zm-82.7 54.3l83 47.9v97.5l-83-47.9V84.9zm180.2 97.5l-83 47.9v-97.5l83-47.9v97.5z" fill={color || "#00F2FE"} />
  </svg>
);

export const IPFSLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm-1 2.3l6.3 3.7L12 11.7 5.7 8 11 4.3zm-6.5 4.5L11 12.5v7.3l-6.5-3.8V8.8zm15 7.3L13 19.8v-7.3l6.5-3.7v7.3z" fill={color || "#65C2CB"} />
  </svg>
);

export const FHIRLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8 2 6 5 6 8.5C6 11.5 8 13.5 10 15C10.5 15.3 11 15.7 11 16.5C11 17.5 10 18.5 8.5 18.5C7.5 18.5 6.5 18 5.5 17C5 18.5 6 21 8.5 21C11.5 21 13.5 19 13.5 16.5C13.5 14.5 12 13 10.5 12C9.5 11.3 9 10.5 9 9.5C9 8 10.2 6.5 12 6.5C13.8 6.5 15 8 15 9.5C15 10.2 14.5 11 14 11.5L15.5 13C16.5 12 17 10.8 17 9.5C17 6 14.5 2 12 2Z" fill={color || "#EF4444"} />
    <path d="M17.5 14H14.5V16H17.5V14Z" fill={color || "#0284C7"} />
    <path d="M19 17H13V19H19V17Z" fill={color || "#0284C7"} />
    <path d="M21 20H11.5V22H21V20Z" fill={color || "#0284C7"} />
  </svg>
);

export const ZKPLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4.8c1.8 0 3.2 1.4 3.2 3.2 0 2.4-3.2 5.6-3.2 5.6s-3.2-3.2-3.2-5.6c0-1.8 1.4-3.2 3.2-3.2z" fill={color || "#38BDF8"} />
  </svg>
);

export const DIDLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-6 h-6", color }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill={color || "#F59E0B"} />
  </svg>
);

export const LegacyEHRLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="6" rx="2" stroke="#EF4444" strokeWidth="2" fill="none" />
    <rect x="3" y="14" width="18" height="6" rx="2" stroke="#EF4444" strokeWidth="2" fill="none" />
    <circle cx="7" cy="7" r="1" fill="#EF4444" />
    <circle cx="7" cy="17" r="1" fill="#EF4444" />
    <line x1="14" y1="10" x2="14" y2="14" stroke="#EF4444" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

export const RansomwareLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" stroke="#EF4444" strokeWidth="2" fill="#EF4444" fillOpacity="0.15" />
    <rect x="9" y="11" width="6" height="5" rx="1" fill="#EF4444" />
    <path d="M10 11V9a2 2 0 114 0v2" stroke="#EF4444" strokeWidth="2" fill="none" />
  </svg>
);

export const SlowTransferLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" fill="none" />
    <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" fill="none" />
    <circle cx="12" cy="14" r="3" stroke="#EF4444" strokeWidth="2" fill="none" />
    <path d="M12 12.5V14L13 15" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
