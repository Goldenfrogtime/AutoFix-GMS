/**
 * src/index.tsx — Hono application entry point.
 *
 * Exported as the default export so that server.mjs (Node.js) can import it
 * and pass `app.fetch` to @hono/node-server.
 *
 * On startup the persist layer is called to restore all in-memory data from
 * gms-data.json (if it exists), so data survives server restarts.
 */

import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { load } from './data/persist'
import api from './routes/api'

// ── Restore persisted data on startup ────────────────────────────────────────
load()

// ── Application ───────────────────────────────────────────────────────────────
const app = new Hono()

// Mount the API router
app.route('/api', api)

// Serve static assets from the public/ directory
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/mockup-jobcard.html', serveStatic({ root: './public' }))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Catch-all: serve a simple ready message
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AutoFix GMS</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <div id="root">
    <p style="font-family:sans-serif;padding:2rem">
      GMS API is running. Use <code>/api</code> endpoints.
    </p>
  </div>
</body>
</html>`)
})

export default app
