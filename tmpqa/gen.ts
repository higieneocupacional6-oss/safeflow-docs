import { construirGrupos, medidasDosGrupos, conclusaoTecnica, metodologiaTexto, type VinculoFuncao } from "../src/lib/psicoRelatorio";
import { BLOCOS_COPSOQ } from "../src/lib/copsoqBlocos";
import { gerarPdfPsicossocial } from "../src/lib/psicoRelatorioPdf";

const vinc = new Map<string, VinculoFuncao>();
vinc.set("operador de produção".normalize("NFD").replace(/[\u0300-\u036f]/g,""), { setor: "Produção", ghe: "GHE-01", expostos: 12, atividades: "Operar máquinas de envase; realizar inspeção visual dos produtos, registrar dados de produção. Efetuar limpeza do posto de trabalho" } as any);
vinc.set("auxiliar de producao", { setor: "Produção", ghe: "GHE-01", expostos: 5, atividades: "" } as any);
vinc.set("analista administrativo", { setor: "Administrativo", ghe: "GHE-02", expostos: 4, atividades: "Emitir relatórios gerenciais; atender clientes internos; conferir documentos fiscais" } as any);

const mk = (funcao: string, alto: boolean) => ({
  funcao_nome: funcao,
  respostas: Object.fromEntries(BLOCOS_COPSOQ.map(b => [b.key, b.perguntas.map((_, i) => (alto && b.key === "exigencias" ? 100 : 20))])),
});
const respostas = [mk("Operador de Produção", true), mk("Auxiliar de Produção", false), mk("Analista Administrativo", false)];
const grupos = construirGrupos(respostas, vinc, "44 horas semanais, turno diurno");
const medidas = medidasDosGrupos(grupos);
gerarPdfPsicossocial({
  empresa: { razao_social: "Indústria Ação & Coração Ltda.", nome_fantasia: "Ação" },
  contrato: { numero_contrato: "CT-2026/001" },
  identificacao: { nome_fantasia: "Ação", cnpj: "12.345.678/0001-90", cnae: "10.99-6-99", endereco: "Rua São João, 123 — Belém/PA", unidade: "Unidade I", responsavel_nome: "Maria Conceição", responsavel_registro: "CRP 10/1234", data_avaliacao: "30/08/2026" },
  metodologia: metodologiaTexto({ periodo: "Agosto/2026", participacao: "88%", observacao: "in loco", respondentes: 3 }),
  grupos, medidas,
  conclusao: conclusaoTecnica(grupos, "Indústria Ação & Coração Ltda."),
  indicadores: { absenteismo: "3,2", rotatividade: "11", horas_extras: "18", queixas: "2" },
  historico: "Não há avaliação anterior disponível para comparação.",
  registros: { aplicador: "João Inácio", responsavel_empresa: "Antônio Sérgio", data: "30/08/2026", versao: "1.0" },
  titulo: "Avaliação Psicossocial 2026",
});
