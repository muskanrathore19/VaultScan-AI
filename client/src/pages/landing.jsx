import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Zap,
  GitBranch,
  Eye,
} from "lucide-react";
import { StyleDefinitions, BackgroundScanner, GlassCard } from "./utils.jsx";
import { useNavigate } from "react-router-dom";

const TYPING_TEXT = "VaultScan";

const stats = [
  { value: "99.8%", label: "Detection accuracy" },
  { value: "<20ms", label: "Scan latency" },
  { value: "50k+", label: "Secret patterns" },
  { value: "SOC", label: "Certified" },
];

const FeatureCard = ({ title, desc }) => (
  <div
    style={{
      background: "rgba(15, 23, 42, 0.5)",
      border: "1px solid rgba(255, 255, 255, 0.07)",
      borderRadius: "16px",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
      cursor: "default",
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(0, 245, 212, 0.45)";
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)";
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
          "linear-gradient(to right, transparent, rgba(0,245,212,0.4), transparent)",
      }}
    />
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "rgba(0, 245, 212, 0.1)",
        border: "1px solid rgba(0, 245, 212, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <Icon size={20} color="#00f5d4" />
    </div>
    <p
      style={{
        fontSize: 16,
        fontWeight: 600,
        color: "#f1f5f9",
        marginBottom: 10,
        margin: 0,
      }}
    >
      {title}
    </p>
    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
      {desc}
    </p>
  </div>
);

const StatItem = ({ value, label }) => (
  <div style={{ textAlign: "center" }}>
    <p
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: "#00f5d4",
        marginBottom: 4,
        margin: 0,
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: 11,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        margin: 0,
      }}
    >
      {label}
    </p>
  </div>
);

const LandingCore = () => {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setText(TYPING_TEXT.slice(0, i));
      i++;
      if (i > TYPING_TEXT.length) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", // horizontal center
        alignItems: "center", // vertical center (optional)
        width: "100%",
      }}
    >
      {/* LEFT SIDE: Square Hero Card */}

      <GlassCard style={{ width: "100%", maxWidth: 1200 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "auto",
          }}
        >
          {/* Badge & Icon */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,245,212,0.1)",
              border: "1px solid rgba(0,245,212,0.3)",
              color: "#00f5d4",
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 14px",
              borderRadius: 100,
              marginBottom: 20,
            }}
          >
            <Eye size={12} /> AI-powered git security
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
              background: "rgba(0,245,212,0.1)",
              borderRadius: 18,
              border: "1px solid rgba(0,245,212,0.2)",
              marginBottom: 20,
            }}
          >
            <ShieldCheck size={36} color="#00f5d4" />
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            {text}
            <span style={{ color: "#00f5d4" }}>|</span>
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "#94a3b8",
              lineHeight: 1.6,
              maxWidth: 400,
              marginBottom: 28,
            }}
          >
            Detect{" "}
            <span style={{ color: "#00f5d4", fontWeight: 600 }}>
              leaked secrets
            </span>{" "}
            and ship{" "}
            <span style={{ color: "#00f5d4", fontWeight: 600 }}>
              optimized Suggestions
            </span>
            .
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "#00f5d4",
                color: "#020617",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get started <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "transparent",
                color: "#e2e8f0",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Stats row footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: 15,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            marginTop: "auto",
          }}
        >
          {stats.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const LandingPage = () => (
  <>
    <StyleDefinitions />
    <BackgroundScanner>
      <LandingCore />
    </BackgroundScanner>
  </>
);

export default LandingPage;
