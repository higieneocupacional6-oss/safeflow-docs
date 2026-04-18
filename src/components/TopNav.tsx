import { Building2, FileText, LayoutTemplate, Database, Users, Menu, X, Bell, UserCircle2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { cn } from "@/lib/utils";
import safedocLogo from "@/assets/safedoc-logo.png";

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
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <NavLink to="/empresas" className="flex items-center gap-2.5 group shrink-0">
            <img
              src={safedocLogo}
              alt="SAFEDOC"
              className="h-9 w-9 object-contain rounded-xl bg-white p-1 ring-1 ring-border shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block leading-tight">
              <h1 className="font-heading text-[15px] font-bold tracking-tight text-foreground">
                SAFE<span className="text-gradient-brand">DOC</span>
              </h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.22em] font-medium">Gestão SST</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 mx-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                activeClassName="!text-primary !bg-primary/10"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Perfil">
              <UserCircle2 className="h-[20px] w-[20px]" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                activeClassName="!text-primary !bg-primary/10"
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
