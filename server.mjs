/**
 * server.mjs — Node.js entry point for the GMS webapp.
 * Run with:  npx tsx server.mjs
 *
 * Data persistence strategy:
 * - On Railway with volume: data stored at /data/gms-data.json
 * - Locally: data stored at <project-root>/gms-data.json
 */

// ── Process-level error handlers (registered first, before any imports) ───────
process.on('uncaughtException', (err) => {
  process.stderr.write(`[GMS] UNCAUGHT EXCEPTION: ${err?.stack || err}\n`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  process.stderr.write(
    `[GMS] UNHANDLED REJECTION: ${reason instanceof Error ? reason.stack : String(reason)}\n`
  )
  process.exit(1)
})

process.stderr.write('[GMS] Starting — process-level error handlers registered\n')

try {
  process.stderr.write('[GMS] Importing Node.js built-ins (fs, path, url)…\n')

  const { serve }                          = await import('@hono/node-server')
  const { existsSync, copyFileSync, mkdirSync } = await import('fs')
  const { resolve, dirname }               = await import('path')
  const { fileURLToPath }                  = await import('url')

  process.stderr.write('[GMS] Built-in imports OK\n')

  const __dirname = dirname(fileURLToPath(import.meta.url))

  // ── Data directory setup ────────────────────────────────────────────────────
  // DATA_DIR is set via Railway environment variable pointing to the
  // mounted volume (e.g. /data).  Falls back to the project root locally.
  const dataDir  = process.env.DATA_DIR || __dirname
  const dataFile = resolve(dataDir, 'gms-data.json')
  const seedFile = resolve(__dirname, 'gms-data.json')

  process.stderr.write(`[GMS] DATA_DIR=${dataDir}  dataFile=${dataFile}\n`)

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
    process.stderr.write(`[GMS] Created data directory: ${dataDir}\n`)
  } else {
    process.stderr.write(`[GMS] Data directory already exists: ${dataDir}\n`)
  }

  // Seed data file on first boot if volume is empty
  if (!existsSync(dataFile)) {
    if (existsSync(seedFile) && dataFile !== seedFile) {
      copyFileSync(seedFile, dataFile)
      process.stderr.write(`[GMS] First boot — seeded ${dataFile} from ${seedFile}\n`)
    } else {
      process.stderr.write(`[GMS] No seed file to copy — starting with empty data\n`)
    }
  } else {
    process.stderr.write(`[GMS] Using existing data file: ${dataFile}\n`)
  }

  // Set env var so persist.ts picks up the correct path
  process.env.DATA_DIR = dataDir

  // ── Application import ──────────────────────────────────────────────────────
  process.stderr.write('[GMS] Importing application (src/index.tsx)…\n')

  const { default: app } = await import('./src/index.tsx')

  process.stderr.write('[GMS] Application import OK\n')

  // ── Start HTTP server ───────────────────────────────────────────────────────
  const PORT = Number(process.env.PORT) || 3000

  process.stderr.write(`[GMS] Starting HTTP server on 0.0.0.0:${PORT}…\n`)

  serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
    process.stderr.write(`[GMS] Server ready — listening on http://0.0.0.0:${info.port}\n`)
    console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
  })

  process.stderr.write('[GMS] serve() called — waiting for ready callback\n')

} catch (err) {
  process.stderr.write(`[GMS] STARTUP ERROR: ${err?.stack || err}\n`)
  process.exit(1)
}
