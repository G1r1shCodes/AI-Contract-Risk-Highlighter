import React, { useRef, useEffect, useMemo } from 'react';

// Renders markdown-lite: bold, italic, newlines
function MessageContent({ content, streaming }: { content: string; streaming?: boolean }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
      {streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent-gold)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.7s step-end infinite' }} />}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  );
}

const STATIC_SUGGESTIONS = [
  "What are my payment obligations and timelines?",
  "Can I terminate this contract early, and what are the penalties?",
  "Who owns the intellectual property created under this agreement?",
  "What happens if there's a dispute — can I go to court?",
  "Am I personally liable if something goes wrong?",
  "What are my confidentiality obligations after the contract ends?",
];

export default function AskQuestionsTab({ qaMessages, qaInput, setQaInput, qaLoading, askQuestion, risks = [], isMobile = false }) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [qaMessages]);

  // Generate context-aware suggested questions from detected risks
  const suggestedQuestions = useMemo(() => {
    if (!risks.length) return STATIC_SUGGESTIONS.slice(0, 4);
    const dynamic: string[] = [];
    risks.slice(0, 4).forEach(r => {
      if (r.category === 'Payment') dynamic.push(`What exactly are the payment terms in Section ${r.clauseRef || 'for payments'}?`);
      else if (r.category === 'IP') dynamic.push(`Do I keep any rights to my pre-existing IP under this agreement?`);
      else if (r.category === 'Termination') dynamic.push(`What notice or compensation do I get if the contract is terminated?`);
      else if (r.category === 'Liability') dynamic.push(`How much am I liable for if something goes wrong?`);
      else if (r.category === 'Arbitration') dynamic.push(`Can I take a dispute to court, or am I forced into arbitration?`);
      else if (r.category === 'Indemnity') dynamic.push(`What exactly does the indemnification clause require me to cover?`);
      else if (r.category === 'Confidentiality') dynamic.push(`How long do my confidentiality obligations last after the contract ends?`);
      else dynamic.push(`Explain the risk in: "${r.title}"`);
    });
    // Fill remaining slots with static questions not already covered
    const remaining = STATIC_SUGGESTIONS.filter(s => !dynamic.some(d => d.slice(0,20) === s.slice(0,20)));
    return [...dynamic, ...remaining].slice(0, 6);
  }, [risks]);

  const hasMessages = qaMessages.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: isMobile ? undefined : "calc(100vh - 280px)", padding: isMobile ? "0 14px 16px" : "0 36px 20px", overflow: isMobile ? "hidden" : undefined }}>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        
        {/* Empty state with suggested questions */}
        {!hasMessages && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>⚖️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>Ask LexScan AI</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                Answers are grounded in your contract text. No hallucinations, no guesses.
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 10 }}>SUGGESTED QUESTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => askQuestion(q)}
                  disabled={qaLoading}
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-main)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    color: "var(--text-muted)",
                    fontSize: 11.5,
                    fontFamily: "'Inter', sans-serif",
                    cursor: "pointer",
                    textAlign: "left",
                    lineHeight: 1.5,
                    transition: "all 0.15s",
                    opacity: qaLoading ? 0.5 : 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)', e.currentTarget.style.color = 'var(--accent-gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-main)', e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <span style={{ marginRight: 6, opacity: 0.5 }}>→</span>{q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {qaMessages.map((m: any, i: number) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "84%",
            background: m.role === "user"
              ? "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(139,105,20,0.05))"
              : "var(--bg-panel)",
            border: `1px solid ${m.role === "user" ? "rgba(200,169,110,0.3)" : "var(--glass-border)"}`,
            borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
            padding: "12px 16px",
            fontSize: 13, lineHeight: 1.7, fontFamily: "'Inter', sans-serif",
            color: "var(--text-main)",
          }}>
            {m.role === "assistant" && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-gold)", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>LEXSCAN AI</div>
            )}
            {m.content ? (
              <MessageContent content={m.content} streaming={m.streaming} />
            ) : (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Thinking<span style={{ animation: 'blink 1s step-end infinite' }}>...</span></span>
            )}
          </div>
        ))}
      </div>

      {/* Suggested follow-ups after first response */}
      {hasMessages && !qaLoading && qaMessages[qaMessages.length - 1]?.role === 'assistant' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {['Explain that in simpler terms', 'What should I negotiate?', 'Is this standard practice?'].map((q, i) => (
            <button key={i} onClick={() => askQuestion(q)}
              style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border-main)',
                borderRadius: 20, padding: '5px 12px', fontSize: 11,
                color: 'var(--text-dim)', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)', e.currentTarget.style.color = 'var(--accent-gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-main)', e.currentTarget.style.color = 'var(--text-dim)')}
            >{q}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--bg-panel-hover)" }}>
        <input
          value={qaInput}
          onChange={(e) => setQaInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askQuestion()}
          placeholder={qaLoading ? "LexScan AI is responding…" : "Ask a question about this contract…"}
          disabled={qaLoading}
          style={{
            flex: 1, background: "var(--bg-panel)", border: "1px solid var(--border-main)",
            borderRadius: 8, padding: "11px 16px", color: "var(--text-main)",
            fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none",
            opacity: qaLoading ? 0.6 : 1, transition: "opacity 0.2s",
          }}
        />
        <button onClick={() => askQuestion()} disabled={!qaInput.trim() || qaLoading}
          style={{
            background: !qaInput.trim() || qaLoading ? "var(--bg-panel-hover)" : "linear-gradient(135deg,var(--accent-gold),var(--accent-gold-dark))",
            color: !qaInput.trim() || qaLoading ? "var(--text-dim)" : "var(--bg-main)",
            border: "none", borderRadius: 8, padding: "11px 20px",
            cursor: !qaInput.trim() || qaLoading ? "not-allowed" : "pointer",
            fontSize: 16, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
          }}>↑</button>
      </div>
    </div>
  );
}
