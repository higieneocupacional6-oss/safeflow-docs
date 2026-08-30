import { Building2, FileText, LayoutTemplate, Database, Shield, Users, FolderTree, Brain } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Setores e Funções", url: "/setores-funcoes", icon: Users },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Controle de Documentos", url: "/documentos/controle", icon: FolderTree },
  { title: "Psicossocial", url: "/psicossocial", icon: Brain },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Cadastros", url: "/cadastros", icon: Database },
  
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-heading text-sm font-bold text-sidebar-accent-foreground tracking-tight">SAFEDOC</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Gestão SST</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
