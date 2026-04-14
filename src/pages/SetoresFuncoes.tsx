import { useState } from "react";
import { Plus, Building2, Users, Loader2, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SetorFuncaoModal } from "@/components/SetorFuncaoModal";
import { FuncaoModal } from "@/components/FuncaoModal";
import { Badge } from "@/components/ui/badge";

export default function SetoresFuncoes() {
  const [empresaId, setEmpresaId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [funcaoModalOpen, setFuncaoModalOpen] = useState(false);
  const [funcaoSetorId, setFuncaoSetorId] = useState("");
  const queryClient = useQueryClient();

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
      const { data, error } = await supabase
        .from("setores")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("nome_setor");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const { data: funcoes = [] } = useQuery({
    queryKey: ["funcoes", empresaId],
    queryFn: async () => {
      if (!empresaId || setores.length === 0) return [];
      const setorIds = setores.map((s: any) => s.id);
      const { data, error } = await supabase
        .from("funcoes")
        .select("*")
        .in("setor_id", setorIds)
        .order("nome_funcao");
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

  const funcoesBySetor = (setorId: string) =>
    funcoes.filter((f: any) => f.setor_id === setorId);

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

      {/* Company selector */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Selecionar Empresa *</label>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Escolha uma empresa cadastrada" />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((e: any) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome_fantasia || e.razao_social}
              </SelectItem>
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
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
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
                    <h3 className="font-heading text-lg font-bold text-foreground uppercase">
                      {setor.nome_setor}
                    </h3>
                    {setor.ghe_ges && (
                      <Badge variant="secondary" className="text-xs">{setor.ghe_ges}</Badge>
                    )}
                  </div>
                  {setor.descricao_ambiente && (
                    <p className="text-sm text-muted-foreground">{setor.descricao_ambiente}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openFuncaoModal(setor.id)}
                >
                  <Plus className="w-3 h-3 mr-1" />Adicionar Função
                </Button>
              </div>

              {funcoesBySetor(setor.id).length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic ml-4">Nenhuma função cadastrada</p>
              ) : (
                <div className="ml-4 mt-3 space-y-2">
                  {funcoesBySetor(setor.id).map((f: any) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{f.nome_funcao}</span>
                        {f.cbo_codigo && (
                          <span className="text-xs text-muted-foreground ml-2">(CBO: {f.cbo_codigo})</span>
                        )}
                        {f.descricao_atividades && (
                          <p className="text-xs text-muted-foreground mt-0.5">{f.descricao_atividades}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SetorFuncaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        empresaId={empresaId}
        onSaved={handleSaved}
      />

      <FuncaoModal
        open={funcaoModalOpen}
        onOpenChange={setFuncaoModalOpen}
        setorId={funcaoSetorId}
        onSaved={handleSaved}
      />
    </div>
  );
}
