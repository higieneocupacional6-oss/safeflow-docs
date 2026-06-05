DROP POLICY IF EXISTS "Admins can delete non-system templates" ON public.templates;
CREATE POLICY "Authenticated can delete non-system templates"
ON public.templates
FOR DELETE
TO authenticated
USING (is_system = false);