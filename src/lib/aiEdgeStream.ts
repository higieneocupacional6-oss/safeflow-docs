import { supabase } from "@/integrations/supabase/client";

/**
 * Chama uma Edge Function de geração com IA que responde em fluxo NDJSON
 * (pings periódicos + {type:"result"} | {type:"error"}). Evita queda de conexão
 * em gerações longas. Não altera nenhum estado da tela: em falha, os dados
 * preenchidos permanecem e o usuário pode tentar de novo.
 */
export async function invocarGeracaoIa<T = any>(funcao: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
  let token = session.access_token;
  if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
    token = data.session.access_token;
  }
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcao}`;

  let resp: Response;
  try {
    const enviar = (accessToken: string) => fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    resp = await enviar(token);
    if (resp.status === 401) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) resp = await enviar(data.session.access_token);
    }
  } catch {
    throw new Error("Não foi possível conectar ao serviço de IA. Verifique a internet e tente novamente.");
  }

  const ctype = resp.headers.get("Content-Type") || "";
  if (resp.status === 401) throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
  if (!resp.ok || !ctype.includes("ndjson") || !resp.body) {
    let body: any = null;
    try { body = await resp.json(); } catch { /* sem corpo JSON */ }
    const msg = body?.error || body?.message || "";
    const texto = `${msg} ${JSON.stringify(body || {})}`;
    if (resp.status === 400 && /jwt|token|auth|authorization|unauthor|sess[aã]o/i.test(texto)) {
      throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
    }
    if (resp.ok && !msg) throw new Error("Resposta inesperada do serviço de IA.");
    throw new Error(msg || `A geração com IA falhou (código ${resp.status}). Tente novamente.`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const aplicarLinha = (line: string): T | undefined => {
    if (!line.trim()) return;
    let ev: any;
    try { ev = JSON.parse(line); } catch { return; }
    if (ev.type === "result") {
      if (saidaVaziaCliente(ev.output)) throw new Error("A IA retornou uma resposta vazia. Tente novamente — seus dados foram mantidos.");
      return ev.output as T;
    }
    if (ev.type === "error") throw new Error(ev.error || "A geração com IA falhou.");
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode() + "\n";
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const got = aplicarLinha(line);
        if (got !== undefined) return got;
      }
      if (done) break;
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    if (e instanceof Error && !(e instanceof TypeError)) throw e;
    throw new Error("A conexão com a IA foi interrompida. Tente novamente — seus dados foram mantidos.");
  }
  throw new Error("A geração com IA terminou sem resultado. Tente novamente — seus dados foram mantidos.");
}

/** Espelha saidaJsonVazia do aiStream: objeto/lista sem conteúdo aplicável. */
export function saidaVaziaCliente(valor: unknown): boolean {
  if (valor == null) return true;
  if (typeof valor === "string") return !valor.trim();
  if (typeof valor === "number" || typeof valor === "boolean") return false;
  if (Array.isArray(valor)) return valor.length === 0 || valor.every(saidaVaziaCliente);
  if (typeof valor === "object") {
    const vals = Object.values(valor as Record<string, unknown>);
    return vals.length === 0 || vals.every(saidaVaziaCliente);
  }
  return true;
}
