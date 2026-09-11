export type AetCronoRow = {
  tarefa?: string | null;
  tempo?: string | null;
  risco?: string | null;
};

export type AetCronoTemplateRow = {
  tarefa: string;
  tarefas: string;
  tempo: string;
  risco: string;
  riscos_observados: string;
};

/**
 * Converts the persisted AET cronoanalysis rows into both loop data and the
 * legacy scalar variables used by existing templates.
 */
export function buildAetCronoTemplateData(
  rows: AetCronoRow[] | null | undefined,
  legacy?: { tarefas?: string | null; riscos_observados?: string | null },
) {
  const cronoanalise: AetCronoTemplateRow[] = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const tarefa = String(row?.tarefa || "").trim();
      const tempo = String(row?.tempo || "").trim();
      const risco = String(row?.risco || "").trim();
      return {
        tarefa,
        tarefas: tarefa,
        tempo,
        risco,
        riscos_observados: risco,
      };
    })
    .filter((row) => row.tarefa || row.tempo || row.risco);

  return {
    cronoanalise,
    tarefas: cronoanalise.length > 0
      ? cronoanalise.map((row) => row.tarefa).join("\n")
      : String(legacy?.tarefas || ""),
    tempo: cronoanalise.map((row) => row.tempo).join("\n"),
    riscos_observados: cronoanalise.length > 0
      ? cronoanalise.map((row) => row.risco).join("\n")
      : String(legacy?.riscos_observados || ""),
  };
}