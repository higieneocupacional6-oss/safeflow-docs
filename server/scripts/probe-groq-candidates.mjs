import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const key = process.env.GROQ_API_KEY;
const candidates = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "allam-2-7b"];
for (const model of candidates) {
  const chat = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Reply with json only." },
        { role: "user", content: 'Return json {"ok":true,"provider":"groq"}' },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  const raw = await chat.text();
  console.log(model, chat.status, raw.slice(0, 220).replace(/\s+/g, " "));
}
