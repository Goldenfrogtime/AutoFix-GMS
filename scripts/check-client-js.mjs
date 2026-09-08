#!/usr/bin/env node
/**
 * check-client-js.mjs — guards against a whole class of bug that is invisible
 * at build time but fatally breaks the app in the browser.
 *
 * The client-side app lives inside a JS template literal in src/index.tsx.
 * That means every backslash must be DOUBLE-escaped (\\s, not \s) to survive
 * into the served HTML, and a literal "</script" or "</body>" inside a regex
 * will terminate the <script> tag early.
 *
 * `vite build` does NOT catch either problem — the TypeScript is valid, and the
 * damage only appears in the emitted string. A single bad regex takes down the
 * entire app script (e.g. "Invalid regular expression flags"), so the login
 * screen renders but nothing responds.
 *
 * This script fetches the actual served HTML, extracts the inline scripts and
 * parses them the way a browser would.
 *
 * Usage: node scripts/check-client-js.mjs [url]
 */
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const url = process.argv[2] || 'http://localhost:3000'
let html
try {
  html = await (await fetch(url)).text()
} catch (err) {
  console.error(`✗ Could not fetch ${url} — is the server running?`)
  console.error(`  ${err.message}`)
  process.exit(2)
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
if (!scripts.length) {
  console.error('✗ No inline <script> blocks found — did the shell fail to render?')
  process.exit(2)
}

const dir = mkdtempSync(join(tmpdir(), 'gmscheck-'))
let failed = false

scripts.forEach((code, i) => {
  const file = join(dir, `script${i}.js`)
  writeFileSync(file, code)
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
    console.log(`✓ inline script #${i} parses cleanly (${code.length} bytes)`)
  } catch (e) {
    failed = true
    console.error(`\n✗ inline script #${i} FAILED TO PARSE (${code.length} bytes)`)
    console.error(String(e.stderr || e.message).split('\n').slice(0, 12).join('\n'))
  }
})

// Heuristic: char classes that almost certainly lost their backslashes.
const suspects = new Set()
for (const code of scripts) {
  for (const m of code.matchAll(/\/[^/\n]{0,60}\[(sS|Ss|dD|wW)\][^/\n]{0,40}\/[gimsuy]*/g)) {
    suspects.add(m[0].slice(0, 90))
  }
}
if (suspects.size) {
  failed = true
  console.error('\n✗ Regex char classes look like they lost a backslash (\\s\\S -> sS).')
  console.error('  Inside the template literal, write \\\\s\\\\S instead:')
  for (const s of suspects) console.error('   ', s)
}

// A literal "</script" in the emitted JS would have closed the tag early.
for (const [i, code] of scripts.entries()) {
  if (code.includes('</script')) {
    failed = true
    console.error(`\n✗ inline script #${i} contains a literal "</script" — this closes the tag early.`)
  }
}

if (failed) {
  console.error('\nClient JS check FAILED — the app would be broken in the browser.')
  process.exit(1)
}
console.log('\nClient JS check passed ✅')
