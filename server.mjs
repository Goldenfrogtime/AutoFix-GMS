/**
 * server.mjs — Node.js entry point for the GMS webapp.
 *
 * DATA DIRECTORY RESOLUTION (in priority order):
 *   1. RAILWAY_VOLUME_MOUNT_PATH  — set automatically by Railway when a Volume is attached
 *   2. DATA_DIR                   — manual override env var
 *   3. /app/data                  — safe default inside the Railway container
 *
 * WHY NOT process.cwd()?
 *   Railway builds your app into /app. Writing gms-data.json to /app means
 *   it is inside the container image and gets wiped on every redeploy.
 *   We always write to a subdirectory (/app/data or the volume mount path)
 *   so data is either on the persistent volume or clearly separated from
 *   the app code.
 */

import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname }                    from 'node:path'
import { fileURLToPath }                       from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── 1. Determine data directory ───────────────────────────────────────────────
// RAILWAY_VOLUME_MOUNT_PATH is injected automatically by Railway when a Volume
// is attached to the service — no manual env var needed.
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH  // e.g. /var/data
             || process.env.DATA_DIR                     // manual override
             || '/app/data'                              // safe fallback (not cwd)

console.log(`[GMS] Data directory: ${DATA_DIR}`)
console.log(`[GMS] Source: ${
  process.env.RAILWAY_VOLUME_MOUNT_PATH ? 'RAILWAY_VOLUME_MOUNT_PATH (volume attached ✅)' :
  process.env.DATA_DIR                  ? 'DATA_DIR (manual override)' :
                                          '/app/data (fallback — data will not persist across redeploys)'
}`)

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
  console.log(`[GMS] Created data directory: ${DATA_DIR}`)
}

// ── 2. Seed gms-data.json on first boot ──────────────────────────────────────
// TENANT_SEED env var allows per-client seed files (e.g. gms-data.rouge-motors.json)
// If not set, falls back to the default gms-data.json
const targetDataFile  = resolve(DATA_DIR, 'gms-data.json')
const tenantSeedName  = process.env.TENANT_SEED || 'gms-data.json'
const seedDataFile    = resolve(__dirname, tenantSeedName)
const fallbackSeed    = resolve(__dirname, 'gms-data.json')

if (!existsSync(targetDataFile)) {
  const chosenSeed = existsSync(seedDataFile) ? seedDataFile : fallbackSeed
  if (existsSync(chosenSeed)) {
    copyFileSync(chosenSeed, targetDataFile)
    console.log(`[GMS] First boot — seeded data from ${tenantSeedName} → ${targetDataFile}`)
  }
} else {
  console.log(`[GMS] Using existing data file: ${targetDataFile}`)
}

// ── 3. Expose path to persist.ts BEFORE importing the app ────────────────────
// persist.ts reads DATA_DIR at module-load time via getDataFilePath(),
// so this must be set before any import that pulls in persist.ts.
process.env.DATA_DIR = DATA_DIR

// ── 4. Import app (triggers load() in persist.ts) ────────────────────────────
const { default: app }    = await import('./src/index.tsx')
const { restoreFromGist } = await import('./src/data/persist.ts')
const { serve }           = await import('@hono/node-server')

// ── 5. Restore from Gist backup if configured ────────────────────────────────
await restoreFromGist()

// ── 6. Start HTTP server ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Listening on http://0.0.0.0:${info.port}`)
})
