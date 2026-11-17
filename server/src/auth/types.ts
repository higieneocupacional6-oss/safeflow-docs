export type AppRole = "admin" | "usuario";

export type AuthUser = {
  id: string;
  email: string;
  nome: string;
  ativo: boolean;
  role: AppRole;
  mustChangePassword: boolean;
  sessionId: string;
};
