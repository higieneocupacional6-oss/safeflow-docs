/**
 * Escopo automático dos loops `{{#setores}}` / `{{#riscos}}` por tipo de agente.
 *
 * PROBLEMA (templates LTCAT / Insalubridade reais):
 * o template repete o bloco `{{#setores}} … {{/setores}}` uma vez para cada
 * agente (Ruído, Calor, VCI, VMB, Químico Quantitativo/Qualitativo,
 * Biológico…), e o cabeçalho do setor (GHE, descrição do ambiente, funções)
 * fica FORA do `{{#is_ruido}}`:
 *
 *   {{#setores}}
 *     GHE: {{ghe_ges}} — {{descricao_ambiente}}      ← sempre renderiza
 *     {{#riscos}}{{#is_ruido}} … tabela … {{/is_ruido}}{{/riscos}}
 *   {{/setores}}
 *
 * Resultado: cada setor gera 9 cabeçalhos (um por seção do template) e
 * várias tabelas vazias — o documento sai completamente desconfigurado.
 *
 * SOLUÇÃO: um `parser` do Docxtemplater que inspeciona o CONTEÚDO de cada
 * loop (as sub-tags compiladas) e descobre quais flags `is_*` são usadas
 * dentro dele. O loop então recebe apenas os setores/riscos que possuem
 * aquele agente. Loops sem nenhuma flag continuam recebendo tudo.
 *
 * Nada muda no template do usuário: a correção é 100% no motor.
 */

/** Coleta recursivamente as flags `is_*` usadas dentro de um loop compilado. */
export function collectFlagsFromPart(part: any): string[] {
  const flags = new Set<string>();
  const walk = (parts: any[]) => {
    (parts || []).forEach((p: any) => {
      if (typeof p?.value === "string" && /^is_[a-z0-9_]+$/i.test(p.value)) {
        flags.add(p.value);
      }
      if (Array.isArray(p?.subparsed)) walk(p.subparsed);
    });
  };
  walk(part?.subparsed);
  return Array.from(flags);
}

const truthy = (v: any) => v !== undefined && v !== null && v !== false && v !== "";

/** Um risco atende ao bloco quando possui pelo menos uma das flags. */
export const riscoMatchFlags = (risco: any, flags: string[]): boolean =>
  flags.length === 0 || flags.some((f) => truthy(risco?.[f]));

/** Setor atende quando tem ao menos um risco compatível com as flags. */
export const setorMatchFlags = (setor: any, flags: string[]): boolean =>
  flags.length === 0 ||
  (Array.isArray(setor?.riscos) && setor.riscos.some((r: any) => riscoMatchFlags(r, flags))) ||
  riscoMatchFlags(setor, flags);

/**
 * Filtra a lista de setores para um bloco específico do template:
 * mantém só os setores com riscos daquele agente e, dentro deles,
 * só os riscos correspondentes.
 */
export function scopeSetores(setores: any[], flags: string[]): any[] {
  if (!Array.isArray(setores) || flags.length === 0) return setores;
  return setores
    .map((s: any) => {
      if (!Array.isArray(s?.riscos)) return setorMatchFlags(s, flags) ? s : null;
      const riscos = s.riscos.filter((r: any) => riscoMatchFlags(r, flags));
      return riscos.length ? { ...s, riscos } : null;
    })
    .filter(Boolean);
}

/** Resolve `a.b.c` dentro de um escopo. */
function resolvePath(scope: any, tag: string): any {
  if (tag === ".") return scope;
  if (!tag.includes(".")) return scope?.[tag];
  return tag.split(".").reduce((acc: any, k: string) => (acc == null ? acc : acc[k]), scope);
}

/**
 * Parser para o Docxtemplater que aplica o escopo por agente aos loops
 * `setores`, `riscos`, `riscos_agrupados` e `avaliacoes`.
 */
export function createAgentScopedParser() {
  return (tag: string) => ({
    get(scope: any, context: any) {
      const value = resolvePath(scope, tag);
      if (!Array.isArray(value)) return value;
      if (tag !== "setores" && tag !== "riscos" && tag !== "riscos_agrupados") return value;

      const part = context?.meta?.part;
      const flags = collectFlagsFromPart(part);
      if (flags.length === 0) return value;

      if (tag === "setores") return scopeSetores(value, flags);
      return value.filter((r: any) => riscoMatchFlags(r, flags));
    },
  });
}
