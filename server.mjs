// ── DIAGNOSTIC: First line synchronous output — proves the process started ───
console.log('[GMS] process started — server.mjs line 1')
process.stderr.write('[GMS] process started — server.mjs line 1 (stderr)\n')

/**
 * server.mjs — Node.js entry point for the GMS webapp.
 * Run with:  npx tsx server.mjs
 *
 * Data persistence strategy:
 * - On Railway with volume: data stored at /data/gms-data.json
 * - Locally: data stored at <project-root>/gms-data.json
 */

import { serve }                               from '@hono/node-server'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname }                    from 'path'
import { fileURLToPath }                       from 'url'

// ── Process-level error handlers (registered before any async work) ───────────
process.on('uncaughtException', (err) => {
  console.error('[GMS] UNCAUGHT EXCEPTION:', err?.stack || err)
  process.stderr.write(`[GMS] UNCAUGHT EXCEPTION: ${err?.stack || err}\n`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.stack : String(reason)
  console.error('[GMS] UNHANDLED REJECTION:', msg)
  process.stderr.write(`[GMS] UNHANDLED REJECTION: ${msg}\n`)
  process.exit(1)
})

console.log('[GMS] Static imports loaded — process-level error handlers registered')
process.stderr.write('[GMS] Static imports loaded — process-level error handlers registered\n')

// ── Startup timeout: log a warning if the server hasn't started in 10 s ──────
const startupTimer = setTimeout(() => {
  console.error('[GMS] TIMEOUT: Server has not started within 10 seconds — possible hang during module load or serve()')
  process.stderr.write('[GMS] TIMEOUT: Server has not started within 10 seconds — possible hang during module load or serve()\n')
}, 10_000)
// Don't let this timer keep the process alive if everything else exits cleanly
startupTimer.unref()

async function main() {
  try {
    console.log('[GMS] main() entered')
    process.stderr.write('[GMS] main() entered\n')

    const __dirname = dirname(fileURLToPath(import.meta.url))

    // ── Data directory setup ──────────────────────────────────────────────────
    // DATA_DIR is set via Railway environment variable pointing to the
    // mounted volume (e.g. /data).  Falls back to the project root locally.
    const dataDir  = process.env.DATA_DIR || __dirname
    const dataFile = resolve(dataDir, 'gms-data.json')
    const seedFile = resolve(__dirname, 'gms-data.json')

    console.log(`[GMS] DATA_DIR=${dataDir}  dataFile=${dataFile}`)
    process.stderr.write(`[GMS] DATA_DIR=${dataDir}  dataFile=${dataFile}\n`)

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
      console.log(`[GMS] Created data directory: ${dataDir}`)
      process.stderr.write(`[GMS] Created data directory: ${dataDir}\n`)
    } else {
      console.log(`[GMS] Data directory already exists: ${dataDir}`)
      process.stderr.write(`[GMS] Data directory already exists: ${dataDir}\n`)
    }

    // Seed data file on first boot if volume is empty
    if (!existsSync(dataFile)) {
      if (existsSync(seedFile) && dataFile !== seedFile) {
        copyFileSync(seedFile, dataFile)
        console.log(`[GMS] First boot — seeded ${dataFile} from ${seedFile}`)
        process.stderr.write(`[GMS] First boot — seeded ${dataFile} from ${seedFile}\n`)
      } else {
        console.log('[GMS] No seed file to copy — starting with empty data')
        process.stderr.write('[GMS] No seed file to copy — starting with empty data\n')
      }
    } else {
      console.log(`[GMS] Using existing data file: ${dataFile}`)
      process.stderr.write(`[GMS] Using existing data file: ${dataFile}\n`)
    }

    // Set env var so persist.ts picks up the correct path
    process.env.DATA_DIR = dataDir

    // ── Application import ────────────────────────────────────────────────────
    console.log('[GMS] Importing application (src/routes/api.ts)…')
    process.stderr.write('[GMS] Importing application (src/routes/api.ts)…\n')

    let app
    try {
      const mod = await import('./src/routes/api.ts')
      app = mod.default
      console.log('[GMS] Application import OK — app:', typeof app)
      process.stderr.write(`[GMS] Application import OK — app: ${typeof app}\n`)
    } catch (importErr) {
      console.error('[GMS] Application import FAILED:', importErr?.stack || importErr)
      process.stderr.write(`[GMS] Application import FAILED: ${importErr?.stack || importErr}\n`)
      process.exit(1)
    }

    // ── Start HTTP server ─────────────────────────────────────────────────────
    const PORT = Number(process.env.PORT) || 3000

    console.log(`[GMS] Calling serve() on 0.0.0.0:${PORT}…`)
    process.stderr.write(`[GMS] Calling serve() on 0.0.0.0:${PORT}…\n`)

    serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
      // Cancel the startup timeout — we're alive
      clearTimeout(startupTimer)
      console.log(`[GMS] Server ready — listening on http://0.0.0.0:${info.port}`)
      process.stderr.write(`[GMS] Server ready — listening on http://0.0.0.0:${info.port}\n`)
    })

    console.log('[GMS] serve() called — waiting for ready callback')
    process.stderr.write('[GMS] serve() called — waiting for ready callback\n')

  } catch (err) {
    console.error('[GMS] STARTUP ERROR:', err?.stack || err)
    process.stderr.write(`[GMS] STARTUP ERROR: ${err?.stack || err}\n`)
    process.exit(1)
  }
}

main()

