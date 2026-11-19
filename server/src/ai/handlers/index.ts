import type { PedidoGeracao } from "../gemini.js";
import { buildAep } from "./aep.js";
import { buildAet } from "./aet.js";
import { buildFormularioAep } from "./formularioAep.js";
import { buildAetVale } from "./aetVale.js";
import {
  buildAprErgo,
  buildAprErgoPlano,
  buildAetValeFoto,
  buildAetValePlano,
  buildPsico,
} from "./generic.js";

export const AI_FUNCTIONS = new Set([
  "aep-generate",
  "aet-generate",
  "apr-ergo-generate",
  "apr-ergo-plano-generate",
  "formulario-aep-generate",
  "psico-generate",
  "aet-vale-generate",
  "aet-vale-plano-generate",
  "aet-vale-foto-analyze",
]);

export async function buildPedido(funcao: string, body: unknown): Promise<PedidoGeracao> {
  const b = (body ?? {}) as any;
  switch (funcao) {
    case "formulario-aep-generate":
      return buildFormularioAep(b);
    case "aep-generate":
      return buildAep(b);
    case "aet-generate":
      return buildAet(b);
    case "apr-ergo-generate":
      return buildAprErgo(b);
    case "apr-ergo-plano-generate":
      return buildAprErgoPlano(b);
    case "aet-vale-generate":
      return buildAetVale(b);
    case "aet-vale-plano-generate":
      return buildAetValePlano(b);
    case "aet-vale-foto-analyze":
      return buildAetValeFoto(b);
    case "psico-generate":
      return buildPsico(b);
    default:
      throw Object.assign(new Error("Função de IA não encontrada."), { status: 404 });
  }
}
