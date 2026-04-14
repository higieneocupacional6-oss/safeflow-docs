
-- Create epi_epc table
CREATE TABLE public.epi_epc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('EPI', 'EPC')),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.epi_epc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view epi_epc" ON public.epi_epc FOR SELECT USING (true);
CREATE POLICY "Anyone can insert epi_epc" ON public.epi_epc FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update epi_epc" ON public.epi_epc FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete epi_epc" ON public.epi_epc FOR DELETE USING (true);

CREATE TRIGGER update_epi_epc_updated_at
  BEFORE UPDATE ON public.epi_epc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create junction table linking epi_epc to riscos
CREATE TABLE public.epi_epc_riscos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epi_epc_id UUID NOT NULL REFERENCES public.epi_epc(id) ON DELETE CASCADE,
  risco_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
  UNIQUE (epi_epc_id, risco_id)
);

ALTER TABLE public.epi_epc_riscos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view epi_epc_riscos" ON public.epi_epc_riscos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert epi_epc_riscos" ON public.epi_epc_riscos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete epi_epc_riscos" ON public.epi_epc_riscos FOR DELETE USING (true);
