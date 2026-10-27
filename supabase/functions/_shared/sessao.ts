/** Extrai JWT de usuário. Recusa chave publishable/anon e token malformado
 * (GoTrue responde HTTP 400 bad_jwt nesses casos). Nunca desliga a autenticação. */
export function tokenJwtUsuario(authorization: string | null | undefined): string | null {
  const raw = String(authorization || "").trim();
  const token = /^bearer\s+/i.test(raw) ? raw.replace(/^bearer\s+/i, "").trim() : raw;
  if (!token || token.split(".").length !== 3) return null;
  if (/^sb_(publishable|secret)_/i.test(token)) return null;
  return token;
}

export async function exigirSessao(
  sb: { auth: { getClaims: (jwt: string) => Promise<{ data?: { claims?: { sub?: string } } | null; error?: unknown }> } },
  authorization: string | null | undefined,
): Promise<string | null> {
  const token = tokenJwtUsuario(authorization);
  if (!token) return null;
  try {
    const { data, error } = await sb.auth.getClaims(token);
    const sub = data?.claims?.sub;
    if (error || !sub) return null;
    return String(sub);
  } catch {
    return null;
  }
}
