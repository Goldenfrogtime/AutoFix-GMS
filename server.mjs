/**
 * server.mjs — Node.js entry point for the GMS webapp.
 * Run with:  npx tsx server.mjs
 *
 * Data persistence strategy:
 * - On Railway with volume: data stored at /var/data/gms-data.json
 * - Locally: data stored at <project-root>/gms-data.json
 */

import { serve } from '@hono/node-server'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Data directory setup ──────────────────────────────────────────────────────
// RAILWAY_VOLUME_MOUNT_PATH is set via Railway environment variable
// pointing to wherever the volume is mounted (e.g. /var/data)
const dataDir  = process.env.DATA_DIR || __dirname
const dataFile = resolve(dataDir, 'gms-data.json')
const seedFile = resolve(__dirname, 'gms-data.json')

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
  console.log(`[GMS] Created data directory: ${dataDir}`)
}

// Seed data file on first boot if volume is empty
if (!existsSync(dataFile)) {
  if (existsSync(seedFile) && dataFile !== seedFile) {
    copyFileSync(seedFile, dataFile)
    console.log(`[GMS] First boot — seeded ${dataFile} from ${seedFile}`)
  }
} else {
  console.log(`[GMS] Using existing data file: ${dataFile}`)
}

// Set env var so persist.ts picks up the correct path
process.env.DATA_DIR = dataDir

import app from './src/index.tsx'

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
})
