import { describe, expect, it } from "vitest";
import {
  filtrarAvaliacoesErgonomicas,
  filtrarDocumentosAepAet,
  montarContextoErgoIntegrado,
  resumirDadosAepAet,
} from "../../supabase/functions/_shared/contextoErgoIntegrado";

describe("contextoErgoIntegrado", () => {
  const escopo = {
    empresaId: "e1",
    contratoId: "c1",
    setorId: "s1",
    funcaoIds: ["f1"],
    funcaoNomes: ["Operador"],
  };

  it("keeps only exact AEP-AET docs and strips photos", () => {
    const docs = [
      {
        id: "d1",
        status: "salvo",
        updated_at: "2026-01-02",
        draft_snapshot: {
          setor_id: "s1",
          funcao_id: "f1",
          dados: {
            identificacao: { funcao_avaliada: "Operador" },
            posturas: { posturas: ["Sentado"], fotos: [{ id: "x", imagem: "data:huge" }] },
          },
        },
      },
      {
        id: "d2",
        status: "rascunho",
        updated_at: "2026-01-03",
        draft_snapshot: { setor_id: "s1", funcao_id: "f1", dados: { identificacao: {} } },
      },
      {
        id: "d3",
        status: "salvo",
        updated_at: "2026-01-01",
        draft_snapshot: { setor_id: "s2", funcao_id: "f1", dados: { identificacao: {} } },
      },
    ];
    const out = filtrarDocumentosAepAet(docs, escopo);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("d1");
    expect((out[0].dados.posturas as any).fotos).toBeUndefined();
    expect((out[0].dados.posturas as any).posturas).toEqual(["Sentado"]);
  });

  it("filters ergonomic assessments by setor_ref + function name", () => {
    const rows = [
      { id: "a1", ferramenta: "RULA", funcao: "Operador", setor_ref: "s1", escore_final: 5, classificacao: "Alto", created_at: "2026-01-02" },
      { id: "a2", ferramenta: "RULA", funcao: "Outra", setor_ref: "s1", escore_final: 3, created_at: "2026-01-03" },
      { id: "a3", ferramenta: "RULA", funcao: "Operador", setor_ref: "s9", escore_final: 7, created_at: "2026-01-04" },
      { id: "a4", ferramenta: "STRAIN_INDEX", funcao: "Operador", setor_ref: "s1", escore_final: 1, created_at: "2026-01-05" },
    ];
    const out = filtrarAvaliacoesErgonomicas(rows, escopo);
    expect(out.map((r) => r.id)).toEqual(["a1"]);
    expect(out[0].escore_final).toBe(5);
  });

  it("returns empty context without inventing when nothing matches", () => {
    const ctx = montarContextoErgoIntegrado([], []);
    expect(ctx.disponivel).toBe(false);
    expect(ctx.formulario_aep_aet).toEqual([]);
    expect(ctx.avaliacoes_ergonomicas).toEqual([]);
  });

  it("resumirDadosAepAet drops photo payloads", () => {
    const r = resumirDadosAepAet({
      sugestoes_melhoria: { sugestoes: "ok", observacoes: "", fotos: [{ id: "1", imagem: "x" }] },
    });
    expect((r.sugestoes_melhoria as any).fotos).toBeUndefined();
    expect((r.sugestoes_melhoria as any).sugestoes).toBe("ok");
  });
});
