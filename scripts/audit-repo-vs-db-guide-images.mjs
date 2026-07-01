import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const slotsRoot = path.join(process.cwd(), 'Slots')
const publicRoot = path.join(process.cwd(), 'public', 'guides')
const inlineRe = /!\[([^\]]*)\]\(([^)]+)\)/g

function readGuideMd(slug) {
  const p = path.join(slotsRoot, slug, 'guide.md')
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p, 'utf8')
}

function extractImages(md) {
  if (!md) return []
  const out = []
  let m
  while ((m = inlineRe.exec(md))) {
    out.push({ alt: m[1], url: m[2].trim() })
  }
  return out
}

function normalizeUrl(url) {
  if (url.startsWith('/guides/')) return url
  if (url.startsWith('http') && url.includes('/guides/')) {
    try {
      const u = new URL(url)
      const idx = u.pathname.indexOf('/guides/')
      if (idx >= 0) return u.pathname.slice(idx)
    } catch { /* ignore */ }
  }
  return url
}

function basenameFromUrl(url) {
  const n = normalizeUrl(url)
  const parts = n.split('/')
  return parts[parts.length - 1] || n
}

function publicFileExists(urlPath) {
  if (!urlPath.startsWith('/guides/')) return null
  const rel = urlPath.replace(/^\/guides\//, '')
  return fs.existsSync(path.join(publicRoot, ...rel.split('/')))
}

function listSlotSlugs() {
  if (!fs.existsSync(slotsRoot)) return []
  return fs
    .readdirSync(slotsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_ingest' && d.name !== 'Images')
    .map((d) => d.name)
    .sort()
}

const { data: guides, error } = await sb
  .from('guides')
  .select('slug, published, content_markdown')
  .order('slug')

if (error) {
  console.error(error.message)
  process.exit(1)
}

const dbBySlug = new Map((guides || []).map((g) => [g.slug, g]))
const slotSlugs = listSlotSlugs()

/** @type {Array<{ slug: string, status: string, repoImages: object[], dbImages: object[], missingInDb: object[], dbOnly: object[], publicMissing: string[] }>} */
const rows = []

for (const slug of slotSlugs) {
  const repoMd = readGuideMd(slug)
  const repoImages = extractImages(repoMd || '')
  const db = dbBySlug.get(slug)
  const dbImages = extractImages(db?.content_markdown || '')

  const repoBasenames = new Set(repoImages.map((i) => basenameFromUrl(i.url)))
  const dbBasenames = new Set(dbImages.map((i) => basenameFromUrl(i.url)))

  const missingInDb = repoImages.filter((i) => !dbBasenames.has(basenameFromUrl(i.url)))
  const dbOnly = dbImages.filter((i) => !repoBasenames.has(basenameFromUrl(i.url)))

  const publicMissing = repoImages
    .filter((i) => i.url.startsWith('/guides/'))
    .filter((i) => !publicFileExists(i.url))
    .map((i) => i.url)

  let status = 'no-repo-md'
  if (repoMd && !db) status = 'repo-only-not-in-db'
  else if (!repoMd && db) status = 'db-only-no-repo-md'
  else if (repoMd && db) {
    if (repoImages.length === 0 && dbImages.length === 0) status = 'both-no-inline-images'
    else if (missingInDb.length === 0 && dbOnly.length === 0 && repoImages.length === dbImages.length) status = 'images-match'
    else if (missingInDb.length > 0) status = 'repo-has-images-not-in-db'
    else if (dbOnly.length > 0) status = 'db-has-images-not-in-repo'
    else status = 'partial-mismatch'
  }

  if (repoImages.length || dbImages.length || status.includes('repo-only') || status.includes('db-only')) {
    rows.push({ slug, status, repoImages, dbImages, missingInDb, dbOnly, publicMissing, published: db?.published ?? null })
  }
}

console.log(`Slot folders: ${slotSlugs.length} | Test DB guides: ${guides.length}\n`)

console.log('=== REPO guide.md has images NOT in test DB (action: re-add via form or sync) ===\n')
const needsAttention = rows.filter((r) => r.missingInDb.length > 0)
if (!needsAttention.length) {
  console.log('(none)\n')
} else {
  for (const r of needsAttention) {
    console.log(`${r.slug}  [${r.status}]  published:${r.published ?? 'n/a'}`)
    for (const img of r.missingInDb) {
      const pub = img.url.startsWith('/guides/') ? publicFileExists(img.url) : null
      const pubNote = pub === null ? '' : pub ? ' public:OK' : ' public:MISSING'
      console.log(`  repo only → ${img.url}${pubNote}`)
    }
    if (r.dbImages.length) {
      console.log(`  db has: ${r.dbImages.map((i) => i.url).join(' | ') || '(none)'}`)
    }
    console.log('')
  }
}

console.log('=== REPO guide.md with NO guide.md or NO images (informational) ===\n')
for (const r of rows.filter((r) => r.status === 'repo-only-not-in-db')) {
  const imgs = r.repoImages.length ? r.repoImages.map((i) => i.url).join(', ') : '(no inline images)'
  console.log(`${r.slug}\tnot in test DB\t${imgs}`)
}

console.log('\n=== DB has images NOT in repo guide.md (form/R2 edits ahead of repo) ===\n')
const dbAhead = rows.filter((r) => r.dbOnly.length > 0)
if (!dbAhead.length) console.log('(none)\n')
else {
  for (const r of dbAhead) {
    console.log(`${r.slug}`)
    for (const img of r.dbOnly) console.log(`  db only → ${img.url}`)
    console.log('')
  }
}

console.log('=== public/guides orphan files (on disk, not in repo guide.md OR db) ===\n')
const allRepoPublicPaths = new Set()
const allDbPublicPaths = new Set()
for (const r of rows) {
  for (const img of r.repoImages) {
    if (img.url.startsWith('/guides/')) allRepoPublicPaths.add(img.url)
  }
  for (const img of r.dbImages) {
    const n = normalizeUrl(img.url)
    if (n.startsWith('/guides/')) allDbPublicPaths.add(n)
  }
}

const orphans = []
for (const dirent of fs.readdirSync(publicRoot, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue
  const folder = dirent.name
  for (const file of fs.readdirSync(path.join(publicRoot, folder))) {
    if (file === '.gitkeep') continue
    const urlPath = `/guides/${folder}/${file}`
    const inRepo = allRepoPublicPaths.has(urlPath)
    const inDb =
      allDbPublicPaths.has(urlPath) ||
      [...dbBySlug.values()].some((g) => (g.content_markdown || '').includes(`${folder}/${file}`))
    if (!inRepo && !inDb) orphans.push({ folder, file })
  }
}

if (!orphans.length) console.log('(none)\n')
else {
  const byFolder = new Map()
  for (const o of orphans) {
    if (!byFolder.has(o.folder)) byFolder.set(o.folder, [])
    byFolder.get(o.folder).push(o.file)
  }
  for (const [folder, files] of [...byFolder.entries()].sort()) {
    console.log(`${folder}\t${files.join(', ')}`)
  }
}

console.log('\n=== Summary counts ===')
console.log({
  repoFoldersWithGuideMd: slotSlugs.filter((s) => fs.existsSync(path.join(slotsRoot, s, 'guide.md'))).length,
  repoGuidesWithAnyInlineImage: rows.filter((r) => r.repoImages.length > 0).length,
  dbGuidesWithAnyInlineImage: rows.filter((r) => r.dbImages.length > 0).length,
  slugsWithImagesInRepoNotDb: needsAttention.length,
  orphanPublicFiles: orphans.length,
})
