// Extract numeric value from a GES/GHE string ("GES 02", "GHE 10", "2", "")
// Returns a large number when empty or non-numeric so they go to the end.
export function gesOrder(value?: string | null): number {
  if (!value) return 999999;
  const m = String(value).match(/\d+/);
  if (!m) return 999999;
  const n = parseInt(m[0], 10);
  return isNaN(n) ? 999999 : n;
}

/** Compara textos somente pelo primeiro número encontrado, sem reordenar alfabeticamente. */
export function numericTextOrder(a?: string | null, b?: string | null): number {
  return gesOrder(a) - gesOrder(b);
}

export type NumericGroup = { setor?: string | null; ghe?: string | null };

/** Ordenação estável Setor → GHE/GES, baseada nos números contidos nos nomes. */
export function sortGroupsNumerically<T extends NumericGroup>(groups: readonly T[]): T[] {
  return groups
    .map((group, index) => ({ group, index }))
    .sort((a, b) =>
      numericTextOrder(a.group.setor, b.group.setor)
      || numericTextOrder(a.group.ghe, b.group.ghe)
      || a.index - b.index,
    )
    .map(({ group }) => group);
}

export function sortByGes<T extends { ghe_ges?: string | null }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const da = gesOrder(a.ghe_ges);
    const db = gesOrder(b.ghe_ges);
    if (da !== db) return da - db;
    // tiebreaker: alphabetical by nome_setor if present
    const na = (a as any).nome_setor || "";
    const nb = (b as any).nome_setor || "";
    return String(na).localeCompare(String(nb), "pt-BR");
  });
}
