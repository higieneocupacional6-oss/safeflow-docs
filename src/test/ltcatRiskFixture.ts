import { sanitizeRisco, riscoExiste } from "@/lib/riscoContext";
export const sanitizeRiscosForTest = (risks: Record<string, any>[]) => risks.filter(riscoExiste).map(sanitizeRisco);