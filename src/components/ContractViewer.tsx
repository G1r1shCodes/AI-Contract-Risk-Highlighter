import React, { useMemo } from 'react';
import { RC } from '../utils/constants';

export default function ContractViewer({ contractText, risks, activeRisk, setActiveRisk, filterLevel, loading }) {
  const segments = useMemo(() => {
    if (!risks?.length || !contractText) return [{ text: contractText, highlighted: false, risk: null }];
    
    const filtered = filterLevel === "all" ? risks : risks.filter((r) => r.level === filterLevel);
    
    let matches = [];
    
    filtered.forEach(risk => {
      const quote = risk.quote?.trim();
      if (!quote || quote.length < 8) return;
      
      let exactIdx = contractText.indexOf(quote);
      if (exactIdx !== -1) {
        matches.push({ start: exactIdx, end: exactIdx + quote.length, risk });
      } else {
         // Advanced Normalization Matching Fallback (Fuzzy alignment)
         const normalize = s => s.replace(/[\s\W_]+/g, '').toLowerCase();
         const normText = normalize(contractText);
         const normQuote = normalize(quote);
         const normIdx = normText.indexOf(normQuote);
         
         if (normIdx !== -1) {
           let normCounter = 0;
           let realStart = -1, realEnd = -1;
           for(let i=0; i<contractText.length; i++) {
              if(!/[\s\W_]/.test(contractText[i])) {
                if(normCounter === normIdx) realStart = i;
                if(normCounter === normIdx + normQuote.length - 1) {
                   realEnd = i + 1;
                   break;
                }
                normCounter++;
              }
           }
           if (realStart !== -1 && realEnd !== -1) {
              matches.push({ start: realStart, end: realEnd, risk });
           }
         }
      }
    });

    matches.sort((a,b) => a.start - b.start);
    
    let nonOverlapping = [];
    let lastEnd = 0;
    for (let m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    let segs = [];
    let cursor = 0;
    for (let m of nonOverlapping) {
      if (m.start > cursor) {
        segs.push({ text: contractText.slice(cursor, m.start), highlighted: false, risk: null });
      }
      segs.push({ text: contractText.slice(m.start, m.end), highlighted: true, risk: m.risk });
      cursor = m.end;
    }
    if (cursor < contractText.length) {
      segs.push({ text: contractText.slice(cursor), highlighted: false, risk: null });
    }
    
    return segs;
  }, [contractText, risks, filterLevel]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", borderRight: "1px solid var(--border-main)" }}>
      <div style={{ fontSize: 13.5, lineHeight: 2, color: "var(--text-main)", fontFamily: "Georgia,serif", whiteSpace: "pre-wrap" }}>
        {loading ? (
             <div style={{ color: 'var(--text-dim)' }}>AI is extracting contract intelligence...</div>
        ) : segments?.map((seg, i) => {
          if (!seg.highlighted) return <span key={i}>{seg.text}</span>;
          const c = RC[seg.risk.level];
          const isActive = activeRisk?.id === seg.risk.id;
          return (
            <mark key={i} onClick={() => setActiveRisk(isActive ? null : seg.risk)}
              style={{
                background: isActive ? c.border : c.bg,
                color: isActive ? "#fff" : "#111",
                borderBottom: `2px solid ${c.border}`,
                borderRadius: 3, padding: "1px 3px",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              {seg.text}
              <sup style={{
                fontSize: 9, marginLeft: 2,
                background: c.border, color: "#fff",
                borderRadius: 3, padding: "1px 4px", fontFamily: "system-ui",
              }}>{seg.risk.level[0].toUpperCase()}</sup>
            </mark>
          );
        })}
      </div>
    </div>
  );
}
