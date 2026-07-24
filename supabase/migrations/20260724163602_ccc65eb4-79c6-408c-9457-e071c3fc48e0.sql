
ALTER TABLE public.ergonomia_avaliacoes
  ADD COLUMN IF NOT EXISTS atividade TEXT;

CREATE INDEX IF NOT EXISTS idx_ergonomia_user_setor
  ON public.ergonomia_avaliacoes (user_id, setor_nome, funcao);

CREATE OR REPLACE FUNCTION public.link_ergonomia_to_aet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ergonomia_avaliacoes ea
  SET aet_documento_id = NEW.id
  WHERE ea.aet_documento_id IS NULL
    AND ea.user_id = NEW.created_by
    AND (
      (NEW.empresa_id IS NOT NULL AND ea.empresa_nome = (
        SELECT razao_social FROM public.empresas WHERE id = NEW.empresa_id
      ))
      OR NEW.empresa_id IS NULL
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_ergonomia_to_aet ON public.aet_documentos;
CREATE TRIGGER trg_link_ergonomia_to_aet
AFTER INSERT ON public.aet_documentos
FOR EACH ROW
EXECUTE FUNCTION public.link_ergonomia_to_aet();
