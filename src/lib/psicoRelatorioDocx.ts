import { indicadoresPreenchidos, matrizOcupada, nivelDeRisco, resumoPorGrupo, riscosParaPgr } from "@/lib/psicoRelatorio";
import type { PdfPayload } from "@/lib/psicoRelatorioPdf";
import { sortGroupsNumerically } from "@/lib/sortGes";

const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const esc = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const text = (value: unknown) => esc(value || "—").replace(/\n/g, "<br>");
const row = (label: string, value: unknown) => `<tr><th>${esc(label)}</th><td>${text(value)}</td></tr>`;
const heading = (number: string, title: string) => `<h1>${esc(`${number}. ${title}`)}</h1>`;

export function buildPsicossocialDocxHtml(payload: PdfPayload): string {
  const p = { ...payload, grupos: sortGroupsNumerically(payload.grupos) };
  const totalTrabalhadores = p.grupos.reduce((total, grupo) => total + (grupo.trabalhadores || 0), 0) || 1;
  const riscosPgr = riscosParaPgr(p.grupos);
  const indicadores = indicadoresPreenchidos(p.indicadores);
  const matriz = matrizOcupada(p.grupos);

  const gruposHtml = p.grupos.map((grupo) => `
    <h2>${text(grupo.setor)} — ${text(grupo.ghe)}</h2>
    <table class="kv"><tbody>
      ${row("Funções envolvidas", grupo.funcoes.join(", "))}
      ${row("Quantidade de trabalhadores", grupo.trabalhadores)}
      ${row("Descrição resumida das atividades", grupo.atividades)}
      ${row("Jornada / turno", grupo.jornada)}
      ${row("Características da organização do trabalho", grupo.organizacao)}
    </tbody></table>`).join("");

  const fatoresHtml = p.grupos.map((grupo) => `
    <h2>${text(grupo.setor)} — ${text(grupo.ghe)}</h2>
    ${grupo.fatores.map((fator) => `
      <h3>${text(fator.fator)} — Nível: ${text(fator.nivel)} | P${fator.probabilidade} x S${fator.severidade}</h3>
      <table class="kv"><tbody>
        ${row("Descrição", fator.descricao)}${row("Fonte / Causa", fator.fonte)}
        ${row("Situação de exposição", fator.situacao)}${row("Trabalhadores expostos", fator.expostos)}
        ${row("Frequência", fator.frequencia)}${row("Interpretação técnica", fator.interpretacao)}
        ${row("Consequências potenciais", fator.consequencias)}${row("Controles existentes", fator.controles)}
      </tbody></table>`).join("")}`).join("");

  const resultadosHtml = p.grupos.map((grupo) => {
    const resumo = resumoPorGrupo(grupo);
    return `<tr><td>${text(`${grupo.setor} — ${grupo.ghe}`)}</td><td>${resumo.investigados}</td><td>${resumo.cont.Baixo}</td><td>${resumo.cont["Médio"]}</td><td>${resumo.cont.Alto}</td><td>${resumo.cont["Crítico"]}</td><td>${text(resumo.predominante)}</td><td>${Math.round(((grupo.trabalhadores || 0) / totalTrabalhadores) * 100)}%</td></tr>`;
  }).join("");

  const matrizHtml = [4, 3, 2, 1].map((severidade) => `<tr><th>Severidade ${severidade}</th>${[1, 2, 3, 4].map((probabilidade) => {
    const nivel = nivelDeRisco(probabilidade, severidade);
    return `<td class="nivel-${nivel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}">${matriz[`${probabilidade}-${severidade}`] || "—"}<br><small>${text(nivel)}</small></td>`;
  }).join("")}</tr>`).join("");

  const indicadoresHtml = [...indicadores.numericos.map((item) => `<tr><td>${text(item.label)}</td><td>${text(item.texto)}</td></tr>`), ...indicadores.qualitativos.map((item) => `<tr><td>${text(item.label)}</td><td>${text(item.texto)}</td></tr>`)].join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e1e1e; line-height: 1.35; }
    .cover { text-align: center; margin-top: 110pt; page-break-after: always; }
    .cover h1 { color: #173a5e; font-size: 24pt; border: 0; margin-bottom: 10pt; }
    .cover h2 { color: #173a5e; font-size: 16pt; margin: 0 0 28pt; }
    h1 { color: #173a5e; font-size: 13pt; border-bottom: 2px solid #173a5e; padding-bottom: 5pt; margin: 18pt 0 9pt; page-break-after: avoid; }
    h2 { color: #173a5e; font-size: 11pt; margin: 14pt 0 6pt; page-break-after: avoid; }
    h3 { background: #eef2f6; color: #173a5e; font-size: 9.5pt; padding: 5pt; margin: 10pt 0 0; page-break-after: avoid; }
    p { margin: 4pt 0 8pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt; }
    th, td { border: 1px solid #cdd5e0; padding: 4pt; vertical-align: top; }
    thead th, .kv th { background: #173a5e; color: #ffffff; font-weight: bold; text-align: left; }
    .kv th { width: 28%; }
    .nivel-baixo { background: #d1fae5; } .nivel-medio { background: #fef3c7; }
    .nivel-alto { background: #ffedd5; } .nivel-critico { background: #fee2e2; }
    .assinaturas { margin-top: 48pt; border: 0; } .assinaturas td { border: 0; text-align: center; width: 50%; padding: 0 18pt; }
    .linha { border-top: 1px solid #333; padding-top: 5pt; }
  </style></head><body>
    <div class="cover"><h1>RELATÓRIO TÉCNICO DE</h1><h2>AVALIAÇÃO PSICOSSOCIAL</h2><p style="text-align:center">NR-01 · NR-17 — Gerenciamento de Riscos Psicossociais</p><h2>${text(p.empresa?.razao_social)}</h2><p style="text-align:center">${text(p.titulo)}</p></div>
    ${heading("1", "Identificação da empresa")}
    <table class="kv"><tbody>${row("Razão social", p.empresa?.razao_social)}${row("Nome fantasia", p.identificacao.nome_fantasia)}${row("CNPJ", p.identificacao.cnpj)}${row("CNAE", p.identificacao.cnae)}${row("Endereço", p.identificacao.endereco)}${row("Unidade / Estabelecimento", p.identificacao.unidade)}${row("Contrato", p.contrato?.numero_contrato)}${row("Responsável pela avaliação", p.identificacao.responsavel_nome)}${row("Registro profissional", p.identificacao.responsavel_registro)}${row("Data da avaliação", p.identificacao.data_avaliacao)}${row("Versão", p.registros.versao)}</tbody></table>
    ${heading("2", "Identificação dos setores / GHE-GES")}${gruposHtml || "<p>Nenhum setor avaliado.</p>"}
    ${heading("3", "Metodologia utilizada")}<p>${text(p.metodologia)}</p>
    ${heading("4", "Fatores de risco psicossocial investigados")}<p>Todas as dimensões investigadas são apresentadas, independentemente do resultado, mantendo a rastreabilidade integral da avaliação.</p>${fatoresHtml || "<p>Nenhum fator investigado.</p>"}
    ${heading("5", "Resultado da avaliação")}<table><thead><tr><th>Setor / GHE</th><th>Investig.</th><th>Baixo</th><th>Médio</th><th>Alto</th><th>Crítico</th><th>Predominante</th><th>% trab.</th></tr></thead><tbody>${resultadosHtml}</tbody></table>
    ${heading("6", "Matriz de risco — Probabilidade x Severidade")}<table><thead><tr><th></th><th>P1</th><th>P2</th><th>P3</th><th>P4</th></tr></thead><tbody>${matrizHtml}</tbody></table>
    <h2>6.1 Riscos recomendados para gerenciamento no PGR</h2><table><thead><tr><th>Setor</th><th>GHE/GES</th><th>Fator investigado</th><th>Resultado</th><th>Intervenção</th><th>Justificativa técnica</th></tr></thead><tbody>${riscosPgr.map((risco) => `<tr><td>${text(risco.setor)}</td><td>${text(risco.ghe)}</td><td>${text(risco.fator)}</td><td>${text(risco.resultado)}</td><td>${text(risco.intervencao)}</td><td>${text(risco.justificativa)}</td></tr>`).join("")}</tbody></table>
    ${heading("7", "Medidas de prevenção e controle")}<table><thead><tr><th>Setor / GHE — Risco</th><th>Medida recomendada</th><th>Tipo</th><th>Prazo</th><th>Prioridade</th></tr></thead><tbody>${p.medidas.length ? p.medidas.map((medida) => `<tr><td>${text(`${medida.grupo} — ${medida.risco}`)}</td><td>${text(medida.medida)}</td><td>${text(medida.tipo)}</td><td>${text(medida.prazo)}</td><td>${text(medida.prioridade)}</td></tr>`).join("") : "<tr><td colspan=\"5\">Não aplicável</td></tr>"}</tbody></table>
    ${heading("8", "Indicadores organizacionais")}<table><thead><tr><th>Indicador</th><th>Informação registrada</th></tr></thead><tbody>${indicadoresHtml || "<tr><td colspan=\"2\">Não foram informados indicadores organizacionais.</td></tr>"}</tbody></table><h2>Análise técnica dos indicadores</h2><p>${text(p.interpretacaoIndicadores)}</p>
    ${heading("9", "Comparativo entre setores")}<table><thead><tr><th>Setor / GHE</th><th>Investigados</th><th>Baixo</th><th>Médio</th><th>Alto</th><th>Crítico</th><th>Trabalhadores</th></tr></thead><tbody>${p.grupos.map((grupo) => { const r = resumoPorGrupo(grupo); return `<tr><td>${text(`${grupo.setor} — ${grupo.ghe}`)}</td><td>${r.investigados}</td><td>${r.cont.Baixo}</td><td>${r.cont["Médio"]}</td><td>${r.cont.Alto}</td><td>${r.cont["Crítico"]}</td><td>${grupo.trabalhadores || "—"}</td></tr>`; }).join("")}</tbody></table>
    ${heading("10", "Conclusão técnica")}<p>${text(p.conclusao)}</p>
    ${heading("11", "Plano de ação")}<p>${text(p.introPlanoAcao)}</p><table><thead><tr><th>Risco</th><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>${p.medidas.length ? p.medidas.map((medida) => `<tr><td>${text(`${medida.grupo} — ${medida.risco}`)}</td><td>${text(medida.medida)}</td><td>${text(medida.responsavel)}</td><td>${text(medida.prazo)}</td><td>${text(medida.prioridade)}</td><td>${text(medida.status)}</td></tr>`).join("") : "<tr><td colspan=\"6\">Não aplicável</td></tr>"}</tbody></table>
    ${heading("12", "Responsáveis e registros")}<table class="kv"><tbody>${row("Profissional responsável", p.identificacao.responsavel_nome)}${row("Registro profissional", p.identificacao.responsavel_registro)}${row("Aplicador da avaliação", p.registros.aplicador)}${row("Responsável da empresa", p.registros.responsavel_empresa)}${row("Data", p.registros.data || p.identificacao.data_avaliacao)}${row("Versão do documento", p.registros.versao || "1.0")}</tbody></table>
    <table class="assinaturas"><tbody><tr><td><div class="linha">${text(p.identificacao.responsavel_nome)}<br>Profissional responsável</div></td><td><div class="linha">${text(p.registros.responsavel_empresa)}<br>Responsável da empresa</div></td></tr></tbody></table>
  </body></html>`;
}

export async function gerarDocxPsicossocial(payload: PdfPayload): Promise<{ blob: Blob; nome: string }> {
  const html = buildPsicossocialDocxHtml(payload);
  const header = `<p style="font-family:Arial;font-size:8pt;color:#6e7682;border-bottom:1px solid #dce2ea">${text(payload.empresa?.razao_social)} — Relatório Técnico de Avaliação Psicossocial</p>`;
  const footer = `<p style="font-family:Arial;font-size:8pt;color:#6e7682;text-align:center">NR-01 · NR-17 — ${text(payload.identificacao.data_avaliacao)}</p>`;
  if (typeof window !== "undefined") {
    const browserGlobal = window as any;
    browserGlobal.global = browserGlobal;
    browserGlobal.process ||= { env: {} };
  }
  const mod: any = await import("@turbodocx/html-to-docx");
  const htmlToDocx = mod.default ?? mod;
  let output: any;
  try {
    output = await htmlToDocx(html, header, {
    pageSize: { width: 11906, height: 16838 },
    margins: { top: 1080, right: 850, bottom: 1080, left: 850, header: 420, footer: 420 },
    title: payload.titulo,
    subject: "Relatório Técnico de Avaliação Psicossocial",
    creator: "SegDoc",
    header: true,
    footer: true,
    pageNumber: true,
    skipFirstHeaderFooter: true,
    font: "Arial",
    fontSize: 19,
    table: { row: { cantSplit: true }, borderOptions: { size: 1, color: "CDD5E0" } },
    heading: {
      heading1: { font: "Arial", fontSize: 26, bold: true, keepNext: true },
      heading2: { font: "Arial", fontSize: 22, bold: true, keepNext: true },
      heading3: { font: "Arial", fontSize: 19, bold: true, keepNext: true },
    },
    lang: "pt-BR",
    decodeUnicode: true,
    }, footer);
  } catch (error) {
    throw new Error(`Falha ao converter o relatório para DOCX: ${error instanceof Error ? error.message : "erro desconhecido"}`);
  }
  const bytes = output instanceof Blob
    ? await output.arrayBuffer()
    : typeof output?.arrayBuffer === "function"
      ? await output.arrayBuffer()
      : output;
  const blob = new Blob([bytes], { type: MIME_DOCX });
  if (!blob.size) throw new Error("O arquivo DOCX gerado está vazio.");
  const empresa = String(payload.empresa?.razao_social || "empresa").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
  return { blob, nome: `Relatorio_Psicossocial_${empresa}.docx` };
}