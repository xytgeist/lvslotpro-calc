/**
 * Compare Desolator "All AP References" PDF entries vs LVSlotPro guide collection.
 * Usage: node scripts/ap-guide-compare-desolator-pdf.mjs
 */
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

/** @type {Array<{ id: string, pdfLabel: string, matchSlugs: string[] }>} */
const PDF_ENTRIES = [
  { id: '2-minute-drill', pdfLabel: '2-Minute Drill (Super Bowl Jackpots)', matchSlugs: ['super-bowl-jackpots', '2-minute-drill'] },
  { id: 'ascending-stack', pdfLabel: 'Ascending Fortunes / Stack Up Pays', matchSlugs: ['ascending-fortunes', 'stack-up-pays'] },
  { id: 'aztec-pegasus', pdfLabel: 'Aztec Banner & Pegasus Banner', matchSlugs: ['aztec-banner', 'pegasus-banner'] },
  { id: 'barnyard-poker', pdfLabel: 'Barnyard Poker', matchSlugs: ['barnyard-poker'] },
  { id: 'buffalo-ascension', pdfLabel: 'Buffalo Ascension', matchSlugs: ['buffalo-ascension'] },
  { id: 'buffalo-link', pdfLabel: 'Buffalo Link & Buffalo Cash', matchSlugs: ['buffalo-link', 'buffalo-cash'] },
  { id: 'captain-riches', pdfLabel: 'Captain Riches', matchSlugs: ['captain-riches-tiki-fortune', 'captain-riches'] },
  { id: 'cashman-bingo', pdfLabel: 'Cashman Bingo', matchSlugs: ['cashman-bingo', 'cashman-double-bingo'] },
  { id: 'dancing-drums', pdfLabel: 'Dancing Drums – Golden Drums', matchSlugs: ['dancing-drums-golden-drums'] },
  { id: 'dragon-jlb', pdfLabel: 'Dragon Jin Long Jin Bao', matchSlugs: ['double-dragon-jin-long-jin-bao', 'dragon-jin-long-jin-bao'] },
  { id: 'fortune-x', pdfLabel: 'Fortune X Poker', matchSlugs: ['fortune-x-poker'] },
  { id: 'frankenstein', pdfLabel: 'Frankenstein', matchSlugs: ['frankenstein'] },
  { id: 'golden-egypt', pdfLabel: 'Golden Egypt', matchSlugs: ['golden-egypt', 'dancing-phoenix-soaring-dragon'] },
  { id: 'golden-egypt-jp', pdfLabel: 'Golden Egypt Jackpots', matchSlugs: ['golden-egypt-grand', 'golden-egypt-jackpots'] },
  { id: 'golden-jungle', pdfLabel: 'Golden Jungle', matchSlugs: ['golden-jungle', 'golden-jungle-grand'] },
  { id: 'grand-buddha', pdfLabel: 'Grand Buddha Link / Lucky Buddha / Lucky Wealth Cat', matchSlugs: ['grand-buddha-link-grand-cat-link', 'lucky-buddha-lucky-wealth-cat'] },
  { id: 'hexbreak3r', pdfLabel: 'Hexbreak3r / Hexbreaker 3', matchSlugs: ['hexbreak3r'] },
  { id: 'hold-n-gold', pdfLabel: 'Hold N Gold', matchSlugs: ['hold-n-gold-acorn-falls-hot-spell', 'hold-n-gold'] },
  { id: 'huff-n-puff', pdfLabel: "Huff N Puff We've Had Enuff", matchSlugs: ['huff-n-puff-weve-had-enuff', 'huff-n-puff-we-ve-had-enuff'] },
  { id: 'joe-blow', pdfLabel: 'Joe Blow Gold', matchSlugs: ['joe-blow-diamonds-joe-blow-gold', 'joe-blow-gold'] },
  { id: 'lobster-4', pdfLabel: 'Lobstermania 4 / Shrimpmania 4', matchSlugs: ['lucky-larrys-lobstermania-4-link-super-sallys-shrimpmania-4-link'] },
  { id: 'lucha-sumo', pdfLabel: 'Lucha Kitty / Sumo Kitty', matchSlugs: ['sumo-kitty-lucha-kitty', 'lucha-kitty', 'sumo-kitty'] },
  { id: 'lucky-haul', pdfLabel: 'Lucky Haul / March of the Zombies', matchSlugs: ['lucky-haul-march-of-the-zombies'] },
  { id: 'lucky-lemmings', pdfLabel: 'Lucky Lemmings Stampede', matchSlugs: ['lucky-lemmings-stampede'] },
  { id: 'lucky-pick', pdfLabel: 'Lucky Pick – Bumble Bee & Leprechaun', matchSlugs: ['lucky-pick-bumble-bee-leprechaun'] },
  { id: 'lunar-disc', pdfLabel: 'Lunar Disc', matchSlugs: ['fortune-disc', 'lunar-disc'] },
  { id: 'mt-gold', pdfLabel: 'Magic Treasures Gold', matchSlugs: ['magic-treasures-gold-emperor-empress'] },
  { id: 'mt-dragon-tiger', pdfLabel: 'Magic Treasures Dragon & Tiger', matchSlugs: ['magic-treasures-dragon-tiger'] },
  { id: 'moving-mult-poker', pdfLabel: 'Moving Multipliers Poker', matchSlugs: ['moving-multipliers-poker'] },
  { id: 'mult-rising-poker', pdfLabel: 'Multipliers Rising Poker', matchSlugs: ['multipliers-rising-poker'] },
  { id: 'multi-streak', pdfLabel: 'Multi-Streak Poker', matchSlugs: ['multi-streak-poker'] },
  { id: 'ocean-bubble', pdfLabel: 'Ocean Magic Bubble Boost', matchSlugs: ['ocean-magic-bubble-boost'] },
  { id: 'pay-upgrade', pdfLabel: 'Pay Upgrade', matchSlugs: ['pay-upgrade'] },
  { id: 'penguin-imperial', pdfLabel: 'Penguin Palace / Imperial Fortunes', matchSlugs: ['imperial-fortunes-penguin-palace'] },
  { id: 'phoenix-link', pdfLabel: 'Phoenix Link', matchSlugs: ['phoenix-link'] },
  { id: 'pick-mult-poker', pdfLabel: 'Pick a Multiplier Poker', matchSlugs: ['pick-a-multiplier-poker'] },
  { id: 'pillars-cash', pdfLabel: 'Pillars of Cash', matchSlugs: ['pillars-of-cash-celestial-fortune-festive-fortune'] },
  { id: 'power-push', pdfLabel: 'Power Push Long de Xiyue', matchSlugs: ['power-push-jin-gou-long-de-xiyue'] },
  { id: 'quick-hit-platinum', pdfLabel: 'Quick Hit Platinum', matchSlugs: ['quick-hit-platinum'] },
  { id: 'regal-riches', pdfLabel: 'Regal Riches', matchSlugs: ['regal-riches', 'regal-riches-prosperity-pearl', 'prosperity-pearl'] },
  {
    id: 'rich-little',
    pdfLabel: 'Rich Little Piggies / Hens / Sheep',
    matchSlugs: [
      'rich-little-piggies-hog-wild-meal-ticket',
      'rich-little-piggies-world-class-advantage-play',
      'rich-little-hens',
      'rich-little-hens-world-class',
      'rich-little-sheep-on-the-lamb-wool-street-riches',
    ],
  },
  { id: 'rising-phoenix', pdfLabel: 'Rising Phoenix', matchSlugs: ['rising-phoenix'] },
  { id: 'rocket-rumble', pdfLabel: 'Rocket Rumble', matchSlugs: ['rocket-rumble'] },
  { id: 'scarab', pdfLabel: 'Scarab', matchSlugs: ['scarab', 'diamond-mania'] },
  { id: 'star-goddess', pdfLabel: 'Star Goddess / Wu Dragon', matchSlugs: ['star-goddess', 'wu-dragon'] },
  { id: 'super-hot-roll', pdfLabel: 'Super Hot Roll Poker', matchSlugs: ['super-hot-roll-poker'] },
  { id: 'sword-angel', pdfLabel: 'Sword of Destiny / Angel Blade', matchSlugs: ['angel-blade-sword-of-destiny', 'sword-of-destiny-fire-warrior'] },
  { id: 'temple-falls', pdfLabel: 'Temple Falls Jungle Adventure', matchSlugs: ['temple-falls-boost-blast-jungle-adventure', 'temple-falls-jungle-adventure'] },
  { id: 'ultimate-x', pdfLabel: 'Ultimate X Video Poker', matchSlugs: ['ultimate-x-poker'] },
  { id: 'ux-bonus-streak', pdfLabel: 'Ultimate X Bonus Streak Poker', matchSlugs: ['ultimate-x-bonus-streak-poker'] },
  { id: 'ultra-rush', pdfLabel: 'Ultra Rush Gold', matchSlugs: ['ultra-rush-gold-african-adventure-midnight-ice-mythical-phoenix-tiger-run', 'ultra-rush-gold-x-bingwen-wei-yi'] },
  { id: 'wheel-frenzy', pdfLabel: 'Wheel Frenzy Genie / Frights N Delights', matchSlugs: ['wheel-frenzy-frights-n-delights-genie-unleashed'] },
  { id: 'wof-high-roller', pdfLabel: 'Wheel of Fortune High Roller', matchSlugs: ['wheel-of-fortune-high-roller'] },
  { id: 'wild-pile-up', pdfLabel: 'Wild Pile Up', matchSlugs: ['wild-pile-up-cutie-kitty-tiger-lee'] },
  { id: 'winning-wings', pdfLabel: 'Winning Wings: Fairies & Butterflies', matchSlugs: ['winning-wings-butterflies-fairies'] },
  { id: 'wolf-cat-peak', pdfLabel: 'Wolf Peak / Cat Peak', matchSlugs: ['wolf-peak-cat-peak-fu-ren-wu'] },
  { id: 'wolf-run-eclipse', pdfLabel: 'Wolf Run Eclipse', matchSlugs: ['wolf-run-eclipse'] },
  { id: 'wu-jin-pen', pdfLabel: 'Wu Jin Pen', matchSlugs: ['wu-jin-pen-fuyu-phoenix-panda', 'wu-jin-pen-parade'] },
  { id: 'zorro', pdfLabel: 'Zorro Power of Z', matchSlugs: ['zorro-power-of-z'] },
]

loadSupabaseEnv('test')
const sb = createClient(readSupabaseCredentials().url, readSupabaseCredentials().key, {
  auth: { persistSession: false },
})
const { data: guides } = await sb.from('guides').select('slug, title').eq('published', true)
const liveSlugs = new Set((guides ?? []).map((g) => g.slug))
const liveBySlug = Object.fromEntries((guides ?? []).map((g) => [g.slug, g.title]))

const progress = JSON.parse(fs.readFileSync('ap-guide-workspace/_batch-progress.json', 'utf8'))
const queued = new Set()
/** @type {Map<string, number>} */
const batchBySlug = new Map()
for (const b of progress.batches) {
  if (b.batch >= 1) {
    for (const s of b.planned ?? []) {
      queued.add(s)
      batchBySlug.set(s, b.batch)
    }
    for (const s of b.skipped ?? []) {
      queued.add(s.slug)
      batchBySlug.set(s.slug, b.batch)
    }
  }
}

const ws = fs.readdirSync('ap-guide-workspace').filter((n) => !n.startsWith('_') && n !== '___DONE')
const done = fs.existsSync('ap-guide-workspace/___DONE')
  ? fs.readdirSync('ap-guide-workspace/___DONE')
  : []
const allFolders = new Set([...ws, ...done])

/** @param {string[]} candidates */
function findStatus(candidates) {
  for (const c of candidates) {
    if (liveSlugs.has(c)) return { status: 'live', slug: c, title: liveBySlug[c] }
  }
  for (const c of candidates) {
    if (queued.has(c)) {
      return { status: 'queued', slug: c, batch: batchBySlug.get(c) ?? null }
    }
    for (const q of queued) {
      if (q === c || q.startsWith(c) || c.startsWith(q)) {
        return { status: 'queued', slug: q, batch: batchBySlug.get(q) ?? null }
      }
    }
  }
  for (const c of candidates) {
    for (const slug of allFolders) {
      if (slug === c || slug.startsWith(c) || c.startsWith(slug)) {
        const batch = batchBySlug.get(slug) ?? null
        return {
          status: liveSlugs.has(slug) ? 'live' : batch != null ? 'queued' : 'workspace',
          slug,
          batch,
        }
      }
    }
  }
  return { status: 'missing', slug: null }
}

/** @type {Array<{ pdfLabel: string, status: string, slug: string | null, title?: string }>} */
const rows = PDF_ENTRIES.map((e) => {
  const hit = findStatus(e.matchSlugs)
  return { pdfLabel: e.pdfLabel, ...hit }
})

const missing = rows.filter((r) => r.status === 'missing')
const live = rows.filter((r) => r.status === 'live')
const queuedOnly = rows.filter((r) => r.status === 'queued')
const workspaceOnly = rows.filter((r) => r.status === 'workspace')

console.log(`Desolator PDF v1.14: ${PDF_ENTRIES.length} entries`)
console.log(`Live on test: ${liveSlugs.size} guides`)
console.log(`Matched live: ${live.length}`)
console.log(`Queued in batch plan: ${queuedOnly.length}`)
console.log(`Workspace folder only: ${workspaceOnly.length}`)
console.log(`MISSING: ${missing.length}\n`)

if (missing.length) {
  console.log('=== NOT IN COLLECTION (PDF only) ===')
  for (const m of missing) console.log(`  • ${m.pdfLabel}`)
}

if (queuedOnly.length) {
  console.log('\n=== IN BATCH QUEUE (not live yet) ===')
  for (const m of queuedOnly) {
    const batch = m.batch != null ? `batch ${m.batch}` : 'queued'
    console.log(`  • ${m.pdfLabel} → ${m.slug} (${batch})`)
  }
}

if (workspaceOnly.length) {
  console.log('\n=== WORKSPACE FOLDER (not in batch plan) ===')
  for (const m of workspaceOnly) console.log(`  • ${m.pdfLabel} → ${m.slug}`)
}

const partial = rows.filter((r) => r.status === 'missing' && r.pdfLabel === 'Quick Hit Platinum')
if (partial.length && liveSlugs.has('quick-hit-ultra-pays')) {
  console.log('\n=== RELATED (different guide live) ===')
  console.log('  • Quick Hit Platinum — not in collection; live cousin: quick-hit-ultra-pays')
}
