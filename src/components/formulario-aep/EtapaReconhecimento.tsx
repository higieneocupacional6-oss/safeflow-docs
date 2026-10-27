import { Fragment } from "react";
import { Input } from "@/components/ui/input";

export type ReconhecimentoState = {
  marcas: Record<string, Record<string, string>>;
  participantes: { avaliador: string; avaliado: string; data: string; assinatura: string };
  ia?: Record<string, { origem: string; validar: boolean; fundamento: string }>;
  compartilhado?: import("@/lib/aepAprCompartilhado").ExposicaoAtividade[];
};

export const reconhecimentoVazio = (): ReconhecimentoState => ({
  marcas: {},
  participantes: { avaliador: "", avaliado: "", data: "", assinatura: "" },
});

const filtrarMarca = (v: string) => {
  const s = v.toUpperCase().replace(/\s/g, "");
  if (s === "" || s === "X") return s;
  return s.replace(/[^0-9]/g, "").slice(0, 4);
};

export const DURACAO = [
  "1 - <12.5%:<1h/ turno de trabalho ou 5horas/semana",
  "2 - 12.5-25%:1 a 2hrs/ turno de trabalho ou 5 a 10horas/semana",
  "3 - 25-50%:2 a 4hrs/ turno de trabalho ou 10 a 20horas/semana",
  "4 - 50-87.5%:4 a 7hrs/ turno de trabalho ou 20 a 35 horas/semana",
  "5 - >87.5%:> 7hrs/ turno de trabalho ou 35 horas/semana",
];
export const INTENSIDADE = [
  "1 - Não perceptível/irrelevante",
  "2 - Detectada, dentro dos níveis de conforto.",
  "3 - Constatada podendo causar desconforto - dificuldade - fadiga",
  "4 - Constatada, por causar desconforto -dificuldade - fadiga, há queixas dos empregados.",
  "5 - Quando não é possível estimar a exigência ergonômica, ou a exigência é incerta.",
];
export const COLUNAS = [
  ...DURACAO.map((_, i) => `D${i + 1}`),
  ...INTENSIDADE.map((_, i) => `I${i + 1}`),
  ...[1, 2, 3, 4, 5].map((n) => `A${n}`),
];

const MATRIZ: [string, number[]][] = [
  ["E", [64, 96, 160, 288, 416]],
  ["D", [32, 48, 80, 144, 208]],
  ["C", [16, 24, 40, 72, 104]],
  ["B", [8, 12, 20, 36, 52]],
];
const corValor = (v: number) =>
  v >= 140 ? "bg-red-500/80 text-white" : v >= 70 ? "bg-orange-400/80" : v >= 25 ? "bg-amber-300/80" : "bg-emerald-400/80";
const NIVEIS = [
  [">= 140", "M. Alto", "bg-red-500/80 text-white"],
  ["70 - 140", "Alto", "bg-orange-400/80"],
  ["25 - 70", "Médio", "bg-amber-300/80"],
  ["< 25", "Baixo", "bg-emerald-400/80"],
];
const SEVERIDADE = [
  ["A", "São efeitos (dores, desconfortos, cansaço, etc.) que melhoram com um período de repouso durante a jornada de trabalho (pausas)"],
  ["B", "São efeitos (dores, desconfortos, cansaço, etc.) que melhoram com um período de repouso entre jornadas"],
  ["C", "São efeitos (dores, desconfortos, cansaço, etc.) que reduzem a capacidade de trabalho podendo gerar restrição ou necessidade de tempo de recuperação acima do descanso entre jornadas."],
  ["D", "São efeitos irreversíveis (doenças/lesões) que podem gerar necessidade de afastamento da atividade ou reavaliação da função"],
  ["E", "São efeitos irreversíveis (doenças/lesões) que podem gerar perda da capacidade laboral (necessidade de avaliação médica para exercer funções administrativas)"],
];
const PROBABILIDADE = [
  ["1 a 3", "1", "Raro"],
  ["4 a 7", "2", "Pouco Provável"],
  ["8 a 11", "3", "Ocasional"],
  ["12 a 16", "4", "Provável"],
  ["17 a 20", "5", "Frequente"],
];

export const CATEGORIAS: [string, string[]][] = [
  ["04.01 - Biomecânicos", [
    "04.01.001: Trabalho em posturas incômodas ou pouco confortáveis por longos períodos",
    "04.01.002: Postura sentada por longos períodos",
    "04.01.003: Postura de pé por longos períodos",
    "04.01.004: Frequente deslocamento a pé durante a jornada de trabalho",
    "04.01.005: Trabalho com esforço físico intenso",
    "04.01.006: Levantamento e transporte manual de cargas ou volumes",
    "04.01.007: Frequente ação de puxar/empurrar cargas ou volumes",
    "04.01.008: Frequente execução de movimentos repetitivos",
    "04.01.009: Manuseio de ferramentas e/ou objetos pesados por períodos prolongados",
    "04.01.010: Exigência de uso frequente de força, pressão, preensão, flexão, extensão ou torção dos segmentos corporais",
    "04.01.011: Compressões de partes do corpo por superfícies rígidas ou com quinas",
    "04.01.012: Exigência de flexões de coluna vertebral frequentes",
    "04.01.013: Uso frequente de pedais",
    "04.01.014: Uso frequente de alavancas",
    "04.01.015: Exigência de elevação frequente de membros superiores",
    "04.01.016: Manuseio ou movimentação de cargas e volumes sem prega ou com \"pega pobre\"",
    "04.01.017: Exposição a vibração de corpo inteiro",
    "04.01.018: Exposição a vibração localizada",
    "04.01.019: Uso frequente de escadas",
    "04.01.020: Trabalho intensivo com teclado ou outros dispositivos de entrada de dados",
  ]],
  ["04.02 - Mobiliários e equipamentos", [
    "04.02.001: Posto de trabalho improvisado",
    "04.02.002: Mobiliário sem meios de regulagem de ajuste",
    "04.02.004: Posto de trabalho não planejado/adaptado para a posição sentada",
    "04.02.005: Assento inadequado",
    "04.02.006: Encosto do assento inadequado ou ausente",
    "04.02.007: Mobiliário ou equipamento sem espaço para movimentação de segmentos corporais",
    "04.02.008: Trabalho com necessidade de alcançar objetos, documentos, controles ou qualquer ponto além das zonaas de alcance ideiais para as características antropométricas do trabalhador",
  ]],
  ["04.03 - Organizacionais", [
    "04.03.001: Trabalho realizado sem pausas pré-definidas para descanso",
    "04.03.002: Necessidade de manter ritmos intensos de trabalho",
    "04.03.003: Trabalho com necessidade de variação de turnos",
    "04.03.004: Monotonia",
    "04.03.005: Trabalho Noturno",
    "04.03.007: Trabalho com utilização rigorosa de metas de produção",
    "04.03.009: Cadência do trabalho imposta por um equipamento",
    "04.03.010: Desequilibrio entre tempo de trabalho e tempo de repouso",
  ]],
  ["04.04 - Ambientais", [
    "04.04.001: Condições de trabalho com níveis de pressão sonora fora dos parâmetros de conforto",
    "04.04.002: Condições de trabalho com índice de temperatura efetiva fora dos parâmetros de conforto",
    "04.04.005: Condições de trabalho com Iluminação diurna inadequada",
    "04.04.006: Condições de trabalho com Iluminação noturna inadequada",
    "04.04.007: Presença de reflexos em telas, painéis, vidros, monitores ou qualquer superfície, que causem desconforto ou prejudiquem a visualização",
    "04.04.008: Piso escorregadio e/ou irregular",
  ]],
  ["04.05 - Psicossociais/Cognitivos", [
    "04.05.001: Excesso de situações de estresse",
    "04.05.002: Situações de sobrecarga de trabalho mental",
    "04.05.003: Exigência de alto nível de concentração, atenção ou memória",
    "04.05.004: Trabalho em condições de difícil comunicação",
    "04.05.008: Trabalho com demandas divergentes (ordens divergentes, metas incompatíveis entre si, exigência de qualidade x quantidade, entre outras",
  ]],
];

const cel = "border border-border";
const TOTAL_COLS = 1 + COLUNAS.length;

export function EtapaReconhecimento({
  value, onChange,
}: { value: ReconhecimentoState; onChange: (v: ReconhecimentoState) => void }) {
  const setMarca = (codigo: string, col: string, v: string) =>
    onChange({
      ...value,
      marcas: { ...value.marcas, [codigo]: { ...(value.marcas[codigo] || {}), [col]: filtrarMarca(v) } },
    });
  const setPart = (k: keyof ReconhecimentoState["participantes"], v: string) =>
    onChange({ ...value, participantes: { ...value.participantes, [k]: v } });

  const vertical = (t: string) => (
    <th className={`${cel} h-60 p-0.5 align-bottom font-normal text-[8.5px] leading-[1.15]`}>
      <div className="mx-auto [writing-mode:vertical-rl] rotate-180 text-left h-56 max-w-full overflow-hidden break-words whitespace-normal">{t}</div>
    </th>
  );

  return (
    <div className="space-y-2">
      <h2 className="text-center text-sm font-semibold text-foreground">Anexo 01 - Formulário de Antecipação e Reconhecimento de Riscos</h2>
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full table-fixed border-collapse text-[10px]">
          <colgroup><col />{COLUNAS.map((c) => <col key={c} style={{ width: "3.1%" }} />)}</colgroup>
          <thead>
            <tr>
              <th colSpan={TOTAL_COLS} className={`${cel} bg-muted/60 py-2 text-sm font-bold`}>IV - RECONHECIMENTO E CLASSIFICAÇÃO</th>
            </tr>
            <tr>
              <th rowSpan={2} className={`${cel} p-2 align-top font-normal`}>
                <div className="flex gap-1.5">
                  <div className="flex-1 space-y-2">
                    <table className="w-full border-collapse text-[9px] leading-tight">
                      <thead>
                        <tr><th></th><th></th><th colSpan={5} className={`${cel} bg-muted`}>FREQUÊNCIA</th></tr>
                        <tr><th></th><th></th>{[1, 2, 3, 4, 5].map((n) => <th key={n} className={`${cel} bg-muted`}>{n}</th>)}</tr>
                      </thead>
                      <tbody>
                        {MATRIZ.map(([l, vals], i) => (
                          <tr key={l}>
                            {i === 0 && (
                              <td rowSpan={4} className={`${cel} bg-muted font-bold`}>
                                <div className="[writing-mode:vertical-rl] rotate-180 text-[9px]">SEVERIDADE</div>
                              </td>
                            )}
                            <td className={`${cel} bg-muted font-bold text-center`}>{l}</td>
                            {vals.map((v) => <td key={v} className={`${cel} text-center font-bold ${corValor(v)}`}>{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <table className="w-full border-collapse text-[9px] leading-tight">
                      <thead><tr><th colSpan={2} className={`${cel} bg-muted`}>Severidade</th></tr></thead>
                      <tbody>
                        {SEVERIDADE.map(([l, t]) => (
                          <tr key={l}><td className={`${cel} px-1 text-center`}>{l}</td><td className={`${cel} px-1 text-left`}>{t}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-[36%] shrink-0 space-y-2">
                    <table className="w-full border-collapse text-[9px] leading-tight">
                      <thead><tr><th colSpan={2} className={`${cel} bg-muted`}>Níveis de Risco</th></tr></thead>
                      <tbody>
                        {NIVEIS.map(([f, n, c]) => (
                          <tr key={n}><td className={`${cel} text-center font-bold ${c}`}>{f}</td><td className={`${cel} text-center font-bold`}>{n}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <table className="w-full border-collapse text-[9px] leading-tight">
                      <thead>
                        <tr><th colSpan={3} className={`${cel} bg-muted`}>Probabilidade</th></tr>
                        <tr><th className={cel}>Nível</th><th className={cel}>Índice</th><th className={cel}>Categoria</th></tr>
                      </thead>
                      <tbody>
                        {PROBABILIDADE.map(([n, i, c]) => (
                          <tr key={i}><td className={`${cel} text-center`}>{n}</td><td className={`${cel} text-center`}>{i}</td><td className={`${cel} text-center`}>{c}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </th>
              <th colSpan={5} className={`${cel} text-[10px] font-semibold`}>Duração Total da Exposição</th>
              <th colSpan={5} className={`${cel} text-[10px] font-semibold`}>Intensidade/Nível</th>
              <th colSpan={5} className={`${cel} text-[9px] font-semibold leading-tight`}>ID da Atividade Reconhecida</th>
            </tr>
            <tr>
              {DURACAO.map((t) => <Fragment key={t}>{vertical(t)}</Fragment>)}
              {INTENSIDADE.map((t) => <Fragment key={t}>{vertical(t)}</Fragment>)}
              {[1, 2, 3, 4, 5].map((n) => (
                <th key={n} className={`${cel} font-normal`}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map(([titulo, itens]) => (
              <Fragment key={titulo}>
                <tr><td colSpan={TOTAL_COLS} className={`${cel} bg-muted/60 text-center text-sm font-bold py-1`}>{titulo}</td></tr>
                {itens.map((item) => {
                  const codigo = item.split(":")[0];
                  return (
                    <tr key={codigo}>
                      <td className={`${cel} bg-muted/20 px-1 py-0.5 text-left leading-tight break-words`}>
                        {item}
                      </td>
                      {COLUNAS.map((c) => (
                        <td key={c} className={`${cel} p-0`}>
                          <Input
                            value={value.marcas[codigo]?.[c] || ""}
                            onChange={(e) => setMarca(codigo, c, e.target.value)}
                            className="h-6 rounded-none px-0 text-[10px] text-center border-0 shadow-none focus-visible:ring-1"
                            aria-label={`${codigo} ${c}`}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
            <tr><td colSpan={TOTAL_COLS} className={`${cel} bg-muted/60 text-center text-sm font-bold py-1`}>V - PARTICIPANTES</td></tr>
            {([
              ["avaliador", "Profissional Avaliador:", "avaliado", "Avaliado:"],
              ["data", "Reconhecimento realizado em:", "assinatura", "Assinatura:"],
            ] as const).map(([k1, l1, k2, l2]) => (
              <tr key={k1}>
                <td className={`${cel} px-2 py-1`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">{l1}</span>
                    <Input type={k1 === "data" ? "date" : "text"} value={value.participantes[k1]} onChange={(e) => setPart(k1, e.target.value)} className="h-8" />
                  </div>
                </td>
                <td colSpan={COLUNAS.length} className={`${cel} px-2 py-1`}>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">{l2}</span>
                    <Input value={value.participantes[k2]} onChange={(e) => setPart(k2, e.target.value)} className="h-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
