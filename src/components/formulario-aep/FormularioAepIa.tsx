import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EXTENSOES_BASE, MAX_ARQUIVOS_BASE, carregarBaseParaIa, enviarBase, listarBase, removerBase, urlVisualizacao,
} from "@/lib/formularioAepBase";
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";

export type ResultadoIaAep = {
  identificacao: Record<string, string>;
  funcoes_ids: string[];
  atividades: { texto: string; marcas: Record<string, string>; origem: string }[];
  controles: { texto: string; marcas: Record<string, string>; origem: string }[];
  fatores: { codigo: string; duracao: number; intensidade: number; atividades_ids: number[]; origem: string; validar?: boolean; fundamento: string }[];
  observacoes: string;
};

export function BaseAepModal({ empresaId, open, onOpenChange, limite = MAX_ARQUIVOS_BASE, titulo = "Base de referência do Formulário AEP" }: { empresaId: string; open: boolean; onOpenChange: (v: boolean) => void; limite?: number; titulo?: string }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const { data: arquivos = [], isLoading } = useQuery({
    queryKey: ["formulario-aep-base", empresaId],
    enabled: open && !!empresaId,
    queryFn: () => listarBase(empresaId),
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["formulario-aep-base", empresaId] });

  const enviar = async (files: FileList | null) => {
    if (!files?.length) return;
    const lista = Array.from(files);
    if (arquivos.length + lista.length > limite) {
      toast.error(`Limite de ${limite} arquivos na Base.`);
      if (ref.current) ref.current.value = "";
      return;
    }
    setEnviando(true);
    try {
      for (const f of lista) {
        if (!EXTENSOES_BASE.some((e) => f.name.toLowerCase().endsWith(e))) { toast.error(`${f.name}: use PDF, DOCX ou XLSX.`); continue; }
        await enviarBase(empresaId, f).catch((e) => toast.error(`${f.name}: ${e.message}`));
      }
      recarregar();
    } finally {
      setEnviando(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{titulo}</DialogTitle>
          <DialogDescription>
            Até {limite} arquivos (PDF, DOCX ou XLSX). A IA usa estes documentos como instruções
            prioritárias para interpretar critérios, matriz e regras de preenchimento.
          </DialogDescription>
        </DialogHeader>
        <input ref={ref} type="file" multiple accept=".pdf,.docx,.xlsx" className="hidden" onChange={(e) => enviar(e.target.files)} />
        <Button variant="outline" onClick={() => ref.current?.click()} disabled={enviando || arquivos.length >= limite}>
          {enviando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          Adicionar arquivos ({arquivos.length}/{limite})
        </Button>
        <div className="space-y-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
          {!isLoading && !arquivos.length && <p className="text-sm text-muted-foreground text-center py-4">Nenhum arquivo na Base.</p>}
          {arquivos.map((a) => (
            <Card key={a.caminho} className="p-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm font-medium truncate flex-1">{a.nome}</p>
              <Button variant="ghost" size="icon" title="Visualizar" onClick={async () => {
                try { window.open(await urlVisualizacao(a.caminho), "_blank"); } catch (e: any) { toast.error(e.message); }
              }}><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" title="Remover" onClick={async () => {
                if (!confirm(`Remover "${a.nome}" da Base?`)) return;
                try { await removerBase(a.caminho); recarregar(); } catch (e: any) { toast.error(e.message); }
              }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </Card>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ROTULOS: Record<string, string> = {
  gerencia_executiva: "Gerência Executiva", gerencia: "Gerência", local_fisico: "Local Físico", nome_gere: "Nome GERE",
  codigo_gere: "Código GERE", horario_avaliacao: "Horário da avaliação", jornada: "Jornada de trabalho",
  expostos: "Nº de trabalhadores expostos", descricao: "Descrição resumida",
};

const OrigemBadge = ({ o }: { o: string }) => (
  <Badge variant={o === "informado" ? "default" : "secondary"} className="text-[10px]">{o === "informado" ? "Informado" : "Inferência técnica"}</Badge>
);

export function GerarIaAepModal({
  open, onOpenChange, empresaId, contexto, criterios, nomeFuncao, contarConflitos, onAplicar,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; empresaId: string;
  contexto: unknown; criterios: unknown; nomeFuncao: (id: string) => string;
  contarConflitos: (r: ResultadoIaAep) => number;
  onAplicar: (r: ResultadoIaAep, substituir: boolean) => void;
}) {
  const [relato, setRelato] = useState("");
  const [gerando, setGerando] = useState(false);
  const [res, setRes] = useState<ResultadoIaAep | null>(null);
  const [conflitos, setConflitos] = useState<number | null>(null);

  const gerar = async () => {
    setGerando(true);
    try {
      const base = await carregarBaseParaIa(empresaId);
      const r = await invocarGeracaoIa<ResultadoIaAep>("formulario-aep-generate", { relato, base, contexto, criterios });
      const vazio = !r
        || (!Object.values(r.identificacao || {}).some((v) => String(v || "").trim())
          && !r.funcoes_ids?.length
          && !r.atividades?.length
          && !r.controles?.length
          && !r.fatores?.length
          && !String(r.observacoes || "").trim());
      if (vazio) throw new Error("A IA retornou uma resposta vazia. Tente novamente — seus dados foram mantidos.");
      setRes(r);
      setConflitos(null);
    } catch (e: any) {
      toast.error(e.message || "Falha na geração.");
    } finally { setGerando(false); }
  };

  const aplicar = (substituir: boolean) => {
    if (!res) return;
    onAplicar(res, substituir);
    toast.success("Preenchimento aplicado. Revise a Parte IV.");
    setRes(null); setConflitos(null); onOpenChange(false);
  };
  const confirmar = () => {
    if (!res) return;
    const n = contarConflitos(res);
    if (n > 0) setConflitos(n); else aplicar(false);
  };

  const ident = res ? Object.entries(res.identificacao || {}).filter(([, v]) => v?.trim()) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!gerando) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Gerar preenchimento com IA</DialogTitle>
          <DialogDescription>
            Descreva funções, atividades, condições de trabalho, desconfortos e outras informações. A IA consulta a Base e
            o cadastro do contrato; campos sem dados suficientes ficam em branco para revisão.
          </DialogDescription>
        </DialogHeader>

        {!res ? (
          <>
            <Textarea rows={10} value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="Ex.: Operador de máquinas trabalha sentado cerca de 6h por turno, com vibração..." />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>Cancelar</Button>
              <Button onClick={gerar} disabled={gerando || relato.trim().length < 10}>
                {gerando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {gerando ? "Analisando..." : "Gerar prévia"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="font-semibold">Prévia do preenchimento</p>
            {ident.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Parte I – Identificação</p>
                {ident.map(([k, v]) => <p key={k}><span className="font-medium">{ROTULOS[k] || k}:</span> {v}</p>)}
              </div>
            )}
            {res.funcoes_ids?.length > 0 && (
              <p><span className="font-medium">Funções amostradas:</span> {res.funcoes_ids.map(nomeFuncao).join(", ")}</p>
            )}
            {(["atividades", "controles"] as const).map((k) => res[k]?.length > 0 && (
              <div key={k} className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">{k === "atividades" ? "Parte II – Atividades críticas" : "Parte III – Medidas de controle"}</p>
                {res[k].map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="flex-1">{l.texto} {Object.entries(l.marcas || {}).filter(([, v]) => v).map(([c, v]) => `${c}=${v}`).join(" ")}</span>
                    <OrigemBadge o={l.origem} />
                  </div>
                ))}
              </div>
            ))}
            {res.fatores?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Parte IV – Reconhecimento e Classificação</p>
                <div className="rounded border border-border divide-y divide-border">
                  {res.fatores.map((f) => (
                    <div key={f.codigo} className="p-2 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{f.codigo}</span>
                        <span className="text-xs">Duração: {f.duracao || "—"} · Intensidade: {f.intensidade || "—"} · Atividades: {f.atividades_ids?.join(", ") || "—"}</span>
                        <OrigemBadge o={f.origem} />
                        {(f.validar ?? f.origem !== "informado") && <Badge variant="outline" className="text-[10px]">Validar</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{f.fundamento}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {res.observacoes?.trim() && <p className="text-xs text-muted-foreground">{res.observacoes}</p>}

            {conflitos !== null ? (
              <Card className="p-3 space-y-2 border-accent">
                <p>{conflitos} campo(s) já preenchido(s) seriam alterados. O que deseja fazer?</p>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => setConflitos(null)}>Voltar</Button>
                  <Button variant="outline" onClick={() => aplicar(false)}>Preencher só os vazios</Button>
                  <Button onClick={() => aplicar(true)}>Substituir</Button>
                </div>
              </Card>
            ) : (
              <DialogFooter>
                <Button variant="outline" onClick={() => setRes(null)}>Cancelar</Button>
                <Button onClick={confirmar}>Aplicar</Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
