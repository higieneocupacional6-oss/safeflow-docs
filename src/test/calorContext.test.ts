import { describe, it, expect } from "vitest";
import {
  getIbutgValor,
  calcIbutgMedio,
  buildMediaIbutg,
  buildCalorFlags,
} from "@/lib/calorContext";

describe("getIbutgValor", () => {
  it("aceita valor do cálculo IBUTG", () => {
    expect(getIbutgValor({ ibutg_resultado: "28,5" })).toBeCloseTo(28.5);
  });
  it("aceita valor digitado no campo Exposição", () => {
    expect(getIbutgValor({ exposicao: "30.1" })).toBeCloseTo(30.1);
  });
  it("aceita valor vindo do banco (ibutg_medido)", () => {
    expect(getIbutgValor({ ibutg_medido: 26 })).toBe(26);
  });
});

describe("calcIbutgMedio", () => {
  it("pondera pelo tempo de exposição quando informado", () => {
    const m = calcIbutgMedio([
      { ibutg_resultado: "30", tempo_exposicao: "6h" },
      { ibutg_resultado: "20", tempo_exposicao: "2h" },
    ]);
    expect(m).toBeCloseTo(27.5);
  });
  it("usa média simples quando não há tempo", () => {
    expect(calcIbutgMedio([{ exposicao: "30" }, { exposicao: "20" }])).toBeCloseTo(25);
  });
});

describe("buildMediaIbutg", () => {
  it("exibe a média com 2+ linhas válidas mesmo sem tempo", () => {
    const r = buildMediaIbutg([{ exposicao: "30" }, { exposicao: "20" }]);
    expect(r.exibir_media_ibutg).toBe(true);
    expect(r.ibutg_medio).toBe("25.00");
  });
  it("não exibe média com uma única linha", () => {
    expect(buildMediaIbutg([{ exposicao: "30" }]).exibir_media_ibutg).toBe(false);
  });
});

describe("buildCalorFlags", () => {
  it("assume sem carga solar quando o tipo não foi salvo", () => {
    const f = buildCalorFlags({ exposicao: "28", ibutg_limite: "30" });
    expect(f.ibutg_sem_carga_solar).toBe(true);
    expect(f.ibutg_com_carga_solar).toBe(false);
    expect(f.situacao).toBe("Seguro");
  });
  it("infere carga solar quando há Tbs", () => {
    const f = buildCalorFlags({ ibutg_resultado: "32", tbs_valores: "31", ibutg_limite: "28" });
    expect(f.ibutg_com_carga_solar).toBe(true);
    expect(f.situacao).toBe("Nocivo");
  });
  it("não marca nenhum bloco sem IBUTG", () => {
    const f = buildCalorFlags({});
    expect(f.ibutg_com_carga_solar).toBe(false);
    expect(f.ibutg_sem_carga_solar).toBe(false);
  });
});
