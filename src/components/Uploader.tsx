import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SAMPLE_CONTRACT } from '../utils/constants';

const FEATURES = [
  { icon: '🔍', label: 'Clause Highlighting' },
  { icon: '⚡', label: 'Instant Analysis' },
  { icon: '💬', label: 'Ask AI Questions' },
  { icon: '📊', label: 'Risk Scoring' },
];

const FILE_TYPES = ['PDF', 'DOCX', 'TXT', 'PNG', 'JPG'];

export default function Uploader({ contractText, setContractText, fileName, setFileName, analyze, loading, extractText }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await extractText(file);
  };

  const wordCount = contractText ? contractText.split(/\s+/).filter(Boolean).length : 0;
  const canAnalyze = contractText.trim() && !loading;

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 32px' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-gold)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 600, letterSpacing: '0.1em' }}>POWERED BY AI</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-0.02em', color: 'var(--text-main)', fontFamily: "'Lora', Georgia, serif" }}>
            Spot Hidden Risks<br />
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Before You Sign</em>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.75, maxWidth: 460, margin: '0 auto 28px', fontFamily: "'Inter', sans-serif" }}>
            Upload any contract and get an instant AI risk analysis — highlighted clauses, plain-English explanations, and answers to your questions.
          </p>
          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 12 }}>{f.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <motion.div
          whileHover={{ borderColor: 'var(--accent-gold)' }}
          whileTap={{ scale: 0.995 }}
          transition={{ duration: 0.15 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-gold)' : 'var(--border-light)'}`,
            borderRadius: 14,
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 16,
            background: dragOver ? 'rgba(200,169,110,0.04)' : 'var(--bg-panel)',
            transition: 'border-color 0.2s, background 0.2s',
            position: 'relative',
          }}>
          <AnimatePresence mode="wait">
            {dragOver ? (
              <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬇️</div>
                <div style={{ color: 'var(--accent-gold)', fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Drop to upload</div>
              </motion.div>
            ) : fileName ? (
              <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                <div style={{ color: 'var(--text-main)', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>{fileName}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: "'Inter', sans-serif" }}>
                  {wordCount.toLocaleString()} words extracted · Click to replace
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>
                  📄
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: 6 }}>
                  Drop your contract here
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>
                  or <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>click to browse</span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {FILE_TYPES.map(t => (
                    <span key={t} style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-panel-hover)', border: '1px solid var(--border-main)', padding: '2px 8px', borderRadius: 4, fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.05em' }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && extractText(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </motion.div>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-main)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: '0.08em' }}>OR PASTE TEXT</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-main)' }} />
        </div>

        {/* Textarea card */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>CONTRACT TEXT</span>
              {contractText && (
                <span style={{ fontSize: 10, color: 'var(--accent-gold)', background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.2)', padding: '1px 7px', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                  {wordCount.toLocaleString()} words
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {contractText && (
                <button
                  onClick={() => { setContractText(''); setFileName(''); }}
                  style={{ background: 'none', border: '1px solid var(--border-main)', color: 'var(--text-dim)', padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#E53935', e.currentTarget.style.color = '#E53935')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-main)', e.currentTarget.style.color = 'var(--text-dim)')}>
                  Clear
                </button>
              )}
              <button
                onClick={() => { setContractText(SAMPLE_CONTRACT); setFileName('sample_contract.txt'); }}
                style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-muted)', padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)', e.currentTarget.style.color = 'var(--accent-gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)', e.currentTarget.style.color = 'var(--text-muted)')}>
                Load sample
              </button>
            </div>
          </div>

          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste your contract text here..."
            style={{
              width: '100%', minHeight: 240, background: 'transparent', border: 'none',
              color: 'var(--text-main)', padding: '18px', fontSize: 13.5,
              lineHeight: 1.85, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', fontFamily: "'Lora', Georgia, serif",
            }}
          />

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-hover)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Inter', sans-serif" }}>
              {canAnalyze ? (
                <span style={{ color: '#43A047', fontWeight: 600 }}>&#10003; Ready to analyze</span>
              ) : (
                'Upload a file or paste contract text above'
              )}
            </div>
            <button
              onClick={analyze}
              disabled={!canAnalyze}
              style={{
                background: canAnalyze ? 'var(--accent-gold)' : 'var(--bg-panel)',
                color: canAnalyze ? 'var(--bg-main)' : 'var(--text-dim)',
                border: canAnalyze ? 'none' : '1px solid var(--border-main)',
                padding: '10px 28px', borderRadius: 8,
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                boxShadow: canAnalyze ? '0 4px 14px rgba(200,169,110,0.3)' : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  ANALYZING...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
              ) : 'ANALYZE RISKS →'}
            </button>
          </div>
        </div>

        {/* Trust note */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
          Your contract text is processed securely and never stored without your permission.
        </div>

      </div>
    </div>
  );
}
