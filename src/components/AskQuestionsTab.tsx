import React, { useRef, useEffect } from 'react';

export default function AskQuestionsTab({ qaMessages, qaInput, setQaInput, qaLoading, askQuestion }) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [qaMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)" }}>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
        {qaMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              Ask anything about this contract.<br />
              <span style={{ color: "var(--text-dim)", fontSize: 12 }}>e.g. "What are the payment terms?" · "Is the termination clause fair?" · "What are my IP rights?"</span>
            </div>
          </div>
        )}
        {qaMessages.map((m: any, i: number) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "82%",
            background: m.role === "user" ? "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(139,105,20,0.05))" : "rgba(30,32,40,0.4)",
            color: m.role === "user" ? "var(--text-main)" : "var(--text-main)",
            border: `1px solid ${m.role === "user" ? "rgba(200,169,110,0.3)" : "var(--glass-border)"}`,
            borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "12px 18px",
            fontSize: 13, lineHeight: 1.65, fontFamily: "'Inter', sans-serif",
            boxShadow: m.role === "user" ? "0 8px 32px rgba(200,169,110,0.05)" : "0 4px 16px rgba(0,0,0,0.2)"
          }}>{m.content}</div>
        ))}
        {qaLoading && (
          <div style={{ alignSelf: "flex-start", background: "var(--bg-panel)", border: "1px solid var(--border-main)", borderRadius: "12px 12px 12px 2px", padding: "12px 18px", fontFamily: "'Inter', sans-serif", fontSize: 12, color: "var(--text-dim)" }}>
            Analyzing…
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--bg-panel-hover)" }}>
        <input
          value={qaInput}
          onChange={(e) => setQaInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askQuestion()}
          placeholder="Ask a question about this contract…"
          style={{
            flex: 1, background: "var(--bg-panel)", border: "1px solid var(--border-main)",
            borderRadius: 8, padding: "11px 16px", color: "var(--text-main)",
            fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none",
          }}
        />
        <button onClick={askQuestion} disabled={!qaInput.trim() || qaLoading}
          style={{
            background: !qaInput.trim() || qaLoading ? "var(--bg-panel-hover)" : "linear-gradient(135deg,var(--accent-gold),var(--accent-gold-dark))",
            color: !qaInput.trim() || qaLoading ? "var(--text-dim)" : "var(--bg-main)",
            border: "none", borderRadius: 8, padding: "11px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif",
          }}>→</button>
      </div>
    </div>
  );
}
