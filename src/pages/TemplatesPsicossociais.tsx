import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus, Link as LinkIcon, QrCode, Copy, Download, Trash2, Link2, FileBarChart2, ArrowLeft, FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { calcularPsicossocial, type AvaliacaoPsicossocial } from "@/components/PsicossocialModal";

function publicUrl(token: string) {
  return `${window.location.origin}/avaliacao-psicossocial/${token}`;
}

export default function TemplatesPsicossociais() {
  const qc = useQueryClient();
  useRealtimeSync(
    [
      { table: "psico_links", queryKey: ["psico-links"] },
      { table: "psico_respostas", queryKey: ["psico-respostas-count"] },
    ],
    "psico-sync"
  );

  const [novoOpen, setNovoOpen] = useState(false);
  const [empresaSel, setEmpresaSel] = useState<string>("");
  const [qrOpen, setQrOpen] = useState<{ token: string; empresa: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [relOpen, setRelOpen] = useState<{ empresa_id: string; empresa: string } | null>(null);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas").select("id, razao_social").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["psico-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_links")
        .select("id, token, ativo, created_at, empresa_id, empresas(razao_social)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["psico-respostas-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_respostas").select("link_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { map[r.link_id] = (map[r.link_id] || 0) + 1; });
      return map;
    },
  });

  useEffect(() => {
    if (qrOpen?.token) {
      QRCode.toDataURL(publicUrl(qrOpen.token), { width: 360, margin: 2 })
        .then(setQrDataUrl).catch(() => setQrDataUrl(""));
    } else {
      setQrDataUrl("");
    }
  }, [qrOpen]);

  const handleGerar = async () => {
    if (!empresaSel) { toast.error("Selecione a empresa"); return; }
    // Reaproveita link existente se houver
    const existente = links.find((l) => l.empresa_id === empresaSel);
    if (existente) {
      toast.info("Esta empresa já possui link gerado");
      setNovoOpen(false);
      return;
    }
    const { error } = await supabase.from("psico_links").insert({ empresa_id: empresaSel } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Link gerado");
    setNovoOpen(false);
    setEmpresaSel("");
    qc.invalidateQueries({ queryKey: ["psico-links"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este link e todas as respostas associadas?")) return;
    const { error } = await supabase.from("psico_links").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Link excluído");
    qc.invalidateQueries({ queryKey: ["psico-links"] });
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(publicUrl(token));
    toast.success("Link copiado");
  };

  const downloadQr = () => {
    if (!qrDataUrl || !qrOpen) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-psicossocial-${qrOpen.empresa.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const copyQrImage = async () => {
    try {
      if (!qrDataUrl) return;
      const blob = await (await fetch(qrDataUrl)).blob();
      // @ts-ignore
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("QR Code copiado");
    } catch {
      toast.error("Navegador não suporta cópia de imagem");
    }
  };

  const handleVincular = async (linkId: string, empresaId: string) => {
    // Atualiza funcao_id em respostas onde ainda está nulo, casando por contrato_id+nome
    const { data: pendentes, error } = await supabase
      .from("psico_respostas")
      .select("id, contrato_id, funcao_nome")
      .eq("link_id", linkId)
      .is("funcao_id", null);
    if (error) { toast.error(error.message); return; }
    if (!pendentes || pendentes.length === 0) {
      toast.success("Todas as respostas já estão vinculadas a uma função cadastrada");
      return;
    }
    let vinculadas = 0;
    let semCadastro: string[] = [];
    for (const r of pendentes) {
      if (!r.contrato_id) { semCadastro.push(r.funcao_nome); continue; }
      const { data: f } = await supabase
        .from("funcoes")
        .select("id, setor_id, setores!inner(contrato_id)")
        .eq("setores.contrato_id", r.contrato_id)
        .ilike("nome_funcao", (r.funcao_nome || "").trim())
        .limit(1)
        .maybeSingle();
      if (f?.id) {
        await supabase.from("psico_respostas").update({ funcao_id: f.id }).eq("id", r.id);
        vinculadas++;
      } else {
        semCadastro.push(r.funcao_nome);
      }
    }
    if (vinculadas > 0) toast.success(`${vinculadas} resposta(s) vinculadas ao GHE/GES`);
    if (semCadastro.length > 0) {
      toast.warning(
        `A(s) função(ões) ${Array.from(new Set(semCadastro)).join(", ")} precisa(m) estar cadastrada(s) no módulo Setores & Funções antes da vinculação.`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex gap-2 mb-2">
        <Link to="/templates">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Templates</Button>
        </Link>
      </div>
      <PageHeader
        title="Avaliações Psicossociais"
        description="Gere links públicos e QR Codes para coleta anônima de questionários COPSOQ"
        actions={
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />Gerar Avaliação
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="w-24 text-center">Link</TableHead>
              <TableHead className="w-24 text-center">QR Code</TableHead>
              <TableHead className="w-32 text-center">Questionários</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhuma avaliação gerada ainda
              </TableCell></TableRow>
            )}
            {links.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.empresas?.razao_social}</TableCell>
                <TableCell className="text-center">
                  <Button size="icon" variant="ghost" onClick={() => copyLink(l.token)} title="Copiar link público">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button size="icon" variant="ghost"
                    onClick={() => setQrOpen({ token: l.token, empresa: l.empresas?.razao_social || "empresa" })}
                    title="Ver QR Code">
                    <QrCode className="w-4 h-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{counts[l.id] || 0}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline"
                      onClick={() => setRelOpen({ empresa_id: l.empresa_id, empresa: l.empresas?.razao_social || "" })}>
                      <FileBarChart2 className="w-4 h-4 mr-1" />Gerar Relatório
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVincular(l.id, l.empresa_id)}>
                      <Link2 className="w-4 h-4 mr-1" />Vincular
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => handleDelete(l.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Novo */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerar nova Avaliação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Empresa *</Label>
            <Select value={empresaSel} onValueChange={setEmpresaSel}>
              <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button onClick={handleGerar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal QR */}
      <Dialog open={!!qrOpen} onOpenChange={(o) => !o && setQrOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>QR Code — {qrOpen?.empresa}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-72 h-72 border rounded-lg" />}
            <Input readOnly value={qrOpen ? publicUrl(qrOpen.token) : ""} />
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => qrOpen && copyLink(qrOpen.token)}>
                <Copy className="w-4 h-4 mr-1" />Copiar link
              </Button>
              <Button variant="outline" className="flex-1" onClick={copyQrImage}>
                <Copy className="w-4 h-4 mr-1" />Copiar imagem
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadQr}>
                <Download className="w-4 h-4 mr-1" />Baixar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Relatório por Função */}
      <RelatorioPorFuncaoModal
        open={!!relOpen}
        onClose={() => setRelOpen(null)}
        empresa_id={relOpen?.empresa_id || ""}
        empresa={relOpen?.empresa || ""}
      />
    </div>
  );
}

function RelatorioPorFuncaoModal({
  open, onClose, empresa_id, empresa,
}: { open: boolean; onClose: () => void; empresa_id: string; empresa: string; }) {
  const [funcao, setFuncao] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: funcoes = [] } = useQuery({
    queryKey: ["psico-funcoes", empresa_id],
    enabled: !!empresa_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_respostas")
        .select("funcao_nome, contrato_nome")
        .eq("empresa_id", empresa_id);
      if (error) throw error;
      const set = new Set<string>();
      (data || []).forEach((r: any) => r.funcao_nome && set.add(r.funcao_nome));
      return Array.from(set).sort();
    },
  });

  const gerar = async () => {
    if (!funcao) { toast.error("Selecione uma função"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("psico_respostas")
        .select("*")
        .eq("empresa_id", empresa_id)
        .ilike("funcao_nome", funcao);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Nenhuma resposta encontrada para esta função");
        return;
      }
      const avaliacoes: AvaliacaoPsicossocial[] = (data as any[]).map((r) => calcularPsicossocial({
        colaborador_nome: r.colaborador_nome || "",
        data_avaliacao: r.data_avaliacao || "",
        respostas: r.respostas || {},
        blocos: r.blocos || {},
        alertas: r.alertas || { alerta_amarelo: false, alerta_vermelho: false, recomendacao_imediata: false },
        resultado_psicossocial: r.resultado_psicossocial || "",
        riscos_psicossociais: r.riscos_psicossociais || "",
      } as any));
      const { gerarRelatorioCopsoqPDF } = await import("@/lib/copsoqRelatorio");
      gerarRelatorioCopsoqPDF(avaliacoes, {
        empresa_nome: empresa,
        setor_nome: `Função: ${funcao}`,
      } as any);
      toast.success("Relatório gerado");
      onClose();
    } catch (e: any) {
      toast.error("Erro ao gerar: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Relatório por Função — {empresa}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Função *</Label>
          <Select value={funcao} onValueChange={setFuncao}>
            <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
            <SelectContent>
              {funcoes.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">Nenhuma resposta registrada</div>}
              {funcoes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            <FileText className="inline w-3 h-3 mr-1" />
            O relatório consolidará todas as respostas anônimas da função selecionada.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={gerar} disabled={loading}>{loading ? "Gerando..." : "Gerar PDF"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
