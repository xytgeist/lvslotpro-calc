-- Admin write (and full-read) policies for machines + guides.
-- Apply in Supabase SQL editor on test, then prod before shipping.
--
-- Migrations (preferred): 20260610220000_guide_admin_write_rls.sql (insert/update/select)
-- + 20260610180000_guide_admin_delete_rls.sql (delete). This file mirrors both for manual apply.

-- ── machines: admin insert + update ──────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert machines" ON machines;
CREATE POLICY "Admins can insert machines" ON machines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update machines" ON machines;
CREATE POLICY "Admins can update machines" ON machines
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── guides: admin full read + insert + update ─────────────────────────────────

-- Allows admins to see unpublished guides (public policy only covers published=true)
DROP POLICY IF EXISTS "Admins can read all guides" ON guides;
CREATE POLICY "Admins can read all guides" ON guides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert guides" ON guides;
CREATE POLICY "Admins can insert guides" ON guides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update guides" ON guides;
CREATE POLICY "Admins can update guides" ON guides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete machines" ON machines;
CREATE POLICY "Admins can delete machines" ON machines
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete guides" ON guides;
CREATE POLICY "Admins can delete guides" ON guides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
