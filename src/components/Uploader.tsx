import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SAMPLE_CONTRACT } from '../utils/constants';

export default function Uploader({ contractText, setContractText, fileName, setFileName, analyze, loading, extractText }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e) => {
    e.preventDefault(); 
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await extractText(file);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-gold)", fontFamily: "'Inter', sans-serif", marginBottom: 14 }}>POWERED BY AI</div>
        <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Spot Hidden Risks<br /><em style={{ color: "var(--accent-gold)" }}>Before You Sign</em>
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, fontFamily: "'Inter', sans-serif", maxWidth: 480, margin: "0 auto" }}>
          Upload your contract (PDF, DOCX, TXT, PNG, or JPG), get an instant AI risk analysis, interactive clause highlighting, and ask questions in plain English.
        </p>
      </div>

      {/* Drop zone */}
      <motion.div
        layout
        whileHover={{ scale: 1.015, borderColor: 'var(--accent-gold)', backgroundColor: 'rgba(200,169,110,0.06)' }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent-gold)" : "var(--border-light)"}`,
          borderRadius: 12, padding: "36px 24px", textAlign: "center",
          cursor: "pointer", marginBottom: 20,
          background: dragOver ? "rgba(200,169,110,0.05)" : "transparent",
        }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
        <div style={{ color: "var(--accent-gold)", fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: 6 }}>
          Drop your contract here
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>PDF · DOCX · TXT · PNG · JPG &nbsp;·&nbsp; or click to browse</div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" onChange={(e) => e.target.files[0] && extractText(e.target.files[0])} style={{ display: "none" }} />
      </motion.div>

      {fileName && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--accent-gold)", fontFamily: "'Inter', sans-serif" }}>📎 {fileName}</span>
          <button onClick={() => { setFileName(""); setContractText(""); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Text area */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-main)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-main)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>CONTRACT TEXT</span>
          <button onClick={() => { setContractText(SAMPLE_CONTRACT); setFileName("sample_contract.txt"); }}
            style={{ background: "none", border: "1px solid var(--border-light)", color: "var(--text-muted)", padding: "4px 11px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "'Inter', sans-serif" }}>
            Load Sample
          </button>
        </div>
        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          placeholder="Or paste your contract text directly here…"
          style={{
            width: "100%", minHeight: 280, background: "transparent", border: "none",
            color: "var(--text-main)", padding: "18px", fontSize: 13, lineHeight: 1.85, resize: "vertical",
            outline: "none", boxSizing: "border-box", fontFamily: "Georgia,serif",
          }}
        />
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border-main)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>
            {contractText ? `${contractText.split(/\s+/).filter(Boolean).length} words` : ""}
          </span>
          <button onClick={analyze} disabled={!contractText.trim() || loading}
            style={{
              background: !contractText.trim() || loading ? "var(--bg-panel-hover)" : "linear-gradient(135deg,var(--accent-gold),var(--accent-gold-dark))",
              color: !contractText.trim() || loading ? "var(--text-dim)" : "var(--bg-main)",
              border: "none", padding: "11px 26px", borderRadius: 7,
              cursor: !contractText.trim() || loading ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", fontFamily: "'Inter', sans-serif",
              transition: "all 0.2s",
            }}>
            {loading ? "⏳  ANALYZING…" : "ANALYZE RISKS →"}
          </button>
        </div>
      </div>
    </div>
  );
}
