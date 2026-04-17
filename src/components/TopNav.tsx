import { Building2, FileText, LayoutTemplate, Database, Shield, Users, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Setores e Funções", url: "/setores-funcoes", icon: Users },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Cadastros", url: "/cadastros", icon: Database },
];

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <NavLink to="/empresas" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[var(--shadow-glow-primary)] transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-base font-bold tracking-tight text-foreground">
                SAFE<span className="text-gradient-mint">DOC</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Gestão SST</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-accent hover:bg-muted/40 transition-all"
                activeClassName="!text-primary-foreground !bg-primary shadow-[var(--shadow-glow-primary)]"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/40 text-foreground"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            open ? "max-h-96 pb-4" : "max-h-0",
          )}
        >
          <nav className="flex flex-col gap-1 pt-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-accent hover:bg-muted/40 transition-all"
                activeClassName="!text-primary-foreground !bg-primary"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
