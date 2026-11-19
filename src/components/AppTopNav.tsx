import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, Menu, UserCircle2, Wifi, WifiOff, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { navItemsVisiveis, type NavGroup } from "@/components/navConfig";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function caminhoAtivo(pathname: string, url: string, end?: boolean) {
  if (end) return pathname === url;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function grupoAtivo(pathname: string, group: NavGroup) {
  return group.items.some((i) => caminhoAtivo(pathname, i.url, i.end));
}

export function AppTopNav({
  syncOnline,
  onLogout,
}: {
  syncOnline: boolean;
  onLogout: () => void;
}) {
  const { user, isAdmin, profileName } = useAuth();
  const location = useLocation();
  const groups = useMemo(() => navItemsVisiveis(!!isAdmin), [isAdmin]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-nav text-nav-foreground shadow-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center rounded-lg outline-none ring-offset-nav focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="SegDoc — início"
        >
          <BrandLogo priority tone="light" size="md" markClassName="sm:h-10 sm:w-10" />
        </Link>

        {/* Desktop nav */}
        <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Menu principal">
          {groups.map((group) => {
            if (group.items.length === 1 && group.label === "Início") {
              const item = group.items[0];
              const active = caminhoAtivo(location.pathname, item.url, item.end);
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.end}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                    active && "bg-white/15 text-white shadow-sm",
                  )}
                  activeClassName="bg-white/15 text-white"
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              );
            }

            const active = grupoAtivo(location.pathname, group);
            return (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger
                  className={cn(
                    "group inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white/80 outline-none transition-all hover:bg-white/10 hover:text-white data-[state=open]:bg-white/15 data-[state=open]:text-white",
                    active && "bg-white/12 text-white",
                  )}
                >
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[240px] border-border/70 bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                  {group.items.map((item) => {
                    const isOn = caminhoAtivo(location.pathname, item.url, item.end);
                    return (
                      <DropdownMenuItem key={item.url} asChild className="cursor-pointer rounded-md p-0">
                        <Link
                          to={item.url}
                          className={cn(
                            "flex w-full items-start gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted",
                            isOn && "bg-primary/8 text-primary font-semibold",
                          )}
                        >
                          <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", isOn ? "text-primary" : "text-muted-foreground")} />
                          <span className="min-w-0">
                            <span className="block leading-tight">{item.title}</span>
                            {item.description && (
                              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground leading-snug">
                                {item.description}
                              </span>
                            )}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div
            className="hidden items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/70 sm:flex"
            title={syncOnline ? "Sincronização ativa" : "Sem sincronização"}
          >
            {syncOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-300" /> : <WifiOff className="h-3.5 w-3.5 text-rose-300" />}
            <span>{syncOnline ? "Online" : "Offline"}</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              onBlur={() => setTimeout(() => setProfileOpen(false), 160)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Perfil"
            >
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden max-w-[140px] truncate text-xs font-medium md:inline">
                {profileName || user?.email}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">Logado como</p>
                  <p className="truncate text-sm font-medium">{profileName || user?.email}</p>
                  {profileName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>}
                  {isAdmin && <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Administrador</p>}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,20rem)] border-r border-white/10 bg-nav p-0 text-nav-foreground">
          <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
            <SheetTitle className="flex items-center justify-between text-white">
              <BrandLogo tone="light" markClassName="h-8 w-8" />
              <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="rounded-md p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-5 overflow-y-auto px-3 py-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = caminhoAtivo(location.pathname, item.url, item.end);
                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                          active && "bg-white/15 text-white font-semibold",
                        )}
                        activeClassName="bg-white/15 text-white font-semibold"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
