import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AprErgoExcluirModal } from "@/components/AprErgoExcluirModal";

const mocks = vi.hoisted(() => ({ filters: {} as Record<string, string>, rows: ["apr-a", "apr-b"], remove: vi.fn(), invalidate: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ delete: () => {
    const chain = { eq: (key: string, value: string) => { mocks.filters[key] = value; return chain; }, select: async () => {
      const id = mocks.filters.id;
      const found = mocks.rows.includes(id) && mocks.filters.tipo === "APR-ERGO" && mocks.filters.empresa_id === "e1" && mocks.filters.contrato_id === "c1";
      if (found) mocks.rows = mocks.rows.filter((r) => r !== id);
      return { data: found ? [{ id }] : [], error: null };
    } }; return chain;
  } }),
  storage: { from: () => ({ list: async () => ({ data: [{ id: "file", name: "referencia.pdf" }], error: null }), remove: mocks.remove }) },
} }));
vi.mock("@/lib/formularioAepBase", () => ({ BUCKET_FORM_AEP_BASE: "formulario-aep-base" }));
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.filters = {}; mocks.rows = ["apr-a", "apr-b"]; });
describe("APR — exclusão individual", () => {
  it("cancelar não exclui nenhuma APR", () => {
    const close = vi.fn();
    render(<AprErgoExcluirModal registros={[{ id: "apr-a", nome: "Operador" }]} empresaId="e1" contratoId="c1" onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.rows).toEqual(["apr-a", "apr-b"]);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("confirmar remove só a APR selecionada e o prefixo exato de sua Base", async () => {
    mocks.remove.mockResolvedValue({ error: null });
    const deleted = vi.fn();
    render(<AprErgoExcluirModal registros={[{ id: "apr-a", nome: "Operador" }]} empresaId="e1" contratoId="c1" onClose={vi.fn()} onDeleted={deleted} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir APR" }));
    await waitFor(() => expect(deleted).toHaveBeenCalledWith("apr-a"));
    expect(mocks.filters).toEqual({ id: "apr-a", tipo: "APR-ERGO", empresa_id: "e1", contrato_id: "c1" });
    expect(mocks.rows).toEqual(["apr-b"]);
    expect(mocks.remove).toHaveBeenCalledWith(["e1/c1/apr-a/apr-base/referencia.pdf"]);
  });
});