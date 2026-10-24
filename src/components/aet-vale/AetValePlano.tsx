import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Etapa2Vale, FatorVale } from "../../../supabase/functions/_shared/aetValeIa";

export const COLUNAS_PLANO = [["o_que", "O quê"], ["por_que", "Por quê"], ["onde", "Onde"], ["quando", "Quando"], ["quem", "Quem"], ["como", "Como"], ["quanto", "Quanto custa"]] as const;
export function AetValePlano({ dados, fatores, onChange }: { dados: Etapa2Vale; fatores: FatorVale[]; onChange: (v: Etapa2Vale) => void }) {
  const alterar = (i: number, campo: string, valor: string) => onChange({ ...dados, plano: dados.plano.map((a, idx) => idx === i ? { ...a, [campo]: valor } : a) });
  return <section className="py-6 space-y-4"><h2 className="font-heading font-semibold">15. Plano de ação — 5W2H</h2>
    <div className="overflow-x-auto"><table className="w-full table-fixed min-w-[900px] text-xs border border-border"><thead className="bg-muted"><tr>{COLUNAS_PLANO.map(([k, titulo]) => <th key={k} className="p-2 text-left border border-border">{titulo}</th>)}<th className="w-12"><span className="sr-only">Excluir</span></th></tr></thead>
      <tbody>{dados.plano.map((a, i) => <tr key={i} className="align-top">{COLUNAS_PLANO.map(([k, titulo]) => <td key={k} className="p-2 border border-border">{k === "o_que" && <><select aria-label={`Fator da ação ${i + 1}`} className="w-full border border-input bg-background rounded-md p-1 mb-2" value={a.fator_id} onChange={e => alterar(i, "fator_id", e.target.value)}><option value="">Selecione o risco</option>{fatores.map(f => <option key={f.id} value={f.id}>{f.circunstancia} — {f.classificacao}</option>)}{a.fator_id && !fatores.some(f => f.id === a.fator_id) && <option value={a.fator_id}>Risco vinculado</option>}</select>{dados.diagnosticos[a.fator_id] && <p className="mb-2 text-muted-foreground whitespace-pre-wrap">{dados.diagnosticos[a.fator_id]}</p>}</>}
        <Textarea aria-label={`${titulo} — ação ${i + 1}`} rows={4} value={a[k]} onChange={e => alterar(i, k, e.target.value)} />{["quando", "quem", "quanto"].includes(k) && !a[k].trim() && <span className="text-muted-foreground block mt-1">A definir</span>}</td>)}<td className="p-1"><Button variant="ghost" size="icon" aria-label={`Excluir ação ${i + 1}`} onClick={() => onChange({ ...dados, plano: dados.plano.filter((_, idx) => idx !== i) })}><Trash2 className="w-4 h-4" /></Button></td></tr>)}</tbody></table></div>
    <Button variant="outline" onClick={() => onChange({ ...dados, plano: [...dados.plano, { fator_id: "", o_que: "", por_que: "", onde: "", quando: "", quem: "", como: "", quanto: "" }] })}><Plus className="w-4 h-4 mr-2" />Adicionar ação</Button>
  </section>;
}