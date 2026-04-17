import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export type TemplateIssue = {
  tipo: string;
  mensagem: string;
  explicacao: string;
  correcao: string;
  severidade: "erro" | "aviso";
};

const KNOWN_VARS = [
  "descricao_atividades", "cbo_codigo", "cbo_descricao", "nome_funcao", "funcao",
  "agente_nome", "parecer_tecnico", "aposentadoria_especial",
  "nome_equipamento", "modelo_equipamento", "serie_equipamento", "data_avaliacao", "data_calibracao",
  "razao_social", "cnpj", "cnae_principal", "grau_risco", "endereco",
  "setor", "ghe_ges", "descricao_ambiente", "local_trabalho", "jornada_trabalho",
  "codigo_esocial", "descricao_esocial", "fonte_geradora", "danos_saude", "medidas_controle",
  "tipo_exposicao", "propagacao", "tipo_avaliacao", "tipo_agente",
  "resultado", "unidade_resultado", "limite_tolerancia", "unidade_limite",
  "epi_nome", "epi_ca", "epi_atenuacao", "epi_eficaz", "epc_nome", "epc_eficaz",
  "is_quimico", "is_fisico", "is_biologico", "is_ruido", "is_calor", "is_vibracao",
];

export function parseDocxErrors(err: any): TemplateIssue[] {
  if (err?.properties?.errors) {
    return err.properties.errors.map((e: any) => {
      const id = e.properties?.id || "unknown";
      const explanation = e.properties?.explanation || e.message || "Erro desconhecido";
      const xtag = e.properties?.xtag || "";

      let tipo = "Desconhecido";
      let correcao = "";

      if (id === "unopened_tag" || id === "unopened_loop") {
        tipo = "Loop fechado sem abertura";
        correcao = `Adicione {{#${xtag}}} antes de {{/${xtag}}} no template`;
      } else if (id === "unclosed_tag" || id === "unclosed_loop") {
        tipo = "Loop aberto sem fechamento";
        correcao = `Adicione {{/${xtag}}} após {{#${xtag}}} no template`;
      } else if (id === "closing_tag_does_not_match_opening_tag") {
        tipo = "Tag de fechamento não corresponde à abertura";
        correcao = `Verifique se {{#tag}} e {{/tag}} usam o mesmo nome`;
      } else if (id === "undefined_tag" || id === "scopeparser_execution_failed") {
        tipo = "Variável inexistente nos dados";
        const suggestion = KNOWN_VARS.find(
          k => k.toLowerCase().startsWith((xtag || "").toLowerCase().slice(0, 5)) || k.includes((xtag || "").replace(/s$/, ""))
        );
        correcao = suggestion
          ? `A variável {{${xtag}}} não existe. Você quis dizer {{${suggestion}}}?`
          : `A variável {{${xtag}}} não existe nos dados. Verifique o nome ou remova-a do template`;
      } else if (id === "raw_xml_tag_not_in_paragraph") {
        tipo = "Tag XML fora de parágrafo";
        correcao = "Mova a tag para dentro de um parágrafo no .docx";
      } else {
        correcao = explanation;
      }

      return {
        tipo: "Template",
        mensagem: `${tipo}: ${xtag || ""}`,
        explicacao: explanation,
        correcao,
        severidade: "erro" as const,
      };
    });
  }
  return [{
    tipo: "Template",
    mensagem: "Erro genérico no template",
    explicacao: err?.message || String(err),
    correcao: "Verifique a estrutura do arquivo .docx",
    severidade: "erro",
  }];
}

/**
 * Compila o .docx e tenta renderizar com um payload de exemplo
 * para detectar tags inválidas, loops desbalanceados, etc.
 */
export async function validateDocxTemplate(file: File): Promise<TemplateIssue[]> {
  const issues: TemplateIssue[] = [];

  let doc: Docxtemplater;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });
  } catch (compileErr: any) {
    return parseDocxErrors(compileErr);
  }

  // Sample payload — espelha o shape real do LTCAT para validar loops e variáveis
  const samplePayload: any = {
    empresa: "Empresa Exemplo", razao_social: "Empresa Exemplo", cnpj: "00.000.000/0001-00",
    cnae_principal: "0000-0/00", grau_risco: "1", endereco: "Endereço",
    local_trabalho: "Local", jornada_trabalho: "44h",
    setores: [{
      setor: "Setor A", ghe_ges: "GHE 01", descricao_ambiente: "Descrição",
      local_trabalho: "Local", jornada_trabalho: "44h", funcoes_ges: "Func A",
      funcao: "Auxiliar", descricao_atividade: "Atividade",
      riscos: [{
        agente_nome: "Ruído contínuo", tipo_agente: "FISICO",
        is_quimico: false, is_fisico: true, is_biologico: false,
        is_ruido: true, is_calor: false, is_vibracao: false,
        codigo_esocial: "01.01.001", descricao_esocial: "Descrição eSocial",
        fonte_geradora: "Fonte", propagacao: "Aérea", tipo_exposicao: "Habitual",
        danos_saude: "Danos", medidas_controle: "Medidas",
        tecnica_amostragem: "NHO-01", tempo_coleta: "60", unidade_tempo_coleta: "min",
        parecer_tecnico: "Parecer", aposentadoria_especial: "NÃO CARACTERIZADO",
        avaliacoes: [{
          data_avaliacao: "01/01/2025", colaborador: "João", funcao: "Auxiliar",
          cbo_codigo: "0000", codigo_esocial: "01.01.001",
          resultado: "85", unidade_resultado: "dB", limite_tolerancia: "85",
          unidade_limite: "dB", situacao: "Segura", cod_gfip: "00",
          dose_percentual: "50",
        }],
        equipamentos_avaliacao: [{
          nome_equipamento: "Dosímetro", modelo_equipamento: "X1",
          serie_equipamento: "123", data_avaliacao: "01/01/2025", data_calibracao: "01/01/2024",
        }],
        epis: [{ epi_nome: "Protetor", epi_ca: "1234", epi_atenuacao: "20dB", epi_eficaz: "Sim" }],
        epcs: [{ epc_nome: "Enclausuramento", epc_eficaz: "Sim" }],
      }],
    }],
    riscos: [],
  };

  try {
    doc.render(samplePayload);
  } catch (renderErr: any) {
    issues.push(...parseDocxErrors(renderErr));
  }

  return issues;
}
