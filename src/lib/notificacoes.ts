import { supabase } from "@/integrations/supabase/client";

export type StatusDoc = "no_prazo" | "proximo" | "vencido";

export function calcStatus(dataValidade: string | null): StatusDoc | null {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataValidade);
  v.setHours(0, 0, 0, 0);
  const diff = Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "vencido";
  if (diff <= 30) return "proximo";
  return "no_prazo";
}

export function diasParaVencimento(dataValidade: string | null): number | null {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataValidade);
  v.setHours(0, 0, 0, 0);
  return Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Gera notificações (30 dias, 15 dias, vencimento) para documentos com data_validade.
 * Idempotente — depende da unique constraint (documento_id, tipo).
 */
export async function gerarNotificacoes() {
  const { data: docs } = await supabase
    .from("documentos")
    .select("id, tipo, empresa_id, empresa_nome, contrato_id, data_validade, nome_documento")
    .not("data_validade", "is", null);

  if (!docs?.length) return;

  const { data: contratos } = await supabase.from("contratos").select("id, numero_contrato");
  const contratoMap = new Map((contratos || []).map((c: any) => [c.id, c.numero_contrato]));

  const rows: any[] = [];
  for (const d of docs as any[]) {
    const dias = diasParaVencimento(d.data_validade);
    if (dias === null) continue;
    const base = {
      documento_id: d.id,
      empresa_id: d.empresa_id,
      contrato_id: d.contrato_id,
      empresa_nome: d.empresa_nome,
      contrato_numero: contratoMap.get(d.contrato_id) || null,
      documento_tipo: d.tipo,
      documento_nome: d.nome_documento || d.tipo,
      data_vencimento: d.data_validade,
    };
    if (dias <= 30 && dias > 15) rows.push({ ...base, tipo: "30_dias" });
    if (dias <= 15 && dias > 0) rows.push({ ...base, tipo: "15_dias" });
    if (dias <= 0) rows.push({ ...base, tipo: "vencimento" });
  }

  if (!rows.length) return;
  await supabase.from("notificacoes").upsert(rows, { onConflict: "documento_id,tipo", ignoreDuplicates: true });
}
