import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResultadoModal } from "@/components/ficha-tecnica/ResultadoModal";
import { FICHA_TIPOS, FichaTipo, fichaTipoLabel, isFichaQuimica } from "@/lib/fichaTecnica";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function FichaTecnicaContrato() {
  const { empresaId = "", contratoId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<FichaTipo>("ruido");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryKey = ["ficha-tecnica-resultados", empresaId, contratoId];

  useRealtimeSync([{ table: "ficha_tecnica_resultados", queryKey }], `ficha-tecnica-${contratoId}`);

  const { data: contexto, isLoading: loadingContexto } = useQuery({
    queryKey: ["ficha-tecnica-contexto", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const [{ data: empresa }, { data: contrato }, { data: setores }, { data: agentes }] = await Promise.all([
        supabase.from("empresas").select("id, razao_social, nome_fantasia").eq("id", empresaId).single(),
        supabase.from("contratos").select("id, empresa_id, numero_contrato, nome_contratante, local_trabalho").eq("id", contratoId).eq("empresa_id", empresaId).single(),
        supabase.from("setores").select("id, nome, empresa_id, contrato_id").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("nome"),
        supabase.from("riscos").select("id, nome, tipo").order("nome"),
      ]);
      if (!empresa || !contrato) throw new Error("Empresa ou contrato inválido.");
      const setorIds = (setores || []).map((item: any) => item.id);
      const { data: funcoes, error } = setorIds.length ? await supabase.from("funcoes").select("id, nome_funcao, setor_id").in("setor_id", setorIds).order("nome_funcao") : { data: [], error: null } as any;
      if (error) throw error;
      return { empresa, contrato, setores: setores || [], funcoes: funcoes || [], agentes: agentes || [] } as any;
    },
  });

  const { data: resultados = [], isLoading } = useQuery({
    queryKey,
    enabled: !!contexto,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ficha_tecnica_resultados").select("*").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const openNew = (value: FichaTipo) => { setEditing(null); setTipo(value); setModalOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setTipo(row.tipo); setModalOpen(true); };
  const remove = async (row: any) => {
    if (!window.confirm("Excluir este resultado permanentemente?")) return;
    const { error } = await (supabase as any).from("ficha_tecnica_resultados").delete().eq("id", row.id).eq("empresa_id", empresaId).eq("contrato_id", contratoId);
    if (error) return toast.error(error.message);
    toast.success("Resultado excluído.");
    queryClient.invalidateQueries({ queryKey });
  };
  const value = (row: any) => {
    if (row.tipo === "ruido") return `NEN ${row.nen} dB | LAVG ${row.lavg} dB`;
    if (row.tipo === "vibracao_vci") return `AREN ${row.aren} m/s² | VDVR ${row.vdvr} m/s¹·⁷`;
    if (row.tipo === "vibracao_vmb") return `AREN ${row.aren} m/s²`;
    if (row.tipo === "calor") return `${row.concentracao} | ${row.taxa_metabolica}`;
    return `${row.componentes}: ${row.exposicao}`;
  };

  if (loadingContexto) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!contexto) return <Card className="p-10 text-center"><p>Empresa ou contrato não encontrado.</p><Button className="mt-4" onClick={() => navigate("/ficha-tecnica")}>Voltar</Button></Card>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3" onClick={() => navigate("/ficha-tecnica")}><ArrowLeft className="h-4 w-4" /> Ficha Técnica</button><h1 className="font-heading text-2xl font-bold">{contexto.empresa.nome_fantasia || contexto.empresa.razao_social}</h1><p className="text-sm text-muted-foreground">Contrato {contexto.contrato.numero_contrato || contexto.contrato.nome_contratante || "sem número"}</p></div>
      <DropdownMenu><DropdownMenuTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Resultados</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72">{FICHA_TIPOS.map((item) => <DropdownMenuItem key={item.value} onClick={() => openNew(item.value)}>{item.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
    </div>
    <Card className="overflow-hidden">
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : resultados.length === 0 ? <div className="py-16 text-center text-muted-foreground">Nenhum resultado cadastrado neste contrato.</div> : <Table><TableHeader><TableRow><TableHead>Agente</TableHead><TableHead>Setor</TableHead><TableHead>Função</TableHead><TableHead>Resultado</TableHead><TableHead>LT</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader><TableBody>{resultados.map((row) => {
        const setor = contexto.setores.find((item: any) => item.id === row.setor_id); const funcao = contexto.funcoes.find((item: any) => item.id === row.funcao_id);
        return <TableRow key={row.id}><TableCell><div className="font-medium">{fichaTipoLabel(row.tipo)}</div>{isFichaQuimica(row.tipo) && <div className="text-xs text-muted-foreground">{row.amostrador}</div>}</TableCell><TableCell>{setor?.nome}</TableCell><TableCell>{funcao?.nome_funcao}</TableCell><TableCell>{value(row)}</TableCell><TableCell>{row.limite_tolerancia}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Editar"><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>;
      })}</TableBody></Table>}
    </Card>
    <ResultadoModal open={modalOpen} onOpenChange={setModalOpen} empresaId={empresaId} contratoId={contratoId} tipo={tipo} setores={contexto.setores} funcoes={contexto.funcoes} agentes={contexto.agentes} registro={editing} onSaved={() => queryClient.invalidateQueries({ queryKey })} />
  </div>;
}