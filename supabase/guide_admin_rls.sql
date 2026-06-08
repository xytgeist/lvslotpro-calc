-- Admin write (and full-read) policies for machines + guides.
-- Apply in Supabase SQL editor on test, then prod before shipping.
--
-- Design: authenticated admin users (profiles.role = 'admin') can read all
-- guides (including unpublished), and insert/update both machines and guides.
-- Supabase merges SELECT policies with OR — admins see all rows, public sees
-- only published rows (existing "Public can read published guides" policy).

-- ── machines: admin insert + update ──────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert machines" ON machines;
CREATE POLICY "Admins can insert machines" ON machines
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update machines" ON machines;
CREATE POLICY "Admins can update machines" ON machines
  FOR UPDATE
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
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert guides" ON guides;
CREATE POLICY "Admins can insert guides" ON guides
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update guides" ON guides;
CREATE POLICY "Admins can update guides" ON guides
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete machines" ON machines;
CREATE POLICY "Admins can delete machines" ON machines
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete guides" ON guides;
CREATE POLICY "Admins can delete guides" ON guides
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
