/**
 * server.mjs — Node.js entry point for the GMS webapp.
 *
 * Run with:  tsx server.mjs
 *
 * Uses @hono/node-server so the persist layer has full access to the real
 * filesystem (readFileSync / writeFileSync).  All application logic in src/
 * is unchanged — only the HTTP adapter is different from wrangler pages dev.
 *
 * On Railway: data volume is mounted at /data (RAILWAY_VOLUME_MOUNT_PATH).
 * On first boot, if /data/gms-data.json doesn't exist, we copy the seed file.
 */

import { serve } from '@hono/node-server'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Ensure data directory and seed file exist ─────────────────────────────────
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname
const dataFile = resolve(dataDir, 'gms-data.json')
const seedFile = resolve(__dirname, 'gms-data.json')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
  console.log(`[GMS] Created data directory: ${dataDir}`)
}

if (!existsSync(dataFile) && existsSync(seedFile)) {
  copyFileSync(seedFile, dataFile)
  console.log(`[GMS] Seeded data file from ${seedFile} → ${dataFile}`)
} else if (existsSync(dataFile)) {
  console.log(`[GMS] Using existing data file: ${dataFile}`)
} else {
  console.log(`[GMS] No seed file found, starting fresh at: ${dataFile}`)
}

import app from './src/index.tsx'

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
})
