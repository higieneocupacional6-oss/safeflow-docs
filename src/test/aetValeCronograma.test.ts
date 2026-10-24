import { describe, expect, it } from "vitest";
import { cronogramaVazio, mesesCronograma, mesclarAcoesMensais, novaAcaoMensal, proximaCorVale } from "../../supabase/functions/_shared/aetValeCronograma";
describe("Plano mensal VALE", () => {
  it("gera Jan/26 até Dez/27 no período 2026 a 2027", () => {
    const meses = mesesCronograma(2026, 2027);
    expect(meses).toHaveLength(24); expect(meses[0]).toEqual({ id:"2026-01", nome:"Jan/26", ano:2026 }); expect(meses[23].nome).toBe("Dez/27");
  });
  it("oferece azul, verde e vermelho sem confundir estados", () => {
    expect(proximaCorVale("")).toBe("azul"); expect(proximaCorVale("azul")).toBe("verde"); expect(proximaCorVale("verde")).toBe("vermelho"); expect(proximaCorVale("vermelho")).toBe("");
  });
  it("preserva linhas manuais, meses renomeados e cores ao incorporar IA sem duplicar", () => {
    const a = { ...novaAcaoMensal("a"), documento_id:"d1", fator_id:"f1", o_que:"Elevar bancada", meses:{"2026-01":"verde" as const} };
    const atual = { ...cronogramaVazio(2026), anoFinal:2027, nomesMeses:{"2026-01":"Janeiro/26"}, acoes:[a] };
    const novo = { ...a, id:"b", fator_id:"f2", o_que:"Ajustar pega", meses:{} };
    const resultado = mesclarAcoesMensais(atual,[a,novo,novo]);
    expect(resultado.acoes).toHaveLength(2); expect(resultado.acoes[0]).toEqual(a); expect(resultado.nomesMeses["2026-01"]).toBe("Janeiro/26"); expect(resultado.anoFinal).toBe(2027); expect(atual.acoes).toHaveLength(1);
  });
  it("não funde riscos de funções avaliadas em documentos distintos", () => {
    const a = { ...novaAcaoMensal("a"), documento_id:"d1", fator_id:"r1", o_que:"Ajustar posto" };
    const b = { ...a, id:"b", documento_id:"d2" };
    expect(mesclarAcoesMensais(cronogramaVazio(2026),[a,b]).acoes).toHaveLength(2);
  });
  it("trocar período não elimina meses e cores já persistidos", () => {
    const a = { ...novaAcaoMensal("a"), o_que:"Ação", meses:{"2027-12":"vermelho" as const} };
    const salvo = { ...cronogramaVazio(2026), acoes:[a], nomesMeses:{"2027-12":"Dezembro/27"} };
    const reaberto = JSON.parse(JSON.stringify(salvo)); reaberto.anoFinal=2027;
    expect(reaberto.acoes[0].meses[mesesCronograma(2026,2027)[23].id]).toBe("vermelho"); expect(reaberto.nomesMeses["2027-12"]).toBe("Dezembro/27");
  });
});