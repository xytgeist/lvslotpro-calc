/**
 * Upsert Play Logbook system templates for every published AP slot guide.
 *
 * Standard fields: bet, denom, cash in/out, acquisition fee, # spins, # bonuses.
 * Calculator-specific fields when the guide ships a calc (Phoenix, Buffalo, MHB, WoF CE, etc.).
 *
 * Usage:
 *   node scripts/sync-play-log-guide-templates.mjs --target=test
 *   node scripts/sync-play-log-guide-templates.mjs --target=test --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, createSupabaseServiceClient, targetHuman } from './lib/supabaseEnv.mjs'
import { playLogTemplateFromGuideRow } from './lib/playLogGuideTemplateMetrics.mjs'

function parseArgs(argv) {
  let target = 'test'
  let dryRun = false
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg.startsWith('--target=')) target = arg.slice('--target='.length)
  }
  return { target, dryRun }
}

async function main() {
  const { target, dryRun } = parseArgs(process.argv)
  loadSupabaseEnv(target === 'production' ? 'production' : 'test')
  const supabase = createSupabaseServiceClient(createClient)

  const { data: guides, error: guideErr } = await supabase
    .from('guides')
    .select(
      `
      slug,
      title,
      published,
      machines (
        slug,
        name,
        type,
        has_calculator,
        calculator_slug
      )
    `,
    )
    .eq('published', true)
    .order('slug')

  if (guideErr) throw guideErr

  /** @type {Map<string, ReturnType<typeof playLogTemplateFromGuideRow>>} */
  const byMachineSlug = new Map()
  for (const row of guides || []) {
    const tpl = playLogTemplateFromGuideRow(row)
    if (!tpl) continue
    byMachineSlug.set(tpl.slug, tpl)
  }

  const templates = [...byMachineSlug.values()].sort((a, b) => a.slug.localeCompare(b.slug))

  const { data: existing, error: existErr } = await supabase
    .from('play_log_game_templates')
    .select('id, slug')
    .eq('is_system', true)
  if (existErr) throw existErr

  const existingBySlug = new Map((existing || []).map((t) => [String(t.slug || ''), t.id]))

  let inserted = 0
  let updated = 0
  let skipped = 0

  console.log(
    `Play Log guide templates → ${targetHuman(target)}${dryRun ? ' (dry run)' : ''}: ${templates.length} published guide(s)`,
  )

  for (const tpl of templates) {
    const payload = {
      slug: tpl.slug,
      display_name: tpl.display_name,
      machine_slug: tpl.machine_slug,
      calculator_slug: tpl.calculator_slug,
      metric_slugs: tpl.metric_slugs,
      is_system: true,
      user_id: null,
    }

    const existingId = existingBySlug.get(tpl.slug)
    if (dryRun) {
      console.log(
        `${existingId ? 'update' : 'insert'} ${tpl.slug} · ${tpl.display_name} · calc=${tpl.calculator_slug || '—'} · fields=${tpl.metric_slugs.length}`,
      )
      if (existingId) updated += 1
      else inserted += 1
      continue
    }

    if (existingId) {
      const { error: updErr } = await supabase
        .from('play_log_game_templates')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existingId)
      if (updErr) throw updErr
      updated += 1
    } else {
      const { error: insErr } = await supabase.from('play_log_game_templates').insert(payload)
      if (insErr) throw insErr
      inserted += 1
    }
  }

  console.log(`Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`)

  if (!dryRun) {
    await removeOrphanPlayLogTemplates(supabase)
  }
}

/** Drop legacy duplicate templates when canonical machine-slug row exists and orphan has no entries. */
async function removeOrphanPlayLogTemplates(supabase) {
  const orphans = [
    {
      orphanSlug: 'wof-collectors-edition',
      canonicalMachineSlug: 'wheel-of-fortune-4d-collectors-edition',
    },
  ]

  for (const { orphanSlug, canonicalMachineSlug } of orphans) {
    const { data: orphan, error: oErr } = await supabase
      .from('play_log_game_templates')
      .select('id, slug')
      .eq('is_system', true)
      .eq('slug', orphanSlug)
      .maybeSingle()
    if (oErr) throw oErr
    if (!orphan?.id) continue

    const { data: canonical, error: cErr } = await supabase
      .from('play_log_game_templates')
      .select('id')
      .eq('is_system', true)
      .eq('slug', canonicalMachineSlug)
      .maybeSingle()
    if (cErr) throw cErr
    if (!canonical?.id || canonical.id === orphan.id) continue

    const { count, error: cntErr } = await supabase
      .from('play_log_entries')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', orphan.id)
    if (cntErr) throw cntErr
    if ((count ?? 0) > 0) {
      console.warn(`Skip delete orphan ${orphanSlug}: ${count} log entries still reference it.`)
      continue
    }

    const { error: delErr } = await supabase.from('play_log_game_templates').delete().eq('id', orphan.id)
    if (delErr) throw delErr
    console.log(`Removed orphan template ${orphanSlug} (canonical: ${canonicalMachineSlug}).`)
  }
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
