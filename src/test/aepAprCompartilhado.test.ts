import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { codigoFatorApr, exposicoesAep, exposicoesApr, exposicaoUnica, mesclarAprExposicoes, mesclarAepExposicoes, type ExposicaoAtividade } from "@/lib/aepAprCompartilhado";
import { ESTIMATIVAS_APR, INTENSIDADES_APR, perfilApr } from "../../supabase/functions/_shared/aprErgoPlanilha";
import { textoPdfApr } from "@/lib/aprErgoPdf";
const fonte: ExposicaoAtividade = { atividade_id: "atividade-uuid", atividade_numero: 2, codigo_aep: "04.01.002", duracao: 3, intensidade: 5 };
const linha = { exigencia: "Postura sentada por longos períodos", estimativa: "", intensidade: "", fotos: ["original"], circunstancia: "Texto manual", severidade: "manual" };
describe("AEP e APR: mesma exposição por atividade", () => {
 it("AEP primeiro: transfere D3, I5 e ID da atividade, sem mudar a matriz", () => {
  const dados = { atividade_ids: ["outra", fonte.atividade_id], reconhecimento: { marcas: { "04.01.002": { D3: "X", I5: "X", A2: "X" } } } };
  const [apr] = mesclarAprExposicoes([linha], exposicoesAep(dados));
  expect(apr.atividade_id).toBe("atividade-uuid"); expect(apr.estimativa).toBe(ESTIMATIVAS_APR[2][0]); expect(apr.intensidade).toBe(INTENSIDADES_APR[4][0]);
  expect(perfilApr(apr.estimativa, apr.intensidade)).toBe(perfilApr(ESTIMATIVAS_APR[2][0], INTENSIDADES_APR[3][0]));
  expect(apr.fotos).toEqual(["original"]); expect(apr.circunstancia).toBe("Texto manual"); expect(apr.severidade).toBe("manual");
 });
 it("APR primeiro: recupera os mesmos D/I/A e ID após serializar e reabrir", () => {
  const [apr] = mesclarAprExposicoes([linha], [fonte]);
  const aep = mesclarAepExposicoes({ marcas: {} }, exposicoesApr(JSON.parse(JSON.stringify([apr]))));
  expect(aep.marcas["04.01.002"]).toEqual({ D3: "X", I5: "X", A2: "X" });
  expect(aep.compartilhado?.[0].atividade_id).toBe("atividade-uuid");
 });
 it("edições da fonte sincronizam apenas campos anteriormente importados", () => {
  const [apr] = mesclarAprExposicoes([linha], [fonte]);
  const [atualizado] = mesclarAprExposicoes([apr], [{ ...fonte, duracao: 4 }]);
  expect(atualizado.estimativa).toBe(ESTIMATIVAS_APR[3][0]);
  const [manual] = mesclarAprExposicoes([{ ...apr, estimativa: ESTIMATIVAS_APR[0][0] }], [{ ...fonte, duracao: 4 }]);
  expect(manual.estimativa).toBe(ESTIMATIVAS_APR[0][0]);
 });
 it("preserva marcas manuais e ambíguas sem duplicar o vínculo", () => {
  const rec = { marcas: { "04.01.002": { D1: "X", I2: "X", A1: "X" } } };
  const uma = mesclarAepExposicoes(rec, [fonte]); const duas = mesclarAepExposicoes(uma, [fonte]);
  expect(duas.marcas).toEqual(rec.marcas); expect(duas.compartilhado).toHaveLength(1);
  expect(exposicaoUnica([fonte, { ...fonte, duracao: 1 }], fonte.codigo_aep)).toBeUndefined();
 });
 it("não associa códigos divergentes da planilha, atividade diferente ou fator sem correspondência exata", () => {
  expect(codigoFatorApr({ exigencia: "Postura sentada por longos períodos" })).toBe("04.01.002");
  expect(codigoFatorApr({ exigencia: "outra postura" })).toBe("");
  expect(mesclarAprExposicoes([{ ...linha, atividade_id: "diferente" }], [fonte])[0].estimativa).toBe("");
 });
 it("remove o marcador legado em qualquer texto exportado sem remover o conteúdo técnico", () => {
  expect(textoPdfApr("Tarefa [IA validar]\nControle [IA · validar]")).toBe("Tarefa \nControle");
 });
});