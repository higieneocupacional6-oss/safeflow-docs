import { describe, expect, it } from "vitest";
import {
  enumValidoGemini,
  erroTemporarioGemini,
  esperaProgressivaMs,
  filaModelosGemini,
  mensagemGeminiIndisponivel,
  MAX_TENTATIVAS_GEMINI,
  modeloFallbackGemini,
  orquestrarChamadasGemini,
  parsearJsonModelo,
  prepararSchemaGemini,
  saidaJsonVazia,
  textoRespostaGemini,
} from "../../supabase/functions/_shared/aiStream";
import { tokenJwtUsuario } from "../../supabase/functions/_shared/sessao";
import { ESTIMATIVAS_APR, INTENSIDADES_APR, SITUACOES_APR } from "../../supabase/functions/_shared/aprErgoPlanilha";

const enumsDoSchema = (n: any, acc: unknown[][] = []): unknown[][] => {
  if (!n || typeof n !== "object") return acc;
  if (Array.isArray(n.enum)) acc.push(n.enum);
  Object.values(n).forEach((v) => enumsDoSchema(v, acc));
  return acc;
};

describe("schema Gemini", () => {
  it("rejeita enum vazio ou inválido e preserva opções técnicas da APR-ERGO", () => {
    const opc = (v: readonly string[]) => ({ type: "string", enum: ["", ...new Set(v)] });
    const schema = {
      type: "object",
      properties: {
        linhas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              situacao: { type: "string", enum: [...SITUACOES_APR] },
              estimativa: opc(ESTIMATIVAS_APR.map((e) => e[0])),
              intensidade: opc(INTENSIDADES_APR.map((e) => e[0])),
            },
          },
        },
      },
    };
    const prepared = prepararSchemaGemini(schema) as any;
    const enums = enumsDoSchema(prepared);
    expect(enums.length).toBeGreaterThan(0);
    for (const e of enums) {
      expect(e.every(enumValidoGemini)).toBe(true);
      expect(e).not.toContain("");
    }
    expect(enums.some((e) => e.includes(SITUACOES_APR[0]))).toBe(true);
    expect(enums.some((e) => e.includes(ESTIMATIVAS_APR[0][0]))).toBe(true);
    expect(enums.some((e) => e.includes(INTENSIDADES_APR[0][0]))).toBe(true);
    const linha = prepared.properties.linhas.items;
    expect(linha.required).toContain("situacao");
    expect(linha.required).not.toContain("estimativa");
    expect(linha.required).not.toContain("intensidade");
  });
});

describe("resposta vazia e parsing JSON", () => {
  it("detecta saída vazia e aceita conteúdo aplicável", () => {
    expect(saidaJsonVazia(null)).toBe(true);
    expect(saidaJsonVazia({})).toBe(true);
    expect(saidaJsonVazia({ riscos_ergonomicos: [], checklist: [], parecer_ergonomia: "  " })).toBe(true);
    expect(saidaJsonVazia({ parecer_ergonomia: "Postura sentada prolongada." })).toBe(false);
    expect(saidaJsonVazia({ riscos_ergonomicos: [{ fator_risco: "Repetição" }] })).toBe(false);
  });

  it("extrai JSON de cerca markdown, string dupla e recorte", () => {
    expect(parsearJsonModelo('```json\n{"ok":true}\n```')).toEqual({ ok: true });
    expect(parsearJsonModelo('"{\\"ok\\":true}"')).toEqual({ ok: true });
    expect(parsearJsonModelo('raciocínio {"ok":true} fim')).toEqual({ ok: true });
    expect(() => parsearJsonModelo("")).toThrow();
    expect(() => parsearJsonModelo("sem json")).toThrow();
  });

  it("ignora partes de raciocínio na resposta Gemini", () => {
    expect(textoRespostaGemini({
      candidates: [{ content: { parts: [{ thought: true, text: "penso" }, { text: '{"ok":true}' }] } }],
    })).toBe('{"ok":true}');
    expect(textoRespostaGemini({ candidates: [{ content: { parts: [{ thought: true, text: "só pensamento" }] } }] })).toBe("");
  });
});

describe("retentativas e fallback Gemini", () => {
  it("classifica 503 e 429 como temporários e 400/403 como permanentes", () => {
    expect(erroTemporarioGemini(503, "This model is currently experiencing high demand")).toBe(true);
    expect(erroTemporarioGemini(429, "", "RESOURCE_EXHAUSTED")).toBe(true);
    expect(erroTemporarioGemini(400, "Invalid enum")).toBe(false);
    expect(erroTemporarioGemini(403, "API key not valid")).toBe(false);
    expect(esperaProgressivaMs(1)).toBe(1000);
    expect(esperaProgressivaMs(2)).toBe(2000);
    expect(MAX_TENTATIVAS_GEMINI).toBe(3);
  });

  it("só aceita fallback configurado e compatível, sem inventar modelo", () => {
    expect(modeloFallbackGemini(undefined)).toBeNull();
    expect(modeloFallbackGemini("")).toBeNull();
    expect(modeloFallbackGemini("sb_publishable_abc")).toBeNull();
    expect(modeloFallbackGemini("gpt-4o")).toBeNull();
    expect(modeloFallbackGemini("models/gemini-3.8-flash-lite")).toBe("gemini-3.8-flash-lite");
    expect(filaModelosGemini("gemini-3.8-flash", null)).toEqual(["gemini-3.8-flash"]);
    expect(filaModelosGemini("gemini-3.8-flash", "gemini-3.8-flash")).toEqual(["gemini-3.8-flash"]);
    expect(filaModelosGemini("gemini-3.8-flash", "models/gemini-3.8-flash-lite")).toEqual([
      "gemini-3.8-flash",
      "gemini-3.8-flash-lite",
    ]);
  });

  it("repete 503 até o sucesso, com espera progressiva, sem concatenar respostas", async () => {
    const waits: number[] = [];
    const modelos: string[] = [];
    let n = 0;
    const r = await orquestrarChamadasGemini({
      modelos: ["gemini-3.8-flash"],
      sleep: async (ms) => { waits.push(ms); },
      chamar: async (modelo) => {
        modelos.push(modelo);
        n += 1;
        if (n < 2) return { ok: false, status: 503, error: "high demand", retryable: true };
        return { ok: true, text: '{"parecer":"ok"}' };
      },
    });
    expect(r).toMatchObject({ ok: true, text: '{"parecer":"ok"}', tentativas: 2 });
    expect(modelos).toEqual(["gemini-3.8-flash", "gemini-3.8-flash"]);
    expect(waits).toEqual([1000]);
  });

  it("repete 429 até o limite e devolve mensagem de esgotamento", async () => {
    let n = 0;
    const r = await orquestrarChamadasGemini({
      modelos: ["gemini-3.8-flash"],
      sleep: async () => {},
      chamar: async () => {
        n += 1;
        return { ok: false, status: 429, error: "quota", retryable: true };
      },
    });
    expect(n).toBe(3);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(429);
      expect(r.error).toBe(mensagemGeminiIndisponivel());
      expect(r.error).toMatch(/dados foram mantidos/);
    }
    expect(r.tentativas).toBe(3);
  });

  it("usa o fallback configurado após 503 esgotado no modelo principal", async () => {
    const chamadas: string[] = [];
    const r = await orquestrarChamadasGemini({
      modelos: filaModelosGemini("gemini-3.8-flash", "gemini-3.8-flash-lite"),
      sleep: async () => {},
      chamar: async (modelo) => {
        chamadas.push(modelo);
        if (modelo === "gemini-3.8-flash") return { ok: false, status: 503, error: "high demand", retryable: true };
        return { ok: true, text: '{"ok":true}' };
      },
    });
    expect(chamadas).toEqual([
      "gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.8-flash",
      "gemini-3.8-flash-lite",
    ]);
    expect(r).toMatchObject({ ok: true, text: '{"ok":true}', modelo: "gemini-3.8-flash-lite", tentativas: 4 });
  });

  it("não tenta de novo em 400 e não envia resultado parcial", async () => {
    let n = 0;
    const r = await orquestrarChamadasGemini({
      modelos: ["gemini-3.8-flash", "gemini-3.8-flash-lite"],
      sleep: async () => { throw new Error("não deveria esperar"); },
      chamar: async () => {
        n += 1;
        return { ok: false, status: 400, error: "Invalid enum", retryable: false };
      },
    });
    expect(n).toBe(1);
    expect(r).toMatchObject({ ok: false, status: 400, error: "Invalid enum", tentativas: 1 });
  });
});

describe("token de sessão", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.sig";
  it("aceita Bearer JWT e recusa chave publishable ou token vazio", () => {
    expect(tokenJwtUsuario(`Bearer ${jwt}`)).toBe(jwt);
    expect(tokenJwtUsuario(`bearer ${jwt}`)).toBe(jwt);
    expect(tokenJwtUsuario("")).toBeNull();
    expect(tokenJwtUsuario("Bearer ")).toBeNull();
    expect(tokenJwtUsuario("Bearer sb_publishable_abc")).toBeNull();
    expect(tokenJwtUsuario(jwt)).toBe(jwt);
  });
});
