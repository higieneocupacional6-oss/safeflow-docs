/**
 * Compatibilidade: telas ainda importam `supabase` deste caminho.
 * As chamadas vão para a API Express (PostgreSQL segcrm), não para o Supabase Cloud.
 */
import { db } from "@/lib/db/client";

export const supabase = db as any;
