/**
 * server.mjs — Node.js entry point for the GMS webapp.
 * Run with:  npx tsx server.mjs
 *
 * STARTUP SEQUENCE:
 * 1. Determine data directory (DATA_DIR env var or project root)
 * 2. Create directory if needed, seed gms-data.json if first boot
 * 3. Set GMS_DATA_DIR env var so persist.ts knows where to write
 * 4. Import the Hono app (which calls load() via persist.ts)
 * 5. Call restoreFromGist() — if Gist has more data than local file,
 *    overwrite local with Gist backup (handles post-redeploy data loss)
 * 6. Start HTTP server
 */

import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname }                    from 'node:path'
import { fileURLToPath }                       from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── 1. Determine data directory ───────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || __dirname

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
  console.log(`[GMS] Created data directory: ${DATA_DIR}`)
}

// ── 2. Seed gms-data.json if it doesn't exist yet ────────────────────────────
const targetDataFile = resolve(DATA_DIR, 'gms-data.json')
const seedDataFile   = resolve(__dirname, 'gms-data.json')

if (!existsSync(targetDataFile)) {
  if (existsSync(seedDataFile) && DATA_DIR !== __dirname) {
    copyFileSync(seedDataFile, targetDataFile)
    console.log(`[GMS] Seeded initial data → ${targetDataFile}`)
  } else {
    console.log('[GMS] No external data dir — using project root data file.')
  }
} else {
  console.log(`[GMS] Using existing data file: ${targetDataFile}`)
}

// ── 3. Tell persist.ts where to write ────────────────────────────────────────
process.env.GMS_DATA_DIR = DATA_DIR

// ── 4. Import app (triggers load() in persist.ts) ────────────────────────────
const { default: app }          = await import('./src/index.tsx')
const { restoreFromGist }       = await import('./src/data/persist.ts')
const { serve }                  = await import('@hono/node-server')

// ── 5. Restore from Gist if local data was wiped by redeploy ─────────────────
await restoreFromGist()

// ── 6. Start HTTP server ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
  if (process.env.GIST_TOKEN && process.env.GIST_ID) {
    console.log('[GMS] Gist backup: ENABLED ✅')
  } else {
    console.log('[GMS] Gist backup: DISABLED (set GIST_TOKEN + GIST_ID env vars to enable)')
  }
})
