/**
 * Mantido para compatibilidade. A navegação ativa do portal é o AppTopNav.
 * Reutiliza a mesma configuração de menus.
 */
import { NavLink } from "@/components/NavLink";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { navItemsVisiveis } from "@/components/navConfig";
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useAuth();
  const grupos = navItemsVisiveis(!!isAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <BrandLogo
          tone="light"
          showWordmark={!collapsed}
          markClassName="h-9 w-9"
        />
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {grupo.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className="rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="!bg-sidebar-accent !text-white font-semibold"
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
