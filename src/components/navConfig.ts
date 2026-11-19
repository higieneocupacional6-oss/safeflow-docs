import {
  Activity, Brain, Building2, ClipboardCheck, ClipboardList, Database,
  FileSignature, FileText, FlaskConical, FolderTree, LayoutDashboard,
  LayoutTemplate, Link2, ShieldCheck, Users, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
  admin?: boolean;
  description?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/** Menus do portal — mesma estrutura do menu lateral anterior. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Início",
    items: [
      { title: "Painel", url: "/", icon: LayoutDashboard, end: true, description: "Visão geral do portal SST" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Empresas", url: "/empresas", icon: Building2, description: "Cadastro de empresas" },
      { title: "Contratos", url: "/empresas-contratos", icon: FileSignature, description: "Contratos por empresa" },
      { title: "Setores e Funções", url: "/setores-funcoes", icon: Users, description: "Estrutura organizacional" },
      { title: "Cadastros gerais", url: "/cadastros", icon: Database, description: "Tabelas e parâmetros" },
    ],
  },
  {
    label: "Documentos",
    items: [
      { title: "Documentos", url: "/documentos", icon: FileText, end: true, description: "LTCAT, PGR, AET, APR e mais" },
      { title: "Controle de Documentos", url: "/documentos/controle", icon: FolderTree, description: "Organização e status" },
    ],
  },
  {
    label: "Avaliações",
    items: [
      { title: "Psicossocial", url: "/psicossocial", icon: Brain, description: "Avaliações psicossociais" },
      { title: "Ficha Técnica", url: "/ficha-tecnica", icon: FlaskConical, description: "Fichas técnicas" },
      { title: "Formulário AEP", url: "/formulario-aep", icon: ClipboardCheck, description: "Anexo 01 / AEP" },
      { title: "Formulário AEP/AET", url: "/formulario-aep-aet", icon: ClipboardList, description: "Avaliações AEP/AET por função" },
      { title: "Ferramentas Ergonômicas", url: "/ferramentas-ergonomicas", icon: Wrench, description: "NIOSH, RULA, REBA, OWAS, ROSA e OCRA" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Templates", url: "/templates", icon: LayoutTemplate, end: true, description: "Modelos de documentos" },
      { title: "Templates Psicossociais", url: "/templates/avaliacoes-psicossociais", icon: ClipboardList, description: "Modelos psicossociais" },
      { title: "Portal Clientes", url: "/portal-clientes", icon: Link2, description: "Links permanentes de documentos por empresa" },
      { title: "Usuários", url: "/usuarios", icon: ShieldCheck, admin: true, description: "Contas e permissões" },
      { title: "Diagnóstico IA", url: "/diagnostico-ia", icon: Activity, admin: true, description: "Status dos provedores de IA" },
    ],
  },
];

export function navItemsVisiveis(isAdmin: boolean): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.admin || isAdmin),
  })).filter((g) => g.items.length > 0);
}
