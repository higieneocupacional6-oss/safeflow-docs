import { useState } from "react";
import { Plus, Building2, Users, Loader2, Briefcase, Pencil, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SetorFuncaoModal } from "@/components/SetorFuncaoModal";
import { FuncaoModal } from "@/components/FuncaoModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CboAutocomplete } from "@/components/CboAutocomplete";
import { sortByGes } from "@/lib/sortGes";

export default function SetoresFuncoes() {
  const [empresaId, setEmpresaId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [funcaoModalOpen, setFuncaoModalOpen] = useState(false);
  const [funcaoSetorId, setFuncaoSetorId] = useState("");
  const queryClient = useQueryClient();

  // Edit setor state
  const [editSetorOpen, setEditSetorOpen] = useState(false);
  const [editSetor, setEditSetor] = useState<any>(null);
  const [editSetorForm, setEditSetorForm] = useState({ nome_setor: "", ghe_ges: "", descricao_ambiente: "" });
  const [savingSetor, setSavingSetor] = useState(false);

  // Edit funcao state
  const [editFuncaoOpen, setEditFuncaoOpen] = useState(false);
  const [editFuncao, setEditFuncao] = useState<any>(null);
  const [editFuncaoForm, setEditFuncaoForm] = useState({ nome_funcao: "", cbo_codigo: "", cbo_descricao: "", descricao_atividades: "" });
  const [savingFuncao, setSavingFuncao] = useState(false);

  // Move funcao state
  const [moveFuncaoOpen, setMoveFuncaoOpen] = useState(false);
  const [moveFuncao, setMoveFuncao] = useState<any>(null);
  const [moveTargetSetor, setMoveTargetSetor] = useState("");
  const [movingFuncao, setMovingFuncao] = useState(false);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: setores = [], isLoading } = useQuery({
    queryKey: ["setores", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from("setores").select("*").eq("empresa_id", empresaId);
      if (error) throw error;
      return sortByGes(data || []);
    },
    enabled: !!empresaId,
  });

  const { data: funcoes = [] } = useQuery({
    queryKey: ["funcoes", empresaId],
    queryFn: async () => {
      if (!empresaId || setores.length === 0) return [];
      const setorIds = setores.map((s: any) => s.id);
      const { data, error } = await supabase.from("funcoes").select("*").in("setor_id", setorIds).order("nome_funcao");
      if (error) throw error;
      return data;
    },
    enabled: setores.length > 0,
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["setores", empresaId] });
    queryClient.invalidateQueries({ queryKey: ["funcoes", empresaId] });
  };

  const openFuncaoModal = (setorId: string) => {
    setFuncaoSetorId(setorId);
    setFuncaoModalOpen(true);
  };

  const funcoesBySetor = (setorId: string) => funcoes.filter((f: any) => f.setor_id === setorId);

  // Edit Setor
  const handleEditSetor = (setor: any) => {
    setEditSetor(setor);
    setEditSetorForm({ nome_setor: setor.nome_setor, ghe_ges: setor.ghe_ges || "", descricao_ambiente: setor.descricao_ambiente || "" });
    setEditSetorOpen(true);
  };

  const handleSaveSetor = async () => {
    if (!editSetorForm.nome_setor.trim()) { toast.error("Nome do setor obrigatório"); return; }
    setSavingSetor(true);
    const { error } = await supabase.from("setores").update({
      nome_setor: editSetorForm.nome_setor.trim(),
      ghe_ges: editSetorForm.ghe_ges || null,
      descricao_ambiente: editSetorForm.descricao_ambiente || null,
    }).eq("id", editSetor.id);
    setSavingSetor(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Setor atualizado!");
    setEditSetorOpen(false);
    handleSaved();
  };

  // Edit Funcao
  const handleEditFuncao = (funcao: any) => {
    setEditFuncao(funcao);
    setEditFuncaoForm({
      nome_funcao: funcao.nome_funcao,
      cbo_codigo: funcao.cbo_codigo || "",
      cbo_descricao: funcao.cbo_descricao || "",
      descricao_atividades: funcao.descricao_atividades || "",
    });
    setEditFuncaoOpen(true);
  };

  const handleSaveFuncao = async () => {
    if (!editFuncaoForm.nome_funcao.trim()) { toast.error("Nome da função obrigatório"); return; }
    setSavingFuncao(true);
    const { error } = await supabase.from("funcoes").update({
      nome_funcao: editFuncaoForm.nome_funcao.trim(),
      cbo_codigo: editFuncaoForm.cbo_codigo || null,
      cbo_descricao: editFuncaoForm.cbo_descricao || null,
      descricao_atividades: editFuncaoForm.descricao_atividades || null,
    }).eq("id", editFuncao.id);
    setSavingFuncao(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Função atualizada!");
    setEditFuncaoOpen(false);
    handleSaved();
  };

  // Move Funcao
  const handleMoveFuncao = (funcao: any) => {
    setMoveFuncao(funcao);
    setMoveTargetSetor("");
    setMoveFuncaoOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!moveTargetSetor) { toast.error("Selecione o setor destino"); return; }
    setMovingFuncao(true);
    const { error } = await supabase.from("funcoes").update({ setor_id: moveTargetSetor }).eq("id", moveFuncao.id);
    setMovingFuncao(false);
    if (error) { toast.error("Erro ao mover"); return; }
    toast.success("Função movida com sucesso!");
    setMoveFuncaoOpen(false);
    handleSaved();
  };

  return (
    <div>
      <PageHeader
        title="Setores e Funções"
        description="Gerencie setores e funções vinculados às empresas"
        actions={
          empresaId ? (
            <Button onClick={() => setModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />Novo Cadastro
            </Button>
          ) : null
        }
      />

      <div className="glass-card rounded-xl p-5 mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Selecionar Empresa *</label>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Escolha uma empresa cadastrada" />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((e: any) => (
              <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!empresaId ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Selecione uma empresa para visualizar setores e funções</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : setores.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum setor cadastrado para esta empresa</p>
          <Button onClick={() => setModalOpen(true)} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />Cadastrar Setor e Função
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {setores.map((setor: any) => (
            <div key={setor.id} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-lg font-bold text-foreground uppercase">{setor.nome_setor}</h3>
                    {setor.ghe_ges && <Badge variant="secondary" className="text-xs">{setor.ghe_ges}</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditSetor(setor)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {setor.descricao_ambiente && <p className="text-sm text-muted-foreground">{setor.descricao_ambiente}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => openFuncaoModal(setor.id)}>
                  <Plus className="w-3 h-3 mr-1" />Adicionar Função
                </Button>
              </div>

              {funcoesBySetor(setor.id).length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic ml-4">Nenhuma função cadastrada</p>
              ) : (
                <div className="ml-4 mt-3 space-y-2">
                  {funcoesBySetor(setor.id).map((f: any) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group">
                      <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{f.nome_funcao}</span>
                        {f.cbo_codigo && <span className="text-xs text-muted-foreground ml-2">(CBO: {f.cbo_codigo})</span>}
                        {f.descricao_atividades && <p className="text-xs text-muted-foreground mt-0.5">{f.descricao_atividades}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditFuncao(f)} title="Editar Função">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveFuncao(f)} title="Trocar Setor">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SetorFuncaoModal open={modalOpen} onOpenChange={setModalOpen} empresaId={empresaId} onSaved={handleSaved} />
      <FuncaoModal open={funcaoModalOpen} onOpenChange={setFuncaoModalOpen} setorId={funcaoSetorId} onSaved={handleSaved} />

      {/* Edit Setor Modal */}
      <Dialog open={editSetorOpen} onOpenChange={setEditSetorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Editar Setor</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nome do Setor *</Label><Input className="mt-1" value={editSetorForm.nome_setor} onChange={e => setEditSetorForm(p => ({ ...p, nome_setor: e.target.value }))} /></div>
            <div><Label>GHE/GES</Label><Input className="mt-1" value={editSetorForm.ghe_ges} onChange={e => setEditSetorForm(p => ({ ...p, ghe_ges: e.target.value }))} /></div>
            <div><Label>Descrição do Ambiente</Label><Textarea className="mt-1" value={editSetorForm.descricao_ambiente} onChange={e => setEditSetorForm(p => ({ ...p, descricao_ambiente: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSetorOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSetor} disabled={savingSetor} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {savingSetor && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Funcao Modal */}
      <Dialog open={editFuncaoOpen} onOpenChange={setEditFuncaoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Editar Função</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nome da Função *</Label><Input className="mt-1" value={editFuncaoForm.nome_funcao} onChange={e => setEditFuncaoForm(p => ({ ...p, nome_funcao: e.target.value }))} /></div>
            <div>
              <Label>CBO</Label>
              <CboAutocomplete
                value={editFuncaoForm.cbo_codigo}
                onSelect={(codigo, descricao) => setEditFuncaoForm(p => ({ ...p, cbo_codigo: codigo, cbo_descricao: descricao }))}
              />
            </div>
            {editFuncaoForm.cbo_descricao && <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">CBO: {editFuncaoForm.cbo_codigo} — {editFuncaoForm.cbo_descricao}</p>}
            <div><Label>Descrição das Atividades</Label><Textarea className="mt-1" value={editFuncaoForm.descricao_atividades} onChange={e => setEditFuncaoForm(p => ({ ...p, descricao_atividades: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFuncaoOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveFuncao} disabled={savingFuncao} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {savingFuncao && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Funcao Modal */}
      <Dialog open={moveFuncaoOpen} onOpenChange={setMoveFuncaoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Trocar Setor da Função</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Mover <strong>{moveFuncao?.nome_funcao}</strong> para outro setor:
            </p>
            <Select value={moveTargetSetor} onValueChange={setMoveTargetSetor}>
              <SelectTrigger><SelectValue placeholder="Selecione o setor destino" /></SelectTrigger>
              <SelectContent>
                {setores.filter((s: any) => s.id !== moveFuncao?.setor_id).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome_setor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveFuncaoOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmMove} disabled={movingFuncao} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {movingFuncao && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
