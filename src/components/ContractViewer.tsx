import React, { useMemo } from 'react';
import { RC } from '../utils/constants';

export default function ContractViewer({ contractText, risks, activeRisk, setActiveRisk, filterLevel, loading, isMobile = false }) {
  const segments = useMemo(() => {
    if (!risks?.length || !contractText) return [{ text: contractText, highlighted: false, risk: null }];

    const filtered = filterLevel === "all" ? risks : risks.filter((r) => r.level === filterLevel);

    // ─── Normalization helpers ───
    // Level 1: Soft normalize — collapse whitespace, normalize quotes/dashes
    const softNorm = (s: string) => s
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")   // curly single quotes
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')   // curly double quotes
      .replace(/[\u2013\u2014\u2015]/g, '-')          // en/em dashes
      .replace(/[\u00A0\u202F\u2009]/g, ' ')          // non-breaking spaces
      .replace(/\s+/g, ' ')                            // collapse whitespace
      .toLowerCase()
      .trim();

    // Level 2: Hard normalize — strip all non-alphanumeric
    const hardNorm = (s: string) => softNorm(s).replace(/[^a-z0-9]/g, '');

    // Build soft-normalized version of contract with char mapping
    const buildNormMap = (text: string) => {
      const normalized: string[] = [];
      const map: number[] = []; // normalized index -> original index
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        // Skip duplicate spaces
        if (/\s/.test(ch)) {
          if (normalized.length === 0 || normalized[normalized.length - 1] !== ' ') {
            normalized.push(' ');
            map.push(i);
          }
        } else {
          normalized.push(ch.toLowerCase());
          map.push(i);
        }
      }
      return { normalized: normalized.join(''), map };
    };

    const { normalized: normContract, map: normMap } = buildNormMap(contractText);

    const findSpan = (quote: string): { start: number; end: number } | null => {
      const q = quote?.trim();
      if (!q || q.length < 6) return null;

      // 1. Exact match (fastest)
      let idx = contractText.indexOf(q);
      if (idx !== -1) return { start: idx, end: idx + q.length };

      // 2. Case-insensitive exact
      idx = contractText.toLowerCase().indexOf(q.toLowerCase());
      if (idx !== -1) return { start: idx, end: idx + q.length };

      // 3. Soft-normalized match (handles whitespace/quote/dash variants)
      const normQ = softNorm(q);
      idx = normContract.indexOf(normQ);
      if (idx !== -1) {
        const start = normMap[idx];
        const endNorm = Math.min(idx + normQ.length - 1, normMap.length - 1);
        const end = normMap[endNorm] + 1;
        return { start, end };
      }

      // 4. Hard-normalized match (handles OCR noise, punctuation errors)
      const hardQ = hardNorm(q);
      if (hardQ.length < 5) return null;
      const hardContract = hardNorm(contractText);
      idx = hardContract.indexOf(hardQ);
      if (idx !== -1) {
        // Map hard-normalized index back to original text
        // Walk original text, counting hard-norm chars
        let hardCounter = 0;
        let realStart = -1, realEnd = -1;
        for (let i = 0; i < contractText.length; i++) {
          const isAlnum = /[a-z0-9]/i.test(contractText[i]);
          if (isAlnum) {
            if (hardCounter === idx) realStart = i;
            if (hardCounter === idx + hardQ.length - 1) { realEnd = i + 1; break; }
            hardCounter++;
          }
        }
        if (realStart !== -1 && realEnd !== -1) return { start: realStart, end: realEnd };
      }

      // 5. Sliding-window partial match: try first 60% of words
      const words = q.split(/\s+/);
      if (words.length >= 5) {
        const partial = words.slice(0, Math.ceil(words.length * 0.65)).join(' ');
        const result = findSpan(partial);
        if (result) return result;
      }

      return null;
    };

    let matches: Array<{ start: number; end: number; risk: any }> = [];
    filtered.forEach(risk => {
      const span = findSpan(risk.quote);
      if (span) matches.push({ ...span, risk });
    });

    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first)
    const nonOverlapping: typeof matches = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    const segs: Array<{ text: string; highlighted: boolean; risk: any }> = [];
    let cursor = 0;
    for (const m of nonOverlapping) {
      if (m.start > cursor) segs.push({ text: contractText.slice(cursor, m.start), highlighted: false, risk: null });
      segs.push({ text: contractText.slice(m.start, m.end), highlighted: true, risk: m.risk });
      cursor = m.end;
    }
    if (cursor < contractText.length) segs.push({ text: contractText.slice(cursor), highlighted: false, risk: null });

    return segs;
  }, [contractText, risks, filterLevel]);

  // Count highlights per level for the legend
  const highlightCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    segments.forEach(s => { if (s.highlighted && s.risk?.level) c[s.risk.level]++; });
    return c;
  }, [segments]);

  const totalHighlights = highlightCounts.high + highlightCounts.medium + highlightCounts.low;

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Highlight legend bar */}
      {!loading && totalHighlights > 0 && (
        <div style={{ padding: '7px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-main)', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif", letterSpacing: '0.07em', fontWeight: 600 }}>
            {totalHighlights} FLAGGED
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['high','medium','low'] as const).filter(l => highlightCounts[l] > 0).map(l => (
              <button
                key={l}
                onClick={() => {/* could sync filter */}}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: "'Inter',sans-serif", color: RC[l].dot, fontWeight: 600, background: 'none', border: 'none', cursor: 'default', padding: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: RC[l].dot, display: 'inline-block' }} />
                {highlightCounts[l]} {l}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Inter',sans-serif" }}>Click highlighted text for details</span>
        </div>
      )}

      <div className="contract-viewer" style={{ padding: isMobile ? '16px 14px 40px' : '24px 28px 40px', fontSize: isMobile ? 13 : 13.5, lineHeight: isMobile ? 1.9 : 2.05, color: 'var(--text-main)', fontFamily: "'Lora', Georgia, serif", whiteSpace: 'pre-wrap', maxWidth: 820 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[100, 85, 95, 70, 90, 60, 80, 88, 75, 95, 65].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
            ))}
            <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4, marginTop: 8 }} />
            {[92, 78, 84, 88, 55].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
            ))}
          </div>
        ) : segments?.map((seg, i) => {
          if (!seg.highlighted) return <span key={i}>{seg.text}</span>;
          const c = RC[seg.risk.level];
          const isActive = activeRisk?.id === seg.risk.id;
          return (
            <mark
              key={i}
              data-level={seg.risk.level}
              className={isActive ? 'active' : ''}
              title={`${seg.risk.title} (➔ click for details)`}
              onClick={() => setActiveRisk(isActive ? null : seg.risk)}
              style={{
                background: isActive ? c.border : c.bg,
                color: isActive ? '#fff' : 'var(--text-main)',
                borderBottom: `2.5px solid ${c.border}`,
                borderRadius: 3,
                padding: '1px 2px',
                cursor: 'pointer',
                boxShadow: isActive ? `0 2px 10px ${c.glow}` : undefined,
              }}>
              {seg.text}<sup style={{
                fontSize: 8, marginLeft: 1,
                background: isActive ? 'rgba(255,255,255,0.3)' : c.border,
                color: '#fff',
                borderRadius: 3, padding: '0px 3px', fontFamily: 'system-ui',
                fontWeight: 700, verticalAlign: 'super', lineHeight: 1,
              }}>{seg.risk.level[0].toUpperCase()}</sup>
            </mark>
          );
        })}
      </div>
    </div>
  );
}
