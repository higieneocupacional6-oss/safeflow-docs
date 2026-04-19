import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Copy, FilePlus2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cloneLtcatToInsalubridade } from "@/lib/cloneLtcatToInsalubridade";

type Mode = "choose" | "reaproveitar" | "zero";

export function InsalubridadeStartModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [empresaId, setEmpresaId] = useState("");
  const [ltcatId, setLtcatId] = useState("");
  const [cloning, setCloning] = useState(false);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-insal-modal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id,razao_social,nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: ltcats = [], isLoading: loadingLtcats } = useQuery({
    queryKey: ["ltcats-empresa", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("documentos")
        .select("id,empresa_nome,created_at,status")
        .eq("empresa_id", empresaId)
        .eq("tipo", "LTCAT")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId && mode === "reaproveitar",
  });

  const reset = () => {
    setMode("choose");
    setEmpresaId("");
    setLtcatId("");
    setCloning(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleStartFromScratch = () => {
    handleClose(false);
    navigate("/documentos/insalubridade/novo");
  };

  const handleReaproveitar = async () => {
    if (!ltcatId) {
      toast.error("Selecione um LTCAT para reaproveitar");
      return;
    }
    setCloning(true);
    try {
      const newId = await cloneLtcatToInsalubridade(ltcatId);
      console.log("DADOS COPIADOS DO LTCAT:", { ltcatId, newId });
      toast.success("Dados do LTCAT reaproveitados!");
      handleClose(false);
      navigate(`/documentos/insalubridade/editar/${newId}`);
    } catch (e: any) {
      toast.error("Erro ao reaproveitar dados: " + (e.message || ""));
      setCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "choose" ? "Deseja reaproveitar dados do LTCAT?" : "Laudo de Insalubridade"}
          </DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-2 py-2">
            <button
              onClick={() => setMode("reaproveitar")}
              className="w-full text-left p-4 rounded-lg border-2 border-accent/40 hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3"
            >
              <Copy className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="font-heading font-semibold text-foreground">Sim, reaproveitar dados do LTCAT</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Copia setores, riscos, avaliações, pareceres e equipamentos de um LTCAT existente.
                </p>
              </div>
            </button>
            <button
              onClick={() => setMode("zero")}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3"
            >
              <FilePlus2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="font-heading font-semibold text-foreground">Não, iniciar do zero</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cria um novo Laudo de Insalubridade em branco.
                </p>
              </div>
            </button>
          </div>
        )}

        {mode === "zero" && (
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Você criará um novo Laudo de Insalubridade do zero, com o mesmo fluxo do LTCAT.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMode("choose")}>Voltar</Button>
              <Button onClick={handleStartFromScratch}>Começar</Button>
            </DialogFooter>
          </div>
        )}

        {mode === "reaproveitar" && (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold uppercase">Empresa</Label>
              <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setLtcatId(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.razao_social || e.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {empresaId && (
              <div>
                <Label className="text-xs font-bold uppercase">LTCAT de origem</Label>
                {loadingLtcats ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando LTCATs...
                  </div>
                ) : ltcats.length === 0 ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Não existe LTCAT cadastrado para esta empresa. Você pode iniciar do zero.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={ltcatId} onValueChange={setLtcatId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione qual LTCAT reaproveitar" /></SelectTrigger>
                    <SelectContent>
                      {ltcats.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {new Date(d.created_at).toLocaleDateString("pt-BR")} — {d.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setMode("choose")} disabled={cloning}>Voltar</Button>
              {ltcats.length === 0 && empresaId ? (
                <Button onClick={handleStartFromScratch}>Iniciar do zero</Button>
              ) : (
                <Button onClick={handleReaproveitar} disabled={!ltcatId || cloning}>
                  {cloning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Copiando...</> : "Reaproveitar e abrir"}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
