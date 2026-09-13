import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") || "";
    if (!url || !anon || !service || !authHeader.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

    const { data: isAdmin, error: roleError } = await caller.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) return json({ error: "Apenas administradores podem gerenciar usuários" }, 403);

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const nome = String(body.nome || "").trim();
      const role = body.role === "admin" ? "admin" : "usuario";
      if (!email || !nome || password.length < 8) return json({ error: "Nome, email e senha de 8 caracteres são obrigatórios" }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, must_change_password: true },
      });
      if (error || !data.user) return json({ error: error?.message || "Falha ao criar usuário" }, 400);

      if (role === "admin") {
        await admin.from("user_roles").delete().eq("user_id", data.user.id);
        const { error: roleInsertError } = await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        if (roleInsertError) return json({ error: roleInsertError.message }, 400);
      }
      return json({ ok: true, user_id: data.user.id });
    }

    const userId = String(body.user_id || "");
    if (!userId) return json({ error: "Usuário não informado" }, 400);

    if (action === "update") {
      const nome = String(body.nome || "").trim();
      const ativo = body.ativo !== false;
      const role = body.role === "admin" ? "admin" : "usuario";
      const { error: profileError } = await admin.from("profiles").update({ nome, ativo }).eq("user_id", userId);
      if (profileError) return json({ error: profileError.message }, 400);
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError2 } = await admin.from("user_roles").insert({ user_id: userId, role });
      if (roleError2) return json({ error: roleError2.message }, 400);
      const { error: banError } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: ativo ? "none" : "876000h",
        user_metadata: { nome },
      });
      if (banError) return json({ error: banError.message }, 400);
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const password = String(body.password || "");
      if (password.length < 8) return json({ error: "A senha deve ter pelo menos 8 caracteres" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { must_change_password: true },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});
