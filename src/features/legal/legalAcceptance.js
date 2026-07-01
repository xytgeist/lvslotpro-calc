import { LEGAL_POLICY_VERSION } from './legalPolicyVersion.js'

const PENDING_ACCEPT_STORAGE_KEY = 'lvslotpro-legal-pending-accept:v1'

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} userId
 */
export async function recordLegalAcceptance(supabaseClient, userId) {
  if (!supabaseClient || !userId) return { error: new Error('Missing client or user') }
  const now = new Date().toISOString()
  const { error } = await supabaseClient
    .from('profiles')
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
      legal_policy_version: LEGAL_POLICY_VERSION,
      updated_at: now,
    })
    .eq('user_id', userId)
  if (error) return { error }
  clearPendingLegalAcceptance()
  return { error: null }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} userId
 */
export async function profileNeedsLegalAcceptance(supabaseClient, userId) {
  if (!supabaseClient || !userId) return false
  if (readPendingLegalAcceptance()) return true
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('terms_accepted_at, privacy_accepted_at, legal_policy_version')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    const code = String(error.code || '')
    if (code === '42703' || /legal_policy_version|terms_accepted_at/i.test(String(error.message || ''))) {
      return Boolean(readPendingLegalAcceptance())
    }
    return false
  }
  if (!data) return Boolean(readPendingLegalAcceptance())
  if (!data.terms_accepted_at || !data.privacy_accepted_at) return true
  if (data.legal_policy_version !== LEGAL_POLICY_VERSION) return true
  return false
}

export function markPendingLegalAcceptance() {
  try {
    window.localStorage.setItem(PENDING_ACCEPT_STORAGE_KEY, LEGAL_POLICY_VERSION)
  } catch {
    // ignore
  }
}

export function readPendingLegalAcceptance() {
  try {
    return window.localStorage.getItem(PENDING_ACCEPT_STORAGE_KEY) === LEGAL_POLICY_VERSION
  } catch {
    return false
  }
}

export function clearPendingLegalAcceptance() {
  try {
    window.localStorage.removeItem(PENDING_ACCEPT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
