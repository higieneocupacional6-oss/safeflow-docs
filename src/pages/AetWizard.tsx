import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Save, FileText, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type Revisao = { data_revisao: string; descricao_revisao: string };
type Colaborador = { nome_colaborador: string; data_avaliacao: string };
type AvalQuant = {
  especificacao_setor: string;
  ruido_valor: string; ruido_unidade: string;
  iluminancia_valor: string; iluminancia_unidade: string;
  temperatura_valor: string; temperatura_unidade: string;
};
type PlanoAcao = { o_que: string; como: string; responsavel: string; prazo: string };

type SetorAet = {
  setor_id: string;
  setor_nome: string;
  ges: string;
  descricao_ambiente: string;
  funcao_id: string;
  funcao_nome: string;
  numero_funcionarios: string;
  colaboradores: Colaborador[];
  posto_trabalho: string;
  descricao_atividade: string;
  analise_organizacional: string;
  tarefas: string;
  riscos_observados: string;
  ritmo_complexidade: string;
  jornada_aspectos: string;
  caracterizacao_biomecanica: string;
  avaliacoes_quantitativas: AvalQuant[];
  diagnostico_ergonomico: string;
  conclusao: string;
  plano_acao: PlanoAcao[];
  ferramentas: any[];
  imagens_ambiente: string[];
  imagens_funcao: string[];
};

const emptyColab = (): Colaborador => ({ nome_colaborador: "", data_avaliacao: "" });
const emptyAval = (): AvalQuant => ({
  especificacao_setor: "",
  ruido_valor: "", ruido_unidade: "dB(A)",
  iluminancia_valor: "", iluminancia_unidade: "lux",
  temperatura_valor: "", temperatura_unidade: "°C",
});
const emptyPlano = (): PlanoAcao => ({ o_que: "", como: "", responsavel: "", prazo: "" });
const emptyRev = (): Revisao => ({ data_revisao: "", descricao_revisao: "" });

const newSetor = (s: any): SetorAet => ({
  setor_id: s.id,
  setor_nome: s.nome_setor || "",
  ges: s.ghe_ges || "",
  descricao_ambiente: s.descricao_ambiente || "",
  funcao_id: "",
  funcao_nome: "",
  numero_funcionarios: "",
  colaboradores: [],
  posto_trabalho: "",
  descricao_atividade: "",
  analise_organizacional: "",
  tarefas: "",
  riscos_observados: "",
  ritmo_complexidade: "",
  jornada_aspectos: "",
  caracterizacao_biomecanica: "",
  avaliacoes_quantitativas: [],
  diagnostico_ergonomico: "",
  conclusao: "",
  plano_acao: [],
  ferramentas: [],
  imagens_ambiente: [],
  imagens_funcao: [],
});

export default function AetWizard() {
  const { documentoId } = useParams();
  const navigate = useNavigate();

  // Identificação
  const [empresaId, setEmpresaId] = useState("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElaboracao, setDataElaboracao] = useState("");
  const [alteracoes, setAlteracoes] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);

  // Setores
  const [setoresAet, setSetoresAet] = useState<SetorAet[]>([]);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSetorIdx, setEditingSetorIdx] = useState<number | null>(null);

  const [aetId, setAetId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!documentoId);

  // Empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-aet"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id,razao_social,nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  // Setores da empresa
  const { data: setoresEmpresa = [] } = useQuery({
    queryKey: ["setores-empresa-aet", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("setores")
        .select("id,nome_setor,ghe_ges,descricao_ambiente")
        .eq("empresa_id", empresaId)
        .order("nome_setor");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Funções dos setores selecionados
  const { data: funcoesAll = [] } = useQuery({
    queryKey: ["funcoes-aet", setoresAet.map((s) => s.setor_id).join(",")],
    queryFn: async () => {
      const ids = setoresAet.map((s) => s.setor_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("funcoes").select("id,nome_funcao,setor_id").in("setor_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: setoresAet.length > 0,
  });

  // Carregar AET existente
  useEffect(() => {
    if (!documentoId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("aet_documentos")
          .select("*")
          .eq("documento_id", documentoId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setAetId(data.id);
          setEmpresaId(data.empresa_id || "");
          setResponsavelTecnico(data.responsavel_tecnico || "");
          setCrea(data.crea || "");
          setCargo(data.cargo || "");
          setDataElaboracao(data.data_elaboracao || "");
          setAlteracoes(data.alteracoes_documento || "");
          setRevisoes((data.revisoes as any) || []);
          setSetoresAet((data.setores as any) || []);
        }
      } catch (e: any) {
        toast.error("Erro ao carregar AET: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentoId]);

  const empresaNome = empresas.find((e: any) => e.id === empresaId)?.razao_social || "";

  const handleConfirmSetores = () => {
    const novos = setoresEmpresa
      .filter((s: any) => selectedIds.has(s.id))
      .filter((s: any) => !setoresAet.some((x) => x.setor_id === s.id))
      .map(newSetor);
    setSetoresAet([...setoresAet, ...novos]);
    setSelectedIds(new Set());
    setSelectModalOpen(false);
  };

  const removeSetor = (idx: number) => {
    setSetoresAet(setoresAet.filter((_, i) => i !== idx));
  };

  const updateSetor = (idx: number, patch: Partial<SetorAet>) => {
    setSetoresAet(setoresAet.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const persist = async (status: "rascunho" | "concluido") => {
    if (!empresaId) {
      toast.error("Selecione a empresa");
      return;
    }
    if (status === "concluido") {
      if (!responsavelTecnico.trim() || !dataElaboracao) {
        toast.error("Preencha responsável técnico e data de elaboração");
        return;
      }
      if (setoresAet.length === 0) {
        toast.error("Adicione ao menos um setor");
        return;
      }
    }
    setSaving(true);
    try {
      let docIdLocal = docId;
      if (!docIdLocal) {
        const { data: doc, error: docErr } = await supabase
          .from("documentos")
          .insert({
            tipo: "AET",
            empresa_id: empresaId,
            empresa_nome: empresaNome,
            status,
          })
          .select()
          .single();
        if (docErr) throw docErr;
        docIdLocal = doc.id;
        setDocId(docIdLocal);
      } else {
        await supabase
          .from("documentos")
          .update({ empresa_id: empresaId, empresa_nome: empresaNome, status })
          .eq("id", docIdLocal);
      }

      const payload = {
        documento_id: docIdLocal,
        empresa_id: empresaId,
        responsavel_tecnico: responsavelTecnico,
        crea,
        cargo,
        data_elaboracao: dataElaboracao || null,
        alteracoes_documento: alteracoes,
        revisoes: revisoes as any,
        setores: setoresAet as any,
        status,
      };

      if (aetId) {
        const { error } = await supabase.from("aet_documentos").update(payload).eq("id", aetId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("aet_documentos").insert(payload).select().single();
        if (error) throw error;
        setAetId(data.id);
      }

      toast.success(status === "concluido" ? "AET finalizada!" : "Rascunho salvo");
      if (status === "concluido") navigate("/documentos");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ───── EDITOR DE SETOR ─────
  if (editingSetorIdx !== null) {
    const setor = setoresAet[editingSetorIdx];
    const funcoesSetor = funcoesAll.filter((f: any) => f.setor_id === setor.setor_id);

    return (
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setEditingSetorIdx(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{setor.setor_nome}</h1>
            <p className="text-xs text-muted-foreground">Edição da AET deste setor</p>
          </div>
        </div>

        {/* Identificação do setor */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Identificação do setor</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>GES</Label>
              <Input value={setor.ges} onChange={(e) => updateSetor(editingSetorIdx, { ges: e.target.value })} />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={setor.setor_nome} disabled />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição do ambiente</Label>
              <Textarea
                value={setor.descricao_ambiente}
                onChange={(e) => updateSetor(editingSetorIdx, { descricao_ambiente: e.target.value })}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={setor.funcao_id}
                onValueChange={(v) => {
                  const f = funcoesSetor.find((x: any) => x.id === v);
                  updateSetor(editingSetorIdx, { funcao_id: v, funcao_nome: f?.nome_funcao || "" });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcoesSetor.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nº de funcionários</Label>
              <Input
                type="number"
                value={setor.numero_funcionarios}
                onChange={(e) => updateSetor(editingSetorIdx, { numero_funcionarios: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Colaboradores */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Colaboradores avaliados</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { colaboradores: [...setor.colaboradores, emptyColab()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {setor.colaboradores.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={c.nome_colaborador}
                    onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], nome_colaborador: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Data avaliação</Label>
                  <Input
                    type="date"
                    value={c.data_avaliacao}
                    onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], data_avaliacao: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  updateSetor(editingSetorIdx, { colaboradores: setor.colaboradores.filter((_, k) => k !== i) })
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {setor.colaboradores.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum colaborador adicionado.</p>
            )}
          </div>
        </Card>

        {/* Campos descritivos */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Descrição da atividade e ambiente</h2>
          <div className="space-y-3">
            {([
              ["posto_trabalho", "Posto de trabalho"],
              ["descricao_atividade", "Descrição da atividade"],
              ["analise_organizacional", "Análise organizacional"],
              ["tarefas", "Tarefas"],
              ["riscos_observados", "Riscos observados"],
              ["ritmo_complexidade", "Ritmo e complexidade"],
              ["jornada_aspectos", "Jornada e aspectos temporais"],
              ["caracterizacao_biomecanica", "Caracterização biomecânica"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  rows={3}
                  value={(setor as any)[key]}
                  onChange={(e) => updateSetor(editingSetorIdx, { [key]: e.target.value } as any)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Avaliações quantitativas */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Avaliações quantitativas</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { avaliacoes_quantitativas: [...setor.avaliacoes_quantitativas, emptyAval()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {setor.avaliacoes_quantitativas.map((a, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Especificação do setor/posto</Label>
                    <Input
                      value={a.especificacao_setor}
                      onChange={(e) => {
                        const arr = [...setor.avaliacoes_quantitativas];
                        arr[i] = { ...arr[i], especificacao_setor: e.target.value };
                        updateSetor(editingSetorIdx, { avaliacoes_quantitativas: arr });
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                    updateSetor(editingSetorIdx, { avaliacoes_quantitativas: setor.avaliacoes_quantitativas.filter((_, k) => k !== i) })
                  }>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["Ruído", "ruido_valor", "ruido_unidade"],
                    ["Iluminância", "iluminancia_valor", "iluminancia_unidade"],
                    ["Temperatura", "temperatura_valor", "temperatura_unidade"],
                  ] as const).map(([label, vKey, uKey]) => (
                    <div key={vKey}>
                      <Label className="text-xs">{label}</Label>
                      <div className="flex gap-1">
                        <Input
                          placeholder="valor"
                          value={(a as any)[vKey]}
                          onChange={(e) => {
                            const arr = [...setor.avaliacoes_quantitativas];
                            arr[i] = { ...arr[i], [vKey]: e.target.value };
                            updateSetor(editingSetorIdx, { avaliacoes_quantitativas: arr });
                          }}
                        />
                        <Input
                          className="w-20"
                          placeholder="un"
                          value={(a as any)[uKey]}
                          onChange={(e) => {
                            const arr = [...setor.avaliacoes_quantitativas];
                            arr[i] = { ...arr[i], [uKey]: e.target.value };
                            updateSetor(editingSetorIdx, { avaliacoes_quantitativas: arr });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {setor.avaliacoes_quantitativas.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma avaliação adicionada.</p>
            )}
          </div>
        </Card>

        {/* Conclusão */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Diagnóstico e conclusão</h2>
          <div className="space-y-3">
            <div>
              <Label>Diagnóstico ergonômico</Label>
              <Textarea
                rows={3}
                value={setor.diagnostico_ergonomico}
                onChange={(e) => updateSetor(editingSetorIdx, { diagnostico_ergonomico: e.target.value })}
              />
            </div>
            <div>
              <Label>Conclusão</Label>
              <Textarea
                rows={3}
                value={setor.conclusao}
                onChange={(e) => updateSetor(editingSetorIdx, { conclusao: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Plano de ação */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Plano de ação</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { plano_acao: [...setor.plano_acao, emptyPlano()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {setor.plano_acao.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">O quê</Label>
                  <Input value={p.o_que} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], o_que: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Como</Label>
                  <Input value={p.como} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], como: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Responsável</Label>
                  <Input value={p.responsavel} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], responsavel: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Prazo</Label>
                  <Input value={p.prazo} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], prazo: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  updateSetor(editingSetorIdx, { plano_acao: setor.plano_acao.filter((_, k) => k !== i) })
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {setor.plano_acao.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma ação adicionada.</p>
            )}
          </div>
        </Card>

        {/* Placeholders fase 2 */}
        <Card className="p-5 mb-4 border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings2 className="w-4 h-4" />
            <p className="text-sm">
              <strong>Fase 2:</strong> Ferramentas ergonômicas (RULA, REBA, OCRA, NIOSH, OWAS, Moore-Garg) e upload de imagens serão adicionados em breve.
            </p>
          </div>
        </Card>

        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border">
          <Button variant="outline" onClick={() => setEditingSetorIdx(null)}>
            Voltar para lista
          </Button>
          <Button onClick={() => persist("rascunho")} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar rascunho
          </Button>
        </div>
      </div>
    );
  }

  // ───── TELA PRINCIPAL ─────
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Análise Ergonômica do Trabalho (AET)</h1>
          <p className="text-xs text-muted-foreground">Cadastro completo do documento</p>
        </div>
      </div>

      {/* Identificação */}
      <Card className="p-5 mb-4">
        <h2 className="font-heading font-semibold mb-3">1. Identificação</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável técnico *</Label>
            <Input value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} />
          </div>
          <div>
            <Label>CREA</Label>
            <Input value={crea} onChange={(e) => setCrea(e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div>
            <Label>Data de elaboração *</Label>
            <Input type="date" value={dataElaboracao} onChange={(e) => setDataElaboracao(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Alterações do documento</Label>
            <Textarea value={alteracoes} onChange={(e) => setAlteracoes(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Revisões</Label>
            <Button size="sm" variant="outline" onClick={() => setRevisoes([...revisoes, emptyRev()])}>
              <Plus className="w-4 h-4 mr-1" />Revisão
            </Button>
          </div>
          <div className="space-y-2">
            {revisoes.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={r.data_revisao} onChange={(e) => {
                    const arr = [...revisoes]; arr[i] = { ...arr[i], data_revisao: e.target.value };
                    setRevisoes(arr);
                  }} />
                </div>
                <div className="col-span-8">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={r.descricao_revisao} onChange={(e) => {
                    const arr = [...revisoes]; arr[i] = { ...arr[i], descricao_revisao: e.target.value };
                    setRevisoes(arr);
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  setRevisoes(revisoes.filter((_, k) => k !== i))
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Setores */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold">2. Setores avaliados</h2>
          <Button size="sm" variant="outline" disabled={!empresaId} onClick={() => setSelectModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />Selecionar setores
          </Button>
        </div>
        {setoresAet.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {empresaId ? "Nenhum setor adicionado" : "Selecione uma empresa primeiro"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {setoresAet.map((s, i) => (
              <div key={s.setor_id} className="border border-border rounded-lg p-4 hover:border-accent transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{s.setor_nome}</h3>
                    {s.ges && <p className="text-xs text-muted-foreground">GES: {s.ges}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeSetor(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button size="sm" className="w-full mt-2" onClick={() => setEditingSetorIdx(i)}>
                  Registrar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border">
        <Button variant="outline" onClick={() => persist("rascunho")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar rascunho
        </Button>
        <Button onClick={() => persist("concluido")} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Finalizar AET
        </Button>
      </div>

      {/* Modal de seleção de setores */}
      <Dialog open={selectModalOpen} onOpenChange={setSelectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar setores</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {setoresEmpresa.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Esta empresa não possui setores cadastrados.
              </p>
            )}
            {setoresEmpresa.map((s: any) => {
              const already = setoresAet.some((x) => x.setor_id === s.id);
              return (
                <label key={s.id} className={`flex items-center gap-2 p-2 rounded hover:bg-muted ${already ? "opacity-50" : "cursor-pointer"}`}>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    disabled={already}
                    onCheckedChange={(v) => {
                      const next = new Set(selectedIds);
                      if (v) next.add(s.id); else next.delete(s.id);
                      setSelectedIds(next);
                    }}
                  />
                  <span className="text-sm">{s.nome_setor}</span>
                  {already && <span className="text-xs text-muted-foreground ml-auto">já adicionado</span>}
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmSetores} disabled={selectedIds.size === 0}>
              Adicionar ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
