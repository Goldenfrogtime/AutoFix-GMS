/**
 * server.mjs — Node.js entry point for the GMS webapp.
 *
 * Run with:  tsx server.mjs
 *
 * Uses @hono/node-server so the persist layer has full access to the real
 * filesystem (readFileSync / writeFileSync).  All application logic in src/
 * is unchanged — only the HTTP adapter is different from wrangler pages dev.
 */

import { serve } from '@hono/node-server'
import app from './src/index.tsx'

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[GMS] Node.js server listening on http://0.0.0.0:${info.port}`)
})
