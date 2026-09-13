REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.link_ergonomia_to_aet() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_ergonomia_to_aet() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.psico_get_public_link(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, service_role;

REVOKE EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, service_role;