/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/purity */

import React, { useMemo, useState } from "react";
import { User, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";

const StyleDefinitions = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
    @keyframes scan {
      0% { transform: translateY(-100vh); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.1; }
      50% { transform: translateY(-20px) scale(1.05); opacity: 0.4; }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 245, 212, 0.2); }
      50% { box-shadow: 0 0 30px rgba(0, 245, 212, 0.5); }
    }
    .animate-scan {
      animation: scan 8s linear infinite;
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
    .glow-effect {
      animation: pulse-glow 3s infinite;
    }
    .cursor-blink {
      animation: blink 1s step-end infinite;
    }
    .glass-panel {
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 245, 212, 0.1);
    }
  `,
    }}
  />
);

const AnimatedGrid = () => {
  const squares = useMemo(
    () =>
      Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: `${Math.floor(Math.random() * 20) * 5}%`, // snapped to grid steps
        top: `${Math.floor(Math.random() * 20) * 5}%`,
        size: 50, // matches SVG grid cell size
        delay: Math.random() * 3,
        duration: Math.random() * 4 + 3,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* SVG Grid — unchanged */}
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0 opacity-[0.20]"
      >
        <defs>
          <pattern
            id="cyber-grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cyber-grid)" />
      </svg>

      {/* Grid-snapped floating cells */}
      {squares.map((sq) => (
        <div
          key={sq.id}
          className="absolute animate-float"
          style={{
            left: sq.left,
            top: sq.top,
            width: `${sq.size}px`,
            height: `${sq.size}px`,
            animationDelay: `${sq.delay}s`,
            animationDuration: `${sq.duration}s`,
            background: "rgba(0, 245, 212, 0.09)",
            border: "1px solid rgba(0, 245, 212, 0.3)",
            outline: "1px solid rgba(0, 245, 212, 0.12)",
            outlineOffset: "3px",
          }}
        />
      ))}
    </div>
  );
};

const BackgroundScanner = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden flex items-center justify-center p-4">
      {/* Deep Space Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#081b2a] to-[#020617] z-0" />

      <AnimatedGrid />

      {/* The Scanner Line Effect */}
      <div className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#00f5d4]/10 animate-scan z-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00f5d4] shadow-[0_0_20px_#00f5d4]" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
};

const InputField = ({ icon: Icon, type, placeholder, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group mb-5">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Icon
          size={20}
          className={`transition-colors duration-300 ${isFocused ? "text-[#00f5d4]" : "text-slate-500"}`}
        />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-[#0f172a]/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00f5d4]/70 focus:ring-1 focus:ring-[#00f5d4]/70 transition-all shadow-inner"
        required
      />
    </div>
  );
};

const GlassCard = ({ children }) => {
  return (
    <div className="glass-panel rounded-3xl p-8 sm:p-10 w-full relative group">
      {/* Top highlight line for extra depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#00f5d4]/50 to-transparent" />
      {children}
    </div>
  );
};

export {
  StyleDefinitions,
  BackgroundScanner,
  GlassCard,
  InputField,
  AnimatedGrid,
};
