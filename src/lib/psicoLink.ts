const PUBLIC_BASE_URL =
  (import.meta as any).env?.VITE_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && /lovable\.app|safedocs/.test(window.location.hostname)
    ? `${window.location.protocol}//safedocs.lovable.app`
    : (typeof window !== "undefined" ? window.location.origin : ""));

/** URL pública do questionário psicossocial de um token de link. */
export function publicPsicoUrl(token: string) {
  return `${PUBLIC_BASE_URL}/avaliacao-psicossocial/${token}`;
}

/** Classificação global (uma palavra) a partir das médias por bloco das respostas. */
export function statusGeralPsicossocial(
  respostas: { blocos?: Record<string, { media: number; classificacao: string }> | null }[],
): string {
  if (!respostas.length) return "Pendente";
  const medias: number[] = [];
  for (const r of respostas) {
    const b = r.blocos || {};
    for (const v of Object.values(b)) if (typeof v?.media === "number") medias.push(v.media);
  }
  if (!medias.length) return "Pendente";
  const m = medias.reduce((a, c) => a + c, 0) / medias.length;
  if (m <= 25) return "Baixo";
  if (m <= 50) return "Moderado";
  if (m <= 75) return "Alto";
  return "Crítico";
}

export function corClassificacao(c: string) {
  switch (c) {
    case "Baixo": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Moderado": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Alto": return "bg-orange-100 text-orange-800 border-orange-300";
    case "Crítico": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}
