
-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read templates
CREATE POLICY "Anyone can view templates" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON public.templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete templates" ON public.templates FOR DELETE USING (true);

-- Create storage bucket for template files
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);

-- Storage policies
CREATE POLICY "Template files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'templates');
CREATE POLICY "Anyone can upload template files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Anyone can delete template files" ON storage.objects FOR DELETE USING (bucket_id = 'templates');
