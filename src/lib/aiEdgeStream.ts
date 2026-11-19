import { apiRequest } from "@/lib/apiClient";

/**
 * Chama a geração de IA no Express (NDJSON: ping + result|error).
 * Credenciais ficam só no servidor.
 */
export async function invocarGeracaoIa<T = any>(funcao: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let csrfToken = "";
  try {
    const csrf = await apiRequest<{ csrfToken: string }>("/api/auth/csrf");
    csrfToken = csrf.csrfToken;
  } catch {
    throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
  }

  let resp: Response;
  try {
    resp = await fetch(`/api/ai/${funcao}`, {
      method: "POST",
      signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível conectar ao serviço de IA. Verifique a internet e tente novamente.");
  }

  if (resp.status === 401) {
    throw new Error("Sessão expirada. Entre novamente para gerar a análise. Seus dados foram mantidos.");
  }

  const ctype = resp.headers.get("Content-Type") || "";
  if (!resp.ok || !ctype.includes("ndjson") || !resp.body) {
    let payload: any = null;
    try {
      payload = await resp.json();
    } catch {
      /* ignore */
    }
    throw new Error(payload?.error || `A geração com IA falhou (código ${resp.status}). Tente novamente.`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const aplicarLinha = (line: string): T | undefined => {
    if (!line.trim()) return;
    let ev: any;
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    if (ev.type === "result") {
      const output = ev.output ?? ev.data;
      if (saidaVaziaCliente(output)) {
        throw new Error(
          "A IA retornou uma resposta vazia ou sem campos aplicáveis ao formulário. Tente novamente — seus dados foram mantidos.",
        );
      }
      return output as T;
    }
    if (ev.type === "error") throw new Error(ev.error || "A geração com IA falhou.");
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();

      const lines = buffer.split("\n");
      // Mantém fragmento incompleto entre chunks; no fim processa tudo.
      buffer = done ? "" : (lines.pop() || "");

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
