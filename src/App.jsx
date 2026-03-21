import { useState } from "react";
import * as mammoth from "mammoth";
import Uploader from "./components/Uploader";
import ContractViewer from "./components/ContractViewer";
import RiskPanel from "./components/RiskPanel";
import AskQuestionsTab from "./components/AskQuestionsTab";
import { btnStyle, RC } from "./utils/constants";

export default function LexScan() {
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
      if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it) => it.str).join(" ") + "\n";
      }
      URL.revokeObjectURL(url);
      setContractText(text.trim());
    } else {
      alert("Unsupported file type. Please upload PDF, DOCX, or TXT.");
    }
  };

  // ── Analyze ──
  const analyze = async () => {
    if (!contractText.trim()) return;
    setLoading(true); setRisks(null); setActiveRisk(null); setQaMessages([]);
    setView("results");
    setActiveTab("analyze");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const parsed = await response.json();
      
      // Bubble backend errors correctly
      if(parsed.error) throw new Error(parsed.error);
      
      setRisks(parsed);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again. " + err.message);
      setView("input");
    } finally {
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
  risks?.risks?.forEach((r) => counts[r.level]++);
  const score = risks?.riskScore || 0;
  const scoreColor = score > 70 ? "#E53935" : score > 40 ? "#FB8C00" : "#43A047";

  return (
    <div style={{ fontFamily: "Georgia,'Times New Roman',serif", minHeight: "100vh", background: "#0B0D12", color: "#E8E4DC" }}>
      <header style={{
        borderBottom: "1px solid #222530", padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0B0D12", position: "sticky", top: 0, zIndex: 200,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 7,
            background: "linear-gradient(135deg,#C8A96E,#7A5C10)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.07em", color: "#C8A96E" }}>LEXSCAN</div>
            <div style={{ fontSize: 10, color: "#555A6A", letterSpacing: "0.14em", fontFamily: "system-ui,sans-serif" }}>AI CONTRACT RISK ANALYSIS</div>
          </div>
        </div>

        {view === "results" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => { setView("input"); setRisks(null); setContractText(""); setFileName(""); setActiveRisk(null); setFilterLevel("all"); setQaMessages([]); setLoading(false); }}
              style={btnStyle("transparent", "#222530", "#9A9DB0", true)}>
              ← NEW
            </button>
          </div>
        )}
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
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid #1E2028" }}>
            <div style={{ padding: "28px 36px 0" }}>
              {/* Score Banner */}
              <div style={{
                background: "#13161D", border: "1px solid #222530", borderRadius: 10,
                padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20,
              }}>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: loading ? "#555" : scoreColor, lineHeight: 1, fontFamily: "system-ui", transition: "all 0.4s" }}>
                     {loading ? "--" : score}
                  </div>
                  <div style={{ fontSize: 9, color: "#555A6A", letterSpacing: "0.12em", fontFamily: "system-ui", marginTop: 3 }}>RISK SCORE</div>
                </div>
                <div style={{ width: 1, height: 40, background: "#222530" }} />
                <div style={{ flex: 1, fontSize: 13, color: "#9A9DB0", lineHeight: 1.65, fontFamily: "system-ui" }}>
                   {loading ? "AI is generating compliance report... this takes about 5 - 15 seconds." : risks?.summary}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {["high","medium","low"].map((l) => (
                    <div key={l} style={{ textAlign: "center", opacity: loading ? 0.4 : 1, transition: "opacity 0.4s" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: loading ? "#555" : RC[l].dot, fontFamily: "system-ui", transition: "color 0.4s" }}>
                         {loading ? "-" : counts[l]}
                      </div>
                      <div style={{ fontSize: 9, color: "#555A6A", letterSpacing: "0.1em", fontFamily: "system-ui" }}>{l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
                {[["analyze","🔍 HIGHLIGHTED CONTRACT"],["qa","💬 ASK QUESTIONS"]].map(([t,label]) => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: "8px 18px", borderRadius: 6,
                    background: activeTab === t ? "#C8A96E" : "#13161D",
                    color: activeTab === t ? "#0B0D12" : "#6B6F7A",
                    border: `1px solid ${activeTab === t ? "transparent" : "#222530"}`,
                    cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: "system-ui",
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
            score={score}
            scoreColor={scoreColor}
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
  );
}
