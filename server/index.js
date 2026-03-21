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
    if (!apiKey) {
      return res.status(500).json({ error: "Groq API Key not found in .env.local" });
    }

    const { contractText } = req.body;
    
    const systemPrompt = `You are a senior legal risk analyst. Analyze contracts and identify risky clauses.
Return ONLY valid JSON. Output in JSON format.
{
  "summary": "2-3 sentence overall risk assessment",
  "riskScore": <1-100 number>,
  "risks": [
    {
      "id": <number>,
      "quote": "exact verbatim text from contract (10-35 words)",
      "level": "high|medium|low",
      "category": "Payment|IP|Liability|Termination|Confidentiality|Arbitration|Indemnity|Penalty|Ambiguity|Other",
      "title": "short risk title (4-6 words)",
      "explanation": "2-3 sentences: why risky, what to watch for, recommended action"
    }
  ]
}
Identify 6-12 risks. Only quote text that appears verbatim in the contract.`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this contract:\n\n${contractText}` }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
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
    let rawContent = data.choices[0].message.content;
    
    // Groq sometimes wraps json outputs in markdown code blocks even in json mode
    rawContent = rawContent.replace(/^```json\s*/is, '').replace(/\s*```$/is, '');
    
    const resultJson = JSON.parse(rawContent);
    res.json(resultJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
