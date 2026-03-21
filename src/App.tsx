import React, { useState, useEffect } from "react";
import * as mammoth from "mammoth";
import Uploader from "./components/Uploader";
import ContractViewer from "./components/ContractViewer";
import RiskPanel from "./components/RiskPanel";
import AskQuestionsTab from "./components/AskQuestionsTab";
import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";
import { RC } from "./utils/constants";
import { motion } from "framer-motion";

const BackgroundGlow = () => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden', background: 'var(--bg-main)' }}>
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.10, 0.18, 0.10], rotate: [0, 90, 0] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '-30%', left: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(200,169,110,0.12) 0%, rgba(0,0,0,0) 60%)', borderRadius: '50%' }}
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06], x: [0, 40, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(122,92,16,0.08) 0%, rgba(0,0,0,0) 65%)', borderRadius: '50%' }}
    />
  </div>
);

function LexScan({ user, setShowAuth }: { user: any; setShowAuth: (s: boolean) => void }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("lexscan_theme") || "dark");

  useEffect(() => {
    if (theme === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
    localStorage.setItem("lexscan_theme", theme);
  }, [theme]);

  const [contractHistory, setContractHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { setContractHistory([]); return; }
    supabase.from('contract_history').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        setContractHistory(data.map(item => ({
          id: item.id, fileName: item.filename, date: item.created_at,
          contractText: item.contract_text, risks: item.risks_json
        })));
      }
    });
  }, [user]);

  const [contractText, setContractText] = useState("");
  const [fileName, setFileName]         = useState("");
  const [risks, setRisks]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [activeRisk, setActiveRisk]     = useState<any>(null);
  const [view, setView]                 = useState("input");
  const [filterLevel, setFilterLevel]   = useState("all");
  const [activeTab, setActiveTab]       = useState("analyze");
  const [qaMessages, setQaMessages]     = useState<any[]>([]);
  const [qaInput, setQaInput]           = useState("");
  const [qaLoading, setQaLoading]       = useState(false);

  const extractText = async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      setContractText(await file.text());
    } else if (ext === "docx") {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      setContractText(result.value);
    } else if (ext === "pdf") {
      const url = URL.createObjectURL(file);
      // @ts-ignore
      if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(" ") + "\n";
      }
      if (!text.trim()) {
        setContractText("Scanning PDF... running OCR (5-15 seconds)...");
        setLoading(true);
        try {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const Tesseract = await import('tesseract.js');
          const result = await Tesseract.recognize(canvas.toDataURL("image/png"), 'eng');
          text = result.data.text;
        } catch(e) { console.error("OCR failed", e); }
        finally { setLoading(false); }
      }
      URL.revokeObjectURL(url);
      setContractText(text.trim());
    } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
      setContractText("Running OCR on image (5-15 seconds)...");
      setLoading(true);
      try {
        const Tesseract = await import('tesseract.js');
        const result = await Tesseract.recognize(file, 'eng');
        setContractText(result.data.text);
      } catch (err: any) {
        alert("OCR failed: " + err.message);
        setContractText("");
      } finally { setLoading(false); }
    } else {
      alert("Unsupported file type. Please upload PDF, DOCX, TXT, or Image.");
    }
  };

  const analyze = async () => {
    if (!contractText.trim()) return;
    setLoading(true);
    setRisks({ summary: "AI is reviewing the contract...", riskScore: 0, risks: [] });
    setActiveRisk(null); setQaMessages([]);
    setView("results"); setActiveTab("analyze");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText })
      });

      let finalRisks: any = { summary: "", riskScore: 0, risks: [] };
      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') {
            setLoading(false);
            if (user) {
              supabase.from('contract_history').insert([{
                user_id: user.id, filename: fileName,
                contract_text: contractText,
                risk_score: finalRisks.riskScore || 0,
                risks_json: finalRisks
              }]).select().then(({ data }) => {
                if (data?.[0]) {
                  const dbRow = data[0];
                  setContractHistory(prev => [{
                    id: dbRow.id, fileName: dbRow.filename,
                    date: dbRow.created_at, contractText: dbRow.contract_text,
                    risks: dbRow.risks_json
                  }, ...prev]);
                }
              });
            }
            return;
          }
          try {
            const obj = JSON.parse(dataStr);
            if (obj.error) { alert("API Error: " + obj.error); setLoading(false); return; }
            if (obj.type === "summary" || obj.summary !== undefined) {
              finalRisks.summary = obj.summary || "AI Contract Scan Complete.";
              let parsedScore = parseFloat(obj.riskScore || obj.score || 0);
              if (isNaN(parsedScore)) parsedScore = 0;
              finalRisks.riskScore = parsedScore;
              setRisks({ ...finalRisks });
              setLoading(false);
            } else if (obj.type === "risk" || obj.quote !== undefined) {
              finalRisks.risks.push(obj);
              if (finalRisks.riskScore === 0) {
                let fs = 0;
                finalRisks.risks.forEach((r: any) => {
                  if (r.level === 'high') fs += 25;
                  else if (r.level === 'medium') fs += 10;
                  else if (r.level === 'low') fs += 3;
                });
                finalRisks.riskScore = Math.min(fs, 100);
              }
              setRisks({ ...finalRisks });
            }
          } catch(e) {}
        }
      }
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
      setView("input"); setLoading(false);
    }
  };

  const askQuestion = async (overrideQ?: string) => {
    const q = (overrideQ || qaInput).trim();
    if (!q || qaLoading) return;
    const newMsgs = [...qaMessages, { role: "user", content: q }];
    setQaMessages([...newMsgs, { role: "assistant", content: "", streaming: true }]);
    setQaInput(""); setQaLoading(true);
    try {
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          risksSummary: risks?.summary || "",
          messages: newMsgs.map((m: any) => ({ role: m.role, content: m.content }))
        })
      });
      if (!response.ok) throw new Error(await response.text());

      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') break;
          try {
            const obj = JSON.parse(dataStr);
            if (obj.error) throw new Error(obj.error);
            if (obj.token) {
              fullAnswer += obj.token;
              setQaMessages([...newMsgs, { role: "assistant", content: fullAnswer, streaming: true }]);
            }
          } catch(e) {}
        }
      }
      setQaMessages([...newMsgs, { role: "assistant", content: fullAnswer, streaming: false }]);
    } catch (err: any) {
      setQaMessages([...newMsgs, { role: "assistant", content: "Error: " + err.message, streaming: false }]);
    } finally { setQaLoading(false); }
  };

  const counts: any = { high: 0, medium: 0, low: 0 };
  risks?.risks?.forEach((r: any) => { if (counts[r.level] !== undefined) counts[r.level]++; });
  const rawScore = risks?.riskScore || 0;
  const score = rawScore <= 10 && rawScore > 0 ? rawScore * 10 : rawScore;
  const scoreColor = score >= 70 ? "#E53935" : score >= 40 ? "#FB8C00" : "#43A047";

  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", minHeight: "100vh", color: "var(--text-main)", display: "flex", position: "relative", background: "var(--bg-main)" }}>
      <BackgroundGlow />

      {/* Sidebar */}
      <div style={{ width: 238, background: "var(--bg-main)", borderRight: "1px solid var(--border-main)", display: "flex", flexDirection: "column", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-main)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,var(--accent-gold),var(--accent-gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
            {String.fromCodePoint(0x2696, 0xFE0F)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", color: "var(--accent-gold)" }}>LEXSCAN</div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.05em", marginTop: 1 }}>AI CONTRACT REVIEW</div>
          </div>
        </div>
        <div style={{ padding: "12px 18px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.12em" }}>HISTORY</span>
          {contractHistory.length > 0 && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{contractHistory.length}</span>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 12px" }}>
          {!user ? (
            <div style={{ margin: "6px 2px", padding: "14px", border: "1px dashed var(--border-light)", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 12 }}>
                Sign in to save and revisit your contract analyses.
              </div>
              <button onClick={() => setShowAuth(true)} style={{ width: "100%", background: "var(--accent-gold)", border: "none", color: "var(--bg-main)", padding: "8px 0", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>SIGN IN FREE</button>
            </div>
          ) : contractHistory.length === 0 ? (
            <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--text-dim)", lineHeight: 1.6 }}>No history yet.</div>
          ) : contractHistory.map((item) => {
            const isActive = risks?.summary === item.risks?.summary;
            const s = item.risks?.riskScore || 0;
            const dotColor = s >= 70 ? "#E53935" : s >= 40 ? "#FB8C00" : "#43A047";
            return (
              <div key={item.id}
                onClick={() => { setContractText(item.contractText); setFileName(item.fileName); setRisks(item.risks); setView("results"); setActiveTab("analyze"); setQaMessages([]); setActiveRisk(null); }}
                style={{ padding: "9px 11px", borderRadius: 8, cursor: "pointer", marginBottom: 3, background: isActive ? "var(--bg-panel)" : "transparent", border: `1px solid ${isActive ? "var(--border-main)" : "transparent"}`, transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 11.5, color: "var(--text-main)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.fileName}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", paddingLeft: 13 }}>{new Date(item.date).toLocaleDateString()} &middot; Score {s}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 10, minWidth: 0 }}>
        <header style={{ borderBottom: "1px solid var(--border-main)", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-panel)", position: "sticky", top: 0, zIndex: 200 }}>
          {fileName && view === "results" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>&#128206;</span>
              <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>{fileName}</span>
            </div>
          ) : <div />}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "var(--bg-panel-hover)", border: "1px solid var(--border-main)", color: "var(--text-muted)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>
              {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
            {user ? (
              <button onClick={() => supabase.auth.signOut()} style={{ background: "transparent", border: "1px solid var(--border-main)", color: "var(--text-muted)", padding: "7px 13px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>SIGN OUT</button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "transparent", border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", padding: "7px 13px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>SIGN IN</button>
            )}
            {view === "results" && (
              <button onClick={() => { setView("input"); setRisks(null); setContractText(""); setFileName(""); setActiveRisk(null); setFilterLevel("all"); setQaMessages([]); setLoading(false); }} style={{ background: "var(--accent-gold)", border: "none", color: "var(--bg-main)", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>
                + NEW
              </button>
            )}
          </div>
        </header>

        {view === "input" && (
          <Uploader contractText={contractText} setContractText={setContractText} fileName={fileName} setFileName={setFileName} analyze={analyze} loading={loading} extractText={extractText} />
        )}

        {view === "results" && (
          <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
            {/* Contract panel */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid var(--border-main)" }}>
              <div style={{ padding: "16px 24px 0", background: "var(--bg-panel)", borderBottom: "1px solid var(--border-main)", flexShrink: 0 }}>
                {/* Score banner */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, padding: "11px 14px", background: "var(--bg-main)", borderRadius: 10, border: `1px solid ${loading ? "var(--border-main)" : scoreColor + "55"}`, borderLeft: `3px solid ${loading ? "var(--border-main)" : scoreColor}`, transition: "border-color 0.5s" }}>
                  <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                    <svg viewBox="0 0 64 64" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border-main)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke={loading ? "var(--border-light)" : scoreColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - (loading ? 0 : score) / 100)}`} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: loading ? "var(--text-dim)" : scoreColor, lineHeight: 1, transition: "color 0.5s" }}>{loading ? "--" : score}</div>
                      <div style={{ fontSize: 7, color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: 1 }}>RISK</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, minWidth: 0 }}>
                    {loading ? (<><div className="skeleton" style={{ height: 10, width: "85%", marginBottom: 7 }} /><div className="skeleton" style={{ height: 10, width: "60%" }} /></>) : risks?.summary}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {["high", "medium", "low"].map((l) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 3, background: loading ? "var(--bg-panel-hover)" : `${RC[l].dot}18`, border: `1px solid ${loading ? "var(--border-main)" : RC[l].dot + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: loading ? "var(--text-dim)" : RC[l].dot, transition: "all 0.4s" }}>
                          {loading ? "-" : counts[l]}
                        </div>
                        <div style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.1em" }}>{l.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Tabs */}
                <div style={{ display: "flex" }}>
                  {[["analyze", "Highlighted Contract"], ["qa", "Ask AI"]].map(([t, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)} disabled={t === "qa" && loading}
                      style={{ padding: "9px 20px 10px", background: "transparent", color: activeTab === t ? "var(--text-main)" : "var(--text-dim)", border: "none", borderBottom: activeTab === t ? "2px solid var(--accent-gold)" : "2px solid transparent", cursor: "pointer", fontSize: 12.5, fontWeight: activeTab === t ? 600 : 400, transition: "all 0.15s", opacity: t === "qa" && loading ? 0.35 : 1 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "analyze" && (
                <ContractViewer contractText={contractText} risks={risks?.risks} activeRisk={activeRisk} setActiveRisk={setActiveRisk} filterLevel={filterLevel} loading={loading} />
              )}
              {activeTab === "qa" && !loading && (
                <AskQuestionsTab qaMessages={qaMessages} qaInput={qaInput} setQaInput={setQaInput} qaLoading={qaLoading} askQuestion={askQuestion} risks={risks?.risks || []} />
              )}
            </div>

            <RiskPanel loading={loading} risks={risks} counts={counts} filterLevel={filterLevel} setFilterLevel={setFilterLevel} activeRisk={activeRisk} setActiveRisk={setActiveRisk} contractText={contractText} fileName={fileName} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); if (session) setShowAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); if (session) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <LexScan user={session?.user} setShowAuth={setShowAuth} />
      {showAuth && !session && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowAuth(false)} style={{ position: "absolute", top: 14, right: 14, background: "var(--bg-panel-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, fontSize: 16 }}>&#215;</button>
            <Auth />
          </div>
        </div>
      )}
    </>
  );
}
