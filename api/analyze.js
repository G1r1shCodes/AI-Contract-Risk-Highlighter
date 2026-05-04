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

  const systemPrompt = `You are a senior legal risk analyst specializing in commercial contract review. Your role is to protect the signing party by identifying clauses that create legal exposure, financial risk, or unfair obligations.

CRITICAL RULES — FOLLOW EXACTLY:
1. Output ONLY valid JSONL: one JSON object per line, no arrays, no markdown backticks, no prose
2. NEVER invent or paraphrase clauses — quotes must be EXACT VERBATIM substrings from the contract
3. Quotes must be 10–45 words. Copy the text character-for-character including punctuation
4. Every risk must have a concrete, specific real-world consequence — not generic legal boilerplate
5. Suggested fixes must be actionable alternative language, not vague advice
6. Confidence reflects how clearly the clause is problematic (1.0 = unambiguously risky)

─── LINE 1: SUMMARY (required, always first) ───
{"type":"summary","summary":"2-3 sentence professional assessment naming the top 2-3 risks and their severity"}

─── LINES 2+: RISKS (identify 6–12 risks) ───
{"type":"risk","id":<n>,"quote":"verbatim contract text, 10-45 words, exact substring","level":"high|medium|low","category":"Payment|IP|Liability|Termination|Confidentiality|Arbitration|Indemnity|Penalty|Scope|Governing Law|Ambiguity","title":"4–6 word risk title","explanation":"1-2 sentences: what makes this clause legally dangerous","impact":"Specific real-world consequence: financial loss amount, IP forfeiture, legal liability exposure, operational disruption — be concrete","suggestedFix":"Specific alternative clause text or key negotiation point the signing party should demand","confidence":<number 0.5-1.0>,"clauseRef":"Section/clause number if visible in contract, else empty string"}

RISK LEVEL CRITERIA:
- high: Could cause major financial loss (>1 month fees), IP forfeiture, unlimited liability, or prevent legal recourse
- medium: Unfavorable terms worth negotiating; creates disadvantage but not catastrophic
- low: Minor ambiguity, slight imbalance, or standard-but-worth-noting language

DO NOT output anything other than these JSONL lines. No explanations. No preamble. No markdown.`;

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
