export const LTCAT_CHILD_KEYS = [
  "componentes",
  "calor",
  "vibracao",
  "resultados",
  "equipamentos",
  "epi_epc",
] as const;

export type LtcatChildKey = (typeof LTCAT_CHILD_KEYS)[number];
export type LtcatSerializedEvaluation = Record<string, unknown> & { id: string };

export type LtcatPersistenceBaseline = {
  fingerprints: Map<string, string>;
  childIds: Record<LtcatChildKey, Map<string, Set<string>>>;
};

export type LtcatIncrementalChanges = {
  upserts: LtcatSerializedEvaluation[];
  deleteEvaluationIds: string[];
  deleteChildIds: Record<LtcatChildKey, string[]>;
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableValue((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
};

export const stableFingerprint = (value: unknown) => JSON.stringify(stableValue(value));

const childRows = (evaluation: LtcatSerializedEvaluation, key: LtcatChildKey) => {
  if (key === "epi_epc") {
    const row = evaluation[key];
    return row && typeof row === "object" && Object.keys(row).length ? [row] : [];
  }
  return Array.isArray(evaluation[key]) ? evaluation[key] as Record<string, unknown>[] : [];
};

export const createLtcatBaseline = (
  evaluations: LtcatSerializedEvaluation[],
): LtcatPersistenceBaseline => {
  const childIds = Object.fromEntries(
    LTCAT_CHILD_KEYS.map((key) => [key, new Map<string, Set<string>>()]),
  ) as LtcatPersistenceBaseline["childIds"];
  const fingerprints = new Map<string, string>();

  evaluations.forEach((evaluation) => {
    fingerprints.set(evaluation.id, stableFingerprint(evaluation));
    LTCAT_CHILD_KEYS.forEach((key) => {
      const ids = childRows(evaluation, key)
        .map((row) => String((row as Record<string, unknown>).id || ""))
        .filter(Boolean);
      childIds[key].set(evaluation.id, new Set(ids));
    });
  });

  return { fingerprints, childIds };
};

export const diffLtcatEvaluations = (
  current: LtcatSerializedEvaluation[],
  baseline: LtcatPersistenceBaseline,
  explicitDeleteIds: Iterable<string>,
): LtcatIncrementalChanges => {
  const deleted = new Set(explicitDeleteIds);
  const deleteChildIds = Object.fromEntries(
    LTCAT_CHILD_KEYS.map((key) => [key, [] as string[]]),
  ) as LtcatIncrementalChanges["deleteChildIds"];

  const upserts = current.filter((evaluation) => {
    if (deleted.has(evaluation.id)) return false;
    return baseline.fingerprints.get(evaluation.id) !== stableFingerprint(evaluation);
  });

  upserts.forEach((evaluation) => {
    LTCAT_CHILD_KEYS.forEach((key) => {
      const previous = baseline.childIds[key].get(evaluation.id) || new Set<string>();
      const currentIds = new Set(
        childRows(evaluation, key)
          .map((row) => String((row as Record<string, unknown>).id || ""))
          .filter(Boolean),
      );
      previous.forEach((id) => {
        if (!currentIds.has(id)) deleteChildIds[key].push(id);
      });
    });
  });

  return {
    upserts,
    deleteEvaluationIds: Array.from(deleted),
    deleteChildIds,
  };
};

export const hasLtcatPersistenceChanges = (changes: LtcatIncrementalChanges) =>
  changes.upserts.length > 0 ||
  changes.deleteEvaluationIds.length > 0 ||
  LTCAT_CHILD_KEYS.some((key) => changes.deleteChildIds[key].length > 0);

export class LatestRequestGuard {
  private generation = 0;

  begin() {
    this.generation += 1;
    return this.generation;
  }

  isCurrent(generation: number) {
    return generation === this.generation;
  }

  invalidate() {
    this.generation += 1;
  }
}

export const createSerialSaveQueue = () => {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const next = tail.catch(() => undefined).then(operation);
    tail = next.catch(() => undefined);
    return next;
  };
};