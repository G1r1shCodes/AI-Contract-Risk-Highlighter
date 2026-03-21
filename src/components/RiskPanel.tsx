import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RC } from '../utils/constants';

const LEVEL_COLORS = {
  high:   { badge: '#FFEBEE', text: '#B71C1C', border: '#E53935', dot: '#E53935' },
  medium: { badge: '#FFF3E0', text: '#E65100', border: '#FB8C00', dot: '#FB8C00' },
  low:    { badge: '#E3F2FD', text: '#0D47A1', border: '#1E88E5', dot: '#1E88E5' },
};

function generateReportHTML(contractText: string, risks: any, fileName: string) {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const score = risks.riskScore;
  const scoreColor = score > 70 ? "#C62828" : score > 40 ? "#E65100" : "#2E7D32";
  const counts: any = { high: 0, medium: 0, low: 0 };
  risks.risks?.forEach((r: any) => { if (counts[r.level] !== undefined) counts[r.level]++; });

  const riskRows = risks.risks?.map((r: any, idx: number) => {
    const lc = LEVEL_COLORS[r.level] || LEVEL_COLORS.low;
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafaf8';
    const impactRow = r.impact ? `<tr><td colspan="2" style="padding:0 14px 10px;font-family:system-ui;font-size:11px;color:#555;background:${rowBg}"><strong style="color:#C62828">&#9888; Impact:</strong> ${r.impact}</td><td colspan="3" style="background:${rowBg}"></td></tr>` : '';
    const fixRow = r.suggestedFix ? `<tr><td colspan="2" style="padding:0 14px 12px;font-family:system-ui;font-size:11px;color:#555;background:${rowBg}"><strong style="color:#2E7D32">&#10003; Suggested fix:</strong> ${r.suggestedFix}</td><td colspan="3" style="background:${rowBg}"></td></tr>` : '';
    return `
    <tr style="background:${rowBg}">
      <td style="padding:12px 14px 4px;border-top:1px solid #eee;font-family:system-ui;font-size:13px;font-weight:600;color:#1a1a1a">${r.title}</td>
      <td style="padding:12px 14px 4px;border-top:1px solid #eee;white-space:nowrap;vertical-align:top">
        <span style="background:${lc.badge};color:${lc.text};border:1px solid ${lc.border}33;padding:3px 9px;border-radius:4px;font-size:11px;font-weight:700;font-family:system-ui">${r.level.toUpperCase()}</span>
      </td>
      <td style="padding:12px 14px 4px;border-top:1px solid #eee;font-family:system-ui;font-size:11px;color:#666;white-space:nowrap;vertical-align:top">${r.category}${r.clauseRef ? ` &middot; ${r.clauseRef}` : ''}</td>
      <td style="padding:12px 14px 4px;border-top:1px solid #eee;font-family:Georgia,serif;font-size:11.5px;color:#555;font-style:italic;line-height:1.55;vertical-align:top">&ldquo;${r.quote}&rdquo;</td>
      <td style="padding:12px 14px 4px;border-top:1px solid #eee;font-family:system-ui;font-size:12px;color:#444;line-height:1.55;vertical-align:top">${r.explanation}</td>
    </tr>${impactRow}${fixRow}`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>LexScan &mdash; ${fileName || 'Contract'} Risk Report</title>
<style>
  @media print { body{margin:0} .no-print{display:none!important} tr{page-break-inside:avoid} }
  body{font-family:Georgia,serif;background:#f7f6f2;margin:0;padding:32px 0}
  .wrap{max-width:960px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)}
</style>
</head>
<body>
<div class="wrap">
  <div style="background:#0D0F14;padding:26px 44px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="color:#C8A96E;font-size:20px;font-weight:700;letter-spacing:0.1em;font-family:system-ui">LEXSCAN</div>
      <div style="color:#555A6A;font-size:10px;letter-spacing:0.18em;font-family:system-ui;margin-top:3px">AI CONTRACT RISK ANALYSIS REPORT</div>
    </div>
    <div style="text-align:right">
      <div style="color:#9A9DB0;font-size:12px;font-family:system-ui">${now}</div>
      <div style="color:#555A6A;font-size:11px;font-family:system-ui;margin-top:2px">${fileName || 'Contract Analysis'}</div>
    </div>
  </div>
  <div style="padding:28px 44px;border-bottom:1px solid #eee">
    <div style="display:flex;gap:20px;align-items:stretch">
      <div style="flex:0 0 100px;border:2px solid ${scoreColor};border-radius:10px;padding:16px;text-align:center">
        <div style="font-size:44px;font-weight:700;color:${scoreColor};line-height:1;font-family:system-ui">${score}</div>
        <div style="color:#888;font-size:10px;letter-spacing:0.12em;font-family:system-ui;margin-top:5px">RISK SCORE</div>
      </div>
      <div style="flex:1;background:#f9f8f5;border-radius:10px;padding:18px 22px;border-left:3px solid ${scoreColor}">
        <div style="font-size:13px;color:#444;line-height:1.75;font-family:system-ui">${risks.summary}</div>
        <div style="display:flex;gap:22px;margin-top:14px">
          ${["high","medium","low"].map(l => `<div style="text-align:center"><div style="font-size:22px;font-weight:700;color:${LEVEL_COLORS[l].dot};font-family:system-ui">${counts[l]}</div><div style="font-size:9px;color:#999;letter-spacing:0.1em;font-family:system-ui;margin-top:2px">${l.toUpperCase()}</div></div>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <div style="padding:28px 44px">
    <h2 style="font-size:13px;color:#1a1a1a;letter-spacing:0.07em;margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid #C8A96E;font-family:system-ui">IDENTIFIED RISK CLAUSES</h2>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f0ede8">
        <th style="padding:9px 14px;text-align:left;font-size:10px;letter-spacing:0.08em;color:#666;font-family:system-ui">RISK</th>
        <th style="padding:9px 14px;text-align:left;font-size:10px;letter-spacing:0.08em;color:#666;font-family:system-ui">LEVEL</th>
        <th style="padding:9px 14px;text-align:left;font-size:10px;letter-spacing:0.08em;color:#666;font-family:system-ui">CATEGORY</th>
        <th style="padding:9px 14px;text-align:left;font-size:10px;letter-spacing:0.08em;color:#666;font-family:system-ui">CLAUSE</th>
        <th style="padding:9px 14px;text-align:left;font-size:10px;letter-spacing:0.08em;color:#666;font-family:system-ui">EXPLANATION</th>
      </tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>
  <div style="padding:14px 44px 24px;border-top:1px solid #eee;text-align:center;font-family:system-ui;font-size:11px;color:#bbb">
    Generated by LexScan AI &mdash; For informational purposes only. Not a substitute for qualified legal advice.
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:20px;padding-bottom:32px">
  <button onclick="window.print()" style="background:#C8A96E;color:#0D0F14;border:none;padding:10px 28px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.05em;font-family:system-ui">
    PRINT / SAVE AS PDF
  </button>
</div>
</body></html>`;
}

export default function RiskPanel({ loading, risks, counts, filterLevel, setFilterLevel, activeRisk, setActiveRisk, contractText, fileName }) {
  const downloadReport = () => {
    if (!risks) return;
    const html = generateReportHTML(contractText, risks, fileName);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const filtered = risks?.risks
    ? filterLevel === "all" ? risks.risks : risks.risks.filter((r: any) => r.level === filterLevel)
    : [];

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ width: 320, flexShrink: 0, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)' }}>
          <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 26, borderRadius: 6 }} />)}
          </div>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)' }}>
          <div className="skeleton" style={{ height: 32, borderRadius: 6 }} />
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ background: 'var(--bg-main)', borderRadius: 8, padding: '11px 12px', borderLeft: '3px solid var(--border-light)' }}>
              <div className="skeleton" style={{ height: 11, width: `${55 + (i * 8) % 32}%`, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 9, width: `${30 + (i * 9) % 22}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 320, flexShrink: 0, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Panel header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.12em', fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>RISK FINDINGS</div>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'high', 'medium', 'low'] as const).map((f) => {
            const isActive = filterLevel === f;
            const color = f === 'all' ? 'var(--accent-gold)' : RC[f]?.dot;
            return (
              <button
                key={f}
                onClick={() => { setFilterLevel(f); setActiveRisk(null); }}
                style={{
                  flex: 1, padding: '5px 2px',
                  background: isActive ? (f === 'all' ? 'var(--accent-gold)' : RC[f]?.dot) : 'var(--bg-main)',
                  color: isActive ? (f === 'all' ? 'var(--bg-main)' : '#fff') : 'var(--text-dim)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-main)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                  fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
                }}>
                {f === 'all' ? 'ALL' : f.toUpperCase()}
                {f !== 'all' && <span style={{ opacity: 0.8 }}> {counts[f]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report button */}
      {risks && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-main)', flexShrink: 0 }}>
          <button
            onClick={downloadReport}
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gold)'; e.currentTarget.style.color = 'var(--bg-main)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent-gold)'; }}>
            <span>&#11015;</span> EXPORT PDF REPORT
          </button>
        </div>
      )}

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* Active detail card */}
        <AnimatePresence>
          {activeRisk && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'var(--bg-main)',
                border: `1px solid ${RC[activeRisk.level].border}`,
                borderRadius: 10, padding: '14px', marginBottom: 12,
                boxShadow: `0 4px 20px ${RC[activeRisk.level].glow}`,
              }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'Inter',sans-serif", lineHeight: 1.4, marginBottom: 6 }}>{activeRisk.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: RC[activeRisk.level].border, color: '#fff', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.07em', fontFamily: "'Inter',sans-serif" }}>
                      {activeRisk.level.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif" }}>{activeRisk.category}</span>
                    {activeRisk.clauseRef && (
                      <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{activeRisk.clauseRef}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveRisk(null)}
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-main)', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  &#215;
                </button>
              </div>

              {/* Quote */}
              <div style={{ background: RC[activeRisk.level].badge, borderLeft: `3px solid ${RC[activeRisk.level].border}`, borderRadius: '0 6px 6px 0', padding: '7px 10px', fontSize: 11, color: '#333', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.55, fontFamily: "'Lora', Georgia, serif" }}>
                &ldquo;{activeRisk.quote}&rdquo;
              </div>

              {/* Why risky */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif", marginBottom: 4 }}>WHY IT&apos;S RISKY</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>{activeRisk.explanation}</div>
              </div>

              {/* Impact */}
              {activeRisk.impact && (
                <div style={{ marginBottom: 8, background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.15)', borderRadius: 6, padding: '7px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: '#C62828', fontFamily: "'Inter',sans-serif", marginBottom: 3 }}>&#9888;&#65039; REAL-WORLD IMPACT</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>{activeRisk.impact}</div>
                </div>
              )}

              {/* Fix */}
              {activeRisk.suggestedFix && (
                <div style={{ marginBottom: 8, background: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.18)', borderRadius: 6, padding: '7px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: '#2E7D32', fontFamily: "'Inter',sans-serif", marginBottom: 3 }}>&#10003; SUGGESTED FIX</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>{activeRisk.suggestedFix}</div>
                </div>
              )}

              {/* Confidence */}
              {activeRisk.confidence && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif", letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>AI CONFIDENCE</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--border-main)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(activeRisk.confidence * 100)}%`, background: RC[activeRisk.level].border, borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif", minWidth: 26, textAlign: 'right' }}>{Math.round(activeRisk.confidence * 100)}%</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Risk list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((risk: any) => {
              const c = RC[risk.level];
              const isActive = activeRisk?.id === risk.id;
              return (
                <motion.div
                  key={risk.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 130 }}
                  onClick={() => setActiveRisk(isActive ? null : risk)}
                  style={{
                    background: isActive ? 'var(--bg-panel-hover)' : 'var(--bg-main)',
                    border: `1px solid ${isActive ? c.border : 'var(--border-main)'}`,
                    borderLeft: `3px solid ${c.dot}`,
                    borderRadius: 8, padding: '10px 12px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', fontFamily: "'Inter',sans-serif", lineHeight: 1.4, flex: 1, marginRight: 8 }}>
                      {risk.title}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, background: c.dot, color: '#fff', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.07em', fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
                      {risk.level.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif" }}>
                      {risk.category}{risk.clauseRef ? ` \u00b7 ${risk.clauseRef}` : ''}
                    </span>
                    {risk.confidence && (
                      <span style={{ fontSize: 9, color: c.dot, fontFamily: "'Inter',sans-serif", opacity: 0.75 }}>
                        {Math.round(risk.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && !loading && risks?.risks?.length > 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif" }}>
              No {filterLevel} risks found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
