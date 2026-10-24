import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CORES_MES_VALE, mesesCronograma, novaAcaoMensal, type CronogramaVale, type CorMesVale } from "../../../supabase/functions/_shared/aetValeCronograma";

const cores: Record<CorMesVale, string> = { "": "bg-background", azul: "vale-previsto", verde: "vale-realizado", vermelho: "vale-nao-realizado" };
const nomes: Record<CorMesVale, string> = { "": "Sem marcação", azul: "Previsto", verde: "Realizado", vermelho: "Não realizado" };
const campos = [["o_que", "O que será feito?"], ["por_que", "Por quê?"], ["quem", "Quem?"], ["quando", "Data"], ["onde", "Onde"], ["realizado", "Realizado"], ["como", "Como será feito"], ["quanto", "Valor previsto"]] as const;

export function AetValeCronograma({ dados, onChange }: { dados: CronogramaVale; onChange: (v: CronogramaVale) => void }) {
  const meses = mesesCronograma(dados.anoInicial, dados.anoFinal);
  const alterar = (id: string, campo: string, valor: unknown) => onChange({ ...dados, acoes: dados.acoes.map(a => a.id === id ? { ...a, [campo]: valor } : a) });
  const celula = (a: CronogramaVale["acoes"][number], k: typeof campos[number][0], nome: string) => <td key={k} className="p-1 border border-border align-top">
    {k === "o_que" && (a.funcao || a.risco) && <p className="text-xs mb-2 whitespace-pre-wrap text-muted-foreground">{a.funcao}{a.risco && ` — ${a.risco}`}</p>}
    <Textarea rows={4} aria-label={`${nome} — ${a.id}`} value={a[k]} onChange={e => alterar(a.id, k, e.target.value)} className="min-w-0 text-xs resize-y" />
  </td>;
  return <section className="space-y-4 py-6">
    <h2 className="vale-plano-titulo p-2 text-center font-heading font-bold uppercase">10. Recomendações gerais e plano de ações</h2>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex gap-3"><label className="text-sm space-y-1">Ano inicial<Input aria-label="Ano inicial" type="number" min={1900} max={2200} className="w-28" value={dados.anoInicial} onChange={e => { const n = Number(e.target.value); if (n >= 1900 && n <= 2200) onChange({ ...dados, anoInicial: n, anoFinal: Math.max(n, dados.anoFinal) }); }} /></label><label className="text-sm space-y-1">Ano final<Input aria-label="Ano final" type="number" min={dados.anoInicial} max={2200} className="w-28" value={dados.anoFinal} onChange={e => { const n = Number(e.target.value); if (n >= dados.anoInicial && n <= 2200) onChange({ ...dados, anoFinal: n }); }} /></label></div>
      <div className="border border-border text-xs">{CORES_MES_VALE.filter(c => c).map(c => <div key={c} className="flex items-center border-b last:border-b-0 border-border"><span className={`w-5 h-6 ${cores[c]}`} /><span className="px-2 font-semibold">{nomes[c]}</span></div>)}</div>
    </div>
    <div className="overflow-x-auto border border-border"><table className="w-full table-fixed text-xs" style={{ minWidth: `${950 + meses.length * 34}px` }}>
      <colgroup>{campos.slice(0, 4).map(([k]) => <col key={k} className={k === "o_que" || k === "por_que" ? "w-40" : "w-24"} />)}{meses.map(m => <col key={m.id} className="w-[34px]" />)}{campos.slice(4).map(([k]) => <col key={k} className={k === "como" ? "w-40" : "w-24"} />)}<col className="w-10" /></colgroup>
      <thead className="bg-muted"><tr>{campos.slice(0,4).map(([k,n]) => <th key={k} rowSpan={2} className="p-2 border border-border">{n}</th>)}<th colSpan={meses.length} className="p-2 border border-border">Prazo (data)</th>{campos.slice(4).map(([k,n]) => <th key={k} rowSpan={2} className="p-2 border border-border">{n}</th>)}<th rowSpan={2}><span className="sr-only">Excluir</span></th></tr><tr>{meses.map(m => <th key={m.id} className="h-24 border border-border p-0"><Input aria-label={`Nome do mês ${m.id}`} value={dados.nomesMeses[m.id] ?? m.nome} onChange={e => onChange({ ...dados, nomesMeses: { ...dados.nomesMeses, [m.id]: e.target.value } })} className="vale-mes-nome h-24 w-full border-0 rounded-none px-1 text-xs text-center" /></th>)}</tr></thead>
      <tbody>{dados.acoes.map(a => <tr key={a.id}>{campos.slice(0,4).map(([k,n]) => celula(a,k,n))}{meses.map(m => <td key={m.id} className="border border-border p-0 align-top"><Popover><PopoverTrigger asChild><Button variant="ghost" aria-label={`${dados.nomesMeses[m.id] ?? m.nome} — ${a.id}: ${nomes[a.meses[m.id] || ""]}`} title={nomes[a.meses[m.id] || ""]} className={`w-full h-24 rounded-none p-0 ${cores[a.meses[m.id] || ""]}`} /></PopoverTrigger><PopoverContent className="w-auto p-2"><div className="flex gap-2">{CORES_MES_VALE.map(c => <Button key={c} variant="outline" size="icon" aria-label={nomes[c]} title={nomes[c]} className={cores[c]} onClick={() => alterar(a.id,"meses",{ ...a.meses, [m.id]: c })} />)}</div></PopoverContent></Popover></td>)}{campos.slice(4).map(([k,n]) => celula(a,k,n))}<td className="align-top"><Button variant="ghost" size="icon" aria-label={`Excluir ação ${a.id}`} onClick={() => onChange({ ...dados, acoes: dados.acoes.filter(v => v.id !== a.id) })}><Trash2 className="w-4 h-4" /></Button></td></tr>)}</tbody>
    </table></div>
    <Button variant="outline" onClick={() => onChange({ ...dados, acoes: [...dados.acoes, novaAcaoMensal(crypto.randomUUID())] })}><Plus className="w-4 h-4 mr-2" />Adicionar linha</Button>
  </section>;
}