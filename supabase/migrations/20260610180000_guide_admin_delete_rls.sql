-- Admin DELETE on machines + guides (AP Guide card removal from app).
-- Pair with GuidesScreen admin Delete control. Apply on test before using in app.

DROP POLICY IF EXISTS "Admins can delete machines" ON public.machines;
CREATE POLICY "Admins can delete machines" ON public.machines
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete guides" ON public.guides;
CREATE POLICY "Admins can delete guides" ON public.guides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
