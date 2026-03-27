/**
 * persist.ts — File-based persistence for the GMS in-memory store.
 *
 * Stores all runtime data (customers, vehicles, job cards, PFIs, invoices,
 * parts consumption, job services, service packages, expenses, vendors,
 * appointments, notifications, activity log, users, lubricant products,
 * catalogue parts, car wash packages, add-on services) in a single JSON
 * file at DATA_FILE_PATH.
 *
 * • load()  — called once at startup; populates the live arrays from disk.
 * • save()  — called after every mutation; writes the live arrays to disk.
 *             It is synchronous (writeFileSync) so the write always completes
 *             before the HTTP response is sent.
 *
 * The file is stored OUTSIDE the dist/ directory so a fresh build never
 * touches it.  Path: <project-root>/gms-data.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  customers,
  vehicles,
  jobCards,
  pfis,
  partsConsumption,
  invoices,
  servicePackages,
  users,
  activityLog,
  lubricantProducts,
  catalogueParts,
  carWashPackages,
  addOnServices,
  appointments,
  jobServices,
  vendors,
  expenses,
  notifications,
  gatePasses,
  fleetInvoices,
} from './store.js'

// ── Path to the data file ─────────────────────────────────────────────────────
// Resolve relative to this file's compiled location.  In the wrangler pages dev
// runtime the CWD is the project root, so '../gms-data.json' lands next to
// package.json — safely outside dist/.
const DATA_FILE_PATH = resolve(process.cwd(), 'gms-data.json')

// ── Keys that are persisted ───────────────────────────────────────────────────
// Sessions (token→userId) are intentionally NOT persisted: all active sessions
// are invalidated on restart (users simply log in again).
// Catalogue seed data (lubricantProducts, catalogueParts, etc.) IS persisted
// so that stock changes and price edits survive restarts.
const PERSIST_KEYS = [
  'customers',
  'vehicles',
  'jobCards',
  'pfis',
  'partsConsumption',
  'invoices',
  'servicePackages',
  'users',
  'activityLog',
  'lubricantProducts',
  'catalogueParts',
  'carWashPackages',
  'addOnServices',
  'appointments',
  'jobServices',
  'vendors',
  'expenses',
  'notifications',
  'gatePasses',
  'fleetInvoices',
] as const

type PersistKey = typeof PERSIST_KEYS[number]

// Map persist keys → live array references
function getLiveArrays(): Record<PersistKey, unknown[]> {
  return {
    customers,
    vehicles,
    jobCards,
    pfis,
    partsConsumption,
    invoices,
    servicePackages,
    users,
    activityLog,
    lubricantProducts,
    catalogueParts,
    carWashPackages,
    addOnServices,
    appointments,
    jobServices,
    vendors,
    expenses,
    notifications,
    gatePasses,
    fleetInvoices,
  }
}

// ── load ──────────────────────────────────────────────────────────────────────
/**
 * Read gms-data.json and splice the saved rows into every live array.
 * Called ONCE on server startup (from store.ts bottom).
 * Safe to call even if the file does not exist yet.
 */
export function load(): void {
  if (!existsSync(DATA_FILE_PATH)) {
    console.log('[GMS persist] No saved data file found — starting fresh.')
    return
  }

  try {
    const raw = readFileSync(DATA_FILE_PATH, 'utf-8')
    const saved: Partial<Record<PersistKey, unknown[]>> = JSON.parse(raw)
    const live = getLiveArrays()

    let totalLoaded = 0
    for (const key of PERSIST_KEYS) {
      const arr = saved[key]
      if (Array.isArray(arr) && arr.length > 0) {
        // Replace contents of the live array without losing the reference
        live[key].splice(0, live[key].length, ...arr)
        totalLoaded += arr.length
      }
    }
    console.log(`[GMS persist] Loaded ${totalLoaded} records from ${DATA_FILE_PATH}`)
  } catch (err) {
    console.error('[GMS persist] Failed to load data file — starting fresh.', err)
  }
}

// ── save ──────────────────────────────────────────────────────────────────────
/**
 * Serialise all live arrays to gms-data.json.
 * Called after every mutation in api.ts.
 */
export function save(): void {
  try {
    const live = getLiveArrays()
    const snapshot: Partial<Record<PersistKey, unknown[]>> = {}
    for (const key of PERSIST_KEYS) {
      snapshot[key] = live[key]
    }
    writeFileSync(DATA_FILE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8')
  } catch (err) {
    console.error('[GMS persist] Failed to save data file.', err)
  }
}
