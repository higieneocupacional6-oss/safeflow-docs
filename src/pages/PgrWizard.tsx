import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type Revisao = {
  revisao: string;
  data: string;
  motivo: string;
  responsavel: string;
};

const emptyRevisao = (): Revisao => ({ revisao: "", data: "", motivo: "", responsavel: "" });

export default function PgrWizard() {
  const { documentoId } = useParams<{ documentoId?: string }>();
  const navigate = useNavigate();

  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElaboracao, setDataElaboracao] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [loading, setLoading] = useState(!!documentoId);
  const [saving, setSaving] = useState(false);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-pgr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id,razao_social,nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  // Carregar rascunho existente
  useEffect(() => {
    if (!documentoId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("documentos")
          .select("*")
          .eq("id", documentoId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setEmpresaId(data.empresa_id || "");
          setEmpresaNome(data.empresa_nome || "");
          setResponsavelTecnico(data.responsavel_tecnico || "");
          setCrea(data.crea || "");
          setCargo(data.cargo || "");
          setDataElaboracao(data.data_elaboracao || "");
          setRevisoes(Array.isArray(data.revisoes) ? (data.revisoes as any[]) : []);
        }
      } catch (e: any) {
        toast.error("Erro ao carregar rascunho: " + (e.message || ""));
      } finally {
        setLoading(false);
      }
    })();
  }, [documentoId]);

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    const emp = empresas.find((e: any) => e.id === id);
    setEmpresaNome(emp ? (emp.razao_social || emp.nome_fantasia || "") : "");
  };

  const addRevisao = () => setRevisoes((prev) => [...prev, emptyRevisao()]);
  const removeRevisao = (i: number) => setRevisoes((prev) => prev.filter((_, idx) => idx !== i));
  const updateRevisao = (i: number, field: keyof Revisao, value: string) =>
    setRevisoes((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const buildPayload = () => ({
    tipo: "PGR",
    empresa_id: empresaId || null,
    empresa_nome: empresaNome || "",
    responsavel_tecnico: responsavelTecnico || null,
    crea: crea || null,
    cargo: cargo || null,
    data_elaboracao: dataElaboracao || null,
    revisoes: revisoes as any,
    status: "rascunho",
  });

  const persist = async (): Promise<string | null> => {
    setSaving(true);
    try {
      if (docId) {
        const { error } = await supabase.from("documentos").update(buildPayload()).eq("id", docId);
        if (error) throw error;
        return docId;
      }
      const { data, error } = await supabase.from("documentos").insert(buildPayload()).select("id").single();
      if (error) throw error;
      setDocId(data.id);
      return data.id;
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e.message || ""));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSalvar = async () => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    const id = await persist();
    if (id) {
      toast.success("Rascunho salvo");
      if (!documentoId) navigate(`/documentos/pgr/editar/${id}`, { replace: true });
    }
  };

  const handleAvancar = async () => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    const id = await persist();
    if (id) {
      toast.success("Identificação salva");
      // Próxima página ainda não implementada; mantém na tela como rascunho
      if (!documentoId) navigate(`/documentos/pgr/editar/${id}`, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">PGR — Identificação</h1>
          <p className="text-sm text-muted-foreground">Programa de Gerenciamento de Riscos</p>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <Label className="text-xs font-bold uppercase">Empresa *</Label>
          <Select value={empresaId} onValueChange={handleEmpresaChange}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold uppercase">Responsável Técnico</Label>
            <Input className="mt-1" value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase">CREA</Label>
            <Input className="mt-1" value={crea} onChange={(e) => setCrea(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase">Cargo</Label>
            <Input className="mt-1" value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase">Data de Elaboração</Label>
            <Input className="mt-1" type="date" value={dataElaboracao} onChange={(e) => setDataElaboracao(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold">Revisões</h2>
            <p className="text-xs text-muted-foreground">Histórico de revisões do documento</p>
          </div>
          <Button variant="outline" size="sm" onClick={addRevisao}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar revisão
          </Button>
        </div>

        {revisoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma revisão cadastrada</p>
        ) : (
          <div className="space-y-3">
            {revisoes.map((r, i) => (
              <div key={i} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                <div>
                  <Label className="text-xs">Revisão</Label>
                  <Input className="mt-1" value={r.revisao} onChange={(e) => updateRevisao(i, "revisao", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data</Label>
                  <Input className="mt-1" type="date" value={r.data} onChange={(e) => updateRevisao(i, "data", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Motivo</Label>
                  <Input className="mt-1" value={r.motivo} onChange={(e) => updateRevisao(i, "motivo", e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Responsável</Label>
                    <Input className="mt-1" value={r.responsavel} onChange={(e) => updateRevisao(i, "responsavel", e.target.value)} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive"
                    onClick={() => removeRevisao(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleSalvar} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
        <Button onClick={handleAvancar} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Avançar
        </Button>
      </div>
    </div>
  );
}
