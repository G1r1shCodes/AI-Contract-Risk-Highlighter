import express from 'express';
import cors from 'cors';
import fs from 'fs';

try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2].trim();
  });
} catch(e) {}


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Analyze Endpoint ──
app.post('/api/analyze', async (req, res) => {
  try {
    const apiKey = process.env.VITE_GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Groq API Key not found in .env.local" });

    const { contractText } = req.body;
    
    // Establishing SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `You are a senior legal risk analyst. Analyze contracts and identify risky clauses.
You MUST output strictly in JSONL (JSON Lines) format. Do not use an array. Do not use markdown backticks. Return ONLY raw JSON strings separated by newlines.

Line 1 MUST be exactly this structure:
{"type":"summary", "summary": "2-3 sentence overall risk assessment", "riskScore": <number>}

Lines 2 through 10 MUST be exactly this structure (one line per risk):
{"type":"risk", "id": <number>, "quote": "exact verbatim text from contract (10-35 words)", "level": "high|medium|low", "category": "Payment|IP|Liability|Termination|Confidentiality|Arbitration|Indemnity|Penalty|Ambiguity|Other", "title": "short risk title (4-6 words)", "explanation": "2-3 sentences: why risky"}

Identify 6-12 risks. Only quote text that appears verbatim in the contract.`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this contract:\n\n${contractText}` }
      ],
      temperature: 0.1,
      stream: true // Enable native streaming from Groq
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });

    if (!groqRes.ok) {
        res.write(`data: ${JSON.stringify({ error: await groqRes.text() })}\n\n`);
        return res.end();
    }

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
         if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
               const data = JSON.parse(line.slice(6));
               if (data.choices[0].delta.content) {
                  buffer += data.choices[0].delta.content;
                  // If buffer contains a newline, we have generated a full JSONL structural line!
                  if (buffer.includes('\n')) {
                     const parts = buffer.split('\n');
                     buffer = parts.pop(); // keep remainder
                     for (const part of parts) {
                        if (part.trim()) {
                            // Forward the complete JSONL object independently to the frontend
                            res.write(`data: ${part}\n\n`);
                        }
                     }
                  }
               }
            } catch(e) {}
         }
      }
    }
    
    // Check remainder
    if (buffer.trim()) res.write(`data: ${buffer}\n\n`);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Q&A Endpoint ──
app.post('/api/qa', async (req, res) => {
  try {
    const apiKey = process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Groq API Key not found in .env.local" });
    }

    const { contractText, risksSummary, history } = req.body;

    const systemPrompt = `You are a legal analyst assistant. Answer questions about the contract below clearly and concisely. Cite specific clauses when relevant. If something is legally risky, say so.

CONTRACT:
${contractText}

RISK ANALYSIS SUMMARY:
${risksSummary || ""}`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: history }
      ],
      temperature: 0.1
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!groqRes.ok) {
        const errorText = await groqRes.text();
        return res.status(groqRes.status).json({ error: `Groq API Error: ${errorText}` });
    }

    const data = await groqRes.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend proxy running on http://localhost:${PORT}`);
});

// Force the Node event loop to stay active (Windows terminal bug workaround)
setInterval(() => {}, 1000 * 60 * 60);
