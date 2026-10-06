import { supabase } from "@/integrations/supabase/client";

/**
 * Chama uma Edge Function de geração com IA que responde em fluxo NDJSON
 * (pings periódicos + {type:"result"} | {type:"error"}). Evita queda de conexão
 * em gerações longas. Não altera nenhum estado da tela: em falha, os dados
 * preenchidos permanecem e o usuário pode tentar de novo.
 */
export async function invocarGeracaoIa<T = any>(funcao: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcao}`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${session?.access_token || anon}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível conectar ao serviço de IA. Verifique a internet e tente novamente.");
  }

  const ctype = resp.headers.get("Content-Type") || "";
  if (!resp.ok || !ctype.includes("ndjson") || !resp.body) {
    let msg = "";
    try { msg = (await resp.json())?.error || ""; } catch { /* sem corpo JSON */ }
    if (resp.ok && !msg) msg = "Resposta inesperada do serviço de IA.";
    throw new Error(msg || `A geração com IA falhou (código ${resp.status}). Tente novamente.`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev: any;
        try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === "result") return ev.output as T;
        if (ev.type === "error") throw new Error(ev.error || "A geração com IA falhou.");
      }
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    if (e instanceof Error && !(e instanceof TypeError)) throw e;
    throw new Error("A conexão com a IA foi interrompida. Tente novamente — seus dados foram mantidos.");
  }
  throw new Error("A geração com IA terminou sem resultado. Tente novamente — seus dados foram mantidos.");
}
