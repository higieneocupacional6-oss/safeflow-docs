import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, FileSignature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SeletorSetorFuncoesAep } from "@/components/formulario-aep/SeletorSetorFuncoesAep";
import { sortByGes } from "@/lib/sortGes";
import { todayDateOnly } from "@/lib/dateOnly";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import {
  baixarPdfFormularioAep, montarPdfDados, urlNovoFormularioAep, urlPreencherFormularioAep,
} from "@/lib/formularioAepRegistro";
import { toast } from "sonner";

export default function FormularioAepNovo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [empresaId, setEmpresaId] = useState(params.get("empresa") || "");
  const [contratoId, setContratoId] = useState(params.get("contrato") || "");
  const [funcoesPorSetor, setFuncoesPorSetor] = useState<Record<string, string[]>>({});
  const restaurado = useRef("");

  useRealtimeSync(
    [{ table: "formularios_aep", queryKey: ["formulario-aep-novo-salvos"] }],
    "formulario-aep-novo-sync",
  );

  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ["formulario-aep-novo-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
    queryKey: ["formulario-aep-novo-contratos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: setores = [], isLoading: loadingSetores, isFetched: setoresProntos } = useQuery({
    queryKey: ["formulario-aep-novo-setores", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("setores")
        .select("id, nome_setor, ghe_ges, descricao_ambiente, funcoes(id, nome_funcao, descricao_atividades)")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return sortByGes(data || []);
    },
  });

  const { data: salvos = [] } = useQuery({
    queryKey: ["formulario-aep-novo-salvos", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios_aep")
        .select("id, funcao_id, updated_at")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return data as { id: string; funcao_id: string | null; updated_at: string }[];
    },
  });

  const funcoesParam = params.get("funcoes") || "";
  useEffect(() => {
    if (!empresaId || !contratoId || !setoresProntos) return;
    const chave = `${empresaId}:${contratoId}:${funcoesParam}`;
    if (restaurado.current === chave) return;
    restaurado.current = chave;
    const ids = new Set(funcoesParam.split(",").filter(Boolean));
    const next: Record<string, string[]> = {};
    for (const setor of setores as any[]) {
      const doSetor = (setor.funcoes || []).map((f: any) => f.id).filter((id: string) => ids.has(id));
      if (doSetor.length) next[setor.id] = doSetor;
    }
    setFuncoesPorSetor(next);
  }, [empresaId, contratoId, setoresProntos, setores, funcoesParam]);

  const funcoesEscolhidas = useMemo(() => Object.values(funcoesPorSetor).flat(), [funcoesPorSetor]);
  const salvas = useMemo(() => {
    const map: Record<string, { id: string; updated_at: string }> = {};
    for (const row of salvos) {
      if (!row.funcao_id) continue;
      const atual = map[row.funcao_id];
      if (!atual || atual.updated_at < row.updated_at) map[row.funcao_id] = { id: row.id, updated_at: row.updated_at };
    }
    return map;
  }, [salvos]);

  const aplicarSelecao = (next: Record<string, string[]>) => {
    setFuncoesPorSetor(next);
    const ids = Object.values(next).flat();
    restaurado.current = `${empresaId}:${contratoId}:${ids.join(",")}`;
    navigate(urlNovoFormularioAep(empresaId, contratoId, ids), { replace: true });
  };

  const abrirFuncao = (setorId: string, funcaoId: string, formularioId?: string) => {
    navigate(urlPreencherFormularioAep({
      empresaId, contratoId, setorId, funcaoId, formularioId,
      origem: "novo", funcoes: funcoesEscolhidas,
    }));
  };

  const baixarFuncao = async (setorId: string, funcaoId: string, formularioId: string) => {
    const setor = (setores as any[]).find((s) => s.id === setorId);
    const funcao = setor?.funcoes?.find((f: any) => f.id === funcaoId);
    const empresa = (empresas as any[]).find((e) => e.id === empresaId);
    const contrato = (contratos as any[]).find((c) => c.id === contratoId);
    const { data, error } = await supabase.from("formularios_aep").select("dados").eq("id", formularioId).eq("empresa_id", empresaId).eq("contrato_id", contratoId).maybeSingle();
    if (error || !data) {
      toast.error("Não foi possível baixar o relatório.");
      return;
    }
    const nomeFuncao = funcao?.nome_funcao || "funcao";
    const arquivo = `Formulario_AEP_${nomeFuncao.replace(/[^\w]+/g, "_")}_${todayDateOnly()}.pdf`;
    baixarPdfFormularioAep(montarPdfDados({
      empresaNome: empresa?.nome_fantasia || empresa?.razao_social || "",
      contratoNome: [contrato?.numero_contrato, contrato?.nome_contratante].filter(Boolean).join(" – ") || "Sem número",
      funcaoNome: nomeFuncao,
      dados: data.dados,
    }), arquivo);
    toast.success("PDF baixado.");
  };

  const handleCriar = () => {
    if (!empresaId) return toast.error("Selecione a empresa");
    if (!contratoId) return toast.error("Selecione o contrato");
    const pares = (setores as any[]).flatMap((setor) =>
      (funcoesPorSetor[setor.id] || []).map((funcaoId: string) => ({ setorId: setor.id, funcaoId })),
    );
    if (pares.length === 0) return toast.error("Selecione ao menos uma função");
    const alvo = pares.find((p) => !salvas[p.funcaoId]) || pares[0];
    abrirFuncao(alvo.setorId, alvo.funcaoId, salvas[alvo.funcaoId]?.id);
  };

  return (
    <div>
      <PageHeader
        title="Novo Formulário AEP"
        description="Selecione a empresa, o contrato, o setor e as funções da análise"
        actions={
          <Button variant="outline" onClick={() => navigate("/formulario-aep")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        }
      />

      <Card className="p-6 max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Empresa
          </Label>
          <Select
            value={empresaId}
            onValueChange={(v) => {
              setEmpresaId(v);
              setContratoId("");
              setFuncoesPorSetor({});
              restaurado.current = "";
              navigate(urlNovoFormularioAep(v, "", []), { replace: true });
            }}
            disabled={loadingEmpresas}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingEmpresas ? "Carregando..." : "Selecione a empresa"} />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {empresaId && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-muted-foreground" /> Contrato
            </Label>
            <Select
              value={contratoId}
              onValueChange={(v) => {
                setContratoId(v);
                setFuncoesPorSetor({});
                restaurado.current = "";
                navigate(urlNovoFormularioAep(empresaId, v, []), { replace: true });
              }}
              disabled={loadingContratos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingContratos ? "Carregando..." : "Selecione o contrato"} />
              </SelectTrigger>
              <SelectContent>
                {contratos.length === 0 ? (
                  <SelectItem value="__vazio__" disabled>
                    Nenhum contrato cadastrado
                  </SelectItem>
                ) : (
                  contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_contrato || "Sem número"}
                      {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {empresaId && contratoId && (
          <SeletorSetorFuncoesAep
            setores={setores as any[]}
            loading={loadingSetores}
            funcoesPorSetor={funcoesPorSetor}
            salvas={salvas}
            onChange={aplicarSelecao}
            onAbrir={abrirFuncao}
            onBaixar={baixarFuncao}
          />
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/formulario-aep")}>
            Cancelar
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleCriar}
            disabled={!empresaId || !contratoId || funcoesEscolhidas.length === 0}
          >
            Criar formulário
          </Button>
        </div>
      </Card>
    </div>
  );
}
