import { test, expect } from "vitest";
import { montarDocumento } from "@/lib/formularioAepPdf";
import { CATEGORIAS, COLUNAS } from "@/components/formulario-aep/EtapaReconhecimento";
test("PDF do Formulário AEP tem exatamente 2 páginas mesmo com conteúdo longo", async () => {
  const marcas: any = {};
  CATEGORIAS.forEach(([, it]) => it.forEach((i) => { marcas[i.split(":")[0]] = Object.fromEntries(COLUNAS.map((c) => [c, "X"])); }));
  const longo = "Texto longo de descrição da atividade com bastante conteúdo técnico ".repeat(6);
  const linhas = [1,2,3,4,5].map(() => ({ texto: longo, marcas: { AF: "2", PI: "X" } }));
  const blob = montarDocumento({ empresaNome: "FLORESTAS ENGENHARIA LTDA", contratoNome: "SERRA LESTE", ident: { gerencia_executiva: "GE", gerencia: "G", local_fisico: "S11D", nome_gere: "GERE 08", codigo_gere: "08", horario_avaliacao: "08h", jornada: "07h às 17h", expostos: "12", descricao: longo.repeat(2) }, funcoesNomes: ["Operador de Harvester", "Técnico de Segurança"], atividades: linhas, controles: linhas, reconhecimento: { marcas, participantes: { avaliador: "Fulano", avaliado: "Ciclano", data: "2026-10-20", assinatura: "" }, ia: { "04.01.002": { origem: "inferido", validar: true, fundamento: "x" } } } });
  expect(blob.getNumberOfPages()).toBe(2);
});
