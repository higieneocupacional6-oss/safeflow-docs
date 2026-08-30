import { construirGrupos, medidasDosGrupos, conclusaoTecnica, metodologiaTexto, planoAcaoTexto, interpretarIndicadores, type VinculoFuncao } from "./src/lib/psicoRelatorio";
import { BLOCOS_COPSOQ } from "./src/lib/copsoqBlocos";
import { gerarPdfPsicossocial } from "./src/lib/psicoRelatorioPdf";

const vinc = new Map<string, VinculoFuncao>();
vinc.set("operador de producao", { setor: "Produção", ghe: "GHE 01", expostos: 24, atividades: "Operar máquinas injetoras; conferir peças; registrar produção; realizar limpeza do posto de trabalho" });
vinc.set("auxiliar administrativo", { setor: "Administrativo", ghe: "GHE 02", expostos: 8, atividades: "Emitir notas fiscais; atender telefone; organizar documentos" });

const mk = (funcao: string, base: number) => ({
  funcao_nome: funcao,
  respostas: Object.fromEntries(BLOCOS_COPSOQ.map((b, bi) => [b.key, b.perguntas.map((_, i) => (bi % 2 === 0 ? (base + i) % 5 : (base + i + 2) % 5))])),
});
const respostas = [mk("Operador de Produção", 4), mk("Operador de Produção", 3), mk("Auxiliar Administrativo", 1), mk("Auxiliar Administrativo", 0)];

const grupos = construirGrupos(respostas, vinc, "44 horas semanais, turno diurno");
const medidas = medidasDosGrupos(grupos);
const indicadores = { absenteismo: "6,2", rotatividade: "12", horas_extras: "28", queixas: "3", afastamentos: "0", pesquisas: "Pesquisa de clima aplicada em 2026 com 78% de satisfação geral" };

gerarPdfPsicossocial({
  empresa: { razao_social: "Indústria Superus Ltda. — Unidade São Paulo", jornada_trabalho: "44h" },
  contrato: { numero_contrato: "CT-2026-014" },
  identificacao: { nome_fantasia: "Superus", cnpj: "12.345.678/0001-90", cnae: "22.19-6/00", endereco: "Rua das Indústrias, 1200 - Distrito Industrial - São Paulo/SP", unidade: "Matriz", responsavel_nome: "Dra. Ana Paula Gonçalves", responsavel_registro: "CRP 06/123456", data_avaliacao: "20/08/2026" },
  metodologia: metodologiaTexto({ periodo: "05/08/2026 a 20/08/2026", participacao: "participação voluntária com apoio da CIPA", observacao: "observação direta nos postos de trabalho em 12/08/2026", respondentes: respostas.length, empresaNome: "Indústria Superus Ltda.", grupos }),
  grupos, medidas,
  conclusao: conclusaoTecnica(grupos, "Indústria Superus Ltda."),
  indicadores,
  historico: "Não há avaliação anterior disponível para comparação.",
  registros: { aplicador: "Carlos Menezes", responsavel_empresa: "João da Silva", data: "22/08/2026", versao: "1.0" },
  interpretacaoIndicadores: interpretarIndicadores(indicadores, grupos),
  introPlanoAcao: planoAcaoTexto(grupos, "Indústria Superus Ltda."),
  titulo: "Avaliação Psicossocial 2026",
});
