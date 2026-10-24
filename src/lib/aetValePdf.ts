import jsPDF from "jspdf";
import autoTable, { type CellInput } from "jspdf-autotable";
import type { AetValeDados, AetValeFoto } from "./aetVale";
import type { RiscoErgonomico } from "./aepRisco";
import { CHECKS_ETAPA2, TEXTOS_ETAPA2, type FatorVale } from "../../supabase/functions/_shared/aetValeIa";

export const CAMPOS_PDF_VALE = {
  gerencia_area: "Gerência de área", descricao_ambiente: "Descrição do ambiente", data_avaliacao: "Data da avaliação", revisao: "Revisão",
  nome_gere: "Nome do GERE", jornada: "Jornada de trabalho", cargo: "Cargo analisado", tarefa_analisada: "Tarefa analisada", descricao_cargo: "Descrição do cargo",
  origem_detalhe: "Detalhamento da origem", demanda_ergonomica: "Demanda ergonômica", descricao_tarefa: "Descrição da tarefa", analise_atividade: "Análise da atividade", verbalizacao: "Verbalização do Empregado",
} as const;
export const SECOES_PDF_VALE = [
  ["1. Características do posto de trabalho", ["posto", "mobiliario"], []],
  ["2. Avaliação do ambiente", ["iluminacao", "ventilacao", "temperatura", "ruido"], []],
  ["3. Partes do corpo envolvidas na atividade", ["corpo_outros"], ["corpo"]],
  ["4. Levantamento, transporte e descarga individual — PRO-028184", ["carga_comentarios"], ["pega", "piso", "peso", "altura_carga", "distancia_carga"]],
  ["5. Máquinas, equipamentos e ferramentas", ["maquinas_outros"], ["maquinas"]],
  ["6. Posturas adotadas durante o trabalho", ["posturas_outros"], ["posturas"]],
  ["7. Assento e condições dos postos — postura sentada", [], ["assento"]],
  ["8. Postura em pé", [], ["postura_pe"]],
  ["9. Organização do trabalho", ["normas_producao", "conteudo_tempo", "psicossociais", "ritmo", "exigencias_tempo", "conteudo_tarefas", "taxa_ocupacao", "operacoes_turno"], []],
  ["10. Medidas de controles existentes", ["engenharia", "administrativos"], ["controles"]],
  ["11. Existe local adequado para pausas?", [], ["local_pausa", "pausa"]],
  ["12. Descrição dos fatores de risco ergonômico", ["descricao_fatores"], []],
  ["13. Ferramentas de análise e resultados encontrados", ["resultados", "biomecanicos"], ["ferramentas"]],
  ["14. Conclusão / Diagnóstico", ["conclusao"], []],
] as const;
export function nomePdfVale(empresa: string, funcao: string) {
  const seguro = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return `AET_VALE_${seguro(empresa) || "EMPRESA"}_${seguro(funcao) || "FUNCAO"}.pdf`;
}
export function gerarPdfVale(dados: AetValeDados, empresa: string, fatores: FatorVale[], aep: RiscoErgonomico[]): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = 14;
  const width = 182;
  const tabela = (head: string[], rows: string[][], weights?: number[]) => {
    const widths = (weights || head.map(() => 1)).map(w => width * w / (weights || head.map(() => 1)).reduce((a,b) => a+b,0));
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    const body: CellInput[][] = [];
    for (const row of rows) {
      const linhas = row.map((v,i) => doc.splitTextToSize(v || "—", widths[i] - 4) as string[]);
      const partes = Math.max(1, ...linhas.map(v => Math.ceil(v.length / 38)));
      for (let p=0; p<partes; p++) body.push(linhas.map(v => v.slice(p*38,(p+1)*38).join("\n")));
    }
    autoTable(doc, { startY: y, head: [head], body, theme: "grid", margin: { top: 18, bottom: 16, left: 14, right: 14 }, styles: { fontSize: 8, cellPadding: 2, textColor: 0, lineColor: 160, overflow: "linebreak" }, headStyles: { fillColor: 225, textColor: 0, fontStyle: "bold" }, columnStyles: Object.fromEntries(widths.map((w,i) => [i,{cellWidth:w}])), rowPageBreak: "avoid" });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  };
  const section = (title: string) => { if (y > 252) { doc.addPage(); y=18; } doc.setFillColor(225,225,225); doc.rect(14,y,width,9,"F"); doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0,0,0); doc.text(title,16,y+6,{maxWidth:178}); y+=12; };
  const campos = (keys: (keyof typeof CAMPOS_PDF_VALE)[]) => tabela(["Campo", "Informação"], keys.map(k => [CAMPOS_PDF_VALE[k], dados[k]]), [1,3]);
  const fotos = (items: AetValeFoto[]) => {
    for (let i=0;i<items.length;i+=2) {
      if (y+72 > 277) { doc.addPage(); y=18; }
      const pair = items.slice(i,i+2);
      for (const [j,f] of pair.entries()) {
        const x=14+j*93; doc.setDrawColor(160,160,160); doc.rect(x,y,89,66.9);
        if (f.imagem) { const props=doc.getImageProperties(f.imagem); const scale=Math.min(85/props.width,62.9/props.height); const w=props.width*scale,h=props.height*scale; doc.addImage(f.imagem,props.fileType,x+(89-w)/2,y+(66.9-h)/2,w,h); }
      }
      y+=69;
      tabela([`Foto ${i+1}`, `Foto ${i+2}`], [pair.map(f => f.descricao || "—")]);
    }
  };
  tabela(["ANEXO 04 — ANÁLISE ERGONÔMICA DO TRABALHO — AET (VALE)"], [[`Empresa: ${empresa}`]]);
  section("Dados gerais"); campos(["gerencia_area","descricao_ambiente","data_avaliacao","revisao"]);
  section("Identificação"); campos(["nome_gere","jornada","cargo","tarefa_analisada","descricao_cargo"]);
  section("Dados da AEP"); tabela(["Agente", "Fator", "Probabilidade", "Severidade", "Nível", "Justificativa", "Medidas"], aep.map(r => [r.tipo_agente,r.fator_risco,String(r.probabilidade || ""),String(r.severidade || ""),r.nivel_risco === "Crítico" ? "Muito Alto" : r.nivel_risco,r.justificativa,r.medidas].map(v => String(v || ""))),[1,2,1,1,1,2,2]);
  section("Origem da demanda"); tabela(["Origem", "Detalhamento"], [[dados.origens.join("; "), dados.origem_detalhe]]);
  section("Campos de análise"); campos(["demanda_ergonomica","descricao_tarefa","analise_atividade"]);
  section("Registro fotográfico"); fotos(dados.fotos);
  section("Verbalização"); campos(["verbalizacao"]);
  for (const [title, texts, checks] of SECOES_PDF_VALE) {
    section(title);
    if (title.startsWith("12.")) tabela(["Origem", "Circunstância / Fonte", "Situação", "Tipo", "Exposição", "Perfil", "Severidade", "Classificação"], fatores.map(f => [f.origem,f.circunstancia,f.situacao,f.tipo,f.estimativa,f.perfil,f.severidade,f.classificacao]),[1,3,2,1,2,1,1,1.5]);
    const rows: string[][] = [];
    for (const k of checks) { const [label,options] = CHECKS_ETAPA2[k]; rows.push([label, options.map(o => `${(dados.etapa2.checks[k] || []).includes(o) ? "[X]" : "[ ]"} ${o}`).join("\n")]); }
    for (const k of texts) rows.push([TEXTOS_ETAPA2[k],dados.etapa2.textos[k] || ""]);
    if (title.startsWith("14.")) for (const [id,texto] of Object.entries(dados.etapa2.diagnosticos)) { const f=fatores.find(v => v.id===id); rows.push([f ? `${f.circunstancia} — ${f.classificacao} (${f.origem})` : `Diagnóstico — ${id}`,texto]); }
    if (rows.length) tabela(["Campo", "Informação"],rows,[1,3]);
    if (title.startsWith("1.")) fotos(dados.etapa2.fotos);
  }
  section("15. Plano de ação — 5W2H");
  for (const [i,a] of dados.etapa2.plano.entries()) {
    const f=fatores.find(v => v.id===a.fator_id);
    tabela([`Ação ${i+1} — Risco e conclusão`, "Informação"], [[f?.circunstancia || a.fator_id || "—", dados.etapa2.diagnosticos[a.fator_id] || "—"]],[1,3]);
    tabela(["O quê", "Por quê", "Onde", "Quando", "Quem", "Como", "Quanto custa"], [[a.o_que,a.por_que,a.onde,a.quando || "A definir",a.quem || "A definir",a.como,a.quanto || "A definir"]],[2,2,1,1,1,2,1]);
  }
  if (!dados.etapa2.plano.length) tabela(["O quê", "Por quê", "Onde", "Quando", "Quem", "Como", "Quanto custa"],[]);
  const total=doc.getNumberOfPages();
  for(let p=1;p<=total;p++) { doc.setPage(p); doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.text(`AET (VALE) — ${empresa}`,14,10,{maxWidth:182}); doc.text(`Página ${p}/${total}`,196,289,{align:"right"}); }
  return doc.output("blob");
}