import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SeletorSetorFuncoesAep } from "@/components/formulario-aep/SeletorSetorFuncoesAep";
import { agruparFormulariosPorSetor, estadoDeDadosSalvos, urlNovoFormularioAep, urlPreencherFormularioAep } from "@/lib/formularioAepRegistro";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const setor = {
  id: "s1",
  nome_setor: "Corte",
  ghe_ges: "GHE 1",
  funcoes: [
    { id: "f1", nome_funcao: "Operador" },
    { id: "f2", nome_funcao: "Ajudante" },
  ],
};

describe("Formulário AEP por função", () => {
  it("seleciona várias funções do setor e mantém uma linha por função", () => {
    const onChange = vi.fn();
    const onAbrir = vi.fn();
    const onBaixar = vi.fn();
    const { rerender } = render(
      <SeletorSetorFuncoesAep
        setores={[setor]}
        loading={false}
        funcoesPorSetor={{}}
        salvas={{}}
        onChange={onChange}
        onAbrir={onAbrir}
        onBaixar={onBaixar}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clique para selecionar os setores" }));
    fireEvent.click(screen.getByRole("button", { name: /Corte/ }));
    expect(screen.getByText("Funções de GHE 1 — Corte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Operador/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Ajudante/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onChange).toHaveBeenCalledWith({ s1: ["f1", "f2"] });
    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    rerender(
      <SeletorSetorFuncoesAep
        setores={[setor]}
        loading={false}
        funcoesPorSetor={{ s1: ["f1", "f2"] }}
        salvas={{ f1: { id: "form-1", updated_at: "2026-10-26T00:00:00Z" } }}
        onChange={onChange}
        onAbrir={onAbrir}
        onBaixar={onBaixar}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Operador" }));
    expect(onAbrir).toHaveBeenCalledWith("s1", "f1", "form-1");
    fireEvent.click(screen.getByRole("button", { name: "Baixar relatório de Operador" }));
    expect(onBaixar).toHaveBeenCalledWith("s1", "f1", "form-1");
    expect(onAbrir).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Baixar relatório de Ajudante" })).not.toBeInTheDocument();
  });

  it("agrupa os salvos por setor e não duplica a função", () => {
    const { grupos, legado } = agruparFormulariosPorSetor(
      [
        { id: "a", empresa_id: "e", contrato_id: "c", funcao_id: "f1", setor_ids: ["s1"], created_at: "1", updated_at: "1" },
        { id: "b", empresa_id: "e", contrato_id: "c", funcao_id: "f1", setor_ids: ["s1"], created_at: "2", updated_at: "2" },
        { id: "c", empresa_id: "e", contrato_id: "c", funcao_id: "f2", setor_ids: ["s1"], created_at: "2", updated_at: "2" },
        { id: "antigo", empresa_id: "e", contrato_id: "c", funcao_id: null, setor_ids: ["s1"], created_at: "1", updated_at: "1" },
      ],
      [{ id: "s1", nome_setor: "Corte", ghe_ges: "GHE 1" }],
      [{ id: "f1", nome_funcao: "Operador", setor_id: "s1" }, { id: "f2", nome_funcao: "Ajudante", setor_id: "s1" }],
    );
    expect(grupos).toHaveLength(1);
    expect(grupos[0].nome).toBe("GHE 1 — Corte");
    expect(grupos[0].funcoes.map((f) => f.nome)).toEqual(["Ajudante", "Operador"]);
    expect(grupos[0].funcoes.find((f) => f.funcaoId === "f1")?.formulario.id).toBe("b");
    expect(legado.map((f) => f.id)).toEqual(["antigo"]);
  });

  it("reabre os dados salvos da função e monta o endereço de retorno", () => {
    const estado = estadoDeDadosSalvos({
      ident: { descricao: "Corte de peças" },
      atividades: [{ texto: "Serrar", marcas: { AF: "X" } }],
      funcoes: ["outra"],
    }, "f1");
    expect(estado.ident.descricao).toBe("Corte de peças");
    expect(estado.funcoes).toEqual(["f1"]);
    expect(estado.atividades[0]).toEqual({ texto: "Serrar", marcas: { AF: "X" } });
    expect(estado.atividades).toHaveLength(5);
    expect(urlPreencherFormularioAep({
      empresaId: "e", contratoId: "c", setorId: "s", funcaoId: "f1", formularioId: "form-1", origem: "novo", funcoes: ["f1", "f2"],
    })).toBe("/formulario-aep/preencher?empresa=e&contrato=c&setor=s&funcao=f1&origem=novo&id=form-1&funcoes=f1%2Cf2");
    expect(urlNovoFormularioAep("e", "c", ["f1", "f2"])).toBe("/formulario-aep/novo?empresa=e&contrato=c&funcoes=f1%2Cf2");
  });
});
