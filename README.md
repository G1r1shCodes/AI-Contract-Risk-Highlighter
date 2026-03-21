# LexScan: AI Contract Risk Highlighter

LexScan is an advanced, AI-powered legal technology application designed to instantly analyze contracts, highlight critical risks, and provide conversational Q&A capabilities directly on the document text.

## 🚀 Features (V2 Architecture)
- **Fuzzy-Matched Highlighting:** Analyzes the contract and visually highlights the exact clauses directly inside the React DOM using `fuzzysort` mapping against the LLM output.
- **Secure Backend Proxy:** A lightweight Express server completely isolates your private LLM API keys from the client payload.
- **Direct PDF Export:** Clean, native browser `window.print()` functionality for exporting styled risk reports.
- **Concurrent Cluster Booting:** Spin up both the Vite frontend and Node backend with a single command.

## 🛠️ Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI Engine:** Groq (llama-3.3-70b-versatile)
- **Document Processing:** Mammoth.js (DOCX) + native PDF.js

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

## 🔒 Security Note
The `.env.local` file is strictly ignored via `.gitignore` to prevent secret leakage. The backend proxy (`server/index.js`) mitigates the risk of exposing the Groq key to the public React bundle.
