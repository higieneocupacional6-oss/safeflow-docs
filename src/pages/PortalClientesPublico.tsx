import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  carregarPortalPublico,
  formatBytes,
  fraseMotivacionalDoAcesso,
  urlDownloadPortalArquivo,
  type PortalPublicoPayload,
} from "@/lib/portalClientes";

const shellClass =
  "min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_#0b1220_45%,_#4b5563_100%)] text-slate-50";

function Atmosphere() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-slate-400/15 blur-3xl"
      />
    </>
  );
}

export default function PortalClientesPublico() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portal, setPortal] = useState<PortalPublicoPayload | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date());

  const frase = useMemo(
    () => fraseMotivacionalDoAcesso(`${token || ""}-${Date.now()}`),
    [token],
  );

  useEffect(() => {
    const t = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setError("Link inválido.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await carregarPortalPublico(token);
        if (!cancelled) {
          setPortal(data);
          if (data.contratos.length === 1) setAberto(data.contratos[0].id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Portal indisponível.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <main className={`${shellClass} grid place-items-center p-6`}>
        <Atmosphere />
        <Loader2 className="relative z-10 h-9 w-9 animate-spin text-sky-300" />
      </main>
    );
  }

  if (error || !portal) {
    return (
      <main className={`${shellClass} grid place-items-center p-6`}>
        <Atmosphere />
        <section className="relative z-10 max-w-md space-y-4 rounded-2xl border border-white/15 bg-slate-950/50 p-8 text-center shadow-2xl backdrop-blur-md">
          <BrandLogo size="lg" tone="light" />
          <h1 className="font-heading text-xl font-semibold text-white">Portal indisponível</h1>
          <p className="text-sm text-slate-300">{error || "Link inválido."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={shellClass}>
      <Atmosphere />
      <div className="relative z-10 mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-14">
        <header className="space-y-5 text-center animate-in fade-in duration-700">
          <div className="flex justify-center">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 backdrop-blur-md shadow-[0_0_40px_rgba(56,189,248,0.15)]">
              <BrandLogo size="xl" tone="light" priority />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300/90">
              Portal do Cliente
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {portal.empresa_nome}
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">{portal.empresa_razao}</p>
          </div>
          <p className="mx-auto max-w-xl text-sm italic leading-relaxed text-sky-100/90 sm:text-base">
            “{frase}”
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-100">
              Gerado em {new Date(portal.created_at).toLocaleString("pt-BR")}
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-100 tabular-nums">
              Agora: {agora.toLocaleString("pt-BR")}
            </span>
          </div>
        </header>

        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-4 w-4 text-sky-300" />
            <h2 className="font-heading text-sm font-semibold tracking-wide text-white">
              Contratos e documentos
            </h2>
          </div>

          {portal.contratos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-300 backdrop-blur-md">
              Nenhum documento disponível neste portal.
            </div>
          ) : (
            <ul className="space-y-3">
              {portal.contratos.map((c) => {
                const abertoAgora = aberto === c.id;
                const titulo = c.numero_contrato || "(sem número)";
                return (
                  <li
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_12px_40px_rgba(2,6,23,0.45)] backdrop-blur-md transition hover:border-sky-400/35"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
                      onClick={() => setAberto(abertoAgora ? null : c.id)}
                    >
                      <div className="min-w-0">
                        <p className="font-heading text-base font-semibold text-white">{titulo}</p>
                        {c.nome_contratante && (
                          <p className="truncate text-xs text-slate-300">{c.nome_contratante}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-[11px] font-medium text-sky-100">
                          {c.arquivos.length} arquivo(s)
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-300 transition ${abertoAgora ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>
                    {abertoAgora && (
                      <div className="border-t border-white/10 bg-slate-900/50 px-4 py-4 sm:px-5">
                        <ul className="space-y-2">
                          {c.arquivos.map((a) => (
                            <li
                              key={a.id}
                              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                            >
                              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-200">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{a.nome}</p>
                                <p className="text-[11px] text-slate-400">
                                  {formatBytes(a.tamanho_bytes)}
                                </p>
                              </div>
                              <a
                                href={urlDownloadPortalArquivo(portal.token, a.id)}
                                download={a.nome}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/25"
                              >
                                <Download className="h-3.5 w-3.5" /> Baixar
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="pt-2 text-center text-[11px] tracking-wide text-slate-400">
          Acesso exclusivo desta empresa · documentos protegidos pelo SegDoc
        </footer>
      </div>
    </main>
  );
}
