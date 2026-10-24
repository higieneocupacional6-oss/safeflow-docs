import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AetValeFotoIa } from "./AetValeFotoIa";
import { aplicarAnotacaoFoto } from "../../../supabase/functions/_shared/aetValeFotos";
import { CHECKS_ETAPA2, TEXTOS_ETAPA2, exigeDiagnostico, type Etapa2Vale, type FatorVale } from "../../../supabase/functions/_shared/aetValeIa";

export function AetValeEtapa2({ dados, fatores, onChange, onFoto, registroId }: { dados: Etapa2Vale; fatores: FatorVale[]; onChange: (v: Etapa2Vale) => void; onFoto: (idx: number, file: File) => void; registroId?: string }) {
  const text = (k: keyof typeof TEXTOS_ETAPA2) => <div key={k} className="space-y-2"><Label htmlFor={`e2-${k}`}>{TEXTOS_ETAPA2[k]}</Label><Textarea id={`e2-${k}`} rows={3} value={dados.textos[k] || ""} onChange={e => onChange({ ...dados, textos: { ...dados.textos, [k]: e.target.value } })} /></div>;
  const checks = (k: keyof typeof CHECKS_ETAPA2) => { const [title, options] = CHECKS_ETAPA2[k]; const single = ["pega", "piso", "peso", "distancia_carga", "local_pausa"].includes(k); return <fieldset key={k} className="space-y-3"><legend className="text-sm font-medium mb-2">{title}</legend><div className="flex flex-wrap gap-4">{options.map(o => <label key={o} className="flex items-start gap-2 text-sm"><Checkbox aria-label={`${title} — ${o}`} checked={(dados.checks[k] || []).includes(o)} onCheckedChange={v => onChange({ ...dados, checks: { ...dados.checks, [k]: v ? single ? [o] : [...(dados.checks[k] || []), o] : (dados.checks[k] || []).filter(x => x !== o) } })} />{o}</label>)}</div></fieldset>; };
  const section = (title: string, content: React.ReactNode) => <section className="border-b border-border py-6 space-y-4"><h2 className="font-heading font-semibold">{title}</h2>{content}</section>;
  return <>
    {section("1. Características do posto de trabalho", <>{text("posto")}{text("mobiliario")}<div className="grid sm:grid-cols-2 gap-4">{dados.fotos.map((f, i) => <div key={i} className="space-y-2"><Label htmlFor={`e2-foto-${i}`}>{i === 0 ? "Foto do posto" : "Foto do mobiliário"}</Label>{f.imagem && <img src={f.imagem} alt={i === 0 ? "Posto de trabalho" : "Mobiliário"} className="w-full h-48 object-contain" />}<Input id={`e2-foto-${i}`} type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) onFoto(i, file); e.target.value = ""; }} /><Input aria-label={`Descrição da foto da etapa 2 — ${i + 1}`} value={f.descricao} onChange={e => onChange({ ...dados, fotos: dados.fotos.map((v, idx) => idx === i ? { ...v, descricao: e.target.value } : v) })} /></div>)}</div></>)}
    {registroId && <div className="grid sm:grid-cols-2 gap-4 py-4">{dados.fotos.map((foto,i) => <AetValeFotoIa key={i} foto={foto} registroId={registroId} numero={`2-${i+1}`} onAplicar={(fonte, anotacao) => onChange({ ...dados, fotos: dados.fotos.map((f,idx) => idx === i ? aplicarAnotacaoFoto(f,fonte,anotacao) : f) })} />)}</div>}
    {section("2. Avaliação do ambiente", <div className="grid sm:grid-cols-2 gap-4">{text("iluminacao")}{text("ventilacao")}{text("temperatura")}{text("ruido")}</div>)}
    {section("3. Partes do corpo envolvidas na atividade", <>{checks("corpo")}{text("corpo_outros")}</>)}
    {section("4. Levantamento, transporte e descarga individual de materiais — PRO-028184", <>{checks("pega")}{checks("piso")}{checks("peso")}{checks("altura_carga")}{checks("distancia_carga")}{text("carga_comentarios")}</>)}
    {section("5. Máquinas, equipamentos e ferramentas", <>{checks("maquinas")}{text("maquinas_outros")}</>)}
    {section("6. Posturas adotadas durante o trabalho", <>{checks("posturas")}{text("posturas_outros")}</>)}
    {section("7. Assento e condições dos postos — postura sentada", checks("assento"))}
    {section("8. Postura em pé", checks("postura_pe"))}
    {section("9. Organização do trabalho", <>{text("normas_producao")}{text("conteudo_tempo")}{text("psicossociais")}{text("ritmo")}{text("exigencias_tempo")}{text("conteudo_tarefas")}<div className="grid sm:grid-cols-2 gap-4">{text("taxa_ocupacao")}{text("operacoes_turno")}</div></>)}
    {section("10. Medidas de controles existentes", <>{checks("controles")}{text("engenharia")}{text("administrativos")}</>)}
    {section("11. Existe local adequado para pausas?", <>{checks("local_pausa")}{checks("pausa")}</>)}
    {section("12. Descrição dos fatores de risco ergonômico", <><div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-muted"><tr>{["Origem", "Circunstância / Fonte", "Situação", "Tipo", "Exposição", "Perfil", "Severidade", "Classificação"].map(t => <th key={t} className="p-2 text-left">{t}</th>)}</tr></thead><tbody>{fatores.map(f => <tr key={f.id} className="border-b border-border align-top">{[f.origem, f.circunstancia, f.situacao, f.tipo, f.estimativa, f.perfil, f.severidade, f.classificacao].map((v, i) => <td key={i} className="p-2 whitespace-pre-wrap">{v || "—"}</td>)}</tr>)}</tbody></table></div>{text("descricao_fatores")}</>)}
    {section("13. Ferramentas de análise e resultados encontrados", <>{checks("ferramentas")}{text("resultados")}{text("biomecanicos")}</>)}
    {section("14. Conclusão / Diagnóstico", <>{text("conclusao")}{fatores.filter(f => exigeDiagnostico(f.classificacao)).map(f => <div key={f.id} className="space-y-2"><Label htmlFor={`diag-${f.id}`}>{f.circunstancia} — {f.classificacao} ({f.origem})</Label><Textarea id={`diag-${f.id}`} value={dados.diagnosticos[f.id] || ""} onChange={e => onChange({ ...dados, diagnosticos: { ...dados.diagnosticos, [f.id]: e.target.value } })} /></div>)}</>)}

  </>;
}
