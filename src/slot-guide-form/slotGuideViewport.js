/**
 * @param {import('@supabase/supabase-js').PostgrestSingleResponse<unknown>} result
 * @param {string} label
 */
export function assertSupabaseRowUpdated(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  const row = result.data
  if (row == null || (Array.isArray(row) && row.length === 0)) {
    throw new Error(
      `${label}: no row updated (RLS blocked or row not found). On test, apply migration 20260610220000_guide_admin_write_rls.sql and sign in as admin (profiles.role = admin).`,
    )
  }
}
