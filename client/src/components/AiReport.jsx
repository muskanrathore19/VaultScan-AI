/* eslint-disable no-useless-escape */

import { Bold } from "lucide-react";
import { useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseBoldInline(text) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ fontWeight: 600, color: "inherit" }}>
        {part}
      </strong>
    ) : part
  );
}

function extractExecutiveSummary(md) {
  const patterns = [
    /###\s*Task\s*\d+[:\s]*(?:Provide\s+)?Executive\s+Summary[\s\S]*?\n([\s\S]*?)(?=###|$)/i,
    /\*\*Executive Summary\*\*\s*\n+([\s\S]*?)(?=###|##|\*\*[A-Z]|$)/i,
    /Executive Summary\s*\n+([\s\S]*?)(?=###|$)/i,
  ];
  for (const p of patterns) {
    const m = md.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  const blocks = md.split(/\n{2,}/);
  const last = blocks[blocks.length - 1];
  if (last && last.length > 80 && !last.startsWith("#") && !last.startsWith("*"))
    return last.trim();
  return null;
}

function extractSection(md, labelRegex) {
  const p = new RegExp(
    `###\\s*(?:Task\\s*\\d+[:\\s]*)?${labelRegex}[\\s\\S]*?(?=###|$)`,
    "i"
  );
  const m = md.match(p);
  return m ? m[0] : null;
}

// function extractSeverity(md) {
//   // const m = md.match(/severity[^:]*:?\s*[\*_]*\s*(critical|high|medium|low|informational)/i);
//   const m = "critical"
//   if (!m) return null;
//   return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
// }

function extractMappings(md) {
  const results = [];
  const seen = new Set();
  const patterns = [
    /\*\*?(OWASP\s+[A-Z]\d+[^:*\n]*)\*?\*?:?\s*([^*\n]*)/gi,
    /\*\*?(CWE-\d+[^:*\n]*)\*?\*?:?\s*([^*\n]*)/gi,
  ];
  for (const p of patterns) {
    p.lastIndex = 0;
    let m;
    while ((m = p.exec(md)) !== null) {
      const code = m[1].trim();
      if (seen.has(code)) continue;
      seen.add(code);
      results.push({ code, desc: m[2]?.trim() || "" });
    }
  }
  return results;
}

function parseBodyItems(raw) {
  if (!raw) return [];
  const cleaned = raw
    .replace(/###\s*Task\s*\d+[:\s].*/gi, "")
    .replace(/###.*/g, "")
    .replace(/##.*/g, "")
    .trim();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];
  let proseAcc = [];
  for (const line of lines) {
    if (/^[\*\-]\s+/.test(line)) {
      if (proseAcc.length) { items.push({ type: "prose", text: proseAcc.join(" ") }); proseAcc = []; }
      items.push({ type: "bullet", text: line.replace(/^[\*\-]\s+/, "") });
    } else {
      proseAcc.push(line);
    }
  }
  if (proseAcc.length) items.push({ type: "prose", text: proseAcc.join(" ") });
  return items;
}

// ─── styles ─────────────────────────────────────────────────────────────────

const S = {
  root: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
  },
  severityRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  severityLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  badge: (sev) => {
    const map = {
      critical: { bg: "#fef2f2", color: "#7f1d1d", border: "#fca5a5" },
      high: { bg: "#fef2f2", color: "#7f1d1d", border: "#fca5a5" },
      medium: { bg: "#fffbeb", color: "#78350f", border: "#fcd34d" },
      low: { bg: "#f0fdf4", color: "#14532d", border: "#86efac" },
      informational: { bg: "#eff6ff", color: "#1e3a8a", border: "#93c5fd" },
    };
    const t = map[sev?.toLowerCase()] || { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      padding: "3px 10px",
      borderRadius: 6,
      border: `1px solid ${t.border}`,
      background: t.bg,
      color: t.color,
    };
  },
  execCard: {
    background: "#fff",
    border: "1px solid #fecaca",
    borderLeft: "4px solid #ef4444",
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 24,
  },
  execLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#dc2626",
    marginBottom: 8,
  },
  execText: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#1f2937",
    margin: 0,
  },
  divider: {
    height: 1,
    background: "#f3f4f6",
    margin: "4px 0 20px",
    border: "none",
  },
  sectionWrap: {
    marginBottom: 22,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 16,
    fontWeight: 900,
    color: "#ec0909",
    paddingBottom: 8,
    marginBottom: 10,
    borderBottom: "1px solid #f3f4f6",
    animation: "police-flash 2s infinite steps(1)"
  },

  prose: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#d5e4e5",
    marginBottom: 6,
    letterSpacing: 1
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: "4px 0 0",
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  bulletItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#d1d5db",
    marginTop: 9,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 1.75,
    color: "#dcdee2",
  },
  mappingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 8,
    marginTop: 2,
  },
  mappingPill: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
  },
  mappingCode: {
    fontFamily: "'SFMono-Regular', Consolas, monospace",
    fontSize: 12,
    fontWeight: 600,
    color: "#2563eb",
    marginBottom: 3,
  },
  mappingDesc: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.4,
    margin: 0,
  },
  empty: {
    textAlign: "center",
    padding: "32px 16px",
    color: "#9ca3af",
    fontSize: 13,
    border: "1px dashed #e5e7eb",
    borderRadius: 10,
  },
};

// ─── AiReport ───────────────────────────────────────────────────────────────

export default function AiReport({ data, sevr }) {
  const parsed = useMemo(() => {
    if (!data || typeof data !== "string" || !data.trim()) return null;
    const md = data;
    const owaspSection = extractSection(md, "(?:OWASP|CWE|Mappings)") || md;
    return {
      executive: extractExecutiveSummary(md),
      severity: sevr,
      issues: extractSection(md, "Detect Security Issues"),
      vulnerabilities: extractSection(md, "Explain Possible Vulnerabilities"),
      remediation: extractSection(md, "Suggest Remediation"),
      mappings: extractMappings(owaspSection),
    };
  }, [data, sevr]);

  if (!parsed) {
    return <div style={S.empty}>No report data. Pass a markdown string via the <code>data</code> prop.</div>;
  }

  const sections = [
    { icon: "🛡️", title: "Security Issues Detected", raw: parsed.issues },
    { icon: "🐛", title: "Possible Vulnerabilities", raw: parsed.vulnerabilities },
    { icon: "🔧", title: "Remediation Steps", raw: parsed.remediation },
  ];

  return (
    <div style={S.root}>

      {/* Severity badge */}
      {parsed.severity && (
        <div style={S.severityRow}>
          <span style={S.severityLabel}>Overall severity</span>
          <span style={S.badge(parsed.severity)}>⚠ {parsed.severity}</span>
        </div>
      )}

      {/* Executive Summary — always first */}
      {parsed.executive && (
        <div style={S.execCard}>
          <div style={S.execLabel}>Executive Summary</div>
          <p style={S.execText}>{parseBoldInline(parsed.executive)}</p>
        </div>
      )}

      <hr style={S.divider} />

      {/* Body sections */}
      {sections.map(({ icon, title, raw }) => {
        const items = parseBodyItems(raw);
        if (!items.length) return null;
        const bullets = items.filter((i) => i.type === "bullet");
        const prose = items.filter((i) => i.type === "prose");
        return (
          <div key={title} style={S.sectionWrap}>
            <div style={S.sectionHead}>
              <span style={S.sectionIcon}>{icon}</span>
              {title}
            </div>
            {prose.map((p, i) => (
              <p key={i} style={S.prose}>{parseBoldInline(p.text)}</p>
            ))}
            {bullets.length > 0 && (
              <ul style={S.bulletList}>
                {bullets.map((b, i) => (
                  <li key={i} style={S.bulletItem}>
                    <span style={S.bulletDot} />
                    <span style={S.bulletText}>{parseBoldInline(b.text)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {/* OWASP / CWE mappings */}
      {parsed.mappings.length > 0 && (
        <div style={S.sectionWrap}>
          <div style={S.sectionHead}>
            <span style={S.sectionIcon}>🏷️</span>
            OWASP / CWE Mappings
          </div>
          <div style={S.mappingGrid}>
            {parsed.mappings.map((m, i) => (
              <div key={i} style={S.mappingPill}>
                <div style={S.mappingCode}>{m.code}</div>
                {m.desc && <p style={S.mappingDesc}>{m.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
