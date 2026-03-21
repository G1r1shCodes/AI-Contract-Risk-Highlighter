import React, { useRef, useState } from 'react';
import { SAMPLE_CONTRACT } from '../utils/constants';

export default function Uploader({ contractText, setContractText, fileName, setFileName, analyze, loading, extractText }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleDrop = async (e) => {
    e.preventDefault(); 
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await extractText(file);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#C8A96E", fontFamily: "system-ui", marginBottom: 14 }}>POWERED BY AI</div>
        <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Spot Hidden Risks<br /><em style={{ color: "#C8A96E" }}>Before You Sign</em>
        </h1>
        <p style={{ color: "#6B6F7A", fontSize: 14, lineHeight: 1.7, fontFamily: "system-ui", maxWidth: 480, margin: "0 auto" }}>
          Upload your contract (PDF, DOCX, or TXT), get an instant AI risk analysis, interactive clause highlighting, and ask questions in plain English.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#C8A96E" : "#2A2D38"}`,
          borderRadius: 12, padding: "36px 24px", textAlign: "center",
          cursor: "pointer", marginBottom: 20, transition: "all 0.2s",
          background: dragOver ? "rgba(200,169,110,0.05)" : "transparent",
        }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
        <div style={{ color: "#C8A96E", fontSize: 14, fontFamily: "system-ui", fontWeight: 600, marginBottom: 6 }}>
          Drop your contract here
        </div>
        <div style={{ color: "#555A6A", fontSize: 12, fontFamily: "system-ui" }}>PDF · DOCX · TXT &nbsp;·&nbsp; or click to browse</div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => e.target.files[0] && extractText(e.target.files[0])} style={{ display: "none" }} />
      </div>

      {fileName && (
        <div style={{ background: "#13161D", border: "1px solid #2A2D38", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#C8A96E", fontFamily: "system-ui" }}>📎 {fileName}</span>
          <button onClick={() => { setFileName(""); setContractText(""); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Text area */}
      <div style={{ background: "#13161D", border: "1px solid #222530", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #222530", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555A6A", letterSpacing: "0.1em", fontFamily: "system-ui" }}>CONTRACT TEXT</span>
          <button onClick={() => { setContractText(SAMPLE_CONTRACT); setFileName("sample_contract.txt"); }}
            style={{ background: "none", border: "1px solid #2A2D38", color: "#9A9DB0", padding: "4px 11px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "system-ui" }}>
            Load Sample
          </button>
        </div>
        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          placeholder="Or paste your contract text directly here…"
          style={{
            width: "100%", minHeight: 280, background: "transparent", border: "none",
            color: "#C8C4BC", padding: "18px", fontSize: 13, lineHeight: 1.85, resize: "vertical",
            outline: "none", boxSizing: "border-box", fontFamily: "Georgia,serif",
          }}
        />
        <div style={{ padding: "12px 18px", borderTop: "1px solid #222530", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#44475A", fontFamily: "system-ui" }}>
            {contractText ? `${contractText.split(/\s+/).filter(Boolean).length} words` : ""}
          </span>
          <button onClick={analyze} disabled={!contractText.trim() || loading}
            style={{
              background: !contractText.trim() || loading ? "#1E2028" : "linear-gradient(135deg,#C8A96E,#8B6914)",
              color: !contractText.trim() || loading ? "#555A6A" : "#0B0D12",
              border: "none", padding: "11px 26px", borderRadius: 7,
              cursor: !contractText.trim() || loading ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", fontFamily: "system-ui",
              transition: "all 0.2s",
            }}>
            {loading ? "⏳  ANALYZING…" : "ANALYZE RISKS →"}
          </button>
        </div>
      </div>
    </div>
  );
}
