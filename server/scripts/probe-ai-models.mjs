import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const redact = (s) => String(s || "").replace(/gsk_[A-Za-z0-9]+/g, "gsk_[redacted]").replace(/sk-or-v1-[A-Za-z0-9]+/g, "sk-or-[redacted]").replace(/AQ\.[A-Za-z0-9_-]+/g, "AQ.[redacted]");

async function probeGroq() {
  const key = process.env.GROQ_API_KEY;
  const configured = process.env.GROQ_MODEL;
  console.log("\n=== GROQ ===");
  console.log("configured:", configured);
  if (!key) return console.log("no key");
  const resp = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const raw = await resp.text();
  console.log("list status:", resp.status);
  if (!resp.ok) return console.log("error:", redact(raw).slice(0, 300));
  const data = JSON.parse(raw);
  const ids = (data.data || []).map((m) => m.id).sort();
  console.log("count:", ids.length);
  console.log("has configured exact:", ids.includes(configured));
  console.log("matches:", ids.filter((id) => id.includes("llama-3.3") || id.includes("70b") || id.includes(configured || "___")));
  console.log("sample:", ids.slice(0, 25).join(", "));

  const chat = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: configured,
      messages: [{ role: "user", content: 'Return {"ok":true}' }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  const chatRaw = await chat.text();
  console.log("chat status:", chat.status, redact(chatRaw).slice(0, 250));
}

async function probeGemini() {
  const key = process.env.GEMINI_API_KEY;
  const configured = process.env.GEMINI_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL;
  console.log("\n=== GEMINI ===");
  console.log("configured:", configured, "fallback:", fallback);
  if (!key) return console.log("no key");
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100`;
  const resp = await fetch(listUrl, { headers: { "x-goog-api-key": key } });
  const raw = await resp.text();
  console.log("list status:", resp.status);
  if (!resp.ok) {
    console.log("error:", redact(raw).slice(0, 400));
    // try query param
    const resp2 = await fetch(`${listUrl}&key=${encodeURIComponent(key)}`);
    console.log("list query-key status:", resp2.status, redact(await resp2.text()).slice(0, 200));
    return;
  }
  const data = JSON.parse(raw);
  const models = (data.models || []).map((m) => ({
    id: String(m.name || "").replace(/^models\//, ""),
    methods: m.supportedGenerationMethods || [],
  }));
  const gen = models.filter((m) => m.methods.includes("generateContent"));
  console.log("total:", models.length, "generateContent:", gen.length);
  const ids = gen.map((m) => m.id);
  console.log("has primary:", ids.includes(configured), "has fallback:", ids.includes(fallback));
  console.log("flash-lite-ish:", ids.filter((id) => /flash/i.test(id)).slice(0, 30).join(", "));

  const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configured)}:generateContent`;
  const g = await fetch(genUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: 'Return {"ok":true}' }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  console.log("generate status:", g.status, redact(await g.text()).slice(0, 250));
}

async function probeOpenRouter() {
  const key = process.env.OPENROUTER_API_KEY;
  const configured = process.env.OPENROUTER_MODEL;
  console.log("\n=== OPENROUTER ===");
  console.log("configured:", configured);
  if (!key) return console.log("no key");
  const resp = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}`, "X-Title": "SegCRM" },
  });
  console.log("list status:", resp.status);
  if (!resp.ok) return console.log("error:", redact(await resp.text()).slice(0, 300));
  const data = JSON.parse(await resp.text());
  const ids = (data.data || []).map((m) => m.id);
  console.log("count:", ids.length, "has configured:", ids.includes(configured));
  const chat = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "SegCRM" },
    body: JSON.stringify({
      model: configured,
      messages: [{ role: "user", content: 'Return {"ok":true}' }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  console.log("chat status:", chat.status, redact(await chat.text()).slice(0, 250));
}

await probeGroq();
await probeGemini();
await probeOpenRouter();
