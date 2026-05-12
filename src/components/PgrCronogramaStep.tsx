import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Save, CalendarIcon, Bookmark, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CronogramaItem = {
  id: string;
  item: string;
  acao: string;
  responsavel: string;
  prazo_mes: string;
  prazo_ano: string;
  situacao: "Previsto" | "Realizado" | "";
};

const MESES = [
  { v: "01", n: "Jan" }, { v: "02", n: "Fev" }, { v: "03", n: "Mar" }, { v: "04", n: "Abr" },
  { v: "05", n: "Mai" }, { v: "06", n: "Jun" }, { v: "07", n: "Jul" }, { v: "08", n: "Ago" },
  { v: "09", n: "Set" }, { v: "10", n: "Out" }, { v: "11", n: "Nov" }, { v: "12", n: "Dez" },
];
const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 10 }, (_, i) => String(ANO_ATUAL - 1 + i));

const MODELOS_KEY = "pgr_cronograma_modelos_v1";
type ModeloSalvo = { id: string; nome: string; data: string; itens: CronogramaItem[] };

function readModelos(): ModeloSalvo[] {
  try { return JSON.parse(localStorage.getItem(MODELOS_KEY) || "[]"); } catch { return []; }
}
function writeModelos(m: ModeloSalvo[]) {
  localStorage.setItem(MODELOS_KEY, JSON.stringify(m));
}

interface Props {
  goToStep: (n: number) => Promise<void> | void;
  saving: boolean;
  empresaId: string;
  empresaNome: string;
  cronograma: CronogramaItem[];
  addCronoItem: () => void;
  updateCronoItem: (id: string, patch: Partial<CronogramaItem>) => void;
  removeCronoItem: (id: string) => void;
  replaceCronograma: (items: CronogramaItem[]) => void;
  appendCronograma: (items: CronogramaItem[]) => void;
  persist: () => Promise<string | null>;
}

export default function PgrCronogramaStep(props: Props) {
  const {
    goToStep, saving, empresaNome, cronograma,
    addCronoItem, updateCronoItem, removeCronoItem,
    replaceCronograma, appendCronograma, persist,
  } = props;

  const [tornarOpen, setTornarOpen] = useState(false);
  const [nomeModelo, setNomeModelo] = useState("");
  const [usarOpen, setUsarOpen] = useState(false);
  const [empresasComCrono, setEmpresasComCrono] = useState<{ id: string; empresa_nome: string; itens: CronogramaItem[]; updated_at: string }[]>([]);
  const [modelosSalvos, setModelosSalvos] = useState<ModeloSalvo[]>([]);

  const handleSalvar = async () => {
    const id = await persist();
    if (id) toast.success("Cronograma salvo");
  };

  const handleAvancar = async () => {
    await persist();
    goToStep(5);
  };

  const handleTornarModelo = () => {
    if (cronograma.length === 0) { toast.error("Adicione ao menos uma ação"); return; }
    setNomeModelo(`Modelo ${empresaNome || "PGR"} — ${new Date().toLocaleDateString("pt-BR")}`);
    setTornarOpen(true);
  };

  const confirmarTornarModelo = () => {
    if (!nomeModelo.trim()) { toast.error("Informe um nome"); return; }
    const novo: ModeloSalvo = {
      id: crypto.randomUUID(),
      nome: nomeModelo.trim(),
      data: new Date().toISOString(),
      itens: cronograma,
    };
    const atual = readModelos();
    writeModelos([novo, ...atual]);
    toast.success("Modelo salvo globalmente");
    setTornarOpen(false);
  };

  const abrirUsarModelo = async () => {
    setModelosSalvos(readModelos());
    setUsarOpen(true);
    try {
      const { data, error } = await supabase
        .from("documentos")
        .select("id,empresa_nome,updated_at,draft_snapshot")
        .eq("tipo", "PGR")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const lista = (data || [])
        .map((d: any) => {
          const itens = (d.draft_snapshot?.cronograma_pgr || []) as CronogramaItem[];
          return { id: d.id, empresa_nome: d.empresa_nome || "(Sem nome)", itens, updated_at: d.updated_at };
        })
        .filter(x => x.itens.length > 0);
      setEmpresasComCrono(lista);
    } catch (e: any) {
      toast.error("Erro ao carregar: " + (e.message || ""));
    }
  };

  const importar = (itens: CronogramaItem[]) => {
    if (cronograma.length > 0) {
      if (confirm("Adicionar ao cronograma atual? OK = adicionar, Cancelar = substituir")) {
        appendCronograma(itens);
      } else {
        replaceCronograma(itens);
      }
    } else {
      replaceCronograma(itens);
    }
    toast.success("Cronograma importado");
    setUsarOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => goToStep(3)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" /> Cronograma do PGR
          </h1>
          <p className="text-sm text-muted-foreground">{empresaNome} — ações, responsáveis e prazos</p>
        </div>
        <Button variant="outline" onClick={handleTornarModelo}><Bookmark className="w-4 h-4 mr-1" /> Tornar Modelo</Button>
        <Button variant="outline" onClick={abrirUsarModelo}><FolderOpen className="w-4 h-4 mr-1" /> Usar Modelo</Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="p-2 w-[14%]">Item</th>
                <th className="p-2">Ação</th>
                <th className="p-2 w-[16%]">Responsável</th>
                <th className="p-2 w-[180px]">Prazo</th>
                <th className="p-2 w-[140px]">Situação</th>
                <th className="p-2 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {cronograma.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ação. Clique em "Adicionar ação" abaixo.</td></tr>
              )}
              {cronograma.map(c => (
                <tr key={c.id} className="border-b align-top">
                  <td className="p-2"><Input value={c.item} onChange={e => updateCronoItem(c.id, { item: e.target.value })} placeholder="Ex: 01" /></td>
                  <td className="p-2"><Textarea rows={2} value={c.acao} onChange={e => updateCronoItem(c.id, { acao: e.target.value })} placeholder="Descrição da ação" /></td>
                  <td className="p-2"><Input value={c.responsavel} onChange={e => updateCronoItem(c.id, { responsavel: e.target.value })} /></td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Select value={c.prazo_mes} onValueChange={v => updateCronoItem(c.id, { prazo_mes: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Mês" /></SelectTrigger>
                        <SelectContent>{MESES.map(m => <SelectItem key={m.v} value={m.v}>{m.n}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.prazo_ano} onValueChange={v => updateCronoItem(c.id, { prazo_ano: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Ano" /></SelectTrigger>
                        <SelectContent>{ANOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-2">
                    <Select value={c.situacao} onValueChange={v => updateCronoItem(c.id, { situacao: v as any })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Previsto">Previsto</SelectItem>
                        <SelectItem value="Realizado">Realizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-center">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeCronoItem(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={addCronoItem}><Plus className="w-4 h-4 mr-1" /> Adicionar ação</Button>
        </div>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => goToStep(3)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSalvar} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
          </Button>
          <Button onClick={handleAvancar} disabled={saving}>Avançar</Button>
        </div>
      </div>

      {/* Modal Tornar Modelo */}
      <Dialog open={tornarOpen} onOpenChange={setTornarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar como Modelo Global</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs uppercase font-bold">Nome do modelo</Label>
            <Input value={nomeModelo} onChange={e => setNomeModelo(e.target.value)} />
            <p className="text-xs text-muted-foreground">{cronograma.length} ação(ões) serão salvas neste modelo.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTornarOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarTornarModelo}><Bookmark className="w-4 h-4 mr-1" /> Salvar Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Usar Modelo */}
      <Dialog open={usarOpen} onOpenChange={setUsarOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Usar Modelo de Cronograma</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <section>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Modelos Salvos</h3>
              {modelosSalvos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum modelo salvo ainda.</p>
              ) : (
                <div className="space-y-2">
                  {modelosSalvos.map(m => (
                    <Card key={m.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{m.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.itens.length} ação(ões) — {new Date(m.data).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <Button size="sm" onClick={() => importar(m.itens)}>Usar modelo salvo</Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Cronogramas de outras empresas</h3>
              {empresasComCrono.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma empresa com cronograma encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {empresasComCrono.map(e => (
                    <Card key={e.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{e.empresa_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          <Badge variant="secondary" className="mr-2">{e.itens.length} ação(ões)</Badge>
                          {new Date(e.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => importar(e.itens)}>Importar</Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
