import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RC } from '../utils/constants';

function generateReportHTML(contractText, risks, fileName) {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const score = risks.riskScore;
  const scoreColor = score > 70 ? "#C62828" : score > 40 ? "#E65100" : "#2E7D32";
  const counts = { high: 0, medium: 0, low: 0 };
  risks.risks?.forEach((r) => counts[r.level]++);

  const riskRows = risks.risks?.map((r) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-family:Georgia,serif;font-size:13px;color:#333">${r.title}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee">
        <span style="background:${RC[r.level].badge};color:${RC[r.level].text};padding:3px 9px;border-radius:4px;font-size:11px;font-weight:700;font-family:system-ui">${r.level.toUpperCase()}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-family:system-ui;font-size:11px;color:#666">${r.category}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-family:Georgia,serif;font-size:12px;color:#555;font-style:italic">"${r.quote}"</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-family:system-ui;font-size:12px;color:#444;line-height:1.5">${r.explanation}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>LEXSCAN Risk Report</title></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif">
<div style="max-width:900px;margin:40px auto;background:#fff;border:1px solid #ddd">
  <div style="background:#0D0F14;padding:36px 48px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="color:var(--accent-gold);font-size:22px;font-weight:700;letter-spacing:0.08em">LEXSCAN</div>
      <div style="color:var(--text-dim);font-size:11px;letter-spacing:0.15em;font-family:system-ui;margin-top:3px">AI CONTRACT RISK ANALYSIS REPORT</div>
    </div>
    <div style="text-align:right">
      <div style="color:var(--text-muted);font-size:12px;font-family:system-ui">${now}</div>
      <div style="color:var(--text-dim);font-size:11px;font-family:system-ui;margin-top:2px">${fileName || "Contract Analysis"}</div>
    </div>
  </div>
  <div style="padding:40px 48px">
    <div style="display:flex;gap:24px;margin-bottom:36px;align-items:stretch">
      <div style="flex:0 0 120px;background:#0D0F14;border-radius:10px;padding:24px;text-align:center">
        <div style="font-size:52px;font-weight:700;color:${scoreColor};line-height:1;font-family:system-ui">${score}</div>
        <div style="color:var(--text-dim);font-size:10px;letter-spacing:0.12em;font-family:system-ui;margin-top:6px">RISK SCORE</div>
      </div>
      <div style="flex:1;background:#f9f8f5;border-radius:10px;padding:20px 24px;border-left:3px solid ${scoreColor}">
        <div style="font-size:13px;color:#555;line-height:1.7;font-family:system-ui">${risks.summary}</div>
        <div style="display:flex;gap:20px;margin-top:16px">
          ${["high","medium","low"].map(l=>`<div style="text-align:center"><div style="font-size:22px;font-weight:700;color:${RC[l].dot};font-family:system-ui">${counts[l]}</div><div style="font-size:10px;color:#888;letter-spacing:0.1em;font-family:system-ui">${l.toUpperCase()}</div></div>`).join("")}
        </div>
      </div>
    </div>
    <h2 style="font-size:16px;color:#1a1a1a;letter-spacing:0.05em;margin-bottom:16px;border-bottom:2px solid var(--accent-gold);padding-bottom:8px">IDENTIFIED RISK CLAUSES</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:40px">
      <thead><tr style="background:#f0ede8">
        <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#555;font-family:system-ui">RISK</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#555;font-family:system-ui">LEVEL</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#555;font-family:system-ui">CATEGORY</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#555;font-family:system-ui">CLAUSE</th>
        <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#555;font-family:system-ui">EXPLANATION</th>
      </tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>
</div></body></html>`;
}


export default function RiskPanel({ loading, risks, counts, filterLevel, setFilterLevel, activeRisk, setActiveRisk, contractText, fileName }) {
  const downloadReport = () => {
    if(!risks) return;
    const html = generateReportHTML(contractText, risks, fileName);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const filtered = risks?.risks ? (filterLevel === "all" ? risks.risks : risks.risks.filter((r) => r.level === filterLevel)) : [];

  if (loading) {
    return (
      <div style={{ width: 340, overflowY: "auto", background: "var(--bg-main)", padding: "20px 16px" }}>
        {/* Filter pill skeletons */}
        <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 28 }} />)}
        </div>
        {/* Report button skeleton */}
        <div className="skeleton" style={{ height: 34, marginBottom: 16, borderRadius: 6 }} />
        {/* Summary card skeleton */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-main)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 10, width: '90%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '75%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '50%' }} />
        </div>
        {/* Risk card skeletons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "var(--bg-panel)", borderRadius: 8, padding: "10px 12px", borderLeft: "3px solid var(--border-light)" }}>
              <div className="skeleton" style={{ height: 11, width: `${60 + (i * 7) % 30}%`, marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 9, width: `${35 + (i * 11) % 25}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 340, overflowY: "auto", background: "var(--bg-main)", padding: "20px 16px" }}>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {["all","high","medium","low"].map((f) => (
          <button key={f} onClick={() => { setFilterLevel(f); setActiveRisk(null); }} style={{
            flex: 1, padding: "6px 4px",
            background: filterLevel === f ? (f === "all" ? "var(--accent-gold)" : RC[f]?.dot) : "var(--bg-panel)",
            color: filterLevel === f ? (f === "all" ? "var(--bg-main)" : "#fff") : "var(--text-dim)",
            border: `1px solid ${filterLevel === f ? "transparent" : "var(--bg-panel-hover)"}`,
            borderRadius: 6, cursor: "pointer",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'Inter', sans-serif",
            transition: "all 0.15s",
          }}>
            {f === "all" ? "ALL" : f.toUpperCase()}{f !== "all" && ` (${counts[f]})`}
          </button>
        ))}
      </div>
      
      {risks && (
          <button onClick={downloadReport} style={{ width: "100%", marginBottom: 16, background: "linear-gradient(135deg,var(--accent-gold),#7A5C10)", border: "none", color: "var(--bg-main)", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: "'Inter', sans-serif" }}>
            ↓ PRINT PDF REPORT
          </button>
      )}

      {/* Active detail card — Full actionable insight */}
      {activeRisk && (
        <div style={{
          background: "var(--bg-panel)",
          border: `1px solid ${RC[activeRisk.level].border}`,
          borderRadius: 10, padding: "16px", marginBottom: 14,
          boxShadow: `0 4px 24px ${RC[activeRisk.level].glow}`,
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Inter', sans-serif", marginBottom: 5 }}>{activeRisk.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, background: RC[activeRisk.level].border, color: "#fff", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.07em", fontFamily: "'Inter', sans-serif" }}>
                  {activeRisk.level.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>{activeRisk.category}</span>
                {activeRisk.clauseRef && <span style={{ fontSize: 10, color: "var(--accent-gold)", fontFamily: "'Inter', sans-serif" }}>{activeRisk.clauseRef}</span>}
              </div>
            </div>
            <button onClick={() => setActiveRisk(null)} style={{ background: "var(--bg-panel-hover)", border: "1px solid var(--border-main)", cursor: "pointer", color: "var(--text-dim)", fontSize: 14, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
          </div>

          {/* Contract quote */}
          <div style={{ background: RC[activeRisk.level].badge, borderLeft: `3px solid ${RC[activeRisk.level].border}`, borderRadius: "0 6px 6px 0", padding: "8px 10px", fontSize: 11, color: "#333", fontStyle: "italic", marginBottom: 10, lineHeight: 1.55, fontFamily: "Georgia,serif" }}>
            “{activeRisk.quote}”
          </div>

          {/* Why it's risky */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", color: "var(--text-dim)", fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>WHY IT’S RISKY</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{activeRisk.explanation}</div>
          </div>

          {/* Real-world impact */}
          {activeRisk.impact && (
            <div style={{ marginBottom: 10, background: "rgba(229,57,53,0.06)", border: "1px solid rgba(229,57,53,0.15)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", color: "#E53935", fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>⚠️ REAL-WORLD IMPACT</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{activeRisk.impact}</div>
            </div>
          )}

          {/* Suggested fix */}
          {activeRisk.suggestedFix && (
            <div style={{ marginBottom: 10, background: "rgba(67,160,71,0.06)", border: "1px solid rgba(67,160,71,0.2)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", color: "#43A047", fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>✅ SUGGESTED FIX</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{activeRisk.suggestedFix}</div>
            </div>
          )}

          {/* Confidence bar */}
          {activeRisk.confidence && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 9, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>AI CONFIDENCE</span>
              <div style={{ flex: 1, height: 4, background: "var(--bg-panel-hover)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(activeRisk.confidence * 100)}%`, background: `linear-gradient(90deg, ${RC[activeRisk.level].border}, ${RC[activeRisk.level].dot})`, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 9, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif", minWidth: 28 }}>{Math.round((activeRisk.confidence || 0) * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Risk list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <AnimatePresence mode='popLayout'>
          {filtered.map((risk) => {
            const c = RC[risk.level];
            const isActive = activeRisk?.id === risk.id;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                key={risk.id} onClick={() => setActiveRisk(isActive ? null : risk)} style={{
                background: isActive ? "var(--bg-panel-hover)" : "var(--bg-panel)",
                border: `1px solid ${isActive ? c.border : "var(--bg-panel-hover)"}`,
                borderLeft: `3px solid ${c.dot}`,
                borderRadius: 8, padding: "10px 12px",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Inter', sans-serif", lineHeight: 1.4, flex: 1, marginRight: 6 }}>{risk.title}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, background: c.dot, color: '#fff', padding: '2px 6px', borderRadius: 3, letterSpacing: "0.07em", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>{risk.level.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>{risk.category}{risk.clauseRef ? ` · ${risk.clauseRef}` : ''}</span>
                  {risk.confidence && (
                    <span style={{ fontSize: 9, color: c.dot, fontFamily: "'Inter', sans-serif", opacity: 0.8 }}>
                      {Math.round(risk.confidence * 100)}%
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
