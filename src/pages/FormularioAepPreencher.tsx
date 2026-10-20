import { usePersistedState } from "@/hooks/usePersistedState";
import { EtapaReconhecimento, reconhecimentoVazio, type ReconhecimentoState } from "@/components/formulario-aep/EtapaReconhecimento";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PrefillState = { empresaId?: string; contratoId?: string; setorIds?: string[] } | null;

const CRITERIOS = ["AF", "RE", "IN", "QO"] as const;
const CONTROLES = ["PI", "MS", "CM", "CE", "AD", "ME", "CP"] as const;
const LINHAS = [1, 2, 3, 4, 5];

type LinhaTabela = { texto: string; marcas: Record<string, string> };
const linhasVazias = (): LinhaTabela[] => LINHAS.map(() => ({ texto: "", marcas: {} }));

// Aceita apenas números ou "X"
const filtrarMarca = (v: string) => {
  const s = v.toUpperCase().replace(/\s/g, "");
  if (s === "" || s === "X") return s;
  return s.replace(/[^0-9]/g, "").slice(0, 4);
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-foreground border-b border-border pb-2 mb-4">{children}</h2>;
}

function TabelaMarcacao({
  colunas, tituloTexto, linhas, onChange,
}: {
  colunas: readonly string[];
  tituloTexto: string;
  linhas: LinhaTabela[];
  onChange: (l: LinhaTabela[]) => void;
}) {
  const set = (i: number, patch: Partial<LinhaTabela>) =>
    onChange(linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="w-12 px-2 py-2 text-center font-medium text-muted-foreground border-r border-border">ID</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border">{tituloTexto}</th>
            {colunas.map((c) => (
              <th key={c} className="w-14 px-1 py-2 text-center font-medium text-muted-foreground border-r border-border last:border-r-0">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1 text-center text-muted-foreground border-r border-border">{i + 1}</td>
              <td className="p-1 border-r border-border">
                <Input value={l.texto} onChange={(e) => set(i, { texto: e.target.value })} className="h-8 border-0 shadow-none focus-visible:ring-1" />
              </td>
              {colunas.map((c) => (
                <td key={c} className="p-1 border-r border-border last:border-r-0">
                  <Input
                    value={l.marcas[c] || ""}
                    onChange={(e) => set(i, { marcas: { ...l.marcas, [c]: filtrarMarca(e.target.value) } })}
                    className="h-8 px-1 text-center border-0 shadow-none focus-visible:ring-1"
                    aria-label={`${c} linha ${i + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FormularioAepPreencher() {
  const navigate = useNavigate();
  const prefill = (useLocation().state as PrefillState) || null;
  const empresaId = prefill?.empresaId || "";
  const contratoId = prefill?.contratoId || "";

  const chave = `formulario-aep:${empresaId}:${contratoId}`;
  const [etapa, setEtapa] = usePersistedState<number>(`${chave}:etapa`, 1);
  const [reconhecimento, setReconhecimento] = usePersistedState<ReconhecimentoState>(`${chave}:etapa2`, reconhecimentoVazio());
  const [ident, setIdent] = usePersistedState(`${chave}:ident`, {
    gerencia_executiva: "", gerencia: "", local_fisico: "", nome_gere: "", codigo_gere: "",
    horario_avaliacao: "", jornada: "", expostos: "", descricao: "",
  });
  const [funcoesArr, setFuncoesArr] = usePersistedState<string[]>(`${chave}:funcoes`, []);
  const funcoesSel = new Set(funcoesArr);
  const [atividades, setAtividades] = usePersistedState<LinhaTabela[]>(`${chave}:atividades`, linhasVazias());
  const [controles, setControles] = usePersistedState<LinhaTabela[]>(`${chave}:controles`, linhasVazias());

  const { data: funcoes = [], isLoading } = useQuery({
    queryKey: ["formulario-aep-funcoes", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, funcoes(id, nome_funcao)")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      const lista = (data || []).flatMap((s: any) => s.funcoes || []);
      const unicas = new Map<string, any>(lista.map((f: any) => [f.id, f]));
      return [...unicas.values()].sort((a, b) => a.nome_funcao.localeCompare(b.nome_funcao));
    },
  });

  const campo = (k: keyof typeof ident, label: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={ident[k]} onChange={(e) => setIdent((p) => ({ ...p, [k]: e.target.value }))} />
    </div>
  );

  const toggleFuncao = (id: string) =>
    setFuncoesArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div>
      <PageHeader
        title="Formulário AEP"
        description="Preencha a identificação e as tabelas da avaliação"
        actions={
          <Button variant="outline" onClick={() => (etapa === 2 ? (setEtapa(1), window.scrollTo(0, 0)) : navigate("/formulario-aep/novo"))}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        }
      />

      {!empresaId || !contratoId ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Selecione empresa, contrato e setores em “Novo Formulário” para iniciar.
        </Card>
      ) : etapa === 2 ? (
        <div className="space-y-6">
          <EtapaReconhecimento value={reconhecimento} onChange={setReconhecimento} />
          <div className="flex justify-start">
            <Button variant="outline" onClick={() => { setEtapa(1); window.scrollTo(0, 0); }}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <SectionTitle>I – IDENTIFICAÇÃO E CARACTERIZAÇÃO</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {campo("gerencia_executiva", "Gerência Executiva")}
              {campo("gerencia", "Gerência")}
              {campo("local_fisico", "Local Físico")}
              {campo("nome_gere", "Nome GERE")}
              {campo("codigo_gere", "Código GERE")}
            </div>

            <div className="mt-5 space-y-2">
              <Label className="text-xs">Funções amostradas em campo</Label>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : funcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função cadastrada para esta empresa e contrato.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border border-border p-3">
                  {funcoes.map((f: any) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={funcoesSel.has(f.id)} onCheckedChange={() => toggleFuncao(f.id)} />
                      <span className="truncate">{f.nome_funcao}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {campo("horario_avaliacao", "Horário da avaliação")}
              {campo("jornada", "Jornada de trabalho")}
              {campo("expostos", "Nº de trabalhadores expostos")}
            </div>

            <div className="mt-5 space-y-1.5">
              <Label className="text-xs">Descrição resumida</Label>
              <Textarea rows={4} value={ident.descricao} onChange={(e) => setIdent((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle>II – PRIORIZAÇÃO DE DEMANDA – ATIVIDADES CRÍTICAS</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">
              Critérios de criticidade: AF – Afastamentos | RE – Restritos | IN – Incidentes | QO – Queixas Osteomusculares
            </p>
            <TabelaMarcacao colunas={CRITERIOS} tituloTexto="Atividades" linhas={atividades} onChange={setAtividades} />
          </Card>

          <Card className="p-6">
            <SectionTitle>III – MEDIDAS DE CONTROLE EXISTENTES/CIRCUNSTÂNCIAS DE EXIGÊNCIAS ERGONÔMICAS</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">
              Tipos de Controle: PI – Proteção Individual | MS – Manutenção e Substituição | CM – Coletiva e Minimização | CE – Coletiva e Engenharia | AD – Administrativa | ME – Médico | CP – Capacitação
            </p>
            <TabelaMarcacao
              colunas={CONTROLES}
              tituloTexto="Descrição do Controle/Circunstância de Exigência Ergonômica"
              linhas={controles}
              onChange={setControles}
            />
          </Card>

          <div className="flex justify-end">
            <Button type="button" onClick={() => { setEtapa(2); window.scrollTo(0, 0); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Avançar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
