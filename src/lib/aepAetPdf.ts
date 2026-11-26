import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateOnly } from "@/lib/dateOnly";
import {
  rotuloSimNao,
  type AepAetDados,
  type AepAetFoto,
} from "@/lib/aepAetFormulario";

export type AepAetPdfContexto = {
  empresaNome: string;
  contratoNome: string;
  dados: AepAetDados;
};

const M = 14;
const AZUL: [number, number, number] = [30, 58, 138];
const safe = (v: unknown) => (v == null || String(v).trim() === "" ? "—" : String(v));

function lastY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? M;
}

function ensureSpace(doc: jsPDF, y: number, need: number) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 16) {
    doc.addPage();
    return M;
  }
  return y;
}

function secao(doc: jsPDF, y: number, titulo: string) {
  y = ensureSpace(doc, y, 12);
  doc.setFillColor(...AZUL);
  doc.rect(M, y, doc.internal.pageSize.getWidth() - 2 * M, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(titulo, M + 2, y + 4.7);
  doc.setTextColor(20, 20, 20);
  return y + 10;
}

function pares(doc: jsPDF, y: number, rows: [string, string][]) {
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: M, right: M },
    styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "top" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, fillColor: [235, 237, 241] },
      1: { cellWidth: "auto" },
    },
    body: rows.map(([k, v]) => [k, safe(v)]),
  });
  return lastY(doc) + 4;
}

function addFotos(doc: jsPDF, y: number, label: string, fotos: AepAetFoto[]) {
  if (!fotos.length) return y;
  y = ensureSpace(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${label} (${fotos.length})`, M, y);
  y += 3;

  const pageW = doc.internal.pageSize.getWidth();
  const usable = pageW - 2 * M;
  const gap = 3;
  const colW = (usable - gap) / 2;
  const maxH = 48;
  let col = 0;
  let rowTop = y;

  for (const foto of fotos) {
    if (!foto.imagem) continue;
    try {
      const props = doc.getImageProperties(foto.imagem);
      const scale = Math.min(colW / props.width, maxH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      if (col === 0) {
        rowTop = ensureSpace(doc, rowTop, h + 8);
      } else if (rowTop + h + 8 > doc.internal.pageSize.getHeight() - 16) {
        doc.addPage();
        rowTop = M;
        col = 0;
      }
      const x = M + col * (colW + gap) + (colW - w) / 2;
      doc.addImage(foto.imagem, props.fileType || "JPEG", x, rowTop, w, h);
      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        rowTop += maxH + 6;
      }
    } catch {
      // ignora imagem inválida
    }
  }
  if (col === 1) rowTop += maxH + 6;
  return rowTop + 2;
}

export function baixarAepAetPdf(ctx: AepAetPdfContexto) {
  const { dados, empresaNome, contratoNome } = ctx;
  const id = dados.identificacao;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...AZUL);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Formulário AEP / AET", M, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${safe(empresaNome)} · ${safe(contratoNome)}`, M, 16);
  doc.setTextColor(20, 20, 20);

  let y = 28;

  y = secao(doc, y, "1. Identificação");
  y = pares(doc, y, [
    ["Data da avaliação", formatDateOnly(id.data_avaliacao, id.data_avaliacao)],
    ["Colaborador avaliado", id.colaborador_avaliado],
    ["Setor", id.setor_avaliado],
    ["Função", id.funcao_avaliada],
    ["Qtd. colaboradores na função", id.qtd_colaboradores_funcao],
  ]);

  const va = dados.variabilidade;
  y = secao(doc, y, "2. Variabilidade");
  y = pares(doc, y, [
    ["Atividade sempre igual", rotuloSimNao(va.atividade_sempre_igual)],
    ["Atividades diferentes no dia", rotuloSimNao(va.atividades_diferentes_dia)],
    ["Rodízio de atividades", rotuloSimNao(va.rodizio_atividades)],
    ["Realiza horas extras", rotuloSimNao(va.realiza_horas_extras)],
    ["Frequência HE", va.frequencia_horas_extras],
    ["Observações", va.observacoes],
  ]);

  y = secao(doc, y, "3. Posturas de trabalho");
  y = pares(doc, y, [
    ["Posturas", dados.posturas.posturas.join(", ")],
    ["Outros", dados.posturas.outros_descricao],
  ]);
  y = addFotos(doc, y, "Fotos — posturas", dados.posturas.fotos);

  const mr = dados.movimentos_repetitivos;
  y = secao(doc, y, "4. Movimentos repetitivos");
  y = pares(doc, y, [
    ["Existem movimentos repetitivos", rotuloSimNao(mr.existem_movimentos_repetitivos)],
    ["Descrição", mr.descricao_atividade],
    ["Frequência", mr.frequencia],
  ]);
  y = addFotos(doc, y, "Fotos — movimentos", mr.fotos);

  const ef = dados.esforco_fisico;
  y = secao(doc, y, "5. Esforço físico");
  y = pares(doc, y, [
    [
      "Esforço",
      ef.sem_esforco ? "Sem esforço físico relevante" : ef.opcoes.join(", "),
    ],
    ["Peso estimado", ef.sem_esforco ? "—" : `${ef.peso_estimado} ${ef.unidade}`.trim()],
    ["Características da carga", ef.caracteristicas_carga],
    ["Frequência", ef.frequencia],
    ["Descrição", ef.descricao_atividade],
  ]);
  if (!ef.sem_esforco) y = addFotos(doc, y, "Fotos — esforço", ef.fotos);

  const mob = dados.mobiliario_equipamentos;
  y = secao(doc, y, "6. Mobiliário e equipamentos");
  if (mob.sem_mobiliario) {
    y = pares(doc, y, [["Situação", "Sem mobiliário"]]);
  } else {
    y = pares(doc, y, [
      [
        "Mesa (A×C×L / cor)",
        `${mob.mesa.altura_cm} × ${mob.mesa.comprimento_cm} × ${mob.mesa.largura_cm} cm / ${mob.mesa.cor}`,
      ],
      [
        "Cadeira (alt. × prof. × larg.)",
        `${mob.cadeira.altura_assento_cm} × ${mob.cadeira.profundidade_assento_cm} × ${mob.cadeira.largura_assento_cm} cm`,
      ],
      ["Altura do monitor", `${mob.monitor.altura_monitor} cm`],
      ["Distância aos olhos", `${mob.monitor.distancia_olhos} cm`],
      ["Distância teclado–borda", `${mob.monitor.distancia_teclado_borda} cm`],
    ]);
    y = addFotos(doc, y, "Fotos — mesa", mob.mesa.fotos);
    y = addFotos(doc, y, "Fotos — cadeira", mob.cadeira.fotos);
    y = addFotos(doc, y, "Fotos — monitor", mob.monitor.fotos);
  }

  const fe = dados.ferramentas_mobiliario;
  y = secao(doc, y, "7. Ferramentas e mobiliário operacional");
  y = pares(doc, y, [
    ["Itens", fe.sugestoes.join(", ")],
    ["Descrição", fe.descricao],
  ]);
  y = addFotos(doc, y, "Fotos — ferramentas", fe.fotos);

  const ca = dados.condicoes_ambientais;
  y = secao(doc, y, "8. Condições ambientais");
  y = pares(doc, y, [
    ["Iluminação", `${ca.iluminacao_lux} lux`],
    ["Ruído", `${ca.ruido_dba} dB(A)`],
    ["Temperatura", `${ca.temperatura_c} °C`],
    ["Exposição à vibração", rotuloSimNao(ca.vibracao_exposicao)],
    [
      "Vibração (valor)",
      ca.vibracao_exposicao === "sim"
        ? `${ca.vibracao_valor} ${ca.vibracao_unidade}`.trim()
        : "—",
    ],
  ]);
  y = addFotos(doc, y, "Fotos — ambiente", ca.fotos);

  const org = dados.organizacao_trabalho;
  y = secao(doc, y, "9. Organização do trabalho");
  y = pares(doc, y, [
    ["Meta de produção", rotuloSimNao(org.meta_producao)],
    ["Ritmo de máquina", rotuloSimNao(org.ritmo_maquina)],
    ["Rodízio de tarefas", rotuloSimNao(org.rodizio_tarefas)],
    ["Rodízio de colaboradores", rotuloSimNao(org.rodizio_colaboradores)],
    ["Pausas na atividade", rotuloSimNao(org.pausas_atividade)],
    ["Observações", org.observacoes],
  ]);

  y = secao(doc, y, "10. Cronoanálise");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: M, right: M },
    head: [["#", "Tarefa", "Tempo (min)", "Frequência"]],
    body: dados.cronoanalise.linhas.map((l, i) => [
      String(i + 1),
      safe(l.tarefa),
      safe(l.tempo_minutos),
      safe(l.frequencia),
    ]),
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.5, overflow: "linebreak" },
  });
  y = lastY(doc) + 4;

  const saude = dados.dados_saude;
  y = secao(doc, y, "11. Dados de saúde");
  y = pares(doc, y, [
    ["Sente desconforto físico", rotuloSimNao(saude.sente_desconforto)],
    ["Locais", saude.locais.join(", ")],
  ]);

  const sug = dados.sugestoes_melhoria;
  y = secao(doc, y, "12. Sugestões de melhoria");
  y = pares(doc, y, [
    ["Sugestões", sug.sugestoes],
    ["Observações", sug.observacoes],
  ]);
  y = addFotos(doc, y, "Fotos complementares", sug.fotos);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text("SafeFlow Docs · Formulário AEP/AET", M, 290);
    doc.text(`Página ${p} de ${pages}`, pageW - M, 290, { align: "right" });
  }

  const slug = (id.funcao_avaliada || "avaliacao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .toLowerCase() || "avaliacao";
  doc.save(`formulario-aep-aet-${slug}.pdf`);
}
