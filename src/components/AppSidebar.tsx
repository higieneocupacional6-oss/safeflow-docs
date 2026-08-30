import {
  Building2, FileText, LayoutTemplate, Database, Users, FolderTree, Brain,
  ShieldCheck, FileSignature, ClipboardList,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: any; end?: boolean; admin?: boolean };

const grupos: { label: string; items: Item[] }[] = [
  {
    label: "Cadastros",
    items: [
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Contratos", url: "/empresas-contratos", icon: FileSignature },
      { title: "Setores e Funções", url: "/setores-funcoes", icon: Users },
      { title: "Cadastros gerais", url: "/cadastros", icon: Database },
    ],
  },
  {
    label: "Documentos",
    items: [
      { title: "Documentos", url: "/documentos", icon: FileText, end: true },
      { title: "Controle de Documentos", url: "/documentos/controle", icon: FolderTree },
    ],
  },
  {
    label: "Avaliações",
    items: [
      { title: "Psicossocial", url: "/psicossocial", icon: Brain },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Templates", url: "/templates", icon: LayoutTemplate, end: true },
      { title: "Templates Psicossociais", url: "/templates/avaliacoes-psicossociais", icon: ClipboardList },
      { title: "Usuários", url: "/usuarios", icon: ShieldCheck, admin: true },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <h1 className="font-heading text-sm font-bold text-sidebar-accent-foreground tracking-tight">
                SEG<span className="text-sidebar-primary">DOC</span>
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-[0.2em]">Gestão SST</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {grupos.map((grupo) => {
          const items = grupo.items.filter((i) => !i.admin || isAdmin);
          if (!items.length) return null;
          return (
            <SidebarGroup key={grupo.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                  {grupo.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end={item.end}
                          className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                          activeClassName="!bg-sidebar-accent !text-sidebar-primary font-semibold"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
