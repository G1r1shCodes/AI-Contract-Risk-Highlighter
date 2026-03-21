export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Groq API Key missing in Vercel ENVs" });

  const { contractText, risksSummary, messages } = req.body;

  // Build a tight, expert system prompt
  const systemPrompt = `You are LexScan AI, a professional legal analyst embedded in a contract review tool. You have already analyzed this contract and identified the key risks.

YOUR ROLE:
- Answer questions about THIS specific contract with precision
- Always cite the relevant section or quote the clause you're referencing
- Flag legal risks plainly: "This is risky because..."
- If a question is outside the contract's scope, say so clearly
- Keep answers concise (2-4 paragraphs max) unless the user asks for more detail
- Use professional but plain English — no excessive legal jargon
- If you are uncertain about a legal interpretation, say "I'd recommend consulting a lawyer on this point"
- Never make up clauses or information not in the contract

FORMAT:
- Use short paragraphs, not bullet points, unless listing multiple items
- Bold key clause references like **Section 3** or **Clause 5.2**
- End answers with a 1-line "Bottom line:" summary when the answer is complex

━━━ CONTRACT TEXT ━━━
${contractText}

━━━ AI RISK ANALYSIS ALREADY PERFORMED ━━━
${risksSummary || "No prior risk analysis available."}`;

  // Convert messages array to proper format
  const formattedMessages = (messages || []).map(m => ({
    role: m.role,
    content: m.content
  }));

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...formattedMessages
    ],
    temperature: 0.15,
    max_tokens: 1024,
    stream: true
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.choices?.[0]?.delta?.content;
            if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
          } catch(e) {}
        } else if (line === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
        }
      }
    }
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
