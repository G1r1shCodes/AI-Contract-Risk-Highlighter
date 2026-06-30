```text
██╗     ███████╗██╗  ██╗███████╗ ██████╗ █████╗ ███╗   ██╗
██║     ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██╔══██╗████╗  ██║
██║     █████╗   ╚███╔╝ ███████╗██║     ███████║██╔██╗ ██║
██║     ██╔══╝   ██╔██╗ ╚════██║██║     ██╔══██║██║╚██╗██║
███████╗███████╗██╔╝ ██╗███████║╚██████╗██║  ██║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge">
  <img src="https://img.shields.io/badge/Tesseract.js-OCR-5A67D8?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

# LexScan: AI Contract Risk Highlighter

LexScan is an advanced AI-powered legal technology application designed to instantly analyze contracts, highlight critical risks, and provide conversational Q&A capabilities directly on document text.

---
## Features

- OCR-based extraction for scanned contracts (`.jpg`, `.png`) using Tesseract.js web workers.
- Server-Sent Events streaming for real-time risk analysis.
- Persistent document history using localStorage.
- Fuzzy-matched clause highlighting within the document viewer.
- Secure backend proxy for API key protection.
- Simultaneous frontend and backend startup using concurrently.

## Tech Stack

| Category | Technology |
|---------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express |
| AI Engine | Groq (llama-3.3-70b-versatile) |
| OCR | Tesseract.js |
| Document Parsing | PDF.js, Mammoth.js |

## Quick Start

### Environment Variables

Create a `.env.local` file:

```env
VITE_GROQ_API_KEY=gsk_your_private_groq_key_here
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

This command launches:
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3005`

## Interface Previews

### Visual Risk Highlights

![Risk Highlights](./assets/screenshot1.png)

### Offline Document History

![Document History](./assets/screenshot2.png)

## Security

The `.env.local` file is excluded through `.gitignore`. The backend proxy prevents exposing Groq API credentials to the client application.
