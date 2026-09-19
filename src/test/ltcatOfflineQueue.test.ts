import { describe, expect, it } from "vitest";
import {
  createMemoryLtcatQueue,
  createPendingOperation,
  isTransientSaveError,
  isVersionConflictMessage,
  retryDelayMs,
  type LtcatPendingOperation,
} from "@/lib/ltcatOfflineQueue";

const operation = (result: number, previous?: LtcatPendingOperation | null) => createPendingOperation({
  userId: "user-1",
  documentId: "doc-1",
  empresaId: "empresa-1",
  tipoDocumento: "ltcat",
  tipoDocLabel: "LTCAT",
  expectedVersion: 4,
  createDocument: false,
  documentPatch: { status: "rascunho" },
  changes: {
    upserts: [{ id: "avaliacao-1", resultado: result }],
    deleteEvaluationIds: [],
    deleteChildIds: { componentes: [], calor: [], vibracao: [], resultados: [], equipamentos: [], epi_epc: [] },
  },
  evaluations: [{ id: "avaliacao-1", resultado: result }],
  snapshot: { empresaId: "empresa-1", riscos: [{ id: "avaliacao-1", resultado: result }] },
}, previous, result);

describe("fila persistente LTCAT/Insalubridade", () => {
  it("registra antes do envio e remove somente a revisão confirmada", async () => {
    const queue = createMemoryLtcatQueue();
    const first = operation(1);
    await queue.put(first);
    expect(await queue.get(first.key)).toEqual(first);
    expect(await queue.removeIfRevision(first.key, "outra-revisao")).toBe(false);
    expect(await queue.get(first.key)).toEqual(first);
    expect(await queue.removeIfRevision(first.key, first.revision)).toBe(true);
    expect(await queue.get(first.key)).toBeNull();
  });

  it("consolida várias alterações mantendo somente o checkpoint mais novo", async () => {
    const queue = createMemoryLtcatQueue();
    const first = operation(1);
    const second = operation(2, first);
    const third = operation(3, second);
    await queue.put(first);
    await queue.put(second);
    await queue.put(third);
    const pending = await queue.get(first.key);
    expect(pending?.changes.upserts[0].resultado).toBe(3);
    expect(pending?.createdAt).toBe(first.createdAt);
    expect((await queue.listForUser("user-1"))).toHaveLength(1);
  });

  it("não apaga alteração nova quando uma requisição antiga termina", async () => {
    const queue = createMemoryLtcatQueue();
    const first = operation(1);
    await queue.put(first);
    const newer = operation(2, first);
    await queue.put(newer);
    expect(await queue.removeIfRevision(first.key, first.revision)).toBe(false);
    expect((await queue.get(first.key))?.revision).toBe(newer.revision);
  });

  it("recupera pendências após uma nova instância da tela", async () => {
    const queue = createMemoryLtcatQueue();
    const pending = operation(7);
    await queue.put(pending);
    const recovered = await queue.get(pending.key);
    expect(recovered?.snapshot).toEqual(pending.snapshot);
    expect(recovered?.expectedVersion).toBe(4);
  });

  it("usa backoff progressivo, limitado e sem rajada de chamadas", () => {
    expect(retryDelayMs(0, () => 0.5)).toBe(1_000);
    expect(retryDelayMs(3, () => 0.5)).toBe(8_000);
    expect(retryDelayMs(20, () => 0.5)).toBe(60_000);
  });

  it("distingue falha transitória de conflito que exige revisão", () => {
    expect(isTransientSaveError(new Error("Failed to fetch"))).toBe(true);
    expect(isTransientSaveError(new Error("500 Internal Server Error"))).toBe(true);
    expect(isVersionConflictMessage("Existem alterações mais recentes neste documento")).toBe(true);
    expect(isTransientSaveError(new Error("Existem alterações mais recentes neste documento"))).toBe(false);
  });

  it("mantém documento grande como uma única operação consolidada", async () => {
    const queue = createMemoryLtcatQueue();
    const large = operation(1);
    large.evaluations = Array.from({ length: 1_000 }, (_, index) => ({ id: `av-${index}`, resultado: index }));
    large.snapshot.riscos = large.evaluations;
    await queue.put(large);
    expect((await queue.listForUser("user-1"))).toHaveLength(1);
    expect((await queue.get(large.key))?.evaluations).toHaveLength(1_000);
  });
});