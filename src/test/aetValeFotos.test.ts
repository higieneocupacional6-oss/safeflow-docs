import { describe, expect, it } from "vitest";
import { aplicarAnotacaoFoto, substituirFotoVale, validarAnaliseFoto, type AnotacaoFotoVale } from "../../supabase/functions/_shared/aetValeFotos";
const m = { problema: "Tronco flexionado", melhoria: "Elevar superfície de apoio", evidencia: "Tronco inclinado sobre bancada", x: .5, y: .4, caixaX: .1, caixaY: .1 };
const anotacao: AnotacaoFotoVale = { imagem: "anotada", fonteHash: "hash", registroId: "doc1", funcaoId: "f1", marcacoes: [m], observacao: "" };
describe("Fotos AET VALE", () => {
  it("preserva original e vínculo exato ao aplicar marcações", () => { expect(aplicarAnotacaoFoto({ imagem:"original", descricao:"Manual" },"original",anotacao)).toEqual({ imagem:"original",descricao:"Manual",anotacao }); });
  it("ignora análise obsoleta após troca da foto", () => { expect(aplicarAnotacaoFoto({imagem:"nova",descricao:""},"original",anotacao).anotacao).toBeUndefined(); });
  it("substituição invalida marcações e mantém descrição", () => { expect(substituirFotoVale({imagem:"original",descricao:"Manual",anotacao},"nova")).toEqual({imagem:"nova",descricao:"Manual"}); });
  it("rejeita marcações sem evidência ou coordenadas fora da foto", () => { expect(validarAnaliseFoto({marcacoes:[m,{...m,evidencia:""},{...m,x:2}],observacao:""}).marcacoes).toEqual([m]); });
  it("não inventa marcação quando não há problema comprovado", () => { expect(validarAnaliseFoto({marcacoes:[],observacao:"Nenhuma melhoria visual comprovada"}).marcacoes).toEqual([]); });
});