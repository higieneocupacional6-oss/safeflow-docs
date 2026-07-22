
CREATE TABLE public.aet_instrucoes_usuario (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instrucoes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aet_instrucoes_usuario TO authenticated;
GRANT ALL ON public.aet_instrucoes_usuario TO service_role;
ALTER TABLE public.aet_instrucoes_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manage own aet instrucoes" ON public.aet_instrucoes_usuario
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_aet_instrucoes_updated
  BEFORE UPDATE ON public.aet_instrucoes_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
