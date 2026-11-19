import { describe, expect, it } from "vitest";
import { calcularRosa, ROSA_DEFAULT } from "@/lib/ergonomia/rosa";
import {
  calcularOcra,
  multiplicadorDuracao,
  OCRA_CHECKLIST_DEFAULT,
  OCRA_INDICE_DEFAULT,
} from "@/lib/ergonomia/ocra";

describe("ROSA (Sonne et al. / Tabelas A–E)", () => {
  it("posto ideal resulta em pontuação baixa (1–4)", () => {
    const r = calcularRosa(ROSA_DEFAULT);
    expect(r.escore_final).toBeGreaterThanOrEqual(1);
    expect(r.escore_final).toBeLessThanOrEqual(4);
    expect(r.classificacao).toMatch(/inapreciável|melhorável/i);
  });

  it("combina Tabela A + duração da cadeira e eleva o escore com fatores adversos", () => {
    const r = calcularRosa({
      ...ROSA_DEFAULT,
      alturaAssento: 3,
      alturaEspacoInsuficiente: true,
      alturaNaoRegulavel: true,
      profundidadeAssento: 2,
      profundidadeNaoRegulavel: true,
      apoioBracos: 2,
      apoioMuitoSeparados: true,
      apoioSuperficieDura: true,
      apoioNaoAjustavel: true,
      encosto: 2,
      encostoSuperficieAlta: true,
      encostoNaoAjustavel: true,
      duracaoCadeira: 1,
      monitor: 3,
      monitorGiroPescoco: true,
      monitorSemAtril: true,
      monitorBrilho: true,
      duracaoMonitor: 1,
      telefone: 2,
      telefoneOmbroPescoco: true,
      telefoneSemMaosLivres: true,
      duracaoTelefone: 1,
      mouse: 2,
      mousePinça: true,
      mouseAlturaDiferente: true,
      mousePressao: true,
      duracaoMouse: 1,
      teclado: 2,
      tecladoDesvio: true,
      tecladoMuitoAlto: true,
      tecladoAlcanceAlto: true,
      tecladoNaoAjustavel: true,
      duracaoTeclado: 1,
    });
    expect(r.escore_final).toBeGreaterThanOrEqual(5);
    expect(r.memoria_calculo.some((m) => m.etapa.includes("Tabela E"))).toBe(true);
  });
});

describe("OCRA Checklist / Índice", () => {
  it("MD oficial por faixas de TNTR", () => {
    expect(multiplicadorDuracao(100)).toBe(0.5);
    expect(multiplicadorDuracao(450)).toBe(1);
    expect(multiplicadorDuracao(500)).toBe(1.2);
    expect(multiplicadorDuracao(750)).toBe(4);
  });

  it("Checklist: ICKL = (FR+FF+FFz+FP+FC)×MD", () => {
    const r = calcularOcra({
      ...OCRA_CHECKLIST_DEFAULT,
      duracaoTurnoMin: 480,
      pausasMin: 0,
      almocoMin: 0,
      trabalhoNaoRepetitivoMin: 0,
      fr: 4,
      atd: 6,
      ate: 0,
      forcaModerada: 4,
      ombro: 6,
      estereotipia: 1.5,
      fisicoMecanico: 2,
      socioOrganizativo: 1,
    });
    // TNTR=480 → MD=1; FF=6; FFz=4; FP=max(6,0,0,0)+1.5=7.5; FC=3
    // soma = 4+6+4+7.5+3 = 24.5 → ICKL = 24.5
    expect(r.escore_final).toBe(24.5);
    expect(r.classificacao).toMatch(/inaceitável alto/i);
  });

  it("Índice: IE = Fobs / (CF×multiplicadores)", () => {
    const r = calcularOcra({
      ...OCRA_INDICE_DEFAULT,
      acoesTecnicasCiclo: 30,
      tempoCicloSeg: 60, // 30 ações/min
      Ff: 1,
      Fp: 1,
      Fa: 1,
      Fr: 1,
      Fd: 1,
    });
    // Fobs=30; RTA/min=30 → IE=1
    expect(r.escore_final).toBe(1);
    expect(r.classificacao).toMatch(/aceitável/i);
  });
});
