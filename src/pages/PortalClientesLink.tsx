import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  excluirPortalArquivo,
  formatBytes,
  resolvePublicPortalUrl,
  urlDownloadPortalArquivoAdmin,
} from "@/lib/portalClientes";

type ArquivoRow = {
  id: string;
  contrato_id: string;
  nome_original: string;
  tamanho_bytes: number;
  content_type: string | null;
  created_at: string;
  contratos?: { numero_contrato: string | null; nome_contratante: string | null } | null;
};

export default function PortalClientesLink() {
  const { linkId } = useParams();
  const qc = useQueryClient();
  const [apagando, setApagando] = useState<string | null>(null);

  const { data: link, isLoading, error } = useQuery({
    queryKey: ["portal-clientes-link", linkId],
    enabled: !!linkId,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("portal_clientes_links")
        .select(
          "id, token, empresa_id, data_referencia, observacoes, created_at, retained_until, ativo, empresas(razao_social, nome_fantasia), portal_clientes_arquivos(id, contrato_id, nome_original, tamanho_bytes, content_type, created_at, contratos(numero_contrato, nome_contratante))",
        )
        .eq("id", linkId!)
        .maybeSingle();
      if (err) throw err;
      return data as any;
    },
  });

  const porContrato = useMemo(() => {
    const map = new Map<string, { id: string; titulo: string; subtitulo: string; arquivos: ArquivoRow[] }>();
    for (const a of (link?.portal_clientes_arquivos || []) as ArquivoRow[]) {
      const key = a.contrato_id;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          titulo: a.contratos?.numero_contrato || "(sem número)",
          subtitulo: a.contratos?.nome_contratante || "",
          arquivos: [],
        });
      }
      map.get(key)!.arquivos.push(a);
    }
    return [...map.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }, [link]);

  if (!linkId) return <Navigate to="/portal-clientes" replace />;

  const empresaNome =
    link?.empresas?.nome_fantasia || link?.empresas?.razao_social || "Empresa";

  const apagarArquivo = async (arquivoId: string) => {
    if (!confirm("Excluir este documento? Ele deixará de aparecer no link público imediatamente.")) {
      return;
    }
    setApagando(arquivoId);
    try {
      await excluirPortalArquivo(arquivoId);
      toast.success("Documento removido do portal.");
      void qc.invalidateQueries({ queryKey: ["portal-clientes-link", linkId] });
      void qc.invalidateQueries({ queryKey: ["portal-clientes-links"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    } finally {
      setApagando(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/portal-clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Portal Clientes
          </Button>
        </Link>
      </div>

      <PageHeader
        title={empresaNome}
        description="Contratos e documentos deste link"
        actions={
          link?.token ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const url = await resolvePublicPortalUrl(link.token);
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Link copiado.");
                } catch {
                  toast.error("Não foi possível copiar.");
                }
              }}
            >
              <Copy className="mr-1.5 h-4 w-4" /> Copiar link
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error || !link ? (
        <div className="portal-surface p-8 text-center text-sm text-muted-foreground">
          Link não encontrado.
        </div>
      ) : (
        <>
          <div className="portal-surface flex flex-wrap items-center gap-2 p-4 text-sm">
            <Badge variant={link.ativo ? "secondary" : "destructive"}>
              {link.ativo ? "Ativo" : "Inválido"}
            </Badge>
            <span className="text-muted-foreground">
              Gerado em {new Date(link.created_at).toLocaleString("pt-BR")}
            </span>
            {link.observacoes && (
              <span className="w-full text-xs text-muted-foreground">{link.observacoes}</span>
            )}
          </div>

          {porContrato.length === 0 ? (
            <div className="portal-surface p-8 text-center text-sm text-muted-foreground">
              Nenhum documento neste link.
            </div>
          ) : (
            <div className="space-y-4">
              {porContrato.map((c) => (
                <section key={c.id} className="portal-surface overflow-hidden">
                  <div className="border-b px-5 py-3">
                    <h2 className="font-heading text-sm font-semibold">{c.titulo}</h2>
                    {c.subtitulo && (
                      <p className="text-xs text-muted-foreground">{c.subtitulo}</p>
                    )}
                  </div>
                  <ul className="divide-y">
                    {c.arquivos.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.nome_original}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatBytes(Number(a.tamanho_bytes || 0))}
                            {a.created_at
                              ? ` · ${new Date(a.created_at).toLocaleString("pt-BR")}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button asChild type="button" variant="outline" size="icon" title="Baixar documento">
                            <a href={urlDownloadPortalArquivoAdmin(a.id)} download={a.nome_original}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Excluir documento"
                            disabled={apagando === a.id || !link.ativo}
                            onClick={() => void apagarArquivo(a.id)}
                          >
                            {apagando === a.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
