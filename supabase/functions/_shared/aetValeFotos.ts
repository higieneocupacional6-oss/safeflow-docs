export type MarcacaoVale = { problema: string; melhoria: string; evidencia: string; x: number; y: number; caixaX: number; caixaY: number };
export type AnaliseFotoVale = { marcacoes: MarcacaoVale[]; observacao: string };
export type AnotacaoFotoVale = AnaliseFotoVale & { imagem: string; fonteHash: string; registroId: string; funcaoId: string };
export type FotoVale = { imagem: string; descricao: string; anotacao?: AnotacaoFotoVale };
export function validarAnaliseFoto(v: AnaliseFotoVale): AnaliseFotoVale {
  return { observacao: String(v.observacao || "").slice(0, 500), marcacoes: (Array.isArray(v.marcacoes) ? v.marcacoes : []).filter(m =>
    m.problema?.trim() && m.melhoria?.trim() && m.evidencia?.trim() &&
    [m.x, m.y, m.caixaX, m.caixaY].every(n => Number.isFinite(n) && n >= 0 && n <= 1)
  ).map(m => ({ ...m, problema: m.problema.slice(0, 100), melhoria: m.melhoria.slice(0, 120), evidencia: m.evidencia.slice(0, 240) })) };
}
export function substituirFotoVale(foto: FotoVale, imagem: string): FotoVale { return { imagem, descricao: foto.descricao }; }
export function aplicarAnotacaoFoto(foto: FotoVale, fonte: string, anotacao: AnotacaoFotoVale): FotoVale {
  return foto.imagem === fonte ? { ...foto, anotacao } : foto;
}