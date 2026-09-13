CREATE OR REPLACE FUNCTION public.preserve_ficha_tecnica_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.ficha_tecnica_resultado_id IS NOT NULL
     AND NEW.ficha_tecnica_resultado_id IS NULL THEN
    NEW.ficha_tecnica_resultado_id := OLD.ficha_tecnica_resultado_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preserve_ficha_tecnica_origin_on_update ON public.ltcat_avaliacoes;
CREATE TRIGGER preserve_ficha_tecnica_origin_on_update
BEFORE UPDATE ON public.ltcat_avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.preserve_ficha_tecnica_origin();

REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM anon;
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.preserve_ficha_tecnica_origin() TO service_role;