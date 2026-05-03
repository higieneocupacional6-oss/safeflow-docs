CREATE TABLE public.equipamentos_ho_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE,
  numero_serie TEXT NOT NULL,
  marca_modelo TEXT,
  data_calibracao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipamentos_ho_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_eq_ho_reg_equipamento_id ON public.equipamentos_ho_registros(equipamento_id);