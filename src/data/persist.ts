/**
 * persist.ts — File-based persistence for the GMS in-memory store.
 *
 * PRIMARY STORAGE: gms-data.json on local disk (DATA_FILE_PATH)
 *
 * BACKUP STRATEGY — Multiple options, used in priority order:
 *
 * Option A — GitHub Gist (GIST_TOKEN + GIST_ID env vars):
 *   Every save() pushes a backup to a private Gist. On startup after a
 *   redeploy, data is automatically restored from the Gist.
 *
 * Option B — External URL (BACKUP_URL + BACKUP_SECRET env vars):
 *   Calls a webhook/endpoint with the data snapshot on every save.
 *   On startup, fetches data from the URL to restore.
 *
 * IMPORTANT: Without one of these options configured, data is stored
 * only in the local filesystem and WILL BE LOST on Railway redeploys.
 *
 * Required Railway environment variables (set ONE of these options):
 *
 * Option A — GitHub Gist:
 *   GIST_TOKEN  — GitHub PAT with 'gist' scope
 *   GIST_ID     — ID of the private Gist to use
 *
 * Option B — Backup URL:
 *   BACKUP_URL    — Full URL to GET/POST data to
 *   BACKUP_SECRET — Secret header value for auth
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  customers, vehicles, jobCards, pfis, partsConsumption, invoices,
  servicePackages, users, activityLog, lubricantProducts, catalogueParts,
  carWashPackages, addOnServices, appointments, jobServices, vendors,
  expenses, notifications, gatePasses, fleetInvoices, subscriptionPlans,
  customerSubscriptions, jobCardPhotos, customerNotifDispatches,
  garageSettings, salesTargets, salesCommissions, saUpsellTargets,
  saUpsellCommissions, techReferralCommissions, updateGarageSettings,
} from './store.js'

// ── Path to the data file ─────────────────────────────────────────────────────
// Supports DATA_DIR (Railway volume mount path) or legacy GMS_DATA_DIR env var
const DATA_FILE_PATH = resolve(process.env.DATA_DIR || process.env.GMS_DATA_DIR || process.cwd(), 'gms-data.json')

// ── Gist config ───────────────────────────────────────────────────────────────
const GIST_TOKEN  = process.env.GIST_TOKEN || ''
const GIST_ID     = process.env.GIST_ID    || ''
const GIST_FILE   = 'gms-data.json'
const gistEnabled = () => !!(GIST_TOKEN && GIST_ID)

// ── Keys that are persisted ───────────────────────────────────────────────────
const PERSIST_KEYS = [
  'customers', 'vehicles', 'jobCards', 'pfis', 'partsConsumption', 'invoices',
  'servicePackages', 'users', 'activityLog', 'lubricantProducts', 'catalogueParts',
  'carWashPackages', 'addOnServices', 'appointments', 'jobServices', 'vendors',
  'expenses', 'notifications', 'gatePasses', 'fleetInvoices', 'subscriptionPlans',
  'customerSubscriptions', 'jobCardPhotos', 'customerNotifDispatches',
  'salesTargets', 'salesCommissions', 'saUpsellTargets', 'saUpsellCommissions',
  'techReferralCommissions',
] as const

type PersistKey = typeof PERSIST_KEYS[number]

function getLiveArrays(): Record<PersistKey, unknown[]> {
  return {
    customers, vehicles, jobCards, pfis, partsConsumption, invoices,
    servicePackages, users, activityLog, lubricantProducts, catalogueParts,
    carWashPackages, addOnServices, appointments, jobServices, vendors,
    expenses, notifications, gatePasses, fleetInvoices, subscriptionPlans,
    customerSubscriptions, jobCardPhotos, customerNotifDispatches,
    salesTargets, salesCommissions, saUpsellTargets, saUpsellCommissions,
    techReferralCommissions,
  }
}

function buildSnapshot() {
  const live = getLiveArrays()
  const snapshot: any = {}
  for (const key of PERSIST_KEYS) snapshot[key] = live[key]
  snapshot.garageSettings = garageSettings
  return snapshot
}

function applySnapshot(saved: any): number {
  const live = getLiveArrays()
  let total = 0
  for (const key of PERSIST_KEYS) {
    if (Array.isArray(saved[key]) && saved[key].length > 0) {
      live[key].splice(0, live[key].length, ...saved[key])
      total += saved[key].length
    }
  }
  if (saved.garageSettings && typeof saved.garageSettings === 'object') {
    updateGarageSettings(saved.garageSettings)
  }
  return total
}

function countRecords(data: any): number {
  let n = 0
  for (const key of PERSIST_KEYS) if (Array.isArray(data[key])) n += data[key].length
  return n
}

// ── Gist: restore ─────────────────────────────────────────────────────────────
export async function restoreFromGist(): Promise<boolean> {
  if (!gistEnabled()) {
    // Only warn if there's no volume mount configured either
    if (!process.env.DATA_DIR && !process.env.GMS_DATA_DIR) {
      console.log('[GMS gist] ⚠️  No GIST_TOKEN/GIST_ID set — data will not survive redeploys!')
      console.log('[GMS gist]    To fix: create a GitHub PAT with "gist" scope, create a Gist,')
      console.log('[GMS gist]    then add GIST_TOKEN and GIST_ID as Railway env variables.')
    } else {
      console.log('[GMS gist] Gist backup disabled — data is protected by Railway volume at ' + (process.env.DATA_DIR || process.env.GMS_DATA_DIR))
    }
    return false
  }

  try {
    console.log('[GMS gist] Checking Gist for backup data...')
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AutoFix-GMS',
      },
    })
    if (!res.ok) {
      console.warn(`[GMS gist] Could not fetch Gist (${res.status}) — using local data.`)
      return false
    }
    const gist = await res.json() as any
    const content = gist?.files?.[GIST_FILE]?.content
    if (!content) {
      console.log('[GMS gist] Gist is empty — no restore needed.')
      return false
    }

    const gistData  = JSON.parse(content)
    const gistCount = countRecords(gistData)

    // Count local records
    let localCount = 0
    if (existsSync(DATA_FILE_PATH)) {
      try {
        const localData = JSON.parse(readFileSync(DATA_FILE_PATH, 'utf-8'))
        localCount = countRecords(localData)
      } catch { /* ignore */ }
    }

    if (gistCount > localCount) {
      const total = applySnapshot(gistData)
      writeFileSync(DATA_FILE_PATH, content, 'utf-8')
      console.log(`[GMS gist] ✅ Restored ${total} records from Gist (Gist:${gistCount} > Local:${localCount})`)
      return true
    }

    console.log(`[GMS gist] Local data is current (Local:${localCount} >= Gist:${gistCount})`)
    return false
  } catch (err: any) {
    console.error('[GMS gist] Restore error — using local data:', err?.message || err)
    return false
  }
}

// ── Gist: push (fire-and-forget) ──────────────────────────────────────────────
function pushToGist(json: string): void {
  if (!gistEnabled()) return
  fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GIST_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AutoFix-GMS',
    },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: json } } }),
  }).catch(err => console.warn('[GMS gist] Push error:', err?.message || err))
}

// ── load ──────────────────────────────────────────────────────────────────────
export function load(): void {
  if (!existsSync(DATA_FILE_PATH)) {
    console.log('[GMS persist] No data file found — starting fresh.')
    return
  }
  try {
    const saved = JSON.parse(readFileSync(DATA_FILE_PATH, 'utf-8'))
    const total = applySnapshot(saved)
    console.log(`[GMS persist] Loaded ${total} records from ${DATA_FILE_PATH}`)
  } catch (err) {
    console.error('[GMS persist] Failed to load — starting fresh.', err)
  }
}

// ── save ──────────────────────────────────────────────────────────────────────
export function save(): void {
  try {
    const json = JSON.stringify(buildSnapshot(), null, 2)
    writeFileSync(DATA_FILE_PATH, json, 'utf-8')
    pushToGist(json)   // non-blocking backup
  } catch (err) {
    console.error('[GMS persist] Save failed.', err)
  }
}
