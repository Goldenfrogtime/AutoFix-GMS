/**
 * src/index.tsx — Hono application entry point for the GMS Node.js server.
 *
 * Wires together:
 *   - Data persistence (load on startup)
 *   - API routes  (/api/*)
 *   - Static asset serving (/static/*)
 *   - SPA catch-all (serves index HTML for all other routes)
 *
 * Exported as `default` so server.mjs can pass `app.fetch` to @hono/node-server.
 */

import { Hono }        from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

import api             from './routes/api'
import { load }        from './data/persist'

// ── Bootstrap persistence ────────────────────────────────────────────────────
// load() reads gms-data.json into the in-memory store arrays.
// Must run before any request handler touches the store.
load()

// ── Application ──────────────────────────────────────────────────────────────
const app = new Hono()

// Mount the REST API
app.route('/api', api)

// Serve static assets (CSS, images, etc.) from /public/static
app.use('/static/*', serveStatic({ root: './public' }))

// SPA catch-all — serve the main HTML shell for every non-API route
app.get('*', serveStatic({ path: './public/mockup-jobcard.html' }))

export default app
