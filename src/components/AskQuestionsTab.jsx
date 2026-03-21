import React, { useRef, useEffect } from 'react';

export default function AskQuestionsTab({ qaMessages, qaInput, setQaInput, qaLoading, askQuestion }) {
  const chatRef = useRef();

  useEffect(() => { 
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); 
  }, [qaMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)" }}>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
        {qaMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#444750" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 13, fontFamily: "system-ui", lineHeight: 1.6 }}>
              Ask anything about this contract.<br />
              <span style={{ color: "#555A6A", fontSize: 12 }}>e.g. "What are the payment terms?" · "Is the termination clause fair?" · "What are my IP rights?"</span>
            </div>
          </div>
        )}
        {qaMessages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "82%",
            background: m.role === "user" ? "linear-gradient(135deg,#C8A96E,#8B6914)" : "#13161D",
            color: m.role === "user" ? "#0B0D12" : "#C8C4BC",
            border: m.role === "user" ? "none" : "1px solid #222530",
            borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            padding: "12px 16px",
            fontSize: 13, lineHeight: 1.65, fontFamily: m.role === "user" ? "system-ui" : "Georgia,serif",
          }}>{m.content}</div>
        ))}
        {qaLoading && (
          <div style={{ alignSelf: "flex-start", background: "#13161D", border: "1px solid #222530", borderRadius: "12px 12px 12px 2px", padding: "12px 18px", fontFamily: "system-ui", fontSize: 12, color: "#555A6A" }}>
            Analyzing…
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #1E2028" }}>
        <input
          value={qaInput}
          onChange={(e) => setQaInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askQuestion()}
          placeholder="Ask a question about this contract…"
          style={{
            flex: 1, background: "#13161D", border: "1px solid #222530",
            borderRadius: 8, padding: "11px 16px", color: "#C8C4BC",
            fontSize: 13, fontFamily: "system-ui", outline: "none",
          }}
        />
        <button onClick={askQuestion} disabled={!qaInput.trim() || qaLoading}
          style={{
            background: !qaInput.trim() || qaLoading ? "#1E2028" : "linear-gradient(135deg,#C8A96E,#8B6914)",
            color: !qaInput.trim() || qaLoading ? "#555A6A" : "#0B0D12",
            border: "none", borderRadius: 8, padding: "11px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "system-ui",
          }}>→</button>
      </div>
    </div>
  );
}
