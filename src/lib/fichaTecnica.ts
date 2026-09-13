export const FICHA_TIPOS = [
  { value: "ruido", label: "Ruído contínuo e intermitente" },
  { value: "vibracao_vci", label: "Vibração de corpo inteiro" },
  { value: "vibracao_vmb", label: "Vibração de mãos e braços" },
  { value: "calor", label: "Calor" },
  { value: "poeira_silica", label: "Poeira respirável e sílica livre" },
  { value: "quimico_quantitativo", label: "Químico quantitativo" },
  { value: "fumos_metalicos", label: "Fumos metálicos" },
  { value: "vapores_organicos", label: "Vapores orgânicos" },
] as const;

export type FichaTipo = typeof FICHA_TIPOS[number]["value"];

export const fichaTipoLabel = (tipo: string) =>
  FICHA_TIPOS.find((item) => item.value === tipo)?.label || tipo;

export const isFichaQuimica = (tipo: string) =>
  ["poeira_silica", "quimico_quantitativo", "fumos_metalicos", "vapores_organicos"].includes(tipo);

export const agenteMatchesTipo = (tipo: FichaTipo, nome: string) => {
  const value = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (tipo === "ruido") return value.includes("ruido") && (value.includes("continu") || value.includes("intermit"));
  if (tipo === "vibracao_vci") return value.includes("vibracao") && (value.includes("corpo inteiro") || value.includes("vci"));
  if (tipo === "vibracao_vmb") return value.includes("vibracao") && (value.includes("mao") || value.includes("braco") || value.includes("vmb"));
  if (tipo === "calor") return value === "calor";
  if (tipo === "poeira_silica") return value.includes("poeira") || value.includes("silica");
  if (tipo === "fumos_metalicos") return value.includes("fumo") && value.includes("metal");
  if (tipo === "vapores_organicos") return value.includes("vapor") && value.includes("organic");
  return value.includes("quim") || value.includes("poeira") || value.includes("fumo") || value.includes("vapor");
};

export const formatFichaResultado = (row: any) => {
  if (row.tipo === "ruido") return `NEN ${row.nen} dB · Dose Q3 ${row.dose_q3}% · LAVG ${row.lavg} dB · Dose Q5 ${row.dose_q5}%`;
  if (row.tipo === "vibracao_vci") return `AREN ${row.aren} m/s² · VDVR ${row.vdvr} m/s¹·⁷`;
  if (row.tipo === "vibracao_vmb") return `AREN ${row.aren} m/s²`;
  if (row.tipo === "calor") return `${row.concentracao} · ${row.taxa_metabolica}`;
  return `${row.componentes}: ${row.exposicao}`;
};