export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Groq API Key missing in Vercel ENVs" });

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

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });
    if (!groqRes.ok) return res.status(groqRes.status).json({ error: await groqRes.text() });
    
    const data = await groqRes.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
