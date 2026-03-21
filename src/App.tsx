import React, { useState, useEffect } from "react";
import * as mammoth from "mammoth";
import Uploader from "./components/Uploader";
import ContractViewer from "./components/ContractViewer";
import RiskPanel from "./components/RiskPanel";
import AskQuestionsTab from "./components/AskQuestionsTab";
import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";
import { btnStyle, RC } from "./utils/constants";
import { motion } from "framer-motion";

const BackgroundGlow = () => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden', background: 'var(--bg-main)' }}>
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.2, 0.12], rotate: [0, 90, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '-30%', left: '-10%', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(200,169,110,0.15) 0%, rgba(0,0,0,0) 60%)', borderRadius: '50%' }}
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08], x: [0, 50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(122,92,16,0.1) 0%, rgba(0,0,0,0) 65%)', borderRadius: '50%' }}
    />
  </div>
);

function LexScan({ user, setShowAuth }: { user: any, setShowAuth: (s: boolean) => void }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("lexscan_theme") || "dark");
  
  useEffect(() => {
    if (theme === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
    localStorage.setItem("lexscan_theme", theme);
  }, [theme]);

  const [contractHistory, setContractHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setContractHistory([]);
      return;
    }
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('contract_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mapped = data.map(item => ({
           id: item.id,
           fileName: item.filename,
           date: item.created_at,
           contractText: item.contract_text,
           risks: item.risks_json
        }));
        setContractHistory(mapped);
      }
    };
    fetchHistory();
  }, [user]);
  const [contractText, setContractText] = useState("");
  const [fileName, setFileName]         = useState("");
  const [risks, setRisks]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [activeRisk, setActiveRisk]     = useState(null);
  const [view, setView]                 = useState("input");
  const [filterLevel, setFilterLevel]   = useState("all");
  const [activeTab, setActiveTab]       = useState("analyze");
  const [qaMessages, setQaMessages]     = useState([]);
  const [qaInput, setQaInput]           = useState("");
  const [qaLoading, setQaLoading]       = useState(false);

  // ── File parsing ──
  const extractText = async (file) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "txt") {
      const t = await file.text();
      setContractText(t);
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
         setContractText("Scanning PDF pixels... running deep OCR abstraction (this takes about 5 - 15 seconds)...");
         setLoading(true);
         try {
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            const imgData = canvas.toDataURL("image/png");
            const Tesseract = await import('tesseract.js');
            const result = await Tesseract.recognize(imgData, 'eng');
            text = result.data.text;
         } catch(e) {
            console.error("PDF OCR Fallback failed", e);
         } finally {
            setLoading(false);
         }
      }

      URL.revokeObjectURL(url);
      setContractText(text.trim());
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      setContractText("Engaging OCR... extracting text from image pixels... (this takes about 5 - 15 seconds to download the language model & parse).");
      setLoading(true);
      try {
         const Tesseract = await import('tesseract.js');
         const result = await Tesseract.recognize(file, 'eng');
         setContractText(result.data.text);
      } catch (err) {
         console.error(err);
         alert("OCR extraction failed: " + err.message);
         setContractText("");
      } finally {
         setLoading(false);
      }
    } else {
      alert("Unsupported file type. Please upload PDF, DOCX, TXT, or Image.");
    }
  };

  // ── Analyze ──
  const analyze = async () => {
    if (!contractText.trim()) return;
    setLoading(true); setRisks({ summary: "AI is reviewing the contract...", riskScore: 0, risks: [] }); setActiveRisk(null); setQaMessages([]);
    setView("results");
    setActiveTab("analyze");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText })
      });
      
      let finalRisks = { summary: "", riskScore: 0, risks: [] };

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
           if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                 setLoading(false);
                 if (user) {
                   // Live Cloud Insertion mapped securely to User Session
                   supabase.from('contract_history').insert([{
                      user_id: user.id,
                      filename: fileName,
                      contract_text: contractText,
                      risk_score: finalRisks.riskScore || 0,
                      risks_json: finalRisks
                   }]).select().then(({ data, error }) => {
                      if (data && data.length > 0) {
                         const dbRow = data[0];
                         setContractHistory(prev => [{
                            id: dbRow.id,
                            fileName: dbRow.filename,
                            date: dbRow.created_at,
                            contractText: dbRow.contract_text,
                            risks: dbRow.risks_json
                         }, ...prev]);
                      }
                   });
                 }
                 return;
              }
              
              try {
                 const obj = JSON.parse(dataStr);
                 if (obj.error) {
                    alert("Groq API Error: " + obj.error);
                    setLoading(false);
                    return;
                 }
                 
                 // Render dynamically!
                 // Render dynamically with aggressive type-safety fallbacks
                 const isSummary = obj.type === "summary" || obj.summary !== undefined;
                 const isRisk = obj.type === "risk" || obj.quote !== undefined;

                 if (isSummary) {
                    finalRisks.summary = obj.summary || finalRisks.summary || "AI Contract Scan Complete.";
                    
                    // Force rigorous numeric parsing for riskScore
                    let parsedScore = parseFloat(obj.riskScore || obj.score || obj.RiskScore || obj.risk_score || 0);
                    if (isNaN(parsedScore)) parsedScore = 0;
                    
                    finalRisks.riskScore = parsedScore;
                    setRisks({ ...finalRisks });
                    setLoading(false); // Drop the skeleton loaders immediately
                 } else if (isRisk) {
                    finalRisks.risks.push(obj);
                    
                    // Mathematical Risk Failsafe calculation (If Groq dropped the Risk Score globally)
                    if (finalRisks.riskScore === 0 && finalRisks.summary !== "AI is reviewing the contract...") {
                       let failsafeScore = 0;
                       finalRisks.risks.forEach(r => {
                          if (r.level?.toLowerCase() === 'high') failsafeScore += 25;
                          if (r.level?.toLowerCase() === 'medium') failsafeScore += 10;
                          if (r.level?.toLowerCase() === 'low') failsafeScore += 3;
                       });
                       finalRisks.riskScore = Math.min(failsafeScore, 100);
                    }
                    
                    setRisks({ ...finalRisks });
                 }
              } catch(e) {
                  // Ignore incomplete chunk parsing errors
              }
           }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again. " + err.message);
      setView("input");
      setLoading(false);
    }
  };

  // ── Q&A ──
  const askQuestion = async () => {
    const q = qaInput.trim();
    if (!q || qaLoading) return;
    const newMsgs = [...qaMessages, { role: "user", content: q }];
    setQaMessages(newMsgs); setQaInput(""); setQaLoading(true);
    try {
      const history = newMsgs.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          risksSummary: risks?.summary || "",
          history
        })
      });
      if (!response.ok) {
         throw new Error(await response.text());
      }
      const parsed = await response.json();
      if(parsed.error) throw new Error(parsed.error);
      
      setQaMessages([...newMsgs, { role: "assistant", content: parsed.answer }]);
    } catch (err) {
      console.error(err);
      setQaMessages([...newMsgs, { role: "assistant", content: `Sorry, I couldn't process that: ${err.message}` }]);
    } finally {
      setQaLoading(false);
    }
  };

  const counts = { high: 0, medium: 0, low: 0 };
  risks?.risks?.forEach((r: any) => { if (counts[r.level] !== undefined) counts[r.level]++; });
  const rawScore = risks?.riskScore || 0;
  const score = rawScore <= 10 && rawScore > 0 ? rawScore * 10 : rawScore;
  const scoreColor = score >= 70 ? "#E53935" : score >= 40 ? "#FB8C00" : "#43A047";

  return (
    <div style={{ fontFamily: "Georgia,'Times New Roman',serif", minHeight: "100vh", color: "var(--text-main)", display: "flex", position: "relative" }}>
      <BackgroundGlow />
      {/* Sidebar History */}
      <div style={{ width: 260, background: "var(--glass-bg)", backdropFilter: "blur(20px)", borderRight: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", zIndex: 10 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--glass-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,var(--accent-gold),#7A5C10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚖️</div>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.07em", color: "var(--accent-gold)" }}>LEXSCAN</div>
          </div>
        </div>
        <div style={{ padding: "16px 20px", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>
          HISTORY
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
          {!user ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'system-ui', border: '1px dashed var(--bg-panel-hover)', borderRadius: 8, marginTop: 16 }}>
               <p style={{ lineHeight: 1.6, marginBottom: 16 }}>Sign in to automatically save and track your legal documents in the cloud.</p>
               <button onClick={() => setShowAuth(true)} style={{ background: 'var(--bg-panel-hover)', border: 'none', color: 'var(--accent-gold)', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>GET STARTED</button>
             </div>
          ) : contractHistory.length === 0 ? (
            <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>No saved history.</div>
          ) : (
            contractHistory.map((item) => (
            <div key={item.id} onClick={() => {
               setContractText(item.contractText);
               setFileName(item.fileName);
               setRisks(item.risks);
               setView("results");
               setActiveTab("analyze");
               setQaMessages([]);
               setActiveRisk(null);
            }} style={{
               padding: "12px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 6,
               background: risks?.summary === item.risks?.summary ? "var(--bg-panel)" : "transparent",
               border: `1px solid ${risks?.summary === item.risks?.summary ? "var(--border-main)" : "transparent"}`,
               transition: "all 0.2s"
            }}>
              <div style={{ fontSize: 12, color: "var(--text-main)", fontWeight: 600, fontFamily: "'Inter', sans-serif", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.fileName}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>
                {new Date(item.date).toLocaleDateString()} · Score: {item.risks.riskScore}
              </div>
            </div>
          )))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 10 }}>
        <header style={{
          borderBottom: "1px solid var(--glass-border)", padding: "16px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--glass-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 200,
        }}>
          <div></div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ ...btnStyle("transparent", "var(--border-main)", "var(--text-muted)", true), padding: "8px", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
               {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
               <button onClick={() => supabase.auth.signOut()} style={btnStyle("transparent", "var(--border-main)", "var(--text-muted)", true)}>SIGN OUT</button>
            ) : (
               <button onClick={() => setShowAuth(true)} style={btnStyle("transparent", "var(--accent-gold)", "var(--accent-gold)", true)}>SIGN IN</button>
            )}
            
            {view === "results" && (
              <button onClick={() => { setView("input"); setRisks(null); setContractText(""); setFileName(""); setActiveRisk(null); setFilterLevel("all"); setQaMessages([]); setLoading(false); }}
                style={btnStyle("transparent", "var(--border-main)", "var(--text-muted)", true)}>
                ← NEW
              </button>
            )}
          </div>
        </header>

      {view === "input" && (
        <Uploader 
           contractText={contractText}
           setContractText={setContractText}
           fileName={fileName}
           setFileName={setFileName}
           analyze={analyze}
           loading={loading}
           extractText={extractText}
        />
      )}

      {view === "results" && (
        <div style={{ display: "flex", height: "calc(100vh - 69px)" }}>
          {/* LEFT: Contract */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid var(--bg-panel-hover)" }}>
            <div style={{ padding: "28px 36px 0" }}>
              {/* Score Banner */}
              <div style={{
                background: "var(--bg-panel)", border: "1px solid var(--border-main)", borderRadius: 10,
                padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20,
              }}>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: loading ? "#555" : scoreColor, lineHeight: 1, fontFamily: "'Inter', sans-serif", transition: "all 0.4s" }}>
                     {loading ? "--" : score}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.12em", fontFamily: "'Inter', sans-serif", marginTop: 3 }}>RISK SCORE</div>
                </div>
                <div style={{ width: 1, height: 40, background: "var(--border-main)" }} />
                <div style={{ flex: 1, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, fontFamily: "'Inter', sans-serif" }}>
                   {loading ? "AI is generating compliance report... this takes about 5 - 15 seconds." : risks?.summary}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {["high","medium","low"].map((l) => (
                    <div key={l} style={{ textAlign: "center", opacity: loading ? 0.4 : 1, transition: "opacity 0.4s" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: loading ? "#555" : RC[l].dot, fontFamily: "'Inter', sans-serif", transition: "color 0.4s" }}>
                         {loading ? "-" : counts[l]}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>{l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
                {[["analyze","🔍 HIGHLIGHTED CONTRACT"],["qa","💬 ASK QUESTIONS"]].map(([t,label]) => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: "8px 18px", borderRadius: 6,
                    background: activeTab === t ? "var(--accent-gold)" : "var(--bg-panel)",
                    color: activeTab === t ? "var(--bg-main)" : "var(--text-dim)",
                    border: `1px solid ${activeTab === t ? "transparent" : "var(--border-main)"}`,
                    cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s",
                    opacity: t === "qa" && loading ? 0.3 : 1
                  }} disabled={t === "qa" && loading}>{label}</button>
                ))}
              </div>
            </div>

            {activeTab === "analyze" && (
               <ContractViewer 
                  contractText={contractText}
                  risks={risks?.risks}
                  activeRisk={activeRisk}
                  setActiveRisk={setActiveRisk}
                  filterLevel={filterLevel}
                  loading={loading}
               />
            )}
            
            {activeTab === "qa" && !loading && (
               <AskQuestionsTab 
                  qaMessages={qaMessages}
                  qaInput={qaInput}
                  setQaInput={setQaInput}
                  qaLoading={qaLoading}
                  askQuestion={askQuestion}
               />
            )}
          </div>

          <RiskPanel 
            loading={loading}
            risks={risks}
            counts={counts}
            filterLevel={filterLevel}
            setFilterLevel={setFilterLevel}
            activeRisk={activeRisk}
            setActiveRisk={setActiveRisk}
            contractText={contractText}
            fileName={fileName}
          />
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
      setSession(session);
      if (session) setShowAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <LexScan user={session?.user} setShowAuth={setShowAuth} />
      
      {showAuth && !session && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'var(--bg-panel-hover)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, fontSize: 18 }}>×</button>
            <Auth />
          </div>
        </div>
      )}
    </>
  );
}
