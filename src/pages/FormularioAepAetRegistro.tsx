import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AepAetEtapaIdentificacao } from "@/components/formulario-aep-aet/AepAetEtapaIdentificacao";
import { AepAetEtapaVariabilidade } from "@/components/formulario-aep-aet/AepAetEtapaVariabilidade";
import { AepAetEtapaPosturas } from "@/components/formulario-aep-aet/AepAetEtapaPosturas";
import { AepAetEtapaMovimentos } from "@/components/formulario-aep-aet/AepAetEtapaMovimentos";
import { AepAetEtapaEsforco } from "@/components/formulario-aep-aet/AepAetEtapaEsforco";
import { AepAetEtapaMobiliario } from "@/components/formulario-aep-aet/AepAetEtapaMobiliario";
import { AepAetEtapaFerramentas } from "@/components/formulario-aep-aet/AepAetEtapaFerramentas";
import { AepAetEtapaCondicoes } from "@/components/formulario-aep-aet/AepAetEtapaCondicoes";
import { AepAetEtapaOrganizacao } from "@/components/formulario-aep-aet/AepAetEtapaOrganizacao";
import { AepAetEtapaCronoanalise } from "@/components/formulario-aep-aet/AepAetEtapaCronoanalise";
import { AepAetEtapaSaude } from "@/components/formulario-aep-aet/AepAetEtapaSaude";
import { AepAetEtapaSugestoes } from "@/components/formulario-aep-aet/AepAetEtapaSugestoes";
import { AepAetModoSeletor } from "@/components/formulario-aep-aet/AepAetModoSeletor";
import { useAuth } from "@/hooks/useAuth";
import {
  AEP_AET_ETAPAS,
  AEP_AET_TOTAL_ETAPAS,
  TIPO_AEP_AET,
  lerDadosAepAet,
  lerSnapshotAepAet,
  numeroFinito,
  numeroNaoNegativo,
  urlAepAetContrato,
  validarEtapaAepAet,
  validarFormularioAepAetCompleto,
  type AepAetDados,
} from "@/lib/aepAetFormulario";
import {
  getAepAetModoPreferido,
  getAepAetOffline,
  setAepAetModoPreferido,
  type AepAetModo,
  type AepAetOfflineAvaliacao,
} from "@/lib/aepAetOfflineDb";
import {
  garantirEspelhoOffline,
  marcarPreferenciaModo,
  persistirAepAetOfflineLocal,
  persistirAepAetOnline,
} from "@/lib/aepAetPersistencia";
import { cn } from "@/lib/utils";

type AutoStatus = "salvo" | "pendente" | "salvando" | "erro";

function errosIdentificacao(dados: AepAetDados) {
  const id = dados.identificacao;
  return {
    data_avaliacao: !id.data_avaliacao,
    colaborador_avaliado: !id.colaborador_avaliado.trim(),
    setor_avaliado: !id.setor_avaliado.trim(),
    funcao_avaliada: !id.funcao_avaliada.trim(),
    qtd_colaboradores_funcao: (() => {
      const q = Number(String(id.qtd_colaboradores_funcao).replace(",", "."));
      return !Number.isFinite(q) || q < 1 || !Number.isInteger(q);
    })(),
  };
}

function errosVariabilidade(dados: AepAetDados) {
  const v = dados.variabilidade;
  return {
    atividade_sempre_igual: !v.atividade_sempre_igual,
    atividades_diferentes_dia: !v.atividades_diferentes_dia,
    rodizio_atividades: !v.rodizio_atividades,
    realiza_horas_extras: !v.realiza_horas_extras,
    frequencia_horas_extras: v.realiza_horas_extras === "sim" && !v.frequencia_horas_extras.trim(),
    observacoes: false,
  };
}

function errosPosturas(dados: AepAetDados) {
  const p = dados.posturas;
  return {
    posturas: p.posturas.length === 0,
    outros_descricao: p.posturas.includes("Outros") && !p.outros_descricao.trim(),
    fotos: p.posturas.length > 0 && p.fotos.length === 0,
  };
}

function errosMovimentos(dados: AepAetDados) {
  const m = dados.movimentos_repetitivos;
  const sim = m.existem_movimentos_repetitivos === "sim";
  return {
    existem_movimentos_repetitivos: !m.existem_movimentos_repetitivos,
    descricao_atividade: sim && !m.descricao_atividade.trim(),
    frequencia: sim && !m.frequencia.trim(),
    fotos: sim && m.fotos.length === 0,
  };
}

function errosEsforco(dados: AepAetDados) {
  const e = dados.esforco_fisico;
  const detalhe = !e.sem_esforco && e.opcoes.length > 0;
  const peso = Number(String(e.peso_estimado).replace(",", "."));
  return {
    opcoes: !e.sem_esforco && e.opcoes.length === 0,
    peso_estimado: detalhe && (!Number.isFinite(peso) || peso <= 0),
    unidade: detalhe && !e.unidade,
    caracteristicas_carga: detalhe && !e.caracteristicas_carga.trim(),
    frequencia: detalhe && !e.frequencia.trim(),
    descricao_atividade: detalhe && !e.descricao_atividade.trim(),
    fotos: detalhe && e.fotos.length === 0,
  };
}

function errosMobiliario(dados: AepAetDados) {
  const m = dados.mobiliario_equipamentos;
  return {
    mesa: {
      altura_cm: numeroNaoNegativo(m.mesa.altura_cm) == null,
      comprimento_cm: numeroNaoNegativo(m.mesa.comprimento_cm) == null,
      largura_cm: numeroNaoNegativo(m.mesa.largura_cm) == null,
      cor: !m.mesa.cor.trim(),
      fotos: m.mesa.fotos.length < 1,
    },
    cadeira: {
      altura_assento_cm: numeroNaoNegativo(m.cadeira.altura_assento_cm) == null,
      profundidade_assento_cm: numeroNaoNegativo(m.cadeira.profundidade_assento_cm) == null,
      largura_assento_cm: numeroNaoNegativo(m.cadeira.largura_assento_cm) == null,
      fotos: m.cadeira.fotos.length < 2,
    },
    monitor: {
      altura_monitor: numeroNaoNegativo(m.monitor.altura_monitor) == null,
      distancia_olhos: numeroNaoNegativo(m.monitor.distancia_olhos) == null,
      distancia_teclado_borda: numeroNaoNegativo(m.monitor.distancia_teclado_borda) == null,
      fotos: m.monitor.fotos.length < 2,
    },
  };
}

function errosFerramentas(dados: AepAetDados) {
  const f = dados.ferramentas_mobiliario;
  return {
    sugestoes: !f.sugestoes.length && !f.descricao.trim(),
    descricao:
      (f.sugestoes.includes("Outros") && !f.descricao.trim()) ||
      (!f.sugestoes.length && !f.descricao.trim()),
    fotos: f.fotos.length < 3,
  };
}

function errosCondicoes(dados: AepAetDados) {
  const c = dados.condicoes_ambientais;
  const vibSim = c.vibracao_exposicao === "sim";
  return {
    iluminacao_lux: numeroNaoNegativo(c.iluminacao_lux) == null,
    ruido_dba: numeroNaoNegativo(c.ruido_dba) == null,
    temperatura_c: numeroFinito(c.temperatura_c) == null,
    fotos: c.fotos.length < 1,
    vibracao_exposicao: !c.vibracao_exposicao,
    vibracao_valor: vibSim && numeroNaoNegativo(c.vibracao_valor) == null,
    vibracao_unidade: vibSim && !c.vibracao_unidade.trim(),
  };
}

function errosOrganizacao(dados: AepAetDados) {
  const o = dados.organizacao_trabalho;
  return {
    meta_producao: !o.meta_producao,
    ritmo_maquina: !o.ritmo_maquina,
    rodizio_tarefas: !o.rodizio_tarefas,
    rodizio_colaboradores: !o.rodizio_colaboradores,
    pausas_atividade: !o.pausas_atividade,
  };
}

function errosCronoanalise(dados: AepAetDados) {
  const linhaIds: Record<string, { tarefa?: boolean; tempo?: boolean; frequencia?: boolean }> = {};
  for (const l of dados.cronoanalise.linhas) {
    const tempo = numeroNaoNegativo(l.tempo_minutos);
    linhaIds[l.id] = {
      tarefa: !l.tarefa.trim(),
      tempo: tempo == null || tempo <= 0,
      frequencia: !l.frequencia.trim(),
    };
  }
  return {
    linhas: dados.cronoanalise.linhas.length === 0,
    linhaIds,
  };
}

function errosSaude(dados: AepAetDados) {
  const s = dados.dados_saude;
  return {
    sente_desconforto: !s.sente_desconforto,
    locais: s.sente_desconforto === "sim" && s.locais.length === 0,
  };
}

export default function FormularioAepAetRegistro() {
  const { empresaId, contratoId, avaliacaoId, offlineId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const rotaOffline = !!offlineId;

  const [dados, setDados] = useState<AepAetDados | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [autoStatus, setAutoStatus] = useState<"salvo" | "pendente" | "salvando" | "erro">("salvo");
  const [salvandoExplicit, setSalvandoExplicit] = useState(false);
  const [modo, setModo] = useState<AepAetModo>(() => (rotaOffline ? "offline" : getAepAetModoPreferido()));
  const [offlineRow, setOfflineRow] = useState<AepAetOfflineAvaliacao | null>(null);
  const [bootOffline, setBootOffline] = useState(rotaOffline);
  const [initDone, setInitDone] = useState(false);

  const ultimoSalvoJson = useRef<string | null>(null);
  const pendenteRef = useRef<AepAetDados | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salvandoLock = useRef(false);
  const snapIdsRef = useRef<{ setor_id: string; funcao_id: string } | null>(null);
  const docRef = useRef<{ id: string; empresa_id: string; contrato_id: string | null; status: string } | null>(null);
  const clientIdRef = useRef<string | null>(offlineId || null);
  const modoRef = useRef<AepAetModo>(modo);
  modoRef.current = modo;

  const { data: doc, isLoading: loadingDoc, isError: erroDoc } = useQuery({
    queryKey: ["aep-aet-registro", avaliacaoId],
    enabled: !!avaliacaoId && !rotaOffline,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, status, empresa_id, contrato_id, empresa_nome, draft_snapshot, current_step, created_at, updated_at")
        .eq("id", avaliacaoId!)
        .eq("tipo", TIPO_AEP_AET)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const snap = lerSnapshotAepAet(doc?.draft_snapshot);

  const { data: setor, isLoading: loadingSetor } = useQuery({
    queryKey: ["aep-aet-reg-setor", snap?.setor_id || offlineRow?.setor_id],
    enabled: !!(snap?.setor_id || offlineRow?.setor_id) && !rotaOffline,
    queryFn: async () => {
      const id = snap?.setor_id || offlineRow?.setor_id || "";
      const { data, error } = await supabase.from("setores").select("id, nome_setor, ghe_ges").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: funcao, isLoading: loadingFuncao } = useQuery({
    queryKey: ["aep-aet-reg-funcao", snap?.funcao_id || offlineRow?.funcao_id],
    enabled: !!(snap?.funcao_id || offlineRow?.funcao_id) && !rotaOffline,
    queryFn: async () => {
      const id = snap?.funcao_id || offlineRow?.funcao_id || "";
      const { data, error } = await supabase.from("funcoes").select("id, nome_funcao").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: contrato } = useQuery({
    queryKey: ["aep-aet-reg-contrato", contratoId],
    enabled: !!contratoId && !rotaOffline,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("id", contratoId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Boot offline-only route
  useEffect(() => {
    if (!rotaOffline || !offlineId || initDone) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await getAepAetOffline(offlineId);
        if (cancelled) return;
        if (!row) {
          setBootOffline(false);
          setInitDone(true);
          return;
        }
        clientIdRef.current = row.client_id;
        setOfflineRow(row);
        setModo(row.preferred_mode || "offline");
        snapIdsRef.current = { setor_id: row.setor_id, funcao_id: row.funcao_id };
        if (row.server_id) {
          docRef.current = {
            id: row.server_id,
            empresa_id: row.empresa_id,
            contrato_id: row.contrato_id,
            status: row.status_doc,
          };
        }
        setDados(row.dados);
        setEtapa(row.dados.etapa_atual || 1);
        ultimoSalvoJson.current = JSON.stringify(row.dados);
        setBootOffline(false);
        setInitDone(true);
      } catch {
        if (!cancelled) {
          setBootOffline(false);
          setInitDone(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [rotaOffline, offlineId, initDone]);

  // Boot online server document (+ optional local mirror)
  useEffect(() => {
    if (rotaOffline || initDone) return;
    if (!doc || !snap) return;
    if (loadingSetor || loadingFuncao) return;

    let cancelled = false;
    (async () => {
      const carregados = lerDadosAepAet(snap.dados, {
        setorNome: setor?.nome_setor || "",
        funcaoNome: funcao?.nome_funcao || "",
      });
      if (!carregados.identificacao.setor_avaliado && setor?.nome_setor) {
        carregados.identificacao.setor_avaliado = setor.nome_setor;
      }
      if (!carregados.identificacao.funcao_avaliada && funcao?.nome_funcao) {
        carregados.identificacao.funcao_avaliada = funcao.nome_funcao;
      }

      snapIdsRef.current = { setor_id: snap.setor_id, funcao_id: snap.funcao_id };
      docRef.current = {
        id: doc.id,
        empresa_id: doc.empresa_id,
        contrato_id: doc.contrato_id,
        status: doc.status,
      };

      let local: AepAetOfflineAvaliacao | null = null;
      try {
        local = await garantirEspelhoOffline({
          serverId: doc.id,
          empresaId: doc.empresa_id,
          empresaNome: doc.empresa_nome || "",
          contratoId: contratoId || doc.contrato_id || "",
          contratoNome: "",
          setorId: snap.setor_id,
          setorNome: setor?.nome_setor || carregados.identificacao.setor_avaliado,
          funcaoId: snap.funcao_id,
          funcaoNome: funcao?.nome_funcao || carregados.identificacao.funcao_avaliada,
          statusDoc: doc.status,
          dados: carregados,
          preferredMode: getAepAetModoPreferido(),
          markPending: false,
        });
      } catch {
        local = null;
      }
      if (cancelled) return;

      if (local) {
        clientIdRef.current = local.client_id;
        setOfflineRow(local);
        const pref = local.preferred_mode || getAepAetModoPreferido();
        setModo(pref);
        // Se há alterações pendentes locais, prioriza o rascunho local
        if (local.sync_status === "pending" || local.sync_status === "error") {
          setDados(local.dados);
          setEtapa(local.dados.etapa_atual || 1);
          ultimoSalvoJson.current = JSON.stringify(local.dados);
          setInitDone(true);
          return;
        }
      }

      setDados(carregados);
      setEtapa(carregados.etapa_atual);
      ultimoSalvoJson.current = JSON.stringify(carregados);
      setInitDone(true);
    })();

    return () => { cancelled = true; };
  }, [rotaOffline, initDone, doc, snap, setor, funcao, loadingSetor, loadingFuncao, contratoId]);

  const persistir = async (
    d: AepAetDados,
    opts?: { marcarSalvo?: boolean; marcarRascunho?: boolean; etapa?: number },
  ) => {
    const ids = snapIdsRef.current;
    if (!ids) return false;
    if (salvandoLock.current) {
      pendenteRef.current = d;
      setAutoStatus("pendente");
      return false;
    }

    salvandoLock.current = true;
    setAutoStatus("salvando");
    const etapaAtual = opts?.etapa ?? d.etapa_atual;
    const payload: AepAetDados = { ...d, etapa_atual: etapaAtual };

    try {
      if (modoRef.current === "offline") {
        const clientId = clientIdRef.current;
        if (!clientId) throw new Error("Sem identificador offline");
        const r = await persistirAepAetOfflineLocal({
          clientId,
          dados: payload,
          marcarSalvo: opts?.marcarSalvo,
          marcarRascunho: opts?.marcarRascunho,
          preferredMode: "offline",
        });
        if (!r.ok) throw new Error(r.error);
        setOfflineRow(r.row);
        if (opts?.marcarSalvo) docRef.current = docRef.current ? { ...docRef.current, status: "salvo" } : docRef.current;
        if (opts?.marcarRascunho) docRef.current = docRef.current ? { ...docRef.current, status: "rascunho" } : docRef.current;
      } else {
        const registro = docRef.current;
        if (!registro) throw new Error("Registro online indisponível — use Offline ou sincronize.");
        const offline = offlineRow || (clientIdRef.current ? await getAepAetOffline(clientIdRef.current) : null);
        const r = await persistirAepAetOnline({
          documentoId: registro.id,
          empresaId: registro.empresa_id,
          setorId: ids.setor_id,
          funcaoId: ids.funcao_id,
          dados: payload,
          userId: user?.id || null,
          marcarSalvo: opts?.marcarSalvo,
          marcarRascunho: opts?.marcarRascunho,
          offlineClientId: offline?.client_id || clientIdRef.current,
          offlineDeviceId: offline?.device_id,
          offlineDeviceLabel: offline?.device_label,
        });
        if (!r.ok) throw new Error(r.error);
        if (opts?.marcarSalvo) docRef.current = { ...registro, status: "salvo" };
        else if (opts?.marcarRascunho) docRef.current = { ...registro, status: "rascunho" };
        else docRef.current = { ...registro, status: r.status };
        qc.setQueryData(["aep-aet-registro", registro.id], (prev: any) =>
          prev ? { ...prev, status: r.status, draft_snapshot: { setor_id: ids.setor_id, funcao_id: ids.funcao_id, dados: payload } } : prev,
        );
        // Espelho local marcado synced
        if (clientIdRef.current) {
          const esp = await garantirEspelhoOffline({
            serverId: registro.id,
            empresaId: registro.empresa_id,
            empresaNome: offlineRow?.empresa_nome || doc?.empresa_nome || "",
            contratoId: registro.contrato_id || contratoId || "",
            contratoNome: offlineRow?.contrato_nome || "",
            setorId: ids.setor_id,
            setorNome: payload.identificacao.setor_avaliado,
            funcaoId: ids.funcao_id,
            funcaoNome: payload.identificacao.funcao_avaliada,
            statusDoc: r.status,
            dados: payload,
            preferredMode: "online",
            markPending: false,
          });
          clientIdRef.current = esp.client_id;
          setOfflineRow(esp);
        }
        void qc.invalidateQueries({ queryKey: ["aep-aet-docs"] });
        void qc.invalidateQueries({ queryKey: ["aep-aet-docs-emp"] });
        void qc.invalidateQueries({ queryKey: ["aep-aet-docs-ctr"] });
      }

      ultimoSalvoJson.current = JSON.stringify(payload);
      const aindaPendente =
        pendenteRef.current && JSON.stringify(pendenteRef.current) !== ultimoSalvoJson.current
          ? pendenteRef.current
          : null;
      pendenteRef.current = aindaPendente;
      setAutoStatus(aindaPendente ? "pendente" : "salvo");
      salvandoLock.current = false;
      if (aindaPendente) void persistir(aindaPendente);
      return true;
    } catch (e) {
      setAutoStatus("erro");
      salvandoLock.current = false;
      if (modoRef.current === "online" && typeof navigator !== "undefined" && !navigator.onLine) {
        toast.message("Sem conexão", { description: "Alterne para Offline para continuar salvando localmente." });
      }
      return false;
    }
  };

  useEffect(() => {
    if (!dados || !initDone) return;
    const json = JSON.stringify(dados);
    if (ultimoSalvoJson.current === null) {
      ultimoSalvoJson.current = json;
      return;
    }
    if (json === ultimoSalvoJson.current) return;
    pendenteRef.current = dados;
    setAutoStatus("pendente");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persistir(dados);
    }, 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, initDone, modo]);

  useEffect(() => {
    const flush = () => {
      if (pendenteRef.current) void persistir(pendenteRef.current);
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (pendenteRef.current) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacaoId, offlineId]);

  const atualizar = (parcial: Partial<AepAetDados> | ((prev: AepAetDados) => AepAetDados)) => {
    setDados((prev) => {
      if (!prev) return prev;
      return typeof parcial === "function" ? parcial(prev) : { ...prev, ...parcial };
    });
  };

  const irPara = (destino: number) => {
    const next = Math.min(AEP_AET_TOTAL_ETAPAS, Math.max(1, destino));
    setMostrarErros(false);
    setEtapa(next);
    atualizar((d) => ({ ...d, etapa_atual: next }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const aguardarLock = async () => {
    let tentativas = 0;
    while (salvandoLock.current && tentativas < 20) {
      await new Promise((r) => setTimeout(r, 100));
      tentativas += 1;
    }
  };

  const flushTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const proximo = () => {
    if (!dados) return;
    const erro = validarEtapaAepAet(etapa, dados);
    if (erro) {
      setMostrarErros(true);
      toast.error(erro);
      return;
    }
    setMostrarErros(false);
    if (etapa < AEP_AET_TOTAL_ETAPAS) {
      irPara(etapa + 1);
      return;
    }
    void salvarAvaliacaoFinal();
  };

  const anterior = () => {
    if (etapa <= 1) return;
    irPara(etapa - 1);
  };

  const salvarExplicit = async () => {
    if (!dados || salvandoExplicit) return;
    const erro = validarEtapaAepAet(etapa, dados);
    if (erro) {
      setMostrarErros(true);
      toast.error(erro);
      return;
    }
    flushTimer();
    setSalvandoExplicit(true);
    try {
      await aguardarLock();
      const ok = await persistir(dados, { marcarSalvo: true, etapa });
      if (!ok) throw new Error();
      toast.success(modo === "offline" ? "Salvo neste dispositivo (pendente de sincronização)." : "Avaliação salva.");
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvandoExplicit(false);
    }
  };

  const salvarContinuarDepois = async () => {
    if (!dados || salvandoExplicit) return;
    flushTimer();
    setSalvandoExplicit(true);
    try {
      await aguardarLock();
      const ok = await persistir(dados, { marcarRascunho: true, etapa });
      if (!ok) throw new Error();
      toast.success("Progresso salvo. Você pode continuar depois.");
      navigate(urlAepAetContrato(empresaId!, contratoId!));
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvandoExplicit(false);
    }
  };

  const salvarAvaliacaoFinal = async () => {
    if (!dados || salvandoExplicit) return;
    const pendencia = validarFormularioAepAetCompleto(dados);
    if (pendencia) {
      setMostrarErros(true);
      setEtapa(pendencia.etapa);
      atualizar((d) => ({ ...d, etapa_atual: pendencia.etapa }));
      toast.error(`Etapa ${pendencia.etapa}: ${pendencia.erro}`);
      return;
    }
    flushTimer();
    setSalvandoExplicit(true);
    try {
      await aguardarLock();
      const ok = await persistir(dados, { marcarSalvo: true, etapa: AEP_AET_TOTAL_ETAPAS });
      if (!ok) throw new Error();
      toast.success(
        modo === "offline"
          ? "Avaliação concluída neste dispositivo. Sincronize no contrato quando estiver online."
          : "Avaliação salva com sucesso.",
      );
      navigate(urlAepAetContrato(empresaId!, contratoId!));
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvandoExplicit(false);
    }
  };

  const trocarModo = async (next: AepAetModo) => {
    if (next === modo) return;
    if (next === "online" && !docRef.current?.id && !navigator.onLine) {
      toast.error("Sem registro no servidor e sem conexão. Continue em Offline.");
      return;
    }
    if (next === "online" && !docRef.current?.id) {
      toast.message("Ainda não sincronizada", {
        description: "Use o ícone de sincronização na lista de contratos para enviar ao servidor.",
      });
      return;
    }
    if (next === "offline") {
      if (!dados || !snapIdsRef.current) return;
      try {
        if (docRef.current?.id) {
          const esp = await garantirEspelhoOffline({
            serverId: docRef.current.id,
            empresaId: docRef.current.empresa_id,
            empresaNome: offlineRow?.empresa_nome || doc?.empresa_nome || "",
            contratoId: docRef.current.contrato_id || contratoId || "",
            contratoNome: offlineRow?.contrato_nome || "",
            setorId: snapIdsRef.current.setor_id,
            setorNome: dados.identificacao.setor_avaliado,
            funcaoId: snapIdsRef.current.funcao_id,
            funcaoNome: dados.identificacao.funcao_avaliada,
            statusDoc: docRef.current.status,
            dados,
            preferredMode: "offline",
            markPending: true,
          });
          clientIdRef.current = esp.client_id;
          setOfflineRow(esp);
        } else if (clientIdRef.current) {
          await marcarPreferenciaModo(clientIdRef.current, "offline");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao preparar modo offline.");
        return;
      }
    } else if (clientIdRef.current) {
      await marcarPreferenciaModo(clientIdRef.current, "online");
    }
    setAepAetModoPreferido(next);
    setModo(next);
    toast.message(next === "offline" ? "Modo Offline ativo" : "Modo Online ativo", {
      description: next === "offline"
        ? "Alterações são salvas neste dispositivo até sincronizar."
        : "Alterações são enviadas ao servidor.",
    });
  };

  const progresso = (etapa / AEP_AET_TOTAL_ETAPAS) * 100;
  const contratoLabel = offlineRow?.contrato_nome
    || (contrato
      ? `${contrato.numero_contrato || "(sem número)"}${contrato.nome_contratante ? ` — ${contrato.nome_contratante}` : ""}`
      : "—");
  const empresaNome = offlineRow?.empresa_nome || doc?.empresa_nome || "";
  const tituloFuncao = dados?.identificacao.funcao_avaliada || offlineRow?.funcao_nome || funcao?.nome_funcao || "Função";
  const tituloSetor = dados?.identificacao.setor_avaliado || offlineRow?.setor_nome || setor?.nome_setor || "Setor";

  const carregando =
    bootOffline ||
    (!rotaOffline && (loadingDoc || (!!doc && !!snap && !initDone && (loadingSetor || loadingFuncao)))) ||
    (!initDone && !erroDoc);

  if (carregando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if ((!rotaOffline && (erroDoc || !doc || !snap)) || !dados) {
    return (
      <div className="space-y-4">
        <Link to={urlAepAetContrato(empresaId!, contratoId!)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <div className="portal-surface p-10 text-center text-sm text-muted-foreground">
          Avaliação não encontrada{rotaOffline ? " neste dispositivo." : "."}
        </div>
      </div>
    );
  }

  const errId = mostrarErros && etapa === 1 ? errosIdentificacao(dados) : undefined;
  const errVa = mostrarErros && etapa === 2 ? errosVariabilidade(dados) : undefined;
  const errPo = mostrarErros && etapa === 3 ? errosPosturas(dados) : undefined;
  const errMo = mostrarErros && etapa === 4 ? errosMovimentos(dados) : undefined;
  const errEs = mostrarErros && etapa === 5 ? errosEsforco(dados) : undefined;
  const errMb = mostrarErros && etapa === 6 ? errosMobiliario(dados) : undefined;
  const errFe = mostrarErros && etapa === 7 ? errosFerramentas(dados) : undefined;
  const errCo = mostrarErros && etapa === 8 ? errosCondicoes(dados) : undefined;
  const errOr = mostrarErros && etapa === 9 ? errosOrganizacao(dados) : undefined;
  const errCr = mostrarErros && etapa === 10 ? errosCronoanalise(dados) : undefined;
  const errSa = mostrarErros && etapa === 11 ? errosSaude(dados) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={urlAepAetContrato(empresaId!, contratoId!)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Setores e funções
          </Button>
        </Link>
      </div>

      <PageHeader
        title={tituloFuncao}
        description={`${empresaNome || "Empresa"} — ${tituloSetor}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AepAetModoSeletor modo={modo} onChange={(m) => void trocarModo(m)} />
            <Badge variant="outline" className="capitalize">
              {modo === "offline"
                ? "offline"
                : (docRef.current?.status || doc?.status || offlineRow?.status_doc || "rascunho")}
            </Badge>
            {offlineRow?.sync_status === "pending" && (
              <Badge variant="secondary">Sync pendente</Badge>
            )}
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {autoStatus === "salvo"
                ? (modo === "offline" ? "Salvo no dispositivo" : "Tudo salvo")
                : autoStatus === "salvando"
                  ? "Salvando…"
                  : autoStatus === "pendente"
                    ? "Alterações pendentes"
                    : "Erro ao salvar"}
            </span>
          </div>
        }
      />

      <div className="portal-surface space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            Etapa {etapa} de {AEP_AET_TOTAL_ETAPAS}
          </span>
          <span className="text-muted-foreground">
            {AEP_AET_ETAPAS[etapa - 1]?.titulo}
          </span>
        </div>
        <Progress value={progresso} className="h-2" />
        <ol className="flex flex-wrap gap-2">
          {AEP_AET_ETAPAS.map((e) => {
            const concluida = e.id < etapa;
            const atual = e.id === etapa;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (e.id <= etapa) {
                      irPara(e.id);
                      return;
                    }
                    for (let s = etapa; s < e.id; s += 1) {
                      const erro = validarEtapaAepAet(s, dados);
                      if (erro) {
                        setMostrarErros(true);
                        setEtapa(s);
                        atualizar((d) => ({ ...d, etapa_atual: s }));
                        toast.error(erro);
                        return;
                      }
                    }
                    irPara(e.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    atual && "border-primary bg-primary/10 font-semibold text-primary",
                    concluida && !atual && "border-border bg-muted/40 text-foreground",
                    !atual && !concluida && "border-border/60 text-muted-foreground",
                  )}
                >
                  {concluida ? <Check className="h-3 w-3" /> : <span>{e.id}</span>}
                  {e.titulo}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="portal-surface p-5 sm:p-6">
        {etapa === 1 && (
          <AepAetEtapaIdentificacao
            value={dados.identificacao}
            onChange={(identificacao) => atualizar({ identificacao })}
            empresaNome={empresaNome}
            contratoNome={contratoLabel}
            errors={errId}
          />
        )}
        {etapa === 2 && (
          <AepAetEtapaVariabilidade
            value={dados.variabilidade}
            onChange={(variabilidade) => atualizar({ variabilidade })}
            errors={errVa}
          />
        )}
        {etapa === 3 && (
          <AepAetEtapaPosturas
            value={dados.posturas}
            onChange={(posturas) => atualizar({ posturas })}
            errors={errPo}
          />
        )}
        {etapa === 4 && (
          <AepAetEtapaMovimentos
            value={dados.movimentos_repetitivos}
            onChange={(movimentos_repetitivos) => atualizar({ movimentos_repetitivos })}
            errors={errMo}
          />
        )}
        {etapa === 5 && (
          <AepAetEtapaEsforco
            value={dados.esforco_fisico}
            onChange={(esforco_fisico) => atualizar({ esforco_fisico })}
            errors={errEs}
          />
        )}
        {etapa === 6 && (
          <AepAetEtapaMobiliario
            value={dados.mobiliario_equipamentos}
            onChange={(mobiliario_equipamentos) => atualizar({ mobiliario_equipamentos })}
            errors={errMb}
          />
        )}
        {etapa === 7 && (
          <AepAetEtapaFerramentas
            value={dados.ferramentas_mobiliario}
            onChange={(ferramentas_mobiliario) => atualizar({ ferramentas_mobiliario })}
            errors={errFe}
          />
        )}
        {etapa === 8 && (
          <AepAetEtapaCondicoes
            value={dados.condicoes_ambientais}
            onChange={(condicoes_ambientais) => atualizar({ condicoes_ambientais })}
            errors={errCo}
          />
        )}
        {etapa === 9 && (
          <AepAetEtapaOrganizacao
            value={dados.organizacao_trabalho}
            onChange={(organizacao_trabalho) => atualizar({ organizacao_trabalho })}
            errors={errOr}
          />
        )}
        {etapa === 10 && (
          <AepAetEtapaCronoanalise
            value={dados.cronoanalise}
            onChange={(cronoanalise) => atualizar({ cronoanalise })}
            errors={errCr}
          />
        )}
        {etapa === 11 && (
          <AepAetEtapaSaude
            value={dados.dados_saude}
            onChange={(dados_saude) => atualizar({ dados_saude })}
            errors={errSa}
          />
        )}
        {etapa === 12 && (
          <AepAetEtapaSugestoes
            value={dados.sugestoes_melhoria}
            onChange={(sugestoes_melhoria) => atualizar({ sugestoes_melhoria })}
            dadosCompletos={dados}
            empresaNome={empresaNome}
            contratoNome={contratoLabel}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={anterior} disabled={etapa <= 1}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Anterior
        </Button>
        {etapa === 12 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void salvarContinuarDepois()}
              disabled={salvandoExplicit}
            >
              {salvandoExplicit ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Salvar e continuar depois
            </Button>
            <Button onClick={() => void salvarAvaliacaoFinal()} disabled={salvandoExplicit}>
              {salvandoExplicit ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              Salvar avaliação
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void salvarExplicit()} disabled={salvandoExplicit}>
              {salvandoExplicit ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Salvar
            </Button>
            <Button onClick={proximo}>
              Próximo <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
