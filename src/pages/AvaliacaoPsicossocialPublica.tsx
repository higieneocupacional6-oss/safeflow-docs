import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  BLOCOS_COPSOQ, ESCALA_COPSOQ, emptyPsicossocial,
  calcularPsicossocial, type AvaliacaoPsicossocial,
} from "@/components/PsicossocialModal";

type LinkData = {
  link_id: string;
  empresa_id: string;
  empresa_nome: string;
  contratos: { id: string; nome: string; funcoes: { id: string; nome: string }[] }[];
  error?: string;
};

export default function AvaliacaoPsicossocialPublica() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const [contratoId, setContratoId] = useState("");
  const [funcaoNome, setFuncaoNome] = useState("");
  const [colaborador, setColaborador] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<AvaliacaoPsicossocial>(emptyPsicossocial());

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: r, error } = await supabase.rpc("psico_get_public_link", { _token: token });
      if (error) { setData({ error: error.message } as any); setLoading(false); return; }
      setData(r as any);
      setLoading(false);
    })();
  }, [token]);

  const contrato = useMemo(
    () => data?.contratos.find((c) => c.id === contratoId),
    [data, contratoId]
  );

  const setResposta = (blocoKey: string, idx: number, value: number) => {
    setDraft((prev) => {
      const arr = [...(prev.respostas[blocoKey] || [])];
      arr[idx] = value;
      return { ...prev, respostas: { ...prev.respostas, [blocoKey]: arr } };
    });
  };

  const allAnswered = BLOCOS_COPSOQ.every((b) =>
    (draft.respostas[b.key] || []).every((r) => r >= 0)
  );

  const submit = async () => {
    if (!contratoId) { toast.error("Selecione o contrato"); return; }
    if (!funcaoNome.trim()) { toast.error("Selecione/informe a função"); return; }
    if (!allAnswered) { toast.error("Responda todas as perguntas"); return; }
    setEnviando(true);
    try {
      const calc = calcularPsicossocial({ ...draft, colaborador_nome: colaborador, data_avaliacao: today });
      const payload = {
        contrato_id: contratoId,
        contrato_nome: contrato?.nome || "",
        funcao_nome: funcaoNome.trim(),
        colaborador_nome: colaborador || null,
        data_avaliacao: today,
        respostas: calc.respostas,
        blocos: calc.blocos,
        alertas: calc.alertas,
        resultado_psicossocial: calc.resultado_psicossocial,
        riscos_psicossociais: calc.riscos_psicossociais,
        total_positivas: calc.total_positivas,
        total_negativas: calc.total_negativas,
        copsoq_resultado_resumido: calc.copsoq_resultado_resumido,
        copsoq_riscos_identificados: calc.copsoq_riscos_identificados,
      };
      const { data: res, error } = await supabase.rpc("psico_submit_resposta", {
        _token: token!, _payload: payload as any,
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setEnviado(true);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + (e?.message || ""));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!data || data.error) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Link inválido</h1>
          <p className="text-muted-foreground">{data?.error || "Esta avaliação não está disponível."}</p>
        </Card>
      </div>
    );
  }
  if (enviado) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Resposta registrada!</h1>
          <p className="text-muted-foreground">Obrigado por participar da Avaliação Psicossocial.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Avaliação Psicossocial (COPSOQ)</h1>
          <p className="text-muted-foreground text-sm">{data.empresa_nome}</p>
          <p className="text-xs text-muted-foreground">Suas respostas são anônimas e utilizadas apenas para análise coletiva.</p>
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Dados iniciais</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Contrato *</Label>
              <Select value={contratoId} onValueChange={(v) => { setContratoId(v); setFuncaoNome(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {data.contratos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Função *</Label>
              {contrato && contrato.funcoes.length > 0 ? (
                <Select value={funcaoNome} onValueChange={setFuncaoNome}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {contrato.funcoes.map((f) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={funcaoNome} onChange={(e) => setFuncaoNome(e.target.value)} placeholder="Informe sua função" />
              )}
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} />
            </div>
            <div>
              <Label>Data</Label>
              <Input value={today} disabled />
            </div>
          </div>
        </Card>

        {BLOCOS_COPSOQ.map((bloco) => (
          <Card key={bloco.key} className="p-5">
            <h3 className="font-semibold mb-3">{bloco.titulo}</h3>
            <div className="space-y-4">
              {bloco.perguntas.map((p, i) => (
                <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                  <p className="text-sm mb-2">{i + 1}. {p}</p>
                  <RadioGroup
                    value={String(draft.respostas[bloco.key]?.[i] ?? "")}
                    onValueChange={(v) => setResposta(bloco.key, i, Number(v))}
                    className="flex flex-wrap gap-3"
                  >
                    {ESCALA_COPSOQ.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <RadioGroupItem value={String(opt.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Button className="w-full" size="lg" onClick={submit} disabled={enviando}>
          {enviando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : "Enviar avaliação"}
        </Button>
      </div>
    </div>
  );
}
