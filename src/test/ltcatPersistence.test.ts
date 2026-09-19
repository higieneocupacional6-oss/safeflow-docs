import { describe, expect, it, vi } from "vitest";
import {
  createLtcatBaseline,
  createLtcatDatabaseSnapshot,
  createLtcatPersistedSnapshot,
  createSerialSaveQueue,
  diffLtcatEvaluations,
  hasLtcatPersistenceChanges,
  LatestRequestGuard,
  serializedByteLength,
  type LtcatSerializedEvaluation,
} from "@/lib/ltcatPersistence";

const evaluation = (
  id: string,
  result: number,
  childIds: string[] = [],
): LtcatSerializedEvaluation => ({
  id,
  resultado: result,
  componentes: childIds.map((childId, ordem) => ({ id: childId, ordem, resultado: result })),
  calor: [],
  vibracao: [],
  resultados: [],
  equipamentos: [],
  epi_epc: {},
});

describe("persistência incremental LTCAT/Insalubridade", () => {
  it("classifica avaliação nova como INSERT/upsert sem excluir as existentes", () => {
    const existing = evaluation("existing", 1);
    const created = evaluation("created", 2);
    const changes = diffLtcatEvaluations([existing, created], createLtcatBaseline([existing]), []);
    expect(changes.upserts.map((row) => row.id)).toEqual(["created"]);
    expect(changes.deleteEvaluationIds).toEqual([]);
  });

  it("envia somente avaliação existente alterada", () => {
    const before = evaluation("existing", 1);
    const after = evaluation("existing", 2);
    const changes = diffLtcatEvaluations([after], createLtcatBaseline([before]), []);
    expect(changes.upserts).toEqual([after]);
  });

  it("não interpreta ausência como exclusão", () => {
    const first = evaluation("first", 1);
    const second = evaluation("second", 2);
    const changes = diffLtcatEvaluations([first], createLtcatBaseline([first, second]), []);
    expect(changes.deleteEvaluationIds).toEqual([]);
    expect(hasLtcatPersistenceChanges(changes)).toBe(false);
  });

  it("exclui avaliação apenas quando o usuário informa seu UUID", () => {
    const first = evaluation("first", 1);
    const second = evaluation("second", 2);
    const changes = diffLtcatEvaluations([first], createLtcatBaseline([first, second]), ["second"]);
    expect(changes.deleteEvaluationIds).toEqual(["second"]);
  });

  it("identifica exclusão explícita de filho ao editar avaliação", () => {
    const before = evaluation("existing", 1, ["child-a", "child-b"]);
    const after = evaluation("existing", 2, ["child-a"]);
    const changes = diffLtcatEvaluations([after], createLtcatBaseline([before]), []);
    expect(changes.deleteChildIds.componentes).toEqual(["child-b"]);
  });

  it("não envia documento grande sem mudanças", () => {
    const rows = Array.from({ length: 500 }, (_, index) =>
      evaluation(`evaluation-${index}`, index, [`child-${index}`]),
    );
    const changes = diffLtcatEvaluations(rows, createLtcatBaseline(rows), []);
    expect(hasLtcatPersistenceChanges(changes)).toBe(false);
  });

  it("serializa várias alterações rápidas e preserva a ordem", async () => {
    const enqueue = createSerialSaveQueue();
    const order: number[] = [];
    const first = enqueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      order.push(1);
      return 1;
    });
    const second = enqueue(async () => {
      order.push(2);
      return 2;
    });
    expect(await Promise.all([first, second])).toEqual([1, 2]);
    expect(order).toEqual([1, 2]);
  });

  it("continua a fila depois de uma falha de conexão", async () => {
    const enqueue = createSerialSaveQueue();
    const failed = enqueue(async () => { throw new Error("offline"); });
    const recovered = enqueue(async () => "saved");
    await expect(failed).rejects.toThrow("offline");
    await expect(recovered).resolves.toBe("saved");
  });

  it("ignora resposta de carregamento antiga", () => {
    const guard = new LatestRequestGuard();
    const oldRequest = guard.begin();
    const currentRequest = guard.begin();
    expect(guard.isCurrent(oldRequest)).toBe(false);
    expect(guard.isCurrent(currentRequest)).toBe(true);
    guard.invalidate();
    expect(guard.isCurrent(currentRequest)).toBe(false);
  });

  it("representa duas alterações consecutivas sem perder a segunda", () => {
    const initial = evaluation("existing", 1);
    const first = evaluation("existing", 2);
    const second = evaluation("existing", 3);
    expect(diffLtcatEvaluations([first], createLtcatBaseline([initial]), []).upserts[0]).toEqual(first);
    expect(diffLtcatEvaluations([second], createLtcatBaseline([first]), []).upserts[0]).toEqual(second);
  });

  it("ignora mudanças visuais ao decidir se existe conteúdo persistível", () => {
    const base = { empresaId: "empresa", riscos: [evaluation("a", 1)], step: 1, riskForm: { resultado: "1" } };
    const visual = { ...base, step: 2, riskForm: { resultado: "123" }, editingRiskId: "a" };
    expect(createLtcatPersistedSnapshot(visual)).toEqual(createLtcatPersistedSnapshot(base));
  });

  it("mantém avaliações fora do snapshot enviado ao banco", () => {
    const snapshot = { empresaId: "empresa", riscos: Array.from({ length: 500 }, (_, i) => evaluation(`a-${i}`, i)), riskForm: { texto: "rascunho" } };
    const databaseSnapshot = createLtcatDatabaseSnapshot(snapshot);
    expect(databaseSnapshot).not.toHaveProperty("riscos");
    expect(databaseSnapshot).not.toHaveProperty("riskForm");
    expect(serializedByteLength(databaseSnapshot)).toBeLessThan(serializedByteLength(snapshot) / 100);
  });

  it("payload incremental cresce com a alteração, não com o documento completo", () => {
    const original = Array.from({ length: 1_000 }, (_, i) => evaluation(`a-${i}`, i, [`c-${i}`]));
    const changed = original.map((row, index) => index === 500 ? evaluation(row.id, 9999, ["c-500"]) : row);
    const changes = diffLtcatEvaluations(changed, createLtcatBaseline(original), []);
    expect(changes.upserts).toHaveLength(1);
    expect(serializedByteLength(changes)).toBeLessThan(serializedByteLength(changed) / 100);
  });
});