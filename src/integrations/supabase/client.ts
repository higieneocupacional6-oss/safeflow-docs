import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

/** Strip accidental /rest/v1 suffix from dashboard copy-paste. */
function normalizeSupabaseUrl(raw: string | undefined): string {
  const value = (raw || "").trim().replace(/\/+$/, "");
  return value.replace(/\/rest\/v1$/i, "");
}

const SUPABASE_URL = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
// Netlify/local often use the classic anon name; accept both to avoid blank boot.
const SUPABASE_PUBLISHABLE_KEY = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
).trim();

export const supabaseConfigError: string | null =
  !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY
    ? "Variáveis de ambiente do Supabase ausentes neste build. No Netlify, defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY) em Site settings → Environment variables e faça um novo deploy."
    : null;

/**
 * Client only exists when URL+key were present at build time (Vite inlines import.meta.env).
 * Calling createClient(undefined, …) throws "supabaseUrl is required" and blanks the SPA.
 */
export const supabase: SupabaseClient<Database> = supabaseConfigError
  ? (null as unknown as SupabaseClient<Database>)
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: brokeredPreviewStorage(),
        persistSession: true,
        autoRefreshToken: true,
      },
    });
