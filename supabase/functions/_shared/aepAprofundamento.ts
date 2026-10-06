// Extração somente leitura: não transforma achados preliminares em medições.
export function extrairFocoAep(setor: Record<string, any>) {
  const texto = (v: unknown) => typeof v === "string" ? v.trim() : "";
  const normalizar = (v: unknown) => texto(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const conduta2 = normalizar(setor.conduta_2);
  const parecer = texto(setor.parecer_conduta_2);
  // NÃO significa que não foi encontrada solução rápida, não ausência de risco.
  const indicacao = conduta2 === "NAO" ? "recomendada"
    : conduta2 === "SIM" ? "solucao_preliminar_indicada" : "nao_informada";
  const riscos = Array.isArray(setor.riscos_lista) ? setor.riscos_lista : [];
  const checklist = setor.checklist && typeof setor.checklist === "object" ? setor.checklist : {};
  return {
    indicacao_aet: indicacao,
    motivo_registrado: parecer,
    condicao_inadequada: texto(setor.conduta_1),
    parecer_condicao: texto(setor.parecer_conduta_1),
    problemas_preliminares: texto(setor.parecer_ergonomia),
    ambiente_preliminar: texto(setor.parecer_ambiente),
    fatores_identificados: riscos,
    checklist,
    medidas_preliminares: Array.isArray(setor.plano_acao) ? setor.plano_acao : [],
    limite_evidencia: "Achados e medidas preliminares; eficácia, tempos, medições e solução definitiva somente quando comprovados pelos dados atuais.",
  };
}