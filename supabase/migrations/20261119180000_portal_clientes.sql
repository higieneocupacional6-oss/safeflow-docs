-- Portal Clientes (espelho do server/migrations/008_portal_clientes.sql)

CREATE TABLE IF NOT EXISTS public.portal_clientes_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_referencia date,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  retained_until timestamptz NOT NULL,
  ativo boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS portal_clientes_links_empresa_idx
  ON public.portal_clientes_links (empresa_id);
CREATE INDEX IF NOT EXISTS portal_clientes_links_retained_idx
  ON public.portal_clientes_links (retained_until);
CREATE INDEX IF NOT EXISTS portal_clientes_links_created_idx
  ON public.portal_clientes_links (created_at DESC);

CREATE TABLE IF NOT EXISTS public.portal_clientes_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.portal_clientes_links(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  nome_original text NOT NULL,
  storage_path text NOT NULL,
  tamanho_bytes bigint NOT NULL DEFAULT 0,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_clientes_arquivos_link_idx
  ON public.portal_clientes_arquivos (link_id);
CREATE INDEX IF NOT EXISTS portal_clientes_arquivos_contrato_idx
  ON public.portal_clientes_arquivos (contrato_id);

CREATE OR REPLACE FUNCTION public.portal_clientes_default_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.token IS NULL OR btrim(NEW.token) = '' THEN
    NEW.token := encode(gen_random_bytes(6), 'hex');
  END IF;
  IF NEW.retained_until IS NULL THEN
    NEW.retained_until := NEW.created_at + interval '22 months';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portal_clientes_links_defaults ON public.portal_clientes_links;
CREATE TRIGGER portal_clientes_links_defaults
  BEFORE INSERT ON public.portal_clientes_links
  FOR EACH ROW EXECUTE FUNCTION public.portal_clientes_default_token();

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.portal_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_result jsonb;
BEGIN
  SELECT l.id, l.token, l.empresa_id, l.ativo, l.data_referencia, l.observacoes,
         l.created_at, l.retained_until, e.razao_social, e.nome_fantasia
  INTO v_link
  FROM public.portal_clientes_links l
  JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;

  IF NOT FOUND OR NOT v_link.ativo THEN
    RETURN jsonb_build_object('error', 'Link inválido ou desativado');
  END IF;

  IF v_link.retained_until < now() THEN
    RETURN jsonb_build_object('error', 'Este portal expirou e os arquivos foram removidos');
  END IF;

  SELECT jsonb_build_object(
    'link_id', v_link.id,
    'token', v_link.token,
    'empresa_id', v_link.empresa_id,
    'empresa_nome', COALESCE(NULLIF(v_link.nome_fantasia, ''), v_link.razao_social),
    'empresa_razao', v_link.razao_social,
    'data_referencia', v_link.data_referencia,
    'observacoes', v_link.observacoes,
    'created_at', v_link.created_at,
    'retained_until', v_link.retained_until,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'numero_contrato', c.numero_contrato,
        'nome_contratante', c.nome_contratante,
        'arquivos', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', a.id,
            'nome', a.nome_original,
            'tamanho_bytes', a.tamanho_bytes,
            'content_type', a.content_type,
            'created_at', a.created_at
          ) ORDER BY a.nome_original)
          FROM public.portal_clientes_arquivos a
          WHERE a.link_id = v_link.id AND a.contrato_id = c.id
        ), '[]'::jsonb)
      ) ORDER BY c.numero_contrato)
      FROM public.contratos c
      WHERE c.empresa_id = v_link.empresa_id
        AND EXISTS (
          SELECT 1 FROM public.portal_clientes_arquivos a
          WHERE a.link_id = v_link.id AND a.contrato_id = c.id
        )
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_get_public_link(_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.portal_get_public_link(_token) $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-clientes', 'portal-clientes', false)
ON CONFLICT (id) DO NOTHING;
