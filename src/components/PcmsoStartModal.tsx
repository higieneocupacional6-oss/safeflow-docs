import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Copy, FilePlus2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildSetoresFromEmpresa, copyPgrSnapshotIntoSetores } from "@/lib/copyPgrToPcmso";

type Mode = "choose" | "copiar" | "zero";

export function PcmsoStartModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [empresaId, setEmpresaId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-pcmso-modal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id,razao_social,nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const reset = () => { setMode("choose"); setEmpresaId(""); setLoading(false); };
  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const createPcmso = async (copyFromPgr: boolean) => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    setLoading(true);
    try {
      const empresa = (empresas as any[]).find((e) => e.id === empresaId);
      const empresaNome = empresa?.razao_social || empresa?.nome_fantasia || "";
      let setores = await buildSetoresFromEmpresa(empresaId);
      if (copyFromPgr) setores = await copyPgrSnapshotIntoSetores(empresaId, setores);

      const { data: pcmso, error: e1 } = await supabase
        .from("pcmso_documentos")
        .insert({ empresa_id: empresaId, setores_snapshot: setores as any, revisoes: [] })
        .select("id")
        .single();
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("documentos").insert({
        id: pcmso.id,
        tipo: "PCMSO",
        empresa_id: empresaId,
        empresa_nome: empresaNome,
        status: "rascunho",
      });
      if (e2) throw e2;

      toast.success(copyFromPgr ? "PCMSO criado com dados do PGR" : "PCMSO criado");
      handleClose(false);
      navigate(`/documentos/pcmso/editar/${pcmso.id}`);
    } catch (e: any) {
      toast.error("Erro ao criar PCMSO: " + (e.message || ""));
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "choose" ? "Deseja copiar informações do PGR?" : "Novo PCMSO"}
          </DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-2 py-2">
            <button onClick={() => setMode("copiar")} className="w-full text-left p-4 rounded-lg border-2 border-accent/40 hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3">
              <Copy className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="font-heading font-semibold text-foreground">SIM, copiar dados do PGR</div>
                <p className="text-xs text-muted-foreground mt-0.5">Preenche automaticamente setores, funções e agentes a partir do PGR mais recente da empresa. Tudo permanece editável.</p>
              </div>
            </button>
            <button onClick={() => setMode("zero")} className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3">
              <FilePlus2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="font-heading font-semibold text-foreground">NÃO, iniciar em branco</div>
                <p className="text-xs text-muted-foreground mt-0.5">Cria um novo PCMSO em branco para preenchimento manual.</p>
              </div>
            </button>
          </div>
        )}

        {(mode === "copiar" || mode === "zero") && (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold uppercase">Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(empresas as any[]).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMode("choose")} disabled={loading}>Voltar</Button>
              <Button onClick={() => createPcmso(mode === "copiar")} disabled={!empresaId || loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : "Criar PCMSO"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
