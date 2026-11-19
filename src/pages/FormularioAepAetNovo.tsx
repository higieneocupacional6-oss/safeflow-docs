import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, FileSignature, FolderTree, Loader2, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { sortByGes } from "@/lib/sortGes";
import { useAuth } from "@/hooks/useAuth";
import {
  TIPO_AEP_AET,
  dadosVaziosAepAet,
  lerSnapshotAepAet,
  urlAepAetContrato,
  urlAepAetOffline,
  urlAepAetRegistro,
  type AepAetDraftSnapshot,
} from "@/lib/aepAetFormulario";
import { createAepAetOfflineNovo, getAepAetModoPreferido, listAepAetOffline } from "@/lib/aepAetOfflineDb";
import { toast } from "sonner";

export default function FormularioAepAetNovo() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [empresaId, setEmpresaId] = useState(params.get("empresa") || "");
  const [contratoId, setContratoId] = useState(params.get("contrato") || "");
  const [funcaoOpen, setFuncaoOpen] = useState(false);
  const [setorSel, setSetorSel] = useState("");
  const [funcaoSel, setFuncaoSel] = useState("");
  const [saving, setSaving] = useState(false);

  useRealtimeSync(
    [
      { table: "setores", queryKey: ["aep-aet-novo-setores", empresaId, contratoId] },
      { table: "documentos", queryKey: ["aep-aet-novo-docs", empresaId, contratoId] },
    ],
    "aep-aet-novo-sync",
  );

  const { data: empresas = [], isLoading: loadingEmp } = useQuery({
    queryKey: ["aep-aet-novo-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [], isLoading: loadingCtr } = useQuery({
    queryKey: ["aep-aet-novo-contratos", empresaId],
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

  const { data: setores = [], isLoading: loadingSetores } = useQuery({
    queryKey: ["aep-aet-novo-setores", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("setores")
        .select("id, nome_setor, ghe_ges, funcoes(id, nome_funcao)")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return sortByGes(data || []);
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["aep-aet-novo-docs", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, draft_snapshot, status")
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    setContratoId((prev) => {
      if (!empresaId) return "";
      if (prev && contratos.some((c) => c.id === prev)) return prev;
      const fromParam = params.get("contrato") || "";
      if (fromParam && contratos.some((c) => c.id === fromParam)) return fromParam;
      return "";
    });
  }, [empresaId, contratos, params]);

  useEffect(() => {
    setSetorSel("");
    setFuncaoSel("");
  }, [contratoId]);

  const funcoesAvaliadas = useMemo(() => {
    const ids = new Set<string>();
    for (const d of docs) {
      const snap = lerSnapshotAepAet(d.draft_snapshot);
      if (snap?.funcao_id) ids.add(snap.funcao_id);
    }
    return ids;
  }, [docs]);

  const funcoesDoSetor = useMemo(() => {
    const setor = (setores as any[]).find((s) => s.id === setorSel);
    return (setor?.funcoes || []) as { id: string; nome_funcao: string }[];
  }, [setores, setorSel]);

  const funcoesDisponiveis = funcoesDoSetor.filter((f) => !funcoesAvaliadas.has(f.id));

  const criarAvaliacao = async () => {
    if (!empresaId) return toast.error("Selecione a empresa.");
    if (!contratoId) return toast.error("Selecione o contrato.");
    if (!setorSel) return toast.error("Selecione o setor.");
    if (!funcaoSel) return toast.error("Selecione a função.");

    const existente = docs.find((d) => lerSnapshotAepAet(d.draft_snapshot)?.funcao_id === funcaoSel);
    if (existente) {
      toast.message("Esta função já possui avaliação.");
      navigate(urlAepAetRegistro(empresaId, contratoId, existente.id));
      return;
    }

    const empresa = empresas.find((e) => e.id === empresaId);
    const setor = (setores as any[]).find((s) => s.id === setorSel);
    const funcao = funcoesDoSetor.find((f) => f.id === funcaoSel);
    const dados = dadosVaziosAepAet({
      setorNome: setor?.nome_setor || "",
      funcaoNome: funcao?.nome_funcao || "",
    });
    const snapshot: AepAetDraftSnapshot = {
      setor_id: setorSel,
      funcao_id: funcaoSel,
      dados,
    };

    const preferOffline =
      getAepAetModoPreferido() === "offline" ||
      (typeof navigator !== "undefined" && !navigator.onLine);

    setSaving(true);
    try {
      // Evita duplicar rascunho offline da mesma função neste dispositivo
      const locais = await listAepAetOffline({
        empresaId,
        contratoId,
        statuses: ["pending", "error", "syncing", "synced"],
      });
      const localMesma = locais.find((l) => l.funcao_id === funcaoSel && !l.server_id);
      if (localMesma) {
        toast.message("Avaliação offline já existe neste dispositivo.");
        setFuncaoOpen(false);
        navigate(urlAepAetOffline(empresaId, contratoId, localMesma.client_id));
        return;
      }

      if (preferOffline) {
        const row = await createAepAetOfflineNovo({
          empresaId,
          empresaNome: empresa?.nome_fantasia || empresa?.razao_social || "",
          contratoId,
          contratoNome: contratos.find((c) => c.id === contratoId)?.numero_contrato || "",
          setorId: setorSel,
          setorNome: setor?.nome_setor || "",
          funcaoId: funcaoSel,
          funcaoNome: funcao?.nome_funcao || "",
          dados,
        });
        toast.success("Avaliação criada offline neste dispositivo.");
        setFuncaoOpen(false);
        navigate(urlAepAetOffline(empresaId, contratoId, row.client_id));
        return;
      }

      const { data, error } = await supabase
        .from("documentos")
        .insert({
          tipo: TIPO_AEP_AET,
          empresa_id: empresaId,
          contrato_id: contratoId,
          empresa_nome: empresa?.nome_fantasia || empresa?.razao_social || "",
          status: "rascunho",
          draft_snapshot: snapshot,
          last_modified_by: user?.id || null,
          current_step: 0,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["aep-aet-docs"] });
      qc.invalidateQueries({ queryKey: ["aep-aet-docs-emp", empresaId] });
      qc.invalidateQueries({ queryKey: ["aep-aet-docs-ctr", contratoId] });
      qc.invalidateQueries({ queryKey: ["aep-aet-novo-docs", empresaId, contratoId] });
      toast.success("Avaliação criada.");
      setFuncaoOpen(false);
      navigate(urlAepAetRegistro(empresaId, contratoId, data.id));
    } catch (e) {
      // Sem rede: cria offline automaticamente
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        try {
          const row = await createAepAetOfflineNovo({
            empresaId,
            empresaNome: empresa?.nome_fantasia || empresa?.razao_social || "",
            contratoId,
            contratoNome: contratos.find((c) => c.id === contratoId)?.numero_contrato || "",
            setorId: setorSel,
            setorNome: setor?.nome_setor || "",
            funcaoId: funcaoSel,
            funcaoNome: funcao?.nome_funcao || "",
            dados,
          });
          toast.success("Sem conexão — avaliação salva offline.");
          setFuncaoOpen(false);
          navigate(urlAepAetOffline(empresaId, contratoId, row.client_id));
          return;
        } catch {
          /* fallthrough */
        }
      }
      toast.error(e instanceof Error ? e.message : "Falha ao criar avaliação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/formulario-aep-aet">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Nova avaliação AEP/AET"
        description="Selecione empresa e contrato. Em seguida adicione a função a avaliar."
      />

      <div className="portal-surface space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Empresa
            </Label>
            <Select
              value={empresaId || undefined}
              onValueChange={(v) => {
                setEmpresaId(v);
                setContratoId("");
              }}
              disabled={loadingEmp}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEmp ? "Carregando…" : "Selecione a empresa"} />
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
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <FileSignature className="h-3.5 w-3.5" /> Contrato
            </Label>
            <Select
              value={contratoId || undefined}
              onValueChange={setContratoId}
              disabled={!empresaId || loadingCtr}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !empresaId ? "Selecione a empresa primeiro" : loadingCtr ? "Carregando…" : "Selecione o contrato"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.numero_contrato || "(sem número)"}
                    {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {empresaId && contratoId && (
          <div className="space-y-3 border-t border-border/70 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-sm font-semibold">Setores e funções</h2>
                <p className="text-xs text-muted-foreground">
                  Cadastros existentes de Setores e Funções deste contrato.
                </p>
              </div>
              <Button onClick={() => setFuncaoOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Função
              </Button>
            </div>

            {loadingSetores ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (setores as any[]).length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum setor/função cadastrado. Cadastre em “Setores e Funções”.
              </p>
            ) : (
              <div className="space-y-3">
                {(setores as any[]).map((setor) => {
                  const funcoes = (setor.funcoes || []) as { id: string; nome_funcao: string }[];
                  return (
                    <div key={setor.id} className="rounded-xl border border-border/80 bg-card overflow-hidden">
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2">
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{setor.nome_setor}</span>
                        {setor.ghe_ges && (
                          <Badge variant="outline" className="text-[10px]">{setor.ghe_ges}</Badge>
                        )}
                      </div>
                      <ul className="divide-y divide-border/60">
                        {funcoes.length === 0 ? (
                          <li className="px-3 py-2 text-xs text-muted-foreground">Sem funções neste setor.</li>
                        ) : (
                          funcoes.map((f) => {
                            const jaTem = funcoesAvaliadas.has(f.id);
                            const doc = docs.find((d) => lerSnapshotAepAet(d.draft_snapshot)?.funcao_id === f.id);
                            return (
                              <li key={f.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="flex-1 truncate">{f.nome_funcao}</span>
                                {jaTem && doc ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(urlAepAetRegistro(empresaId, contratoId, doc.id))}
                                  >
                                    Abrir
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">Disponível</Badge>
                                )}
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate(urlAepAetContrato(empresaId, contratoId))}
              >
                Ver avaliações do contrato
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={funcaoOpen} onOpenChange={setFuncaoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar função à avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Setor</Label>
              <Select
                value={setorSel || undefined}
                onValueChange={(v) => {
                  setSetorSel(v);
                  setFuncaoSel("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {(setores as any[]).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome_setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Função</Label>
              <Select
                value={funcaoSel || undefined}
                onValueChange={setFuncaoSel}
                disabled={!setorSel}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!setorSel ? "Selecione o setor" : "Selecione a função"} />
                </SelectTrigger>
                <SelectContent>
                  {funcoesDisponiveis.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {setorSel && funcoesDisponiveis.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todas as funções deste setor já possuem avaliação.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuncaoOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void criarAvaliacao()} disabled={saving || !funcaoSel}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
