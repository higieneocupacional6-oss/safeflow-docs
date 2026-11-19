import { getPool } from "../../db/pool.js";
import { compactarContexto, limitarTexto, type PedidoGeracao } from "../gemini.js";

const db = () => {
  const pool = getPool();
  if (!pool) throw Object.assign(new Error("Banco de dados indisponível para a geração."), { status: 503 });
  return pool;
};

/** APR-ERGO: usa relato + dados do documento no banco. */
export async function buildAprErgo(body: any): Promise<PedidoGeracao> {
  const relato = typeof body.relato === "string" ? body.relato.trim() : "";
  if (relato.length < 10) throw Object.assign(new Error("Informe um relato técnico antes de gerar."), { status: 400 });
  const registroId = body.registroId;
  if (!registroId) throw Object.assign(new Error("Registro APR-ERGO não informado."), { status: 400 });

  const doc = await db().query(
    `select id, empresa_id, contrato_id, empresa_nome, draft_snapshot
     from documentos where id = $1 and tipo = 'APR-ERGO' limit 1`,
    [registroId],
  );
  if (!doc.rows[0]) throw Object.assign(new Error("Registro APR-ERGO indisponível."), { status: 404 });
  const snap = doc.rows[0].draft_snapshot || {};
  const setorId = snap.setor_id;
  const setor = setorId
    ? await db().query(
      `select s.id, s.nome_setor, s.ghe_ges, s.descricao_ambiente,
              coalesce(json_agg(json_build_object('id', f.id, 'nome_funcao', f.nome_funcao, 'descricao_atividades', f.descricao_atividades))
                filter (where f.id is not null), '[]') as funcoes
       from setores s
       left join funcoes f on f.setor_id = s.id
       where s.id = $1 and s.empresa_id = $2 and s.contrato_id = $3
       group by s.id`,
      [setorId, doc.rows[0].empresa_id, doc.rows[0].contrato_id],
    )
    : { rows: [] };

  const schema = {
    type: "object",
    properties: {
      cabecalho: {
        type: "object",
        properties: { atividades: { type: "string" }, ambiente: { type: "string" } },
      },
      linhas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            funcao_id: { type: "string" },
            funcao_ids: { type: "array", items: { type: "string" } },
            cenario: { type: "string" },
            circunstancia: { type: "string" },
            recomendacoes: { type: "string" },
            situacao: { type: "string" },
            exigencia: { type: "string" },
            tipo: { type: "string" },
            estimativa: { type: "string" },
            intensidade: { type: "string" },
            severidade: { type: "string" },
            codigo_aep: { type: "string" },
            formulario_aep_id: { type: "string" },
            medidas: { type: "array", items: { type: "string" } },
          },
        },
      },
      observacoes: { type: "string" },
    },
    required: ["cabecalho", "linhas"],
  };

  const base = Array.isArray(body.base) ? body.base.slice(0, 6) : [];
  const content: unknown[] = base
    .filter((b: any) => b?.tipo === "pdf" && b.data)
    .map((b: any) => ({
      type: "input_file",
      filename: b.nome || "base.pdf",
      file_data: `data:application/pdf;base64,${b.data}`,
    }));

  content.push({
    type: "input_text",
    text: limitarTexto(`RELATO: ${relato}
EMPRESA: ${doc.rows[0].empresa_nome}
SETOR: ${JSON.stringify(setor.rows[0] || {})}
CRITÉRIOS: ${JSON.stringify(body.criterios ?? {})}
BASE TEXTO: ${base.filter((b: any) => b?.tipo === "texto").map((b: any) => `${b.nome}\n${b.data}`).join("\n")}`),
  });

  const setorRow = setor.rows[0] as { id?: string; funcoes?: Array<{ id: string; nome_funcao: string }> } | undefined;
  const funcoesSetor = Array.isArray(setorRow?.funcoes) ? setorRow.funcoes : [];

  return {
    systemPrompt: `Você é ergonomista elaborando APR-ERGO. Produza análise técnica formal. Use IDs exatos de funções do setor. Responda só JSON conforme schema. Não invente medições. medidas deve listar somente controles confirmados (strings da lista implícita do contexto); o sistema unifica medidas em texto.`,
    userContent: content,
    schema,
    schemaName: "apr_ergo",
    // Origem do bug APLICAR: schema Gemini entrega medidas como string[]; o formulário e aplicarPropostaApr exigem string.
    posProcessar: (output: any) => {
      const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "");
      const linhas = (Array.isArray(output?.linhas) ? output.linhas : []).map((l: Record<string, unknown>) => {
        const medidas = Array.isArray(l?.medidas)
          ? [...new Set(l.medidas.map((m) => str(m).trim()).filter(Boolean))].join("; ")
          : str(l?.medidas).trim();
        const ids = [
          ...new Set<string>(
            Array.isArray(l?.funcao_ids) && (l.funcao_ids as unknown[]).length
              ? (l.funcao_ids as unknown[]).filter((id): id is string => typeof id === "string" && id.length > 0)
              : typeof l?.funcao_id === "string" && l.funcao_id
                ? [l.funcao_id]
                : [],
          ),
        ];
        const funcoes = funcoesSetor.filter((f) => ids.includes(f.id));
        const funcao = funcoes.length === 1 ? funcoes[0] : undefined;
        return {
          cenario: str(l?.cenario),
          circunstancia: str(l?.circunstancia).trim(),
          situacao: str(l?.situacao).trim(),
          exigencia: str(l?.exigencia).trim(),
          tipo: str(l?.tipo).trim(),
          medidas,
          estimativa: str(l?.estimativa).trim(),
          intensidade: str(l?.intensidade).trim(),
          severidade: str(l?.severidade).trim(),
          perfil: "",
          classificacao: "",
          recomendacoes: str(l?.recomendacoes).trim(),
          fotos: [],
          funcao_id: funcao?.id || (typeof l?.funcao_id === "string" ? l.funcao_id : ""),
          funcao_ids: ids,
          funcao_nome: funcoes.map((f) => f.nome_funcao).join("; "),
          setor_id: setorId || "",
          codigo_aep: str(l?.codigo_aep).trim() || undefined,
        };
      }).filter((l: { circunstancia: string }) => l.circunstancia);

      return {
        linhas: linhas.map((l: Record<string, unknown>, i: number) => ({ ...l, cenario: String(i + 1) })),
        fontes_aep: Array.isArray(output?.fontes_aep)
          ? output.fontes_aep.filter((id: unknown): id is string => typeof id === "string")
          : [],
        observacoes: str(output?.observacoes),
        cabecalho: {
          atividades: str(output?.cabecalho?.atividades).trim(),
          ambiente: str(output?.cabecalho?.ambiente).trim(),
        },
      };
    },
  };
}

export async function buildAprErgoPlano(body: any): Promise<PedidoGeracao> {
  const { empresaId, contratoId } = body;
  if (!empresaId || !contratoId) throw Object.assign(new Error("Empresa e contrato são obrigatórios."), { status: 400 });
  const docs = await db().query(
    `select id, draft_snapshot from documentos
     where empresa_id = $1 and contrato_id = $2 and tipo = 'APR-ERGO' and status <> 'rascunho'
     order by updated_at desc nulls last limit 40`,
    [empresaId, contratoId],
  );
  const schema = {
    type: "object",
    properties: {
      acoes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            o_que: { type: "string" },
            por_que: { type: "string" },
            onde: { type: "string" },
            quem: { type: "string" },
            quando: { type: "string" },
            como: { type: "string" },
            quanto: { type: "string" },
            resultado_esperado: { type: "string" },
            documento_id: { type: "string" },
          },
        },
      },
    },
    required: ["acoes"],
  };
  return {
    systemPrompt: `Elabore ações 5W2H a partir das APR-ERGO salvas. Não invente responsáveis/prazos sem evidência. Responda só JSON.`,
    userContent: [{
      type: "input_text",
      text: JSON.stringify(compactarContexto({ empresaId, contratoId, documentos: docs.rows })),
    }],
    schema,
    schemaName: "apr_ergo_plano",
  };
}

export async function buildAetValePlano(body: any): Promise<PedidoGeracao> {
  const { empresaId, contratoId } = body;
  if (!empresaId || !contratoId) throw Object.assign(new Error("Empresa e contrato são obrigatórios."), { status: 400 });
  const docs = await db().query(
    `select id, draft_snapshot from documentos
     where empresa_id = $1 and contrato_id = $2 and tipo = 'AET-VALE' and status <> 'rascunho'
     order by updated_at desc nulls last limit 40`,
    [empresaId, contratoId],
  );
  const schema = {
    type: "object",
    properties: {
      acoes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            o_que: { type: "string" },
            por_que: { type: "string" },
            onde: { type: "string" },
            quem: { type: "string" },
            quando: { type: "string" },
            como: { type: "string" },
            quanto: { type: "string" },
            documento_id: { type: "string" },
            fator_id: { type: "string" },
          },
        },
      },
    },
    required: ["acoes"],
  };
  return {
    systemPrompt: `Elabore ações do plano mensal AET VALE a partir das avaliações salvas. Responda só JSON.`,
    userContent: [{ type: "input_text", text: JSON.stringify(compactarContexto({ empresaId, contratoId, documentos: docs.rows })) }],
    schema,
    schemaName: "aet_vale_plano",
  };
}

export async function buildAetValeFoto(body: any): Promise<PedidoGeracao> {
  const registroId = body.registroId;
  const imagem = typeof body.imagem === "string" ? body.imagem : "";
  if (!registroId || !imagem.startsWith("data:image/")) {
    throw Object.assign(new Error("Envie uma foto JPEG, PNG ou WebP válida desta avaliação."), { status: 400 });
  }
  const doc = await db().query(
    `select id, empresa_id, contrato_id, draft_snapshot from documentos where id = $1 and tipo = 'AET-VALE' limit 1`,
    [registroId],
  );
  if (!doc.rows[0]) throw Object.assign(new Error("Avaliação indisponível."), { status: 404 });
  const snap = doc.rows[0].draft_snapshot || {};
  const [setor, funcao] = await Promise.all([
    db().query(`select id, nome_setor from setores where id = $1 and empresa_id = $2 and contrato_id = $3 limit 1`,
      [snap.setor_id, doc.rows[0].empresa_id, doc.rows[0].contrato_id]),
    db().query(`select id, nome_funcao, descricao_atividades from funcoes where id = $1 and setor_id = $2 limit 1`,
      [snap.funcao_id, snap.setor_id]),
  ]);
  if (!setor.rows[0] || !funcao.rows[0]) {
    throw Object.assign(new Error("Vínculo de setor e função indisponível."), { status: 400 });
  }
  const properties = {
    problema: { type: "string" },
    melhoria: { type: "string" },
    evidencia: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
    caixaX: { type: "number" },
    caixaY: { type: "number" },
  };
  const schema = {
    type: "object",
    properties: {
      observacao: { type: "string" },
      marcacoes: {
        type: "array",
        items: { type: "object", properties, required: Object.keys(properties) },
      },
    },
    required: ["observacao", "marcacoes"],
  };
  return {
    systemPrompt: `Atue como engenheiro ergonomista. Analise SOMENTE a foto. Não invente medidas. Coordenadas 0..1. Responda só JSON.`,
    userContent: [
      {
        type: "input_text",
        text: JSON.stringify({
          setor: setor.rows[0].nome_setor,
          funcao: funcao.rows[0].nome_funcao,
          atividade: funcao.rows[0].descricao_atividades,
          descricaoFoto: body.descricao || "",
        }),
      },
      { type: "input_image", image_url: imagem },
    ],
    schema,
    schemaName: "foto_aet_vale",
    posProcessar: (output) => ({ ...output, registroId, funcaoId: funcao.rows[0].id }),
  };
}

export function buildPsico(body: any): PedidoGeracao {
  const schema = {
    type: "object",
    properties: {
      metodologia: { type: "string" },
      conclusao: { type: "string" },
      intro_plano_acao: { type: "string" },
      lacunas: { type: "array", items: { type: "string" } },
      grupos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            grupo_id: { type: "string" },
            atividades: { type: "string" },
            organizacao: { type: "string" },
            fatores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fator_key: { type: "string" },
                  descricao: { type: "string" },
                  fonte: { type: "string" },
                  situacao: { type: "string" },
                  interpretacao: { type: "string" },
                  consequencias: { type: "string" },
                  controles: { type: "string" },
                  frequencia: { type: "string", enum: ["Eventual", "Intermitente", "Habitual"] },
                },
                required: ["fator_key", "descricao", "fonte", "situacao", "interpretacao", "consequencias", "controles", "frequencia"],
              },
            },
          },
          required: ["grupo_id", "atividades", "organizacao", "fatores"],
        },
      },
      medidas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medida_key: { type: "string" },
            medida: { type: "string" },
            tipo: { type: "string" },
            responsavel: { type: "string" },
            prazo: { type: "string" },
            prioridade: { type: "string" },
          },
          required: ["medida_key", "medida"],
        },
      },
    },
    required: ["metodologia", "conclusao", "intro_plano_acao", "grupos", "medidas"],
  };

  const base = Array.isArray(body.baseTecnica) ? body.baseTecnica.slice(0, 6) : [];
  const content: unknown[] = base
    .filter((b: any) => b?.data)
    .map((b: any) => ({
      type: "input_file",
      filename: b.name || "base.pdf",
      file_data: `data:application/pdf;base64,${b.data}`,
    }));
  content.push({
    type: "input_text",
    text: limitarTexto(JSON.stringify(compactarContexto(body.contexto ?? {}), null, 2)),
  });

  return {
    systemPrompt: `Você é especialista em fatores psicossociais (NR-01/NR-17). Não invente dados. Preserve chaves recebidas. Responda só JSON.`,
    userContent: content,
    schema,
    schemaName: "psico_output",
  };
}
