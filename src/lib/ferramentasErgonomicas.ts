import type { LucideIcon } from "lucide-react";
import {
  Activity, Armchair, Boxes, MonitorSmartphone, PersonStanding, Repeat,
} from "lucide-react";

export type FerramentaErgoSlug = "niosh" | "rula" | "reba" | "owas" | "rosa" | "ocra";
export type FerramentaErgoTipo = "NIOSH" | "RULA" | "REBA" | "OWAS" | "ROSA" | "OCRA";

export type FerramentaErgoMeta = {
  slug: FerramentaErgoSlug;
  tipo: FerramentaErgoTipo;
  titulo: string;
  nomeCompleto: string;
  descricao: string;
  icon: LucideIcon;
};

export const FERRAMENTAS_ERGONOMICAS: FerramentaErgoMeta[] = [
  {
    slug: "niosh",
    tipo: "NIOSH",
    titulo: "NIOSH",
    nomeCompleto: "Equação Revisada de Levantamento (NIOSH)",
    descricao: "Avalia o risco de levantamento manual de cargas e calcula o Limite de Peso Recomendado (RWL) e o Índice de Levantamento.",
    icon: Boxes,
  },
  {
    slug: "rula",
    tipo: "RULA",
    titulo: "RULA",
    nomeCompleto: "Rapid Upper Limb Assessment",
    descricao: "Analisa posturas de membros superiores, pescoço e tronco para estimar o nível de ação ergonômica.",
    icon: Armchair,
  },
  {
    slug: "reba",
    tipo: "REBA",
    titulo: "REBA",
    nomeCompleto: "Rapid Entire Body Assessment",
    descricao: "Avalia posturas de corpo inteiro, incluindo carga, acoplamento e atividade, com classificação de risco.",
    icon: PersonStanding,
  },
  {
    slug: "owas",
    tipo: "OWAS",
    titulo: "OWAS",
    nomeCompleto: "Ovako Working Posture Analysis System",
    descricao: "Classifica combinações de posturas de costas, braços, pernas e carga em categorias de ação.",
    icon: Activity,
  },
  {
    slug: "rosa",
    tipo: "ROSA",
    titulo: "ROSA",
    nomeCompleto: "Rapid Office Strain Assessment",
    descricao: "Avalia postos de escritório (cadeira, monitor, telefone, mouse e teclado) com matriz oficial de pontuação.",
    icon: MonitorSmartphone,
  },
  {
    slug: "ocra",
    tipo: "OCRA",
    titulo: "OCRA",
    nomeCompleto: "Occupational Repetitive Actions",
    descricao: "Avalia exposição a movimentos repetitivos dos membros superiores (Checklist ICKL ou Índice ATA/RTA).",
    icon: Repeat,
  },
];

export function ferramentaErgoPorSlug(slug?: string | null): FerramentaErgoMeta | null {
  if (!slug) return null;
  return FERRAMENTAS_ERGONOMICAS.find((f) => f.slug === slug.toLowerCase()) || null;
}

export function urlFerramentasErgonomicas() {
  return "/ferramentas-ergonomicas";
}

export function urlFerramentaErgonomica(slug: FerramentaErgoSlug) {
  return `/ferramentas-ergonomicas/${slug}`;
}
