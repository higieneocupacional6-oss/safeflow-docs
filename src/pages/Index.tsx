import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { navItemsVisiveis } from "@/components/navConfig";
import { PageHeader } from "@/components/PageHeader";

export default function Index() {
  const { isAdmin, profileName } = useAuth();
  const groups = navItemsVisiveis(!!isAdmin).filter((g) => g.label !== "Início");

  const atalhos = groups.flatMap((g) => g.items).slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(700px 280px at 0% 0%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(500px 240px at 100% 0%, hsl(152 25% 55% / 0.1), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <BrandLogo markOnly size="sm" markClassName="h-4 w-4" />
              Portal SST
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Bem-vindo{profileName ? `, ${profileName.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Centralize cadastros, documentos e avaliações de Segurança e Saúde do Trabalho com uma experiência clara, segura e profissional.
            </p>
          </div>
          <Link
            to="/documentos"
            className="btn-premium inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium"
          >
            Ir para Documentos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <PageHeader title="Acesso rápido" description="Principais módulos do SegDoc" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {atalhos.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className="glass-card group flex flex-col gap-3 p-4 hover-glow-primary"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <PageHeader title="Áreas do sistema" description="Navegue por categoria" />
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.label} className="portal-surface p-5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </h2>
              <ul className="mt-3 divide-y divide-border/70">
                {group.items.map((item) => (
                  <li key={item.url}>
                    <Link
                      to={item.url}
                      className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 font-medium">{item.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
