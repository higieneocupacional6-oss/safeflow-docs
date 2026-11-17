import { describe, expect, it, vi } from "vitest";
import { AetValeSaveQueue } from "../lib/aetValeSaveQueue";

describe("AET VALE persistence queue", () => {
  it("keeps only the latest pending change during a slow save", async () => {
    let finish: (() => void) | undefined;
    const write = vi.fn().mockImplementationOnce(() => new Promise<void>(r => { finish = r; })).mockResolvedValue(undefined);
    const queue = new AetValeSaveQueue<number>(write);
    const first = queue.save(1);
    const second = queue.save(2);
    const third = queue.save(3, true);
    finish?.();
    expect(await Promise.all([first, second, third])).toEqual([true, true, true]);
    expect(write.mock.calls).toEqual([[1, false, true], [3, true, true]]);
  });

  it("does not resend unchanged original and annotated images when marking saved", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const queue = new AetValeSaveQueue<object>(write);
    const data = { fotos: [{ imagem: "original", anotacao: { imagem: "annotated" } }] };
    queue.initialize(data, false);
    expect(await queue.save(data, true)).toBe(true);
    expect(write).toHaveBeenCalledWith(data, true, false);
    await queue.save(data, true);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("retains every field and allows retry after failure", async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
    const queue = new AetValeSaveQueue<object>(write);
    const data = { cargo: "Operador", fotos: [{ imagem: "original", anotacao: { imagem: "annotated" } }], etapa2: { plano: [{ acao: "Ajustar bancada" }] } };
    expect(await queue.save(data)).toBe(false);
    expect(queue.isSaved(data)).toBe(false);
    expect(await queue.save(data)).toBe(true);
    expect(write.mock.calls[1][0]).toBe(data);
    expect(queue.isSaved(data)).toBe(true);
  });
});