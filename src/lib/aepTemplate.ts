/**
 * Motor de template EXCLUSIVO da AEP.
 *
 * Problema corrigido: o parser padrão do Docxtemplater NÃO resolve caminhos com
 * ponto (`{{aep.crea}}`, `{{#aep.setores}}`, `{{checklist.mobiliario.condicao}}`).
 * Como toda a estrutura nova da AEP é aninhada, todas as tags retornavam
 * undefined e o documento saía em branco.
 *
 * Aqui criamos um parser que resolve caminhos aninhados e um validador que faz
 * o vínculo real entre o JSON da AEP e as variáveis existentes no template.
 */

export type AepBindingIssue = {
  tipo: "erro" | "aviso";
  titulo: string;
  onde: string;
  correcao: string;
};

export type AepBindingResult = {
  issues: AepBindingIssue[];
  totalTags: number;
  vinculadas: number;
  loops: { nome: string; itens: number }[];
};

/** Resolve `a.b.c` no escopo atual, com fallback para o escopo raiz. */
export function resolveAepPath(scope: any, tag: string, root?: any): any {
  if (tag === ".") return scope;
  const walk = (base: any) =>
    tag.split(".").reduce((acc: any, k: string) => (acc == null ? undefined : acc[k]), base);
  const v = walk(scope);
  if (v !== undefined) return v;
  return root ? walk(root) : undefined;
}

/** Parser do Docxtemplater com suporte a caminhos aninhados (somente AEP). */
export function createAepParser(root: any) {
  return (tag: string) => ({
    get(scope: any) {
      if (tag === ".") return scope;
      const v = resolveAepPath(scope, tag, root);
      return v === undefined ? "" : v;
    },
  });
}

/** Extrai o texto de document.xml (+ headers/footers) de um docx. */
export function extractDocxText(zip: any): string {
  const files: string[] = Object.keys(zip.files || {}).filter((f) =>
    /^word\/(document|header\d*|footer\d*)\.xml$/.test(f),
  );
  let out = "";
  for (const f of files) {
    try {
      out += zip.file(f)?.asText?.() || "";
    } catch {
      /* ignore */
    }
  }
  // remove tags XML para juntar runs quebrados ({{ae}}{{p.crea}})
  return out.replace(/<[^>]+>/g, "");
}

const TAG_RE = /\{\{\s*([#/^]?)\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export type ParsedTag = { kind: "" | "#" | "/" | "^"; name: string };

export function parseTags(text: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text))) {
    tags.push({ kind: (m[1] as any) || "", name: m[2] });
  }
  return tags;
}

/** Variáveis antigas da AEP que não existem mais na nova estrutura. */
const VARIAVEIS_ANTIGAS = [
  "responsavel_tecnico",
  "crea",
  "cargo",
  "data_elaboracao",
  "setor_nome",
  "riscos",
  "colaboradores_avaliados",
  "checklist_organizacao",
  "acoes",
];

/**
 * Faz o vínculo real entre o JSON da AEP e as tags do template,
 * resolvendo escopos de loop (setores, colaboradores, riscos, plano de ação).
 */
export function validateAepBinding(templateText: string, data: any): AepBindingResult {
  const issues: AepBindingIssue[] = [];
  const loops: { nome: string; itens: number }[] = [];
  const tags = parseTags(templateText);

  if (tags.length === 0) {
    issues.push({
      tipo: "erro",
      titulo: "Nenhuma variável encontrada no template",
      onde: "Arquivo do template selecionado",
      correcao:
        "O template não possui tags {{ }}. Verifique se enviou o arquivo correto e se as variáveis não foram coladas como imagem ou campo do Word.",
    });
    return { issues, totalTags: 0, vinculadas: 0, loops };
  }

  let vinculadas = 0;
  const stack: { name: string; scopes: any[] }[] = [];
  const scopeChain = (): any[] => {
    const chain: any[] = [data];
    for (const s of stack) if (s.scopes.length) chain.push(s.scopes[0]);
    return chain.reverse();
  };
  const resolveInChain = (name: string): any => {
    for (const sc of scopeChain()) {
      const v = resolveAepPath(sc, name, data);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  for (const t of tags) {
    if (t.kind === "#" || t.kind === "^") {
      const value = resolveInChain(t.name);
      if (t.kind === "#") {
        if (value === undefined) {
          issues.push({
            tipo: "erro",
            titulo: `Loop {{#${t.name}}} não possui correspondência no JSON da AEP`,
            onde: `Bloco {{#${t.name}}} … {{/${t.name}}}`,
            correcao:
              "Use os loops válidos da AEP: {{#aep.setores}}, {{#colaboradores}}, {{#riscos_ergonomicos}} e {{#plano_acao}}.",
          });
        } else if (Array.isArray(value)) {
          loops.push({ nome: t.name, itens: value.length });
          if (value.length === 0) {
            issues.push({
              tipo: "aviso",
              titulo: `Loop {{#${t.name}}} está vazio`,
              onde: `Bloco {{#${t.name}}}`,
              correcao: "Nenhum registro cadastrado na AEP para esse bloco; ele não será impresso.",
            });
          }
        }
      }
      stack.push({
        name: t.name,
        scopes: Array.isArray(value) ? (value.length ? [value[0]] : []) : value && typeof value === "object" ? [value] : [],
      });
      continue;
    }

    if (t.kind === "/") {
      const open = stack.pop();
      if (!open) {
        issues.push({
          tipo: "erro",
          titulo: `Fechamento {{/${t.name}}} sem abertura`,
          onde: `Tag {{/${t.name}}}`,
          correcao: `Adicione {{#${t.name}}} antes do conteúdo do bloco.`,
        });
      } else if (open.name !== t.name) {
        issues.push({
          tipo: "erro",
          titulo: `Estrutura de loop incorreta: {{#${open.name}}} fechado por {{/${t.name}}}`,
          onde: `Bloco {{#${open.name}}}`,
          correcao: `Feche o bloco com {{/${open.name}}} na mesma ordem em que foi aberto.`,
        });
      }
      continue;
    }

    const value = resolveInChain(t.name);
    if (value === undefined) {
      const antiga = VARIAVEIS_ANTIGAS.includes(t.name);
      issues.push({
        tipo: "erro",
        titulo: antiga
          ? `Variável antiga da AEP: {{${t.name}}}`
          : `Variável {{${t.name}}} não possui correspondência no JSON da AEP`,
        onde: stack.length ? `Dentro do bloco {{#${stack[stack.length - 1].name}}}` : "Corpo do documento",
        correcao: antiga
          ? `Substitua por {{aep.${t.name}}} (dados gerais) ou pela variável equivalente da nova estrutura — veja o botão Variáveis.`
          : "Confira a grafia no botão Variáveis da AEP. Variáveis de setor só funcionam dentro de {{#aep.setores}}.",
      });
    } else {
      vinculadas++;
      if (value === "" ) {
        issues.push({
          tipo: "aviso",
          titulo: `Campo vazio para {{${t.name}}}`,
          onde: stack.length ? `Dentro de {{#${stack[stack.length - 1].name}}}` : "Corpo do documento",
          correcao: "Preencha esse campo na AEP para que apareça no documento.",
        });
      }
    }
  }

  for (const rest of stack) {
    issues.push({
      tipo: "erro",
      titulo: `Loop {{#${rest.name}}} não foi fechado`,
      onde: `Bloco {{#${rest.name}}}`,
      correcao: `Adicione {{/${rest.name}}} ao final do bloco.`,
    });
  }

  if (Array.isArray(data?.aep?.setores) && data.aep.setores.length > 0 && !tags.some((t) => t.kind === "#" && (t.name === "aep.setores" || t.name === "setores"))) {
    issues.push({
      tipo: "erro",
      titulo: "Loop de setores ausente no template",
      onde: "Estrutura geral do documento",
      correcao:
        "Envolva todo o conteúdo do setor com {{#aep.setores}} … {{/aep.setores}}; sem isso apenas um bloco (ou nenhum) será gerado.",
    });
  }

  return { issues, totalTags: tags.length, vinculadas, loops };
}
