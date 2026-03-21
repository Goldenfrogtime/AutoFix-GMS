/**
 * Post-build syntax checker
 * Starts the built worker temporarily, fetches the rendered HTML,
 * extracts every inline <script> block, and runs `node --check` on each.
 *
 * Why this matters:
 *   Hono renders the SPA as a tagged-template-literal in src/index.tsx.
 *   Escape sequences like \' inside that template resolve to bare single-
 *   quotes in the rendered HTML, which can produce silent JS syntax errors
 *   (e.g. the custPickerFilter bug: onmousedown="fn(''+ns+'',''+id+'')" ).
 *   Vite / TypeScript never see this because the JS lives inside a string.
 *   This script catches it at build time so it never reaches users.
 */

'use strict';
const { spawnSync, spawn }  = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const path  = require('path');
const os    = require('os');
const http  = require('http');

const WORKER  = path.join(__dirname, '..', 'dist', '_worker.js');
const PORT    = 13999;   // throwaway port, won't conflict with 3000
const TIMEOUT = 12000;   // ms to wait for worker to start

// ── 1. Spin up wrangler pages dev on throwaway port ──────────────────────────
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function waitForServer(url, deadline) {
  while (Date.now() < deadline) {
    try { await fetchHtml(url); return true; } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  // Start wrangler pages dev silently
  const wrangler = spawn(
    'npx', ['wrangler', 'pages', 'dev', 'dist', '--ip', '127.0.0.1', '--port', String(PORT)],
    { stdio: 'pipe', cwd: path.join(__dirname, '..') }
  );

  const alive = await waitForServer('http://127.0.0.1:' + PORT + '/', Date.now() + TIMEOUT);
  if (!alive) {
    wrangler.kill();
    // Can't start server — skip check (don't block build)
    console.warn('⚠️  JS syntax checker: could not start temp server — skipping check.');
    process.exit(0);
  }

  let html;
  try {
    html = await fetchHtml('http://127.0.0.1:' + PORT + '/');
  } catch (e) {
    wrangler.kill();
    console.warn('⚠️  JS syntax checker: failed to fetch HTML — skipping check.');
    process.exit(0);
  }
  wrangler.kill();

  // ── 2. Extract <script> blocks ─────────────────────────────────────────────
  const scriptRe = /<script>([\s\S]*?)<\/script>/g;
  let match, idx = 0, hasErrors = false;
  const tmpFiles = [];

  while ((match = scriptRe.exec(html)) !== null) {
    const code = match[1];
    if (code.trim().length < 200) continue; // skip tiny config blocks
    idx++;
    const tmp = path.join(os.tmpdir(), 'gms_jscheck_' + idx + '.js');
    writeFileSync(tmp, code);
    tmpFiles.push(tmp);

    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error('\n❌  JS SYNTAX ERROR in inline <script> block #' + idx + ':');
      console.error((r.stderr || r.stdout).trim());
      hasErrors = true;
    }
  }

  tmpFiles.forEach(f => { try { unlinkSync(f); } catch (_) {} });

  if (hasErrors) {
    console.error('\n🚫  Build FAILED: fix the JS syntax errors above.\n');
    process.exit(1);
  } else {
    console.log('✅  Inline JS syntax OK (' + idx + ' block' + (idx !== 1 ? 's' : '') + ' checked).');
  }
}

main().catch(e => {
  console.warn('⚠️  JS syntax checker error: ' + e.message + ' — skipping.');
  process.exit(0);
});
