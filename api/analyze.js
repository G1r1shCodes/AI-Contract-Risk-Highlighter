export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: "Groq API Key missing in Vercel ENVs" })}\n\n`);
    return res.end();
  }
  
  const { contractText } = req.body;
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
    stream: true
  };

  try {
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
               if (data.choices && data.choices[0].delta.content) {
                  buffer += data.choices[0].delta.content;
                  if (buffer.includes('\n')) {
                     const parts = buffer.split('\n');
                     buffer = parts.pop();
                     for (const part of parts) {
                        if (part.trim()) res.write(`data: ${part}\n\n`);
                     }
                  }
               }
            } catch(e) {}
         }
      }
    }
    if (buffer.trim()) res.write(`data: ${buffer}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
