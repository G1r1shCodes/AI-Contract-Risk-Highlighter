# LexScan: AI Contract Risk Highlighter

LexScan is an advanced, AI-powered legal technology application designed to instantly analyze contracts, highlight critical risks, and provide conversational Q&A capabilities directly on the document text.

## 🚀 Features (V2 Architecture)
- **OCR Image Vision:** Drag and drop non-selectable scanned contracts (`.jpg`, `.png`). A native `Tesseract.js` web-worker seamlessly extracts physical pixels into machine-readable text.
- **Lightning SSE Streaming:** Server-Sent Events natively stream JSONL Risk Cards out of the Groq LLM to your React frontend, dropping perceived load times from 15s down to 2s.
- **Database Persistence:** An offline-first `localStorage` caching engine permanently saves past reports into a robust 'HISTORY' sidebar, preventing data loss on browser refreshes.
- **Fuzzy-Matched Highlighting:** Visually highlights the exact risky clauses directly inside the React DOM using `fuzzysort` text normalization.
- **Secure Backend Proxy:** A lightweight Express server completely isolates your private LLM API keys from the client payload.
- **Concurrent Cluster Booting:** Spin up both the Vite frontend and Node backend simultaneously with a single command.

## 🛠️ Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **AI Engine:** Groq (llama-3.3-70b-versatile)
- **Document Extractors:** Tesseract.js (OCR), Mammoth.js (DOCX), PDF.js

## ⚙️ Quick Start

### 1. Environment Variables
You must create a `.env.local` file in the root directory to store your private API keys. Do not commit this file.
```env
VITE_GROQ_API_KEY=gsk_your_private_groq_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Cluster
```bash
npm run dev
```
This single command uses `concurrently` to boot the backend proxy on `http://localhost:3001` and the React frontend on `http://localhost:3005`.

## 📸 Interface Previews
### Visual Risk Highlights
![Risk Highlights](./assets/screenshot1.png)

### Offline Document History
![Document History](./assets/screenshot2.png)

## 🔒 Security Note
The `.env.local` file is strictly ignored via `.gitignore` to prevent secret leakage. The backend proxy (`server/index.js`) mitigates the risk of exposing the Groq key to the public React bundle.
