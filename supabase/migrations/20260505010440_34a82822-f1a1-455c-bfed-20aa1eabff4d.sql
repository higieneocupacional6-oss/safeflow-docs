-- Add is_system flag to templates and protect from deletion
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Drop existing admin delete policy and recreate to forbid deleting system templates
DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;

CREATE POLICY "Admins can delete non-system templates"
ON public.templates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_system = false);

-- Block updates to is_system flag and protect system templates from being modified by non-admins
DROP POLICY IF EXISTS "Authenticated can update templates" ON public.templates;
CREATE POLICY "Authenticated can update non-system templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (is_system = false)
WITH CHECK (is_system = false);