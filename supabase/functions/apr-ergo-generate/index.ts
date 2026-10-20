import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { gerarJsonEmFluxo, limitarTexto } from "../_shared/aiStream.ts";
import { CAMPOS_APR, SITUACOES_APR, TIPOS_APR, formulariosCompativeisApr, classificacoesSalvasApr } from "../_shared/aprErgoIa.ts";

const Body = z.object({ registroId: z.string().uuid(), relato: z.string().trim().min(10).max(30000),
  criterios: z.object({ duracao: z.array(z.string().max(500)).length(5), intensidade: z.array(z.string().max(500)).length(5), fatores: z.array(z.tuple([z.string().max(100), z.array(z.string().max(1000))])).max(10) }),
  base: z.array(z.object({ nome: z.string().max(255), tipo: z.enum(["pdf", "texto"]), data: z.string().max(14000000) })).max(6),
});
const textos = ["cenario", "circunstancia", "exigencia", "medidas", "recomendacoes", "codigo_aep", "formulario_aep_id"];
const schema = { type: "object", properties: {
  linhas: { type: "array", items: { type: "object", properties: {
    ...Object.fromEntries(textos.map((k) => [k, { type: "string" }])),
    situacoes: { type: "array", items: { type: "string", enum: SITUACOES_APR } },
    tipo: { type: "string", enum: TIPOS_APR },
  } } }, observacoes: { type: "string" },
} };
const prompt = `Você é ergonomista elaborando APR-ERGO. Produza análise técnica formal da atividade real: relação entre atividade, exigência ergonômica, condição e repercussão; recomendações específicas na fonte, processo, organização, mobiliário, equipamentos e método. Não invente atividades, controles existentes, exposições, medições ou condições. Referências são contexto técnico, não prova de fatos. Use somente situações e tipos permitidos. Até 5 linhas distintas e objetivas; textos curtos, sem mencionar cadastro, IA ou fontes dentro das células.
Os formulários AEP são somente os compatíveis com esta empresa, contrato, setor e funções. Para cada linha indique codigo_aep e formulario_aep_id SOMENTE se o fator marcado corresponde à mesma atividade/função relatada e o ID de atividade da AEP sustenta essa correspondência. Caso contrário ambos vazios. Não calcule nem estime duração, intensidade, perfil, severidade ou risco: o sistema recupera exclusivamente valores realmente salvos. Não interprete A1-A5 (IDs de atividade) como severidade. Não use a matriz 3x3 de outro módulo. Respeite os critérios AEP existentes; a Base complementa a interpretação sem criar escala alternativa. observacoes deve explicar lacunas reais das classificações para revisão fora da tabela.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), key = Deno.env.get("LOVABLE_API_KEY");
    if (!url || !anon || !key) return json("Serviço de IA não configurado.", 500);
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: authError } = await sb.auth.getClaims(auth.replace("Bearer ", ""));
    if (authError || !claims?.claims?.sub) return json("Sessão expirada. Entre novamente.", 401);
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json("Verifique o relato e os arquivos enviados (até 6).", 400);
    const body = parsed.data;
    if (body.base.reduce((n, b) => n + b.data.length, 0) > 24000000) return json("Os arquivos excedem o tamanho permitido para análise. Reduza os arquivos.", 400);
    const { data: doc, error: docError } = await sb.from("documentos").select("empresa_id, contrato_id, empresa_nome, draft_snapshot").eq("id", body.registroId).eq("tipo", "APR-ERGO").single();
    if (docError || !doc?.empresa_id || !doc?.contrato_id) return json("Registro APR-ERGO indisponível.", 404);
    const setorId = doc.draft_snapshot?.setor_id;
    if (typeof setorId !== "string") return json("O registro não possui setor vinculado.", 400);
    const { data: setor, error: setorError } = await sb.from("setores").select("id, nome_setor, ghe_ges, descricao_ambiente, funcoes(id, nome_funcao, descricao_atividades)").eq("id", setorId).eq("empresa_id", doc.empresa_id).eq("contrato_id", doc.contrato_id).single();
    if (setorError || !setor) return json("O setor não corresponde à empresa e ao contrato.", 400);
    const formularios = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await sb.from("formularios_aep").select("id, setor_ids, dados, updated_at").eq("empresa_id", doc.empresa_id).eq("contrato_id", doc.contrato_id).contains("setor_ids", [setorId]).order("updated_at", { ascending: false }).range(offset, offset + 99);
      if (error) return json("Não foi possível consultar a AEP. Tente novamente.", 500);
      formularios.push(...(data || []));
      if (!data || data.length < 100) break;
    }
    const compativeis = formulariosCompativeisApr(formularios, setorId, setor.funcoes.map((f: { id: string }) => f.id)).slice(0, 5);
    const content: unknown[] = body.base.filter((b) => b.tipo === "pdf").map((b) => ({ type: "input_file", filename: b.nome, file_data: `data:application/pdf;base64,${b.data}` }));
    content.push({ type: "input_text", text: `RELATO: ${body.relato}\nEMPRESA: ${doc.empresa_nome}\nSETOR: ${JSON.stringify(setor)}\nAEP COMPATÍVEL: ${JSON.stringify(compativeis)}\nCRITÉRIOS: ${JSON.stringify(body.criterios)}\nBASE: ${body.base.filter((b) => b.tipo === "texto").map((b) => `${b.nome}\n${limitarTexto(b.data, 40000)}`).join("\n")}` });
    return await gerarJsonEmFluxo({ req, corsHeaders, key, systemPrompt: prompt, userContent: content, schemaName: "apr_ergo", schema,
      posProcessar: (output) => {
        const fontes = new Set<string>();
        const linhas = (output.linhas || []).slice(0, 5).map((l: Record<string, any>) => {
          const f = compativeis.find((f) => f.id === l.formulario_aep_id);
          const marcas = f?.dados?.reconhecimento?.marcas?.[l.codigo_aep];
          if (marcas) fontes.add(f.id);
          return { ...Object.fromEntries(CAMPOS_APR.map((k) => [k, typeof l[k] === "string" ? l[k] : ""])),
            situacao: (l.situacoes || []).filter((s: string) => SITUACOES_APR.includes(s as typeof SITUACOES_APR[number])).join("; "),
            ...classificacoesSalvasApr(marcas || {}, body.criterios.duracao, body.criterios.intensidade), fotos: [] };
        });
        return { linhas, fontes_aep: [...fontes], observacoes: output.observacoes || "" };
      },
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return new Response(null, { status: 499, headers: corsHeaders });
    return json("Não foi possível gerar a análise. Seus dados foram mantidos.", 500);
  }
});