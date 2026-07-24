import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularRula, type RulaInput } from "@/lib/ergonomia/rula";
import { calcularReba, type RebaInput } from "@/lib/ergonomia/reba";
import { calcularNiosh, type NioshInput } from "@/lib/ergonomia/niosh";
import { calcularOwas, OWAS_LABELS, type OwasInput } from "@/lib/ergonomia/owas";
import { salvarAvaliacaoEGerarPdf } from "@/lib/ergonomia/persist";
import type { AvaliacaoErgonomica, CabecalhoAvaliacao, ResultadoErgonomico } from "@/lib/ergonomia/types";


type ToolTipo = "RULA" | "REBA" | "NIOSH" | "OWAS";

export type ToolAssessmentResult = {
  tipo: ToolTipo;
  colaborador_nome: string;
  funcao: string;
  atividade: string;
  data_avaliacao: string;
  escore_final: number;
  classificacao: string;
  nivel_acao: string;
  avaliacao_id: string;
  pdf_path: string;
  respostas: Record<string, unknown>;
  resumo: string;
};


type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tool: ToolTipo;
  cabecalho: Omit<CabecalhoAvaliacao, "colaborador_nome" | "data_avaliacao"> & {
    colaborador_nome?: string; data_avaliacao?: string;
  };
  aetDocumentoId?: string | null;
  setorRef?: string | null;
  onComplete: (r: ToolAssessmentResult) => void;
};

const OPT = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export function ToolAssessmentModal({
  open, onOpenChange, tool, cabecalho, aetDocumentoId, setorRef, onComplete,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [colaborador, setColaborador] = useState(cabecalho.colaborador_nome || "");
  const [funcaoSel, setFuncaoSel] = useState<string>(cabecalho.funcao || "");
  const [funcaoManual, setFuncaoManual] = useState<string>("");
  const [modoManual, setModoManual] = useState<boolean>(false);
  const [atividade, setAtividade] = useState<string>("");
  const [funcoesDb, setFuncoesDb] = useState<string[]>([]);
  const [data, setData] = useState(cabecalho.data_avaliacao || today);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      const nomes = new Set<string>();
      if (cabecalho.funcao) {
        cabecalho.funcao.split(",").map((s) => s.trim()).filter(Boolean).forEach((n) => nomes.add(n));
      }
      if (setorRef) {
        const { data: fs } = await supabase
          .from("funcoes")
          .select("nome_funcao")
          .eq("setor_id", setorRef);
        (fs || []).forEach((f: any) => f?.nome_funcao && nomes.add(f.nome_funcao));
      }
      if (!cancelled) setFuncoesDb(Array.from(nomes).sort((a, b) => a.localeCompare(b)));
    })();
    return () => { cancelled = true; };
  }, [open, setorRef, cabecalho.funcao]);


  // Estados por ferramenta
  const [rula, setRula] = useState<RulaInput>({
    braco: 1, bracoAdicionais: { ombroElevado: false, abduzido: false, apoiado: false, bracoMuitoAlto: false },
    antebraco: 1, antebracoAdicionais: { cruzaCorpo: false, foraLinhaMedia: false },
    punho: 1, punhoDesviado: false, torcaoPunho: 1,
    pescoco: 1, pescocoAdicionais: { torcido: false, inclinado: false },
    tronco: 1, troncoAdicionais: { torcido: false, inclinado: false },
    pernas: 1, usoMuscular: false, carga: 0,
  });

  const [reba, setReba] = useState<RebaInput>({
    tronco: 1, troncoAjuste: { torcido: false, inclinado: false },
    pescoco: 1, pescocoAjuste: { torcido: false, inclinado: false },
    pernas: 1, pernasFlexao: 0,
    carga: 0, cargaImpacto: false,
    bracoSup: 1, bracoAjuste: { ombroElevado: false, abduzido: false, apoiado: false },
    antebraco: 1, punho: 1, punhoDesviado: false, acoplamento: 0,
    atividade: { estatico: false, repetitivo: false, instavel: false },
  });

  const [niosh, setNiosh] = useState<NioshInput>({
    peso_carga_kg: 10, H_cm: 30, V_cm: 75, D_cm: 50, A_graus: 0,
    F_por_min: 1, duracao: "curta", acoplamento: "bom",
  });

  const [owas, setOwas] = useState<OwasInput>({
    costas: 1, bracos: 1, pernas: 2, carga: 1,
  });

  const resultado = useMemo<ResultadoErgonomico | null>(() => {
    try {
      if (tool === "RULA") return calcularRula(rula);
      if (tool === "REBA") return calcularReba(reba);
      if (tool === "NIOSH") return calcularNiosh(niosh);
      if (tool === "OWAS") return calcularOwas(owas);
    } catch { /* ignore */ }
    return null;
  }, [tool, rula, reba, niosh, owas]);

  const handleSubmit = async () => {
    if (!aetDocumentoId) {
      toast.error("Salve primeiro a AET deste setor antes de registrar avaliações ergonômicas.");
      return;
    }
    if (!colaborador.trim()) { toast.error("Informe o colaborador avaliado"); return; }
    if (!resultado) { toast.error("Não foi possível calcular a avaliação"); return; }
    setLoading(true);
    try {
      const respostas: Record<string, unknown> =
        tool === "RULA" ? (rula as unknown as Record<string, unknown>) :
        tool === "REBA" ? (reba as unknown as Record<string, unknown>) :
        tool === "OWAS" ? (owas as unknown as Record<string, unknown>) :
        (niosh as unknown as Record<string, unknown>);
      const av: AvaliacaoErgonomica = {
        ferramenta: tool,
        cabecalho: {
          colaborador_nome: colaborador.trim(),
          funcao: cabecalho.funcao,
          empresa_nome: cabecalho.empresa_nome,
          setor_nome: cabecalho.setor_nome,
          data_avaliacao: data,
        },
        respostas,
        resultado,
      };
      const saved = await salvarAvaliacaoEGerarPdf(av, {
        aetDocumentoId: aetDocumentoId ?? null,
        setorRef: setorRef ?? null,
      });
      onComplete({
        tipo: tool,
        colaborador_nome: colaborador.trim(),
        data_avaliacao: data,
        escore_final: resultado.escore_final,
        classificacao: resultado.classificacao,
        nivel_acao: resultado.nivel_acao,
        avaliacao_id: saved.id,
        pdf_path: saved.pdf_path,
        respostas,
        resumo: resultado.memoria_calculo.map((m) => `${m.etapa}: ${m.valor}`).join(" • "),
      });
      toast.success(`Avaliação ${tool} concluída — PDF gerado e baixado`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar avaliação");
    } finally {
      setLoading(false);
    }
  };

  const R = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  );

  const numSelect = (
    value: number,
    onChange: (n: number) => void,
    n: number,
    labels?: string[],
  ) => (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {OPT(n).map((i) => (
          <SelectItem key={i} value={String(i)}>{labels?.[i - 1] ? `${i} — ${labels[i - 1]}` : String(i)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Avaliação {tool} — {cabecalho.funcao || "Função"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Colaborador avaliado *</Label>
              <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">Data da avaliação</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          {tool === "RULA" && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold">Grupo A — Braço, antebraço e punho</p>
                <R>
                  <div>
                    <Label className="text-xs">Braço (posição)</Label>
                    {numSelect(rula.braco, (n) => setRula({ ...rula, braco: n as 1 | 2 | 3 | 4 }), 4, [
                      "-20° a +20°", ">20° ext. ou flex.", "20°-45° flexão", "45°-90° flexão",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Antebraço</Label>
                    {numSelect(rula.antebraco, (n) => setRula({ ...rula, antebraco: n as 1 | 2 }), 2, [
                      "60°-100° flexão", "<60° ou >100°",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Punho</Label>
                    {numSelect(rula.punho, (n) => setRula({ ...rula, punho: n as 1 | 2 | 3 }), 3, [
                      "Neutro (0°)", "0°-15°", ">15°",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Torção do punho</Label>
                    {numSelect(rula.torcaoPunho, (n) => setRula({ ...rula, torcaoPunho: n as 1 | 2 }), 2, [
                      "Faixa média", "Próximo do limite",
                    ])}
                  </div>
                </R>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1"><Checkbox checked={rula.bracoAdicionais.ombroElevado} onCheckedChange={(v) => setRula({ ...rula, bracoAdicionais: { ...rula.bracoAdicionais, ombroElevado: !!v } })} /> Ombro elevado (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.bracoAdicionais.abduzido} onCheckedChange={(v) => setRula({ ...rula, bracoAdicionais: { ...rula.bracoAdicionais, abduzido: !!v } })} /> Braço abduzido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.bracoAdicionais.apoiado} onCheckedChange={(v) => setRula({ ...rula, bracoAdicionais: { ...rula.bracoAdicionais, apoiado: !!v } })} /> Braço apoiado (-1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.bracoAdicionais.bracoMuitoAlto} onCheckedChange={(v) => setRula({ ...rula, bracoAdicionais: { ...rula.bracoAdicionais, bracoMuitoAlto: !!v } })} /> Braço &gt; 90° (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.antebracoAdicionais.cruzaCorpo || rula.antebracoAdicionais.foraLinhaMedia} onCheckedChange={(v) => setRula({ ...rula, antebracoAdicionais: { cruzaCorpo: !!v, foraLinhaMedia: !!v } })} /> Antebraço cruza o corpo / fora da linha média (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.punhoDesviado} onCheckedChange={(v) => setRula({ ...rula, punhoDesviado: !!v })} /> Punho desviado da linha média (+1)</label>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold">Grupo B — Pescoço, tronco e pernas</p>
                <R>
                  <div>
                    <Label className="text-xs">Pescoço</Label>
                    {numSelect(rula.pescoco, (n) => setRula({ ...rula, pescoco: n as 1 | 2 | 3 | 4 }), 4, [
                      "0°-10° flexão", "10°-20°", ">20°", "Em extensão",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Tronco</Label>
                    {numSelect(rula.tronco, (n) => setRula({ ...rula, tronco: n as 1 | 2 | 3 | 4 }), 4, [
                      "Ereto", "0°-20°", "20°-60°", ">60°",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Pernas</Label>
                    {numSelect(rula.pernas, (n) => setRula({ ...rula, pernas: n as 1 | 2 }), 2, [
                      "Apoiadas / equilibradas", "Sem apoio adequado",
                    ])}
                  </div>
                  <div>
                    <Label className="text-xs">Carga / Força</Label>
                    <Select value={String(rula.carga)} onValueChange={(v) => setRula({ ...rula, carga: Number(v) as 0 | 1 | 2 | 3 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 — &lt; 2 kg intermitente</SelectItem>
                        <SelectItem value="1">1 — 2 a 10 kg intermitente</SelectItem>
                        <SelectItem value="2">2 — 2 a 10 kg estático/repetitivo</SelectItem>
                        <SelectItem value="3">3 — &gt; 10 kg ou impacto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </R>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1"><Checkbox checked={rula.pescocoAdicionais.torcido} onCheckedChange={(v) => setRula({ ...rula, pescocoAdicionais: { ...rula.pescocoAdicionais, torcido: !!v } })} /> Pescoço torcido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.pescocoAdicionais.inclinado} onCheckedChange={(v) => setRula({ ...rula, pescocoAdicionais: { ...rula.pescocoAdicionais, inclinado: !!v } })} /> Pescoço inclinado (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.troncoAdicionais.torcido} onCheckedChange={(v) => setRula({ ...rula, troncoAdicionais: { ...rula.troncoAdicionais, torcido: !!v } })} /> Tronco torcido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.troncoAdicionais.inclinado} onCheckedChange={(v) => setRula({ ...rula, troncoAdicionais: { ...rula.troncoAdicionais, inclinado: !!v } })} /> Tronco inclinado (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={rula.usoMuscular} onCheckedChange={(v) => setRula({ ...rula, usoMuscular: !!v })} /> Uso muscular estático/repetitivo (+1)</label>
                </div>
              </div>
            </div>
          )}

          {tool === "REBA" && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold">Grupo A — Tronco, pescoço e pernas</p>
                <R>
                  <div><Label className="text-xs">Tronco</Label>{numSelect(reba.tronco, (n) => setReba({ ...reba, tronco: n as 1 | 2 | 3 | 4 }), 4, ["Ereto", "0°-20°", "20°-60°", ">60°"])}</div>
                  <div><Label className="text-xs">Pescoço</Label>{numSelect(reba.pescoco, (n) => setReba({ ...reba, pescoco: n as 1 | 2 | 3 }), 3, ["0°-20°", ">20°", "Em extensão"])}</div>
                  <div><Label className="text-xs">Pernas</Label>{numSelect(reba.pernas, (n) => setReba({ ...reba, pernas: n as 1 | 2 }), 2, ["Bilateral (estável)", "Unilateral/instável"])}</div>
                  <div>
                    <Label className="text-xs">Flexão de joelhos</Label>
                    <Select value={String(reba.pernasFlexao)} onValueChange={(v) => setReba({ ...reba, pernasFlexao: Number(v) as 0 | 1 | 2 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 — sem flexão relevante</SelectItem>
                        <SelectItem value="1">+1 — 30° a 60°</SelectItem>
                        <SelectItem value="2">+2 — &gt; 60°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Carga</Label>
                    <Select value={String(reba.carga)} onValueChange={(v) => setReba({ ...reba, carga: Number(v) as 0 | 1 | 2 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 — &lt; 5 kg</SelectItem>
                        <SelectItem value="1">1 — 5 a 10 kg</SelectItem>
                        <SelectItem value="2">2 — &gt; 10 kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </R>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1"><Checkbox checked={reba.troncoAjuste.torcido} onCheckedChange={(v) => setReba({ ...reba, troncoAjuste: { ...reba.troncoAjuste, torcido: !!v } })} /> Tronco torcido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.troncoAjuste.inclinado} onCheckedChange={(v) => setReba({ ...reba, troncoAjuste: { ...reba.troncoAjuste, inclinado: !!v } })} /> Tronco inclinado lateral (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.pescocoAjuste.torcido} onCheckedChange={(v) => setReba({ ...reba, pescocoAjuste: { ...reba.pescocoAjuste, torcido: !!v } })} /> Pescoço torcido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.pescocoAjuste.inclinado} onCheckedChange={(v) => setReba({ ...reba, pescocoAjuste: { ...reba.pescocoAjuste, inclinado: !!v } })} /> Pescoço inclinado (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.cargaImpacto} onCheckedChange={(v) => setReba({ ...reba, cargaImpacto: !!v })} /> Carga com impacto (+1)</label>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold">Grupo B — Braço, antebraço, punho</p>
                <R>
                  <div><Label className="text-xs">Braço superior</Label>{numSelect(reba.bracoSup, (n) => setReba({ ...reba, bracoSup: n as 1 | 2 | 3 | 4 }), 4, ["-20°-20°", "20°-45° ou ext.>20°", "45°-90°", ">90°"])}</div>
                  <div><Label className="text-xs">Antebraço</Label>{numSelect(reba.antebraco, (n) => setReba({ ...reba, antebraco: n as 1 | 2 }), 2, ["60°-100°", "<60° ou >100°"])}</div>
                  <div><Label className="text-xs">Punho</Label>{numSelect(reba.punho, (n) => setReba({ ...reba, punho: n as 1 | 2 }), 2, ["0°-15°", ">15°"])}</div>
                  <div>
                    <Label className="text-xs">Acoplamento (pega)</Label>
                    <Select value={String(reba.acoplamento)} onValueChange={(v) => setReba({ ...reba, acoplamento: Number(v) as 0 | 1 | 2 | 3 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 — Bom</SelectItem>
                        <SelectItem value="1">1 — Regular</SelectItem>
                        <SelectItem value="2">2 — Ruim</SelectItem>
                        <SelectItem value="3">3 — Inaceitável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </R>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1"><Checkbox checked={reba.bracoAjuste.ombroElevado} onCheckedChange={(v) => setReba({ ...reba, bracoAjuste: { ...reba.bracoAjuste, ombroElevado: !!v } })} /> Ombro elevado (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.bracoAjuste.abduzido} onCheckedChange={(v) => setReba({ ...reba, bracoAjuste: { ...reba.bracoAjuste, abduzido: !!v } })} /> Braço abduzido (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.bracoAjuste.apoiado} onCheckedChange={(v) => setReba({ ...reba, bracoAjuste: { ...reba.bracoAjuste, apoiado: !!v } })} /> Braço apoiado (-1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.punhoDesviado} onCheckedChange={(v) => setReba({ ...reba, punhoDesviado: !!v })} /> Punho desviado/torcido (+1)</label>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1"><Checkbox checked={reba.atividade.estatico} onCheckedChange={(v) => setReba({ ...reba, atividade: { ...reba.atividade, estatico: !!v } })} /> Postura estática &gt; 1 min (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.atividade.repetitivo} onCheckedChange={(v) => setReba({ ...reba, atividade: { ...reba.atividade, repetitivo: !!v } })} /> Movimento repetitivo &gt; 4×/min (+1)</label>
                  <label className="flex items-center gap-1"><Checkbox checked={reba.atividade.instavel} onCheckedChange={(v) => setReba({ ...reba, atividade: { ...reba.atividade, instavel: !!v } })} /> Mudanças rápidas/instáveis (+1)</label>
                </div>
              </div>
            </div>
          )}

          {tool === "NIOSH" && (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-semibold">Parâmetros da tarefa de levantamento</p>
              <R>
                <div><Label className="text-xs">Peso da carga (kg)</Label><Input type="number" step="0.5" value={niosh.peso_carga_kg} onChange={(e) => setNiosh({ ...niosh, peso_carga_kg: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Distância horizontal H (cm)</Label><Input type="number" value={niosh.H_cm} onChange={(e) => setNiosh({ ...niosh, H_cm: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Altura vertical V (cm)</Label><Input type="number" value={niosh.V_cm} onChange={(e) => setNiosh({ ...niosh, V_cm: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Deslocamento vertical D (cm)</Label><Input type="number" value={niosh.D_cm} onChange={(e) => setNiosh({ ...niosh, D_cm: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Assimetria A (graus)</Label><Input type="number" value={niosh.A_graus} onChange={(e) => setNiosh({ ...niosh, A_graus: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Frequência F (levant./min)</Label><Input type="number" step="0.1" value={niosh.F_por_min} onChange={(e) => setNiosh({ ...niosh, F_por_min: Number(e.target.value) })} /></div>
                <div>
                  <Label className="text-xs">Duração</Label>
                  <Select value={niosh.duracao} onValueChange={(v) => setNiosh({ ...niosh, duracao: v as NioshInput["duracao"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curta">Curta (≤ 1h)</SelectItem>
                      <SelectItem value="moderada">Moderada (≤ 2h)</SelectItem>
                      <SelectItem value="longa">Longa (≤ 8h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Acoplamento (pega)</Label>
                  <Select value={niosh.acoplamento} onValueChange={(v) => setNiosh({ ...niosh, acoplamento: v as NioshInput["acoplamento"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bom">Bom</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </R>
            </div>
          )}

          {tool === "OWAS" && (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-semibold">Análise postural OWAS</p>
              <p className="text-xs text-muted-foreground">
                Selecione a postura predominante observada durante a execução da tarefa. O código OWAS e a
                categoria de ação são calculados automaticamente conforme a metodologia de Karhu et al. (1977).
              </p>
              <R>
                <div>
                  <Label className="text-xs">Costas</Label>
                  <Select value={String(owas.costas)} onValueChange={(v) => setOwas({ ...owas, costas: Number(v) as OwasInput["costas"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} — {(OWAS_LABELS.costas as any)[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Braços</Label>
                  <Select value={String(owas.bracos)} onValueChange={(v) => setOwas({ ...owas, bracos: Number(v) as OwasInput["bracos"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} — {(OWAS_LABELS.bracos as any)[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pernas</Label>
                  <Select value={String(owas.pernas)} onValueChange={(v) => setOwas({ ...owas, pernas: Number(v) as OwasInput["pernas"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} — {(OWAS_LABELS.pernas as any)[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Carga manipulada</Label>
                  <Select value={String(owas.carga)} onValueChange={(v) => setOwas({ ...owas, carga: Number(v) as OwasInput["carga"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3].map((n) => (
                        <SelectItem key={n} value={String(n)}>{(OWAS_LABELS.carga as any)[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </R>
              <div className="text-xs text-muted-foreground">
                Código OWAS calculado: <span className="font-mono font-bold">{owas.costas}{owas.bracos}{owas.pernas}{owas.carga}</span>
              </div>
            </div>
          )}


          {resultado && (
            <div className="rounded-lg border-2 border-accent bg-accent/5 p-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Prévia do resultado</p>
              <p className="text-lg font-bold">
                Escore: {resultado.escore_final} — <span className="text-accent-foreground">{resultado.classificacao}</span>
              </p>
              <p className="text-xs text-muted-foreground">{resultado.nivel_acao}</p>
            </div>
          )}

          {!aetDocumentoId && (
            <div className="rounded-lg border border-amber-400 bg-amber-50 text-amber-900 p-3 text-sm">
              Salve primeiro a AET deste setor antes de registrar avaliações ergonômicas.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !aetDocumentoId}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Concluir avaliação e gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
