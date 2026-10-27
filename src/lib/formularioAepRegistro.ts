import { gerarPdfFormularioAep, type FormularioAepPdfDados } from "@/lib/formularioAepPdf";
import { reconhecimentoVazio, type ReconhecimentoState } from "@/components/formulario-aep/EtapaReconhecimento";

export type FormularioAepSalvo = {
  id: string;
  empresa_id: string;
  contrato_id: string;
  funcao_id: string | null;
  setor_ids: string[] | null;
  dados?: unknown;
  created_at: string;
  updated_at: string;
};

export type GrupoSetorAep = {
  setorId: string;
  nome: string;
  funcoes: { funcaoId: string; nome: string; formulario: FormularioAepSalvo }[];
};

const LINHAS = [1, 2, 3, 4, 5];

export const identFormularioVazio = () => ({
  gerencia_executiva: "", gerencia: "", local_fisico: "", nome_gere: "", codigo_gere: "",
  horario_avaliacao: "", jornada: "", expostos: "", descricao: "",
});

export const linhasFormularioVazias = () => LINHAS.map(() => ({ texto: "", marcas: {} as Record<string, string> }));

export function rotuloSetor(setor: { nome_setor?: string | null; ghe_ges?: string | null }) {
  const nome = setor.nome_setor || "Setor";
  return setor.ghe_ges ? `${setor.ghe_ges} — ${nome}` : nome;
}

/** Um formulário por função. Se houver mais de uma linha para a mesma função, fica a mais recente. */
export function agruparFormulariosPorSetor(
  forms: FormularioAepSalvo[],
  setores: { id: string; nome_setor: string; ghe_ges?: string | null }[],
  funcoes: { id: string; nome_funcao: string; setor_id: string }[],
) {
  const setorPorId = new Map(setores.map((s) => [s.id, s]));
  const funcaoPorId = new Map(funcoes.map((f) => [f.id, f]));
  const legado = forms.filter((f) => !f.funcao_id);
  const porFuncao = new Map<string, FormularioAepSalvo>();
  for (const form of forms) {
    if (!form.funcao_id) continue;
    const atual = porFuncao.get(form.funcao_id);
    if (!atual || atual.updated_at < form.updated_at) porFuncao.set(form.funcao_id, form);
  }
  const gruposMap = new Map<string, GrupoSetorAep>();
  for (const [funcaoId, formulario] of porFuncao) {
    const funcao = funcaoPorId.get(funcaoId);
    const setorId = funcao?.setor_id || formulario.setor_ids?.[0] || "";
    if (!setorId) continue;
    const setor = setorPorId.get(setorId);
    if (!gruposMap.has(setorId)) {
      gruposMap.set(setorId, { setorId, nome: setor ? rotuloSetor(setor) : "Setor", funcoes: [] });
    }
    gruposMap.get(setorId)!.funcoes.push({
      funcaoId,
      nome: funcao?.nome_funcao || "Função",
      formulario,
    });
  }
  const grupos = [...gruposMap.values()]
    .map((g) => ({ ...g, funcoes: [...g.funcoes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { grupos, legado };
}

export function estadoDeDadosSalvos(dados: any, funcaoId?: string) {
  const ident = { ...identFormularioVazio(), ...(dados?.ident || {}) };
  const funcoes = funcaoId ? [funcaoId] : (Array.isArray(dados?.funcoes) ? dados.funcoes.filter(Boolean) : []);
  const atividades = normalizarLinhas(dados?.atividades);
  const controles = normalizarLinhas(dados?.controles);
  const base = reconhecimentoVazio();
  const reconhecimento: ReconhecimentoState = {
    ...base,
    ...(dados?.reconhecimento || {}),
    marcas: dados?.reconhecimento?.marcas || {},
    participantes: { ...base.participantes, ...(dados?.reconhecimento?.participantes || {}) },
  };
  return { ident, funcoes, atividades, controles, reconhecimento };
}

function normalizarLinhas(linhas: any) {
  const base = linhasFormularioVazias();
  if (!Array.isArray(linhas) || linhas.length === 0) return base;
  return base.map((vazio, i) => {
    const linha = linhas[i];
    if (!linha) return vazio;
    return { texto: String(linha.texto || ""), marcas: { ...(linha.marcas || {}) } };
  });
}

export function montarPdfDados(args: {
  empresaNome: string;
  contratoNome: string;
  funcaoNome: string;
  dados: any;
}): FormularioAepPdfDados {
  const estado = estadoDeDadosSalvos(args.dados, undefined);
  const nomes = args.funcaoNome
    ? [args.funcaoNome]
    : estado.funcoes;
  return {
    empresaNome: args.empresaNome,
    contratoNome: args.contratoNome,
    ident: estado.ident,
    funcoesNomes: nomes,
    atividades: estado.atividades,
    controles: estado.controles,
    reconhecimento: estado.reconhecimento,
  };
}

export function baixarPdfFormularioAep(dados: FormularioAepPdfDados, nomeArquivo: string) {
  const blob = gerarPdfFormularioAep(dados);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return blob;
}

export function urlPreencherFormularioAep(args: {
  empresaId: string;
  contratoId: string;
  setorId: string;
  funcaoId: string;
  formularioId?: string;
  origem: "novo" | "lista";
  funcoes?: string[];
}) {
  const q = new URLSearchParams({
    empresa: args.empresaId,
    contrato: args.contratoId,
    setor: args.setorId,
    funcao: args.funcaoId,
    origem: args.origem,
  });
  if (args.formularioId) q.set("id", args.formularioId);
  if (args.funcoes?.length) q.set("funcoes", args.funcoes.join(","));
  return `/formulario-aep/preencher?${q.toString()}`;
}

export function urlNovoFormularioAep(empresaId: string, contratoId: string, funcoes: string[]) {
  const q = new URLSearchParams();
  if (empresaId) q.set("empresa", empresaId);
  if (contratoId) q.set("contrato", contratoId);
  if (funcoes.length) q.set("funcoes", funcoes.join(","));
  const s = q.toString();
  return s ? `/formulario-aep/novo?${s}` : "/formulario-aep/novo";
}
