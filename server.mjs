/**
 * server.mjs — Node.js entry point for the GMS webapp.
 * Run with:  npx tsx server.mjs
 *
 * DATA PERSISTENCE STRATEGY:
 * ---------------------------
 * On Railway (with a volume), set the environment variable DATA_DIR to the
 * volume mount path (e.g., /data).  The app will read/write gms-data.json
 * inside that directory, so data survives every redeploy.
 *
 * Without a volume (local dev), DATA_DIR falls back to the project root,
 * where gms-data.json already lives alongside this file.
 */

import { serve } from '@hono/node-server'
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Determine the data directory ──────────────────────────────────────────────
// On Railway: set DATA_DIR=/data (where the volume is mounted)
// Locally:    defaults to the project root (next to this file)
const DATA_DIR = process.env.DATA_DIR || __dirname

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
  console.log(`[GMS] Created data directory: ${DATA_DIR}`)
}

// ── Seed gms-data.json into DATA_DIR if it doesn't exist yet ─────────────────
const targetDataFile = resolve(DATA_DIR, 'gms-data.json')
const seedDataFile   = resolve(__dirname, 'gms-data.json')

if (!existsSync(targetDataFile)) {
  if (existsSync(seedDataFile) && DATA_DIR !== __dirname) {
    copyFileSync(seedDataFile, targetDataFile)
    console.log(`[GMS] Seeded initial data → ${targetDataFile}`)
  } else {
    console.log(`[GMS] No seed file to copy; starting with empty data.`)
  }
} else {
  console.log(`[GMS] Using existing data file: ${targetDataFile}`)
}

// ── Export DATA_DIR so persist.ts can pick it up ──────────────────────────────
process.env.GMS_DATA_DIR = DATA_DIR

// ── Start the Hono app ────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000
const { default: app } = await import('./src/index.tsx')

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
})
