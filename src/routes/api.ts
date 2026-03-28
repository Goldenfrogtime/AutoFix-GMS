import { Hono } from 'hono'
import {
  customers, vehicles, jobCards, pfis, partsConsumption,
  invoices, servicePackages, users, activityLog, sessions,
  oilServiceProducts, catalogueParts, carWashPackages, addOnServices, appointments,
  jobServices, expenses, notifications, lubricantProducts, vendors, gatePasses,
  fleetInvoices,
  subscriptionPlans,
  customerSubscriptions,
  ROLE_PERMISSIONS,
  type Customer, type Vehicle, type JobCard, type PFI,
  type PartConsumption, type ServicePackage, type User, type Invoice,
  type CataloguePart, type CarWashPackage, type AddOnService, type Appointment,
  type JobService, type Expense, type Notification, type NotificationType, type NotificationPriority,
  type LubricantProduct, type Permission, type StatusTimelineEntry, type JobCardStatus, type Vendor,
  type GatePass, type FleetInvoice, type FleetInvoiceLineItem,
  type SubscriptionPlan, type CustomerSubscription, type SubscriptionStatus
} from '../data/store'
import { save } from '../data/persist'

const api = new Hono()

// ─── Auto-persist middleware ─────────────────────────────────────────────────
// After every mutating request (POST, PUT, PATCH, DELETE) that returns a
// successful response (status < 400), write all live arrays to disk so that
// data survives a server restart.
api.use('*', async (c, next) => {
  await next()
  const method = c.req.method
  if (method !== 'GET' && method !== 'HEAD') {
    const status = c.res.status
    if (status < 400) {
      save()
    }
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).substring(2, 10)
}
function now() {
  return new Date().toISOString()
}
// Generate a sequential batch number: BAT-YYYY-NNNN
// Starts at 77 to continue from the 76 pre-seeded catalogue items (lub-001..019 = 0001-0019, parts af1..of17 = 0020-0076)
let _batchCounter = 77
function genBatchNumber() {
  const year = new Date().getFullYear()
  const seq  = String(_batchCounter++).padStart(4, '0')
  return `BAT-${year}-${seq}`
}

// ─── Working-Time Calculator ─────────────────────────────────────────────────
// Working hours: 08:00–18:00, Mon–Sun (all 7 days)
const WORK_START_H = 8   // 08:00
const WORK_END_H   = 18  // 18:00
const WORK_MINS_PER_DAY = (WORK_END_H - WORK_START_H) * 60  // 600 mins

/**
 * Returns the number of working minutes between two ISO timestamps.
 * Working hours: 08:00–18:00 every day (Mon–Sun).
 */
function workingMinutes(fromISO: string, toISO: string): number {
  const from = new Date(fromISO)
  const to   = new Date(toISO)
  if (to <= from) return 0

  let total = 0
  // Walk day by day from `from` to `to`
  const cursor = new Date(from)

  while (cursor < to) {
    // Working window for this calendar day
    const dayStart = new Date(cursor)
    dayStart.setHours(WORK_START_H, 0, 0, 0)
    const dayEnd = new Date(cursor)
    dayEnd.setHours(WORK_END_H, 0, 0, 0)

    // Clamp the interval [from, to] to [dayStart, dayEnd]
    const windowStart = cursor < dayStart ? dayStart : cursor
    const windowEnd   = to    < dayEnd   ? to       : dayEnd

    if (windowEnd > windowStart) {
      total += (windowEnd.getTime() - windowStart.getTime()) / 60000
    }

    // Advance cursor to the start of next working day
    cursor.setDate(cursor.getDate() + 1)
    cursor.setHours(WORK_START_H, 0, 0, 0)
  }
  return Math.round(total)
}

/** Format minutes → human string e.g. "2d 3h 15m" */
function fmtDuration(mins: number): string {
  if (mins <= 0) return '0m'
  const d = Math.floor(mins / (WORK_MINS_PER_DAY))
  const h = Math.floor((mins % WORK_MINS_PER_DAY) / 60)
  const m = mins % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || parts.length === 0) parts.push(`${m}m`)
  return parts.join(' ')
}

/** Open a new timeline entry (called on job create or status change) */
function openTimelineEntry(jc: JobCard, status: JobCardStatus, timestamp: string): StatusTimelineEntry {
  return { status, enteredAt: timestamp, technician: jc.assignedTechnician || undefined }
}

/** Close the current open timeline entry in-place and return duration */
function closeTimelineEntry(entry: StatusTimelineEntry, exitTimestamp: string): number {
  entry.exitedAt    = exitTimestamp
  entry.durationMins = workingMinutes(entry.enteredAt, exitTimestamp)
  return entry.durationMins
}

// ─── Auth / RBAC Helpers ─────────────────────────────────────────────────────
function getSessionUser(c: any): User | null {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (c.req.query('_token') || '')
  if (!token) return null
  const userId = sessions.get(token)
  if (!userId) return null
  return users.find(u => u.id === userId && u.active) || null
}

function can(user: User | null, permission: Permission): boolean {
  if (!user) return false
  const perms = ROLE_PERMISSIONS[user.role] || []
  return perms.includes(permission)
}

// Strip password from user before sending to client
function safeUser(u: User) {
  const { password, ...rest } = u as any
  return rest
}

// ─── Notification Helper ─────────────────────────────────────────────────────
function addNotification(
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  message: string,
  meta?: {
    jobCardId?: string
    jobCardNumber?: string
    entityId?: string
    entityType?: string
  }
): Notification {
  const n: Notification = {
    id: 'n' + genId(),
    type,
    priority,
    title,
    message,
    read: false,
    jobCardId: meta?.jobCardId,
    jobCardNumber: meta?.jobCardNumber,
    entityId: meta?.entityId,
    entityType: meta?.entityType,
    createdAt: now(),
  }
  notifications.unshift(n)          // newest first
  if (notifications.length > 200)   // cap at 200 entries
    notifications.splice(200)
  return n
}

// ─── Sync PFI + Invoice after parts/services change ─────────────────────────
// Called whenever services or parts are added or removed from a job.
// Recalculates the live parts/services totals and updates:
//   • the job's PFI (partsCost, totalEstimate) — preserving discount & labour
//   • the job's Invoice (partsCost, tax, totalAmount) — only if not yet Paid
function syncJobFinancials(jobCardId: string) {
  const liveParts    = partsConsumption.filter(p => p.jobCardId === jobCardId)
  const liveServices = jobServices.filter(s => s.jobCardId === jobCardId)
  const livePartsCost    = liveParts.reduce((s, p) => s + p.totalCost, 0)
  const liveServicesCost = liveServices.reduce((s, sv) => s + sv.totalCost, 0)
  const liveBillable = livePartsCost + liveServicesCost  // = partsCost in PFI/Invoice

  // ── Update PFI ──────────────────────────────────────────────────────────────
  const pfiIdx = pfis.findIndex(p => p.jobCardId === jobCardId)
  if (pfiIdx !== -1) {
    const pfi = pfis[pfiIdx]
    const subtotal = (pfi.labourCost || 0) + liveBillable
    let discountAmount = 0
    if (pfi.discountType === 'percentage' && pfi.discountValue) {
      discountAmount = Math.round(subtotal * Math.min(pfi.discountValue, 100) / 100)
    } else if (pfi.discountType === 'fixed' && pfi.discountValue) {
      discountAmount = Math.min(Math.round(pfi.discountValue), subtotal)
    } else {
      discountAmount = pfi.discountAmount || 0
    }
    const pfiTotalEstimate = Math.max(0, subtotal - discountAmount)
    const pfiTax           = Math.round(pfiTotalEstimate * 0.18)
    const pfiTotalAmount   = pfiTotalEstimate + pfiTax
    pfis[pfiIdx] = {
      ...pfi,
      partsCost:     liveBillable,
      discountAmount,
      totalEstimate: pfiTotalEstimate,
      tax:           pfiTax,
      totalAmount:   pfiTotalAmount,
    }
  }

  // ── Update Invoice (only if not fully Paid) ─────────────────────────────────
  const invIdx = invoices.findIndex(inv => inv.jobCardId === jobCardId)
  if (invIdx !== -1) {
    const inv = invoices[invIdx]
    if (inv.status !== 'Paid') {
      const subtotal = (inv.labourCost || 0) + liveBillable
      const discountAmount = inv.discountAmount || 0
      const afterDiscount  = Math.max(0, subtotal - discountAmount)
      const tax            = Math.round(afterDiscount * 0.18)
      const totalAmount    = afterDiscount + tax
      invoices[invIdx] = {
        ...inv,
        partsCost:  liveBillable,
        tax,
        totalAmount,
        updatedAt:  now(),
      }
    }
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
api.get('/dashboard', (c) => {
  const active = jobCards.filter(j => !['COMPLETED', 'INVOICED', 'RELEASED'].includes(j.status)).length
  const inProgress = jobCards.filter(j => j.status === 'REPAIR_IN_PROGRESS').length
  const awaitingApproval = jobCards.filter(j => j.status === 'AWAITING_INSURER_APPROVAL').length
  const completed = jobCards.filter(j => j.status === 'COMPLETED').length
  const readyPickup = jobCards.filter(j => j.status === 'RELEASED').length
  const pendingInvoices = jobCards.filter(j => j.status === 'INVOICED').length
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0)
  const recentJobs = [...jobCards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(j => {
    const v = vehicles.find(v => v.id === j.vehicleId)
    const cu = customers.find(cx => cx.id === j.customerId)
    return { ...j, vehicleReg: v?.registrationNumber, vehicleMake: v?.make, vehicleModel: v?.model, customerName: cu?.name }
  })
  return c.json({ active, inProgress, awaitingApproval, completed, readyPickup, pendingInvoices, totalRevenue, recentJobs })
})

// ─── Customers ──────────────────────────────────────────────────────────────
api.get('/customers', (c) => {
  const typeFilter = c.req.query('type') // 'Individual' | 'Corporate'
  let list = customers
  if (typeFilter) list = list.filter(cu => cu.customerType === typeFilter)
  const withVehicles = list.map(cu => ({
    ...cu,
    vehicleCount: vehicles.filter(v => v.customerId === cu.id).length,
    jobCount: jobCards.filter(j => j.customerId === cu.id).length
  }))
  return c.json(withVehicles)
})

api.get('/customers/:id', (c) => {
  const cu = customers.find(x => x.id === c.req.param('id'))
  if (!cu) return c.json({ error: 'Not found' }, 404)
  const cvs = vehicles.filter(v => v.customerId === cu.id)
  const jobs = jobCards.filter(j => j.customerId === cu.id)
  return c.json({ ...cu, vehicles: cvs, jobs })
})

api.post('/customers', async (c) => {
  const body = await c.req.json<Omit<Customer, 'id' | 'createdAt'>>()
  const newCustomer: Customer = { ...body, id: 'c' + genId(), createdAt: now() }
  customers.push(newCustomer)
  return c.json(newCustomer, 201)
})

api.put('/customers/:id', async (c) => {
  const idx = customers.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<Customer>>()
  customers[idx] = { ...customers[idx], ...body }
  return c.json(customers[idx])
})

api.delete('/customers/:id', (c) => {
  const idx = customers.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  customers.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Vehicles ───────────────────────────────────────────────────────────────
api.get('/vehicles', (c) => {
  const withCustomer = vehicles.map(v => ({
    ...v, customerName: customers.find(cu => cu.id === v.customerId)?.name
  }))
  return c.json(withCustomer)
})

api.get('/vehicles/:id', (c) => {
  const v = vehicles.find(x => x.id === c.req.param('id'))
  if (!v) return c.json({ error: 'Not found' }, 404)
  const cu = customers.find(x => x.id === v.customerId)
  const jobs = jobCards.filter(j => j.vehicleId === v.id)
  return c.json({ ...v, customer: cu, jobs })
})

api.post('/vehicles', async (c) => {
  const body = await c.req.json<Omit<Vehicle, 'id' | 'createdAt'>>()
  const newVehicle: Vehicle = { ...body, id: 'v' + genId(), createdAt: now() }
  vehicles.push(newVehicle)
  return c.json(newVehicle, 201)
})

api.post('/vehicles/bulk', async (c) => {
  const body = await c.req.json<{ customerId: string; vehicles: Omit<Vehicle, 'id' | 'createdAt' | 'customerId'>[] }>()
  if (!body.customerId || !Array.isArray(body.vehicles) || body.vehicles.length === 0) {
    return c.json({ error: 'customerId and vehicles array required' }, 400)
  }
  const customer = customers.find(x => x.id === body.customerId)
  if (!customer) return c.json({ error: 'Customer not found' }, 404)
  const created: Vehicle[] = []
  for (const v of body.vehicles) {
    if (!v.registrationNumber || !v.make || !v.model || !v.year) continue
    const newVehicle: Vehicle = { ...v, customerId: body.customerId, id: 'v' + genId(), createdAt: now() }
    vehicles.push(newVehicle)
    created.push(newVehicle)
  }
  return c.json({ imported: created.length, skipped: body.vehicles.length - created.length, vehicles: created }, 201)
})

api.put('/vehicles/:id', async (c) => {
  const idx = vehicles.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<Vehicle>>()
  vehicles[idx] = { ...vehicles[idx], ...body }
  return c.json(vehicles[idx])
})

api.delete('/vehicles/:id', (c) => {
  const idx = vehicles.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  vehicles.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Job Cards ───────────────────────────────────────────────────────────────
api.get('/jobcards', (c) => {
  const status = c.req.query('status')
  const filtered = status ? jobCards.filter(j => j.status === status) : jobCards
  const enriched = filtered.map(j => {
    const v = vehicles.find(x => x.id === j.vehicleId)
    const cu = customers.find(x => x.id === j.customerId)
    const tech = users.find(x => x.id === j.assignedTechnician)
    return { ...j, vehicle: v, customer: cu, technicianName: tech?.name }
  })
  return c.json([...enriched].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
})

api.get('/jobcards/:id', (c) => {
  const j = jobCards.find(x => x.id === c.req.param('id'))
  if (!j) return c.json({ error: 'Not found' }, 404)
  const v = vehicles.find(x => x.id === j.vehicleId)
  const cu = customers.find(x => x.id === j.customerId)
  const tech = users.find(x => x.id === j.assignedTechnician)
  const pfi = pfis.find(x => x.jobCardId === j.id)
  const parts = partsConsumption.filter(x => x.jobCardId === j.id)
  const services = jobServices.filter(x => x.jobCardId === j.id)
  const invoice = invoices.find(x => x.jobCardId === j.id)
  const logs = activityLog.filter(x => x.jobCardId === j.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return c.json({ ...j, vehicle: v, customer: cu, technicianName: tech?.name, pfi, parts, services, invoice, logs })
})

// GET /jobcards/:id/timeline — returns timeline entries with enriched data
api.get('/jobcards/:id/timeline', (c) => {
  const j = jobCards.find(x => x.id === c.req.param('id'))
  if (!j) return c.json({ error: 'Not found' }, 404)
  const tsNow = now()
  // Enrich timeline: for the open (current) entry, compute live duration
  const timeline = (j.statusTimeline || []).map(entry => {
    const durationMins = entry.exitedAt
      ? (entry.durationMins ?? workingMinutes(entry.enteredAt, entry.exitedAt))
      : workingMinutes(entry.enteredAt, tsNow)
    const techUser = entry.technician ? users.find(u => u.id === entry.technician) : null
    return {
      ...entry,
      durationMins,
      durationFormatted: fmtDuration(durationMins),
      isOpen: !entry.exitedAt,
      technicianName: techUser?.name || entry.technician || null
    }
  })
  // Total TAT: sum of completed entries + current open entry time
  const totalMins = j.totalTATMins != null
    ? j.totalTATMins
    : workingMinutes(j.createdAt, tsNow)
  return c.json({
    jobCardId: j.id,
    jobCardNumber: j.jobCardNumber,
    currentStatus: j.status,
    createdAt: j.createdAt,
    completedAt: j.completedAt || null,
    totalTATMins: totalMins,
    totalTATFormatted: fmtDuration(totalMins),
    timeline,
    workingHours: `${WORK_START_H}:00–${WORK_END_H}:00, Mon–Sun`
  })
})

api.post('/jobcards', async (c) => {
  const body = await c.req.json<Omit<JobCard, 'id' | 'jobCardNumber' | 'status' | 'createdAt' | 'updatedAt'>>()
  const num = 'GMS-' + new Date().getFullYear() + '-' + String(jobCards.length + 1).padStart(3, '0')
  const ts = now()
  // Open first timeline entry at RECEIVED
  const firstEntry: StatusTimelineEntry = {
    status: 'RECEIVED',
    enteredAt: ts,
    technician: body.assignedTechnician || undefined
  }
  // Record technicianAssignedAt if a technician is already assigned
  const techAssignedAt = body.assignedTechnician ? ts : undefined
  const newJob: JobCard = {
    ...body,
    id: 'j' + genId(),
    jobCardNumber: num,
    status: 'RECEIVED',
    statusTimeline: [firstEntry],
    technicianAssignedAt: techAssignedAt,
    createdAt: ts,
    updatedAt: ts
  }
  jobCards.push(newJob)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'JOB_CREATED', description: 'New job card created', userId: 'u3', userName: 'System', timestamp: ts })
  const cust = customers.find(x => x.id === newJob.customerId)
  const veh  = vehicles.find(x => x.id === newJob.vehicleId)
  addNotification('job_created', 'info', 'New Job Card Created',
    `${num} opened for ${cust?.name || 'customer'} – ${veh?.make || ''} ${veh?.model || ''} (${veh?.registrationNumber || ''})`,
    { jobCardId: newJob.id, jobCardNumber: num })

  // ── Auto-create Entry Gate Pass ─────────────────────────────────────────────
  const gpNum = 'GMS-GP-' + new Date().getFullYear() + '-' + String(gatePasses.length + 1).padStart(3, '0')
  const entryGP: GatePass = {
    id: 'gp' + genId(),
    passNumber: gpNum,
    jobCardId: newJob.id,
    jobCardNumber: num,
    vehicleReg: veh?.registrationNumber || body.vehicleReg || '',
    vehicleMake: veh?.make,
    vehicleModel: veh?.model,
    vehicleYear: veh?.year,
    vehicleColor: veh?.color,
    customerName: cust?.name || '',
    customerPhone: cust?.phone,
    entryTime: ts,
    status: 'Active',
    createdAt: ts,
    updatedAt: ts,
  }
  gatePasses.push(entryGP)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'GATE_PASS_ENTRY', description: `Entry Gate Pass ${gpNum} issued`, userId: 'u3', userName: 'System', timestamp: ts })

  return c.json(newJob, 201)
})

api.patch('/jobcards/:id/status', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { status } = await c.req.json<{ status: string }>()
  const old = jobCards[idx].status
  const ts = now()

  // ── Timeline: close the current open entry, open a new one ──────────────
  const timeline: StatusTimelineEntry[] = jobCards[idx].statusTimeline
    ? [...jobCards[idx].statusTimeline!]
    : []
  // Close the last open entry (no exitedAt yet)
  const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
  if (openEntry) {
    closeTimelineEntry(openEntry, ts)
  }
  // Open new entry for the new status
  const newEntry = openTimelineEntry(jobCards[idx], status as JobCardStatus, ts)
  timeline.push(newEntry)

  // Compute total TAT when reaching COMPLETED
  let completedAt = jobCards[idx].completedAt
  let totalTATMins = jobCards[idx].totalTATMins
  if (status === 'COMPLETED') {
    completedAt = ts
    totalTATMins = workingMinutes(jobCards[idx].createdAt, ts)
  }

  jobCards[idx] = {
    ...jobCards[idx],
    status: status as any,
    statusTimeline: timeline,
    completedAt,
    totalTATMins,
    updatedAt: ts
  }
  activityLog.push({ id: 'a' + genId(), jobCardId: jobCards[idx].id, action: 'STATUS_CHANGE', description: `Status changed from ${old} to ${status}`, userId: 'u2', userName: 'System', timestamp: ts })
  const jc = jobCards[idx]
  const statusLabels: Record<string, string> = {
    RECEIVED: 'Received', INSPECTION: 'Under Inspection', PFI_PREPARATION: 'PFI Preparation',
    AWAITING_INSURER_APPROVAL: 'Awaiting Insurer Approval', REPAIR_IN_PROGRESS: 'Repair In Progress',
    WAITING_FOR_PARTS: 'Waiting for Parts', QUALITY_CHECK: 'Quality Check',
    COMPLETED: 'Completed', INVOICED: 'Invoiced', RELEASED: 'Released'
  }
  const isCompleted = status === 'COMPLETED'
  const isWaiting   = status === 'WAITING_FOR_PARTS' || status === 'AWAITING_INSURER_APPROVAL'
  const priority: NotificationPriority = isCompleted ? 'success' : isWaiting ? 'warning' : 'info'
  const type: NotificationType = isCompleted ? 'job_completed' : 'job_status'
  addNotification(type, priority,
    isCompleted ? 'Job Completed ✔' : `Status: ${statusLabels[status] || status}`,
    `${jc.jobCardNumber} moved to ${statusLabels[status] || status}`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })

  // ── Check if gate pass should move to Pending Exit ───────────────────────
  if (isCompleted) {
    const relatedInvoice = invoices.find(i => i.jobCardId === jc.id)
    const isPaid = relatedInvoice?.status === 'Paid'
    const gp = gatePasses.find(g => g.jobCardId === jc.id && g.status === 'Active')
    if (gp && isPaid) {
      gp.status = 'Pending Exit'
      gp.updatedAt = ts
      addNotification('gate_pass_exit_pending', 'warning', 'Exit Gate Pass Pending Approval',
        `${jc.jobCardNumber} is completed & paid — please approve exit for ${gp.vehicleReg}`,
        { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: gp.id, entityType: 'gate_pass' })
    }
  }

  return c.json(jobCards[idx])
})

// ─── Reopen a Job Card ───────────────────────────────────────────────────────
// Allowed from: RELEASED, COMPLETED, INVOICED
// Sets status back to REPAIR_IN_PROGRESS, records reason, increments reopenCount
api.post('/jobcards/:id/reopen', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]

  const REOPENABLE = ['RELEASED', 'COMPLETED', 'INVOICED']
  if (!REOPENABLE.includes(jc.status)) {
    return c.json({ error: `Job card cannot be reopened from status: ${jc.status}. Only RELEASED, COMPLETED, or INVOICED jobs can be reopened.` }, 400)
  }

  const { reason } = await c.req.json<{ reason: string }>()
  if (!reason || !reason.trim()) {
    return c.json({ error: 'A reason is required to reopen a job card' }, 400)
  }

  const ts = now()
  const prevStatus = jc.status
  const newStatus: JobCardStatus = 'REPAIR_IN_PROGRESS'

  // ── Timeline: close current open entry, open new REPAIR_IN_PROGRESS entry ──
  const timeline: StatusTimelineEntry[] = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, newStatus, ts))

  jobCards[idx] = {
    ...jc,
    status: newStatus,
    statusTimeline: timeline,
    reopenCount: (jc.reopenCount || 0) + 1,
    reopenedAt: ts,
    reopenReason: reason.trim(),
    updatedAt: ts,
  }

  // ── Activity log ────────────────────────────────────────────────────────────
  activityLog.push({
    id: 'a' + genId(),
    jobCardId: jc.id,
    action: 'STATUS_CHANGE',
    description: `Job card reopened from ${prevStatus} → REPAIR_IN_PROGRESS. Reason: ${reason.trim()}`,
    userId: 'system',
    userName: 'System',
    timestamp: ts,
  })

  // ── Notification ────────────────────────────────────────────────────────────
  addNotification(
    'job_status', 'warning',
    `Job Card Reopened – ${jc.jobCardNumber}`,
    `Moved from ${prevStatus} back to Repair In Progress. Reason: ${reason.trim()}`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber }
  )

  return c.json(jobCards[idx])
})

api.put('/jobcards/:id', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<JobCard>>()
  const ts = now()
  // If technician is being assigned or changed, record the timestamp and update the current open timeline entry
  const technicianChanged = body.assignedTechnician && body.assignedTechnician !== jobCards[idx].assignedTechnician
  let timeline = jobCards[idx].statusTimeline ? [...jobCards[idx].statusTimeline!] : []
  if (technicianChanged) {
    // Update the technician in the most recent open timeline entry
    const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
    if (openEntry) {
      openEntry.technician = body.assignedTechnician
    }
  }
  jobCards[idx] = {
    ...jobCards[idx],
    ...body,
    statusTimeline: timeline,
    technicianAssignedAt: technicianChanged ? ts : (jobCards[idx].technicianAssignedAt || (body.assignedTechnician ? ts : undefined)),
    updatedAt: ts
  }
  return c.json(jobCards[idx])
})

// ─── PFIs ────────────────────────────────────────────────────────────────────
api.get('/pfis', (c) => c.json(pfis))

api.post('/jobcards/:id/pfi', async (c) => {
  const body = await c.req.json<Omit<PFI, 'id' | 'jobCardId' | 'createdAt'>>()
  const ts = now()

  // ── Resolve discount ─────────────────────────────────────────────────────
  const subtotal = (body.labourCost || 0) + (body.partsCost || 0)
  let discountAmount = 0
  if (body.discountType === 'percentage' && body.discountValue) {
    discountAmount = Math.round(subtotal * Math.min(body.discountValue, 100) / 100)
  } else if (body.discountType === 'fixed' && body.discountValue) {
    discountAmount = Math.min(Math.round(body.discountValue), subtotal)
  }
  const totalEstimate = Math.max(0, subtotal - discountAmount)
  const tax           = Math.round(totalEstimate * 0.18)
  const totalAmount   = totalEstimate + tax

  const newPFI: PFI = {
    ...body,
    id: 'p' + genId(),
    jobCardId: c.req.param('id'),
    discountAmount,
    totalEstimate,
    tax,
    totalAmount,
    createdAt: ts
  }
  pfis.push(newPFI)
  const jIdx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (jIdx !== -1) {
    // Close current timeline entry and open PFI_PREPARATION
    const timeline: StatusTimelineEntry[] = jobCards[jIdx].statusTimeline
      ? [...jobCards[jIdx].statusTimeline!]
      : []
    const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
    if (openEntry) closeTimelineEntry(openEntry, ts)
    timeline.push(openTimelineEntry(jobCards[jIdx], 'PFI_PREPARATION', ts))
    jobCards[jIdx].status = 'PFI_PREPARATION'
    jobCards[jIdx].statusTimeline = timeline
    jobCards[jIdx].updatedAt = ts
  }
  const jc = jobCards[jIdx]
  const discountNote = discountAmount > 0 ? ` (discount: TZS ${discountAmount.toLocaleString()})` : ''
  if (jc) addNotification('pfi_created', 'info', 'PFI Created',
    `Pro Forma Invoice created for ${jc.jobCardNumber} — TZS ${newPFI.totalEstimate.toLocaleString()}${discountNote}`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: newPFI.id, entityType: 'pfi' })
  return c.json(newPFI, 201)
})

api.patch('/pfi/:id', async (c) => {
  const idx = pfis.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<PFI>>()
  const merged = { ...pfis[idx], ...body }
  // Recalculate discountAmount and totalEstimate if any cost/discount field changed.
  // Tax is accepted directly from the body if supplied; otherwise keep existing value.
  if (body.discountType !== undefined || body.discountValue !== undefined || body.labourCost !== undefined || body.partsCost !== undefined) {
    const subtotal = (merged.labourCost || 0) + (merged.partsCost || 0)
    let discountAmount = 0
    if (merged.discountType === 'percentage' && merged.discountValue) {
      discountAmount = Math.round(subtotal * Math.min(merged.discountValue, 100) / 100)
    } else if (merged.discountType === 'fixed' && merged.discountValue) {
      discountAmount = Math.min(Math.round(merged.discountValue), subtotal)
    }
    merged.discountAmount = discountAmount
    merged.totalEstimate  = Math.max(0, subtotal - discountAmount)
    // Use the tax value from the request body if explicitly provided (allows 0);
    // otherwise fall back to the existing stored tax.
    merged.tax        = (body.tax !== undefined) ? body.tax : merged.tax
    merged.totalAmount = merged.totalEstimate + merged.tax
  } else if (body.tax !== undefined) {
    // Tax-only update (e.g. toggling VAT on/off without changing costs)
    merged.tax        = body.tax
    merged.totalAmount = merged.totalEstimate + merged.tax
  }
  pfis[idx] = merged
  return c.json(pfis[idx])
})

// Record that a PFI was sent (email delivery happens client-side via mailto / future SMTP)
api.post('/pfi/:id/send', async (c) => {
  const idx = pfis.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { email } = await c.req.json<{ email: string }>()
  const job = jobCards.find(j => j.id === pfis[idx].jobCardId)
  const isInsurance = job?.category === 'Insurance'
  let newStatus = pfis[idx].status
  if (isInsurance && pfis[idx].status === 'Draft') newStatus = 'Submitted'
  if (!isInsurance && pfis[idx].status === 'Draft') newStatus = 'Sent'
  pfis[idx] = { ...pfis[idx], sentAt: now(), sentTo: email, status: newStatus }
  if (job) {
    activityLog.push({ id: 'a' + genId(), jobCardId: pfis[idx].jobCardId, action: 'PFI_SENT', description: `PFI sent to ${email}`, userId: 'u3', userName: 'System', timestamp: now() })
    addNotification('pfi_sent', 'info', 'PFI Sent',
      `PFI for ${job.jobCardNumber} emailed to ${email}`,
      { jobCardId: job.id, jobCardNumber: job.jobCardNumber, entityId: pfis[idx].id, entityType: 'pfi' })
  }
  return c.json(pfis[idx])
})

// Get full PFI detail (with job, customer, vehicle, parts)
api.get('/pfi/:id/detail', (c) => {
  const pfi = pfis.find(x => x.id === c.req.param('id'))
  if (!pfi) return c.json({ error: 'Not found' }, 404)
  const job = jobCards.find(j => j.id === pfi.jobCardId)
  const customer = job ? customers.find(cu => cu.id === job.customerId) : null
  const vehicle  = job ? vehicles.find(v  => v.id  === job.vehicleId)  : null
  const parts    = partsConsumption.filter(p => p.jobCardId === pfi.jobCardId)
  const services = jobServices.filter(s => s.jobCardId === pfi.jobCardId)
  return c.json({ pfi, job, customer, vehicle, parts, services })
})

// ─── Parts Consumption ───────────────────────────────────────────────────────
api.get('/parts/all', (c) => c.json(partsConsumption))

api.get('/jobcards/:id/parts', (c) => {
  return c.json(partsConsumption.filter(x => x.jobCardId === c.req.param('id')))
})

api.post('/jobcards/:id/parts', async (c) => {
  const body = await c.req.json<Omit<PartConsumption, 'id' | 'jobCardId'>>()
  const jobCardId = c.req.param('id')
  const newPart: PartConsumption = { ...body, id: 'pc' + genId(), jobCardId }

  // ── Traceability: copy batch # and part serial # from catalogue item ─────────
  // Look up the source catalogue item by partId (sent from the UI when a catalogue
  // part is selected) and stamp the consumption record with the current batch number
  // and supplier part serial number for full traceability.
  const cataloguePart = catalogueParts.find(p => p.id === (body as any).partId)
  const lubricantItem = !cataloguePart ? lubricantProducts.find(l => l.id === (body as any).partId) : null
  const catalogueItem = cataloguePart ?? lubricantItem ?? null

  if (catalogueItem) {
    if (catalogueItem.batchNumber)      newPart.batchNumber      = catalogueItem.batchNumber
    if ((catalogueItem as any).partSerialNumber) newPart.partSerialNumber = (catalogueItem as any).partSerialNumber
    newPart.partId = (body as any).partId  // preserve for traceability
  }

  partsConsumption.push(newPart)

  // ── Auto-expense: record buying cost of the part ────────────────────────────
  const buyingPrice = catalogueItem?.buyingPrice ?? null

  if (buyingPrice !== null && buyingPrice > 0) {
    const buyingTotal = buyingPrice * newPart.quantity
    const autoExp: Expense = {
      id:          'ex' + genId(),
      jobCardId,
      category:    'Parts & Materials',
      description: `${newPart.partName} × ${newPart.quantity} (buying cost)`,
      amount:      buyingTotal,
      status:      'Approved',
      auto:        true,
      date:        now().substring(0, 10),
      createdAt:   now(),
      updatedAt:   now(),
    }
    expenses.push(autoExp)
    // Link back so we can remove it if the part is deleted
    newPart.autoExpenseId = autoExp.id
  }

  syncJobFinancials(jobCardId)
  return c.json(newPart, 201)
})

api.delete('/parts/:id', (c) => {
  const idx = partsConsumption.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const part = partsConsumption[idx]
  // Remove the linked auto-expense if it exists
  if (part.autoExpenseId) {
    const expIdx = expenses.findIndex(e => e.id === part.autoExpenseId)
    if (expIdx !== -1) expenses.splice(expIdx, 1)
  }
  partsConsumption.splice(idx, 1)
  syncJobFinancials(part.jobCardId)
  return c.json({ success: true })
})

// ─── Job Services (Packages / Oil / Car Wash / Add-ons on a job) ─────────────
api.get('/jobcards/:id/services', (c) => {
  return c.json(jobServices.filter(x => x.jobCardId === c.req.param('id')))
})

api.post('/jobcards/:id/services', async (c) => {
  const body = await c.req.json<Omit<JobService, 'id' | 'jobCardId'>>()
  const jobCardId = c.req.param('id')
  const newSvc: JobService = { ...body, id: 'svc' + genId(), jobCardId }

  // ── Traceability: stamp batch number for lubricant/oil services ──────────────
  if (body.lubricantId) {
    const srcLub = lubricantProducts.find(l => l.id === body.lubricantId)
    if (srcLub?.batchNumber) newSvc.batchNumber = srcLub.batchNumber
  }

  jobServices.push(newSvc)

  // Auto-calculate nextServiceMileage when a lubricant with a mileageInterval is added
  if (body.lubricantId) {
    const lub = lubricantProducts.find(l => l.id === body.lubricantId)
    if (lub?.mileageInterval) {
      const jcIdx = jobCards.findIndex(j => j.id === jobCardId)
      if (jcIdx !== -1 && jobCards[jcIdx].mileageIn) {
        jobCards[jcIdx] = {
          ...jobCards[jcIdx],
          nextServiceMileage: (jobCards[jcIdx].mileageIn!) + lub.mileageInterval,
          nextServiceLubricant: lub.description,
          updatedAt: now(),
        }
      }
    }
  }

  // ── Auto-expense: record buying cost of the service ─────────────────────────
  // Buying cost sources by category:
  //   Oil Service  → lubricant buyingPrice × quantity
  //   Parts (catalogue part used as a service) → cataloguePart buyingPrice × quantity
  //   Service Package → package labourCost (the garage's cost to perform the job)
  //   Car Wash / Add-on → no buying cost (labour-only, no inventory consumed)
  let buyingCost: number | null = null
  let expenseCategory: 'Parts & Materials' | 'Labour' = 'Parts & Materials'

  if (body.lubricantId) {
    // Oil service — lubricant buying price
    const lub = lubricantProducts.find(l => l.id === body.lubricantId)
    if (lub && lub.buyingPrice > 0) {
      buyingCost = lub.buyingPrice * newSvc.quantity
    }
  } else if (body.category === 'Service Package') {
    // Service package — labourCost is the internal cost to the garage
    const pkg = servicePackages.find(p => p.id === body.serviceId)
    if (pkg && pkg.labourCost > 0) {
      buyingCost = pkg.labourCost * newSvc.quantity
      expenseCategory = 'Labour'
    }
  } else if (body.category === 'Add-on') {
    // Add-on services have no buying price catalogue — skip
    buyingCost = null
  } else if (body.category === 'Car Wash') {
    // Car wash packages have no buying price — skip
    buyingCost = null
  }
  // For any other category where the serviceId maps to a catalogue part
  if (buyingCost === null && !body.lubricantId && body.serviceId) {
    const cp = catalogueParts.find(p => p.id === body.serviceId)
    if (cp && cp.buyingPrice > 0) {
      buyingCost = cp.buyingPrice * newSvc.quantity
    }
  }

  if (buyingCost !== null && buyingCost > 0) {
    const autoExp: Expense = {
      id:          'ex' + genId(),
      jobCardId,
      category:    expenseCategory,
      description: `${newSvc.serviceName} × ${newSvc.quantity} (buying cost)`,
      amount:      buyingCost,
      status:      'Approved',
      auto:        true,
      date:        now().substring(0, 10),
      createdAt:   now(),
      updatedAt:   now(),
    }
    expenses.push(autoExp)
    newSvc.autoExpenseId = autoExp.id
  }

  syncJobFinancials(jobCardId)
  return c.json(newSvc, 201)
})

api.delete('/services/:id', (c) => {
  const idx = jobServices.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const svc = jobServices[idx]
  // Remove the linked auto-expense if it exists
  if (svc.autoExpenseId) {
    const expIdx = expenses.findIndex(e => e.id === svc.autoExpenseId)
    if (expIdx !== -1) expenses.splice(expIdx, 1)
  }
  jobServices.splice(idx, 1)
  syncJobFinancials(svc.jobCardId)
  return c.json({ success: true })
})

// ─── Service Card ─────────────────────────────────────────────────────────────
// GET /jobcards/:id/service-card — return full data bundle for generating a service card
api.get('/jobcards/:id/service-card', (c) => {
  const jId = c.req.param('id')
  const job = jobCards.find(x => x.id === jId)
  if (!job) return c.json({ error: 'Not found' }, 404)
  const customer  = customers.find(x => x.id === job.customerId)
  const vehicle   = vehicles.find(x => x.id === job.vehicleId)
  const parts     = partsConsumption.filter(p => p.jobCardId === jId)
  const services  = jobServices.filter(s => s.jobCardId === jId)
  return c.json({ job, customer, vehicle, parts, services })
})

// PATCH /jobcards/:id/service-card — record mileageOut and serviceCardIssuedAt
api.patch('/jobcards/:id/service-card', async (c) => {
  const jIdx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (jIdx === -1) return c.json({ error: 'Not found' }, 404)
  const { mileageOut } = await c.req.json<{ mileageOut?: number }>()
  const ts = now()
  jobCards[jIdx] = {
    ...jobCards[jIdx],
    ...(mileageOut != null ? { mileageOut } : {}),
    serviceCardIssuedAt: ts,
    updatedAt: ts,
  }
  const jc = jobCards[jIdx]
  addNotification('service_card', 'success', 'Service Card Issued',
    `Service card generated for ${jc.jobCardNumber}`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityType: 'job' })
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'SERVICE_CARD_ISSUED',
    description: 'Digital service card issued to customer', userId: 'u3', userName: 'System', timestamp: ts })
  return c.json(jobCards[jIdx])
})

// ─── Invoices ────────────────────────────────────────────────────────────────
api.get('/invoices', (c) => {
  return c.json(invoices.map(inv => {
    const j = jobCards.find(x => x.id === inv.jobCardId)
    const cu = customers.find(x => x.id === j?.customerId)
    return { ...inv, jobCardNumber: j?.jobCardNumber, customerName: cu?.name }
  }))
})

api.post('/jobcards/:id/invoice', async (c) => {
  const jobCardId = c.req.param('id')
  const body = await c.req.json<Omit<Invoice, 'id' | 'jobCardId' | 'invoiceNumber' | 'issuedAt'>>()
  // Default due date: 30 days from today
  const dueDate = body.dueDate || (() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
  })()
  // ── Resolve discount (may be passed from PFI or entered in invoice modal) ──
  const subtotal = (body.labourCost || 0) + (body.partsCost || 0)
  let discountAmount = body.discountAmount ?? 0
  if (!discountAmount && body.discountType && body.discountValue) {
    if (body.discountType === 'percentage') {
      discountAmount = Math.round(subtotal * Math.min(body.discountValue, 100) / 100)
    } else {
      discountAmount = Math.min(Math.round(body.discountValue), subtotal)
    }
  }
  const totalAmount = body.totalAmount ?? Math.max(0, subtotal - discountAmount + (body.tax || 0))
  const jIdx = jobCards.findIndex(x => x.id === jobCardId)

  // ── UPSERT: update existing invoice if one already exists for this job ──────
  const existingIdx = invoices.findIndex(x => x.jobCardId === jobCardId)
  if (existingIdx !== -1) {
    const existing = invoices[existingIdx]
    // Preserve payment info — only update amounts, discount, tax, status if not yet paid
    const isPaid = existing.status === 'Paid'
    invoices[existingIdx] = {
      ...existing,
      labourCost:     body.labourCost    ?? existing.labourCost,
      partsCost:      body.partsCost     ?? existing.partsCost,
      discountType:   body.discountType  ?? existing.discountType,
      discountValue:  body.discountValue ?? existing.discountValue,
      discountAmount,
      discountReason: body.discountReason ?? existing.discountReason,
      tax:            body.tax           ?? existing.tax,
      totalAmount,
      dueDate:        body.dueDate       ?? existing.dueDate,
      // Only update status if invoice is not already paid
      status:         isPaid ? existing.status : (body.status as any ?? existing.status),
      updatedAt:      now(),
    }
    if (jIdx !== -1) { jobCards[jIdx].status = 'INVOICED'; jobCards[jIdx].updatedAt = now() }
    return c.json(invoices[existingIdx], 200)
  }

  // ── CREATE: no existing invoice for this job — create new ───────────────────
  const invNum = 'INV-' + new Date().getFullYear() + '-' + String(invoices.length + 1).padStart(3, '0')
  const newInv: Invoice = {
    ...body,
    id: 'i' + genId(),
    jobCardId,
    invoiceNumber: invNum,
    discountAmount,
    totalAmount,
    status: (body.status as any) || 'Issued',   // always default to 'Issued' if not provided
    issuedAt: now(),
    dueDate
  }
  invoices.push(newInv)
  if (jIdx !== -1) { jobCards[jIdx].status = 'INVOICED'; jobCards[jIdx].updatedAt = now() }
  const jc = jobCards[jIdx]
  if (jc) addNotification('invoice_created', 'success', 'Invoice Generated',
    `${invNum} issued for ${jc.jobCardNumber} — TZS ${newInv.totalAmount.toLocaleString()}`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: newInv.id, entityType: 'invoice' })
  return c.json(newInv, 201)
})

// ─── Invoice: Record Payment (full or partial) ────────────────────────────────
api.patch('/invoices/:id/status', async (c) => {
  const idx = invoices.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<{
    status?: string
    paidAt?: string
    dueDate?: string
    // payment fields
    paymentMethod?: string
    paymentReference?: string
    amountPaid?: number       // amount being recorded in this transaction
  }>()

  const prev = invoices[idx]
  const prevAmountPaid = prev.amountPaid || 0
  const newPaymentAmount = body.amountPaid ?? 0

  // Build updated payment ledger entry (if a payment method was provided)
  const newPayments = prev.payments ? [...prev.payments] : []
  if (body.paymentMethod && newPaymentAmount > 0) {
    newPayments.push({
      id: 'pay-' + prev.id + '-' + Date.now(),
      amount: newPaymentAmount,
      method: body.paymentMethod as any,
      reference: body.paymentReference,
      paidAt: body.paidAt || now(),
    })
  }

  const totalAmountPaid = newPayments.reduce((s, p) => s + p.amount, 0)

  // Auto-determine status if not explicitly set
  // Note: prev.status may be undefined for legacy invoices — default to 'Issued'
  let newStatus = (body.status as any) || prev.status || 'Issued'
  if (body.paymentMethod && newPaymentAmount > 0) {
    if (totalAmountPaid >= prev.totalAmount) {
      newStatus = 'Paid'
    } else if (totalAmountPaid > 0) {
      newStatus = 'Partially Paid'
    }
  }

  invoices[idx] = {
    ...prev,
    status: newStatus,
    ...(body.dueDate ? { dueDate: body.dueDate } : {}),
    ...(body.paymentMethod ? {
      paymentMethod: body.paymentMethod as any,
      paymentReference: body.paymentReference,
    } : {}),
    amountPaid: totalAmountPaid,
    payments: newPayments,
    // paidAt = timestamp of first full payment or latest payment
    paidAt: newStatus === 'Paid' ? (body.paidAt || now()) : (prev.paidAt || undefined),
  }

  const inv = invoices[idx]
  const jc  = jobCards.find(j => j.id === inv.jobCardId)

  if (newStatus === 'Paid' && prev.status !== 'Paid') {
    addNotification('invoice_paid', 'success', 'Invoice Paid',
      `${inv.invoiceNumber} – TZS ${inv.totalAmount.toLocaleString()} received via ${inv.paymentMethod || 'payment'}${jc ? ' for ' + jc.jobCardNumber : ''}`,
      { jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber, entityId: inv.id, entityType: 'invoice' })
    // ── Check gate pass: if job is also COMPLETED, move to Pending Exit ──────
    if (jc && (jc.status === 'COMPLETED' || jc.status === 'INVOICED' || jc.status === 'RELEASED')) {
      const gp = gatePasses.find(g => g.jobCardId === jc.id && g.status === 'Active')
      if (gp) {
        gp.status = 'Pending Exit'
        gp.updatedAt = now()
        addNotification('gate_pass_exit_pending', 'warning', 'Exit Gate Pass Pending Approval',
          `${jc.jobCardNumber} invoice paid — please approve exit for ${gp.vehicleReg}`,
          { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: gp.id, entityType: 'gate_pass' })
      }
    }
  } else if (newStatus === 'Partially Paid') {
    addNotification('invoice_paid', 'info', 'Partial Payment Received',
      `${inv.invoiceNumber} – TZS ${totalAmountPaid.toLocaleString()} of TZS ${inv.totalAmount.toLocaleString()} received${jc ? ' for ' + jc.jobCardNumber : ''}`,
      { jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber, entityId: inv.id, entityType: 'invoice' })
  } else if (newStatus === 'Overdue') {
    addNotification('invoice_overdue', 'error', 'Invoice Overdue',
      `${inv.invoiceNumber} – TZS ${inv.totalAmount.toLocaleString()} is now overdue${jc ? ' (' + jc.jobCardNumber + ')' : ''}`,
      { jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber, entityId: inv.id, entityType: 'invoice' })
  }
  return c.json(invoices[idx])
})

// ─── Edit a single payment entry ─────────────────────────────────────────────
api.patch('/invoices/:id/payments/:paymentId', async (c) => {
  const idx = invoices.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Invoice not found' }, 404)

  const inv      = invoices[idx]
  const payId    = c.req.param('paymentId')
  const payments = inv.payments ? [...inv.payments] : []
  const pIdx     = payments.findIndex(p => p.id === payId)
  if (pIdx === -1) return c.json({ error: 'Payment not found' }, 404)

  const body = await c.req.json<{
    amount?: number
    method?: string
    reference?: string
    paidAt?: string
  }>()

  payments[pIdx] = {
    ...payments[pIdx],
    ...(body.amount    !== undefined ? { amount:    body.amount }             : {}),
    ...(body.method    !== undefined ? { method:    body.method as any }      : {}),
    ...(body.reference !== undefined ? { reference: body.reference }          : {}),
    ...(body.paidAt    !== undefined ? { paidAt:    body.paidAt }             : {}),
  }

  const totalAmountPaid = payments.reduce((s, p) => s + p.amount, 0)
  let newStatus: any = inv.status
  if (totalAmountPaid >= inv.totalAmount) {
    newStatus = 'Paid'
  } else if (totalAmountPaid > 0) {
    newStatus = 'Partially Paid'
  } else {
    newStatus = inv.dueDate && inv.dueDate < new Date().toISOString().slice(0, 10) ? 'Overdue' : 'Issued'
  }

  // Update top-level paymentMethod to the latest payment's method
  const lastPayment = payments[payments.length - 1]

  invoices[idx] = {
    ...inv,
    payments,
    amountPaid: totalAmountPaid,
    status: newStatus,
    paymentMethod: lastPayment?.method ?? inv.paymentMethod,
    paidAt: newStatus === 'Paid' ? (lastPayment?.paidAt ?? inv.paidAt) : undefined,
  }

  return c.json(invoices[idx])
})

// ─── Delete a single payment entry ───────────────────────────────────────────
api.delete('/invoices/:id/payments/:paymentId', async (c) => {
  const idx = invoices.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Invoice not found' }, 404)

  const inv      = invoices[idx]
  const payId    = c.req.param('paymentId')
  const payments = (inv.payments || []).filter(p => p.id !== payId)

  if ((inv.payments || []).length === payments.length) {
    return c.json({ error: 'Payment not found' }, 404)
  }

  const totalAmountPaid = payments.reduce((s, p) => s + p.amount, 0)
  let newStatus: any = inv.status
  if (totalAmountPaid >= inv.totalAmount) {
    newStatus = 'Paid'
  } else if (totalAmountPaid > 0) {
    newStatus = 'Partially Paid'
  } else {
    newStatus = inv.dueDate && inv.dueDate < new Date().toISOString().slice(0, 10) ? 'Overdue' : 'Issued'
  }

  const lastPayment = payments[payments.length - 1]
  const jc = jobCards.find(j => j.id === inv.jobCardId)

  invoices[idx] = {
    ...inv,
    payments,
    amountPaid: totalAmountPaid,
    status: newStatus,
    paymentMethod: lastPayment?.method ?? undefined,
    paidAt: newStatus === 'Paid' ? (lastPayment?.paidAt ?? undefined) : undefined,
  }

  addNotification('invoice_paid', 'warning', 'Payment Removed',
    `A payment was removed from ${inv.invoiceNumber}${jc ? ' (' + jc.jobCardNumber + ')' : ''}. New balance: TZS ${(inv.totalAmount - totalAmountPaid).toLocaleString()}`,
    { entityId: inv.id, entityType: 'invoice', jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber })

  return c.json(invoices[idx])
})

// ─── Finance Summary ──────────────────────────────────────────────────────────
api.get('/finance/summary', (c) => {
  const now_str = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD

  // ── Invoice Metrics ────────────────────────────────────────────────────────
  const allInv = invoices

  // Mark any past-due unpaid invoices as Overdue automatically
  allInv.forEach((inv, idx) => {
    if (inv.dueDate && inv.dueDate < now_str && inv.status === 'Issued') {
      invoices[idx] = { ...inv, status: 'Overdue' }
    }
  })

  const totalInvoiced  = allInv.reduce((s, i) => s + i.totalAmount, 0)
  const paidInvoices   = allInv.filter(i => i.status === 'Paid')
  const partialInvoices = allInv.filter(i => i.status === 'Partially Paid')
  const totalPaid      = paidInvoices.reduce((s, i) => s + i.totalAmount, 0)
                       + partialInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0)
  const outstanding    = allInv.filter(i => i.status === 'Issued' || i.status === 'Draft' || i.status === 'Partially Paid')
                               .reduce((s, i) => s + (i.totalAmount - (i.amountPaid || 0)), 0)
  const overdue        = allInv.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.totalAmount, 0)
  const paidCount      = paidInvoices.length
  const overdueCount   = allInv.filter(i => i.status === 'Overdue').length
  const outstandingCount = allInv.filter(i => i.status === 'Issued' || i.status === 'Draft' || i.status === 'Partially Paid').length

  // ── Pipeline: from open Job Cards that don't yet have an invoice ──────────
  const invoicedJobIds = new Set(allInv.map(i => i.jobCardId))
  const pipelineJobs   = jobCards.filter(j =>
    !invoicedJobIds.has(j.id) &&
    !['RECEIVED','INSPECTION','PFI_PREPARATION'].includes(j.status)
  )
  // Estimate pipeline value from PFIs or job services
  const pipelineValue = pipelineJobs.reduce((sum, j) => {
    const pfi = pfis.find(p => p.jobCardId === j.id)
    if (pfi) return sum + pfi.totalEstimate
    // fall back to summing job services
    const svcTotal = jobServices.filter(s => s.jobCardId === j.id).reduce((ss, s) => ss + s.totalCost, 0)
    return sum + svcTotal
  }, 0)

  // ── Expected from Appointments (Scheduled / Confirmed) ────────────────────
  const apptValue = appointments
    .filter(a => ['Scheduled', 'Confirmed'].includes(a.status) && !a.jobCardId)
    .reduce((sum, a) => {
      // use estimatedCost if available, else 0
      return sum + (Number((a as any).estimatedCost) || 0)
    }, 0)
  const apptCount = appointments.filter(a =>
    ['Scheduled', 'Confirmed'].includes(a.status) && !a.jobCardId
  ).length

  // ── Monthly Revenue Trend (last 6 completed months + current) ─────────────
  const monthlyRevenue: Record<string, number> = {}
  paidInvoices.forEach(inv => {
    const m = (inv.paidAt || inv.issuedAt).substring(0, 7)
    monthlyRevenue[m] = (monthlyRevenue[m] || 0) + inv.totalAmount
  })
  const revenueMonths = Object.entries(monthlyRevenue)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)

  // ── Expense Metrics ────────────────────────────────────────────────────────
  const allExp        = expenses
  const totalExpenses = allExp.reduce((s, e) => s + e.amount, 0)
  const paidExpenses  = allExp.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0)
  const pendingExp    = allExp.filter(e => e.status === 'Pending' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0)
  const jobLinkedExp  = allExp.filter(e => e.jobCardId).reduce((s, e) => s + e.amount, 0)
  const overheadExp   = allExp.filter(e => !e.jobCardId).reduce((s, e) => s + e.amount, 0)

  // Expense by category
  const expByCategory: Record<string, number> = {}
  allExp.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount })

  // Monthly expense trend
  const monthlyExpenses: Record<string, number> = {}
  allExp.forEach(e => {
    const m = e.date.substring(0, 7)
    monthlyExpenses[m] = (monthlyExpenses[m] || 0) + e.amount
  })
  const expenseMonths = Object.entries(monthlyExpenses)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)

  // ── P&L ───────────────────────────────────────────────────────────────────
  const grossIncome  = totalPaid
  const netIncome    = grossIncome - paidExpenses
  const grossMargin  = grossIncome > 0 ? ((netIncome / grossIncome) * 100) : 0
  const avgJobValue  = paidCount > 0 ? totalPaid / paidCount : 0

  // ── Discount Metrics ──────────────────────────────────────────────────────
  const totalDiscountsGiven = allInv.reduce((s, i) => s + (i.discountAmount || 0), 0)
  const discountedInvoiceCount = allInv.filter(i => (i.discountAmount || 0) > 0).length

  // ── Monthly P&L trend ─────────────────────────────────────────────────────
  const allMonths = new Set([
    ...Object.keys(monthlyRevenue),
    ...Object.keys(monthlyExpenses),
  ])
  const monthlyPL = Array.from(allMonths).sort().slice(-7).map(m => ({
    month: m,
    revenue:  monthlyRevenue[m]  || 0,
    expenses: monthlyExpenses[m] || 0,
    net:      (monthlyRevenue[m] || 0) - (monthlyExpenses[m] || 0),
  }))

  return c.json({
    invoices: {
      totalInvoiced, totalPaid, outstanding, overdue,
      paidCount, overdueCount, outstandingCount,
      totalCount: allInv.length,
    },
    pipeline: { value: pipelineValue, jobCount: pipelineJobs.length },
    appointments: { expectedValue: apptValue, count: apptCount },
    expenses: {
      total: totalExpenses, paid: paidExpenses, pending: pendingExp,
      jobLinked: jobLinkedExp, overhead: overheadExp, byCategory: expByCategory,
    },
    pl: { grossIncome, netIncome, grossMargin, avgJobValue },
    discounts: { total: totalDiscountsGiven, invoiceCount: discountedInvoiceCount },
    trends: { revenue: revenueMonths, expenses: expenseMonths, pl: monthlyPL },
  })
})

// ─── Finance: Per-job P&L ─────────────────────────────────────────────────────
api.get('/finance/job/:id', (c) => {
  const jId = c.req.param('id')
  const jc  = jobCards.find(j => j.id === jId)
  if (!jc) return c.json({ error: 'Not found' }, 404)

  const inv  = invoices.find(i => i.jobCardId === jId)
  const exps = expenses.filter(e => e.jobCardId === jId)
  const svcs = jobServices.filter(s => s.jobCardId === jId)
  const parts = partsConsumption.filter(p => p.jobCardId === jId)

  const revenue       = inv?.status === 'Paid' ? inv.totalAmount : 0
  const totalExpenses = exps.reduce((s, e) => s + e.amount, 0)
  const paidExp       = exps.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0)
  const svcCost       = svcs.reduce((s, s2) => s + s2.totalCost, 0)
  const partsCostAmt  = parts.reduce((s, p) => s + p.totalCost, 0)
  const netProfit     = revenue - totalExpenses
  const margin        = revenue > 0 ? ((netProfit / revenue) * 100) : 0

  return c.json({
    jobCard: jc,
    invoice: inv || null,
    revenue, totalExpenses, paidExp, svcCost, partsCostAmt,
    netProfit, margin,
    expenses: exps,
    services: svcs,
    parts,
  })
})

// ─── Service Packages ────────────────────────────────────────────────────────
api.get('/packages', (c) => c.json(servicePackages))

api.post('/packages', async (c) => {
  const body = await c.req.json<Omit<ServicePackage, 'id'>>()
  const newPkg: ServicePackage = { sellingPrice: 0, ...body, id: 'sp' + genId() }
  servicePackages.push(newPkg)
  return c.json(newPkg, 201)
})

api.put('/packages/:id', async (c) => {
  const idx = servicePackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<ServicePackage>>()
  servicePackages[idx] = { sellingPrice: 0, ...servicePackages[idx], ...body }
  return c.json(servicePackages[idx])
})

api.delete('/packages/:id', (c) => {
  const idx = servicePackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  servicePackages.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Auth ────────────────────────────────────────────────────────────────────

// POST /auth/login  { email, password }
api.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400)

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active)
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  // Simple plain-text password check for demo (in production, use bcrypt)
  if (user.password && user.password !== password) return c.json({ error: 'Invalid credentials' }, 401)
  // If no password set, allow login (for users created without passwords in demo)

  const token = genId() + genId()
  sessions.set(token, user.id)
  // Update last login
  const idx = users.findIndex(u => u.id === user.id)
  if (idx !== -1) users[idx].lastLogin = now()

  return c.json({ token, user: safeUser(user) })
})

// POST /auth/logout
api.post('/auth/logout', (c) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token) sessions.delete(token)
  return c.json({ success: true })
})

// GET /auth/me – return current user + their permissions
api.get('/auth/me', (c) => {
  const user = getSessionUser(c)
  if (!user) return c.json({ error: 'Unauthenticated' }, 401)
  const permissions = ROLE_PERMISSIONS[user.role] || []
  return c.json({ user: safeUser(user), permissions })
})

// GET /auth/permissions – get permissions for any role (public, for UI)
api.get('/auth/permissions', (c) => {
  return c.json(ROLE_PERMISSIONS)
})

// ─── Users ───────────────────────────────────────────────────────────────────
api.get('/users', (c) => c.json(users.map(safeUser)))

api.post('/users', async (c) => {
  const body = await c.req.json<Omit<User, 'id' | 'createdAt'>>()
  const newUser: User = { ...body, id: 'u' + genId(), createdAt: now() }
  users.push(newUser)
  return c.json(safeUser(newUser), 201)
})

api.put('/users/:id', async (c) => {
  const idx = users.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<User>>()
  users[idx] = { ...users[idx], ...body }
  return c.json(safeUser(users[idx]))
})

api.delete('/users/:id', (c) => {
  const idx = users.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const [removed] = users.splice(idx, 1)
  // Revoke all sessions for this user
  sessions.forEach((uid, token) => { if (uid === removed.id) sessions.delete(token) })
  return c.json({ success: true })
})

// ─── Analytics ───────────────────────────────────────────────────────────────
api.get('/analytics', (c) => {
  const paid = invoices.filter(i => i.status === 'Paid' || i.status === 'Partially Paid')
  const totalRevenue = paid.reduce((s, i) => s + (i.amountPaid || i.totalAmount), 0)
  const totalLabour = paid.reduce((s, i) => s + i.labourCost, 0)
  const totalParts = paid.reduce((s, i) => s + i.partsCost, 0)
  const totalCost = totalLabour + totalParts
  const margin = totalRevenue - totalCost
  const avgJobValue = paid.length > 0 ? totalRevenue / paid.length : 0

  const byInsurer = jobCards.filter(j => j.insurer).reduce((acc, j) => {
    acc[j.insurer!] = (acc[j.insurer!] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byStatus = jobCards.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return c.json({ totalRevenue, totalLabour, totalParts, totalCost, margin, avgJobValue, byInsurer, byStatus, invoiceCount: paid.length })
})

// GET /analytics/tat — Turn-Around-Time analytics across all job cards
api.get('/analytics/tat', (c) => {
  const tsNow = now()

  // Status labels
  const STATUS_LABELS: Record<string, string> = {
    RECEIVED: 'Received', INSPECTION: 'Under Inspection', PFI_PREPARATION: 'PFI Preparation',
    AWAITING_INSURER_APPROVAL: 'Awaiting Insurer Approval', REPAIR_IN_PROGRESS: 'Repair In Progress',
    WAITING_FOR_PARTS: 'Waiting for Parts', QUALITY_CHECK: 'Quality Check',
    COMPLETED: 'Completed', INVOICED: 'Invoiced', RELEASED: 'Released'
  }
  const STATUS_FLOW_LIST = ['RECEIVED','INSPECTION','PFI_PREPARATION','AWAITING_INSURER_APPROVAL',
    'REPAIR_IN_PROGRESS','WAITING_FOR_PARTS','QUALITY_CHECK','COMPLETED','INVOICED','RELEASED']

  // Per-status average durations across all job cards (closed entries only)
  const statusTotals: Record<string, { totalMins: number; count: number }> = {}
  STATUS_FLOW_LIST.forEach(s => { statusTotals[s] = { totalMins: 0, count: 0 } })

  // Per-technician stats
  const techStats: Record<string, { name: string; jobCount: number; totalMins: number; completedCount: number }> = {}

  // Completed jobs TAT
  const completedTATs: number[] = []
  const activeJobMins: number[] = []

  jobCards.forEach(j => {
    // TAT for completed jobs
    if (j.status === 'COMPLETED' || j.status === 'INVOICED' || j.status === 'RELEASED') {
      if (j.totalTATMins != null) {
        completedTATs.push(j.totalTATMins)
      } else if (j.completedAt) {
        completedTATs.push(workingMinutes(j.createdAt, j.completedAt))
      }
    } else {
      activeJobMins.push(workingMinutes(j.createdAt, tsNow))
    }

    // Status durations
    if (j.statusTimeline) {
      j.statusTimeline.forEach(entry => {
        const mins = entry.exitedAt
          ? (entry.durationMins ?? workingMinutes(entry.enteredAt, entry.exitedAt))
          : workingMinutes(entry.enteredAt, tsNow)
        if (statusTotals[entry.status] && entry.exitedAt) {
          statusTotals[entry.status].totalMins += mins
          statusTotals[entry.status].count += 1
        }
      })
    }

    // Technician stats (using current assignedTechnician)
    if (j.assignedTechnician) {
      const tech = users.find(u => u.id === j.assignedTechnician)
      if (!techStats[j.assignedTechnician]) {
        techStats[j.assignedTechnician] = {
          techId: j.assignedTechnician,
          name: tech?.name || j.assignedTechnician,
          jobCount: 0,
          totalMins: 0,
          completedCount: 0,
          jobs: []
        }
      }
      const cust = customers.find(c => c.id === j.customerId)
      const veh  = vehicles.find(v => v.id === j.vehicleId)
      const tatMins = j.totalTATMins ?? (j.completedAt ? workingMinutes(j.createdAt, j.completedAt) : 0)
      techStats[j.assignedTechnician].jobs.push({
        id: j.id,
        jobCardNumber: j.jobCardNumber,
        status: j.status,
        category: j.category,
        customerName: cust?.name || '—',
        vehicleInfo: veh ? `${veh.make} ${veh.model} (${veh.registrationNumber})` : '—',
        createdAt: j.createdAt,
        completedAt: j.completedAt || null,
        tatMins: tatMins,
        tatFormatted: tatMins > 0 ? fmtDuration(tatMins) : '—'
      })
      techStats[j.assignedTechnician].jobCount += 1
      if (j.status === 'COMPLETED' || j.status === 'INVOICED' || j.status === 'RELEASED') {
        techStats[j.assignedTechnician].completedCount += 1
        techStats[j.assignedTechnician].totalMins += tatMins
      }
    }
  })

  // Compute averages per status
  const avgByStatus = STATUS_FLOW_LIST.map(s => ({
    status: s,
    label: STATUS_LABELS[s] || s,
    avgMins: statusTotals[s].count > 0 ? Math.round(statusTotals[s].totalMins / statusTotals[s].count) : 0,
    avgFormatted: statusTotals[s].count > 0 ? fmtDuration(Math.round(statusTotals[s].totalMins / statusTotals[s].count)) : '—',
    sampleCount: statusTotals[s].count
  }))

  const avgCompletedTAT = completedTATs.length > 0
    ? Math.round(completedTATs.reduce((a, b) => a + b, 0) / completedTATs.length)
    : 0
  const maxCompletedTAT = completedTATs.length > 0 ? Math.max(...completedTATs) : 0
  const minCompletedTAT = completedTATs.length > 0 ? Math.min(...completedTATs) : 0

  // Technician leaderboard (sorted by completedCount desc, then avgTAT asc)
  const techLeaderboard = Object.values(techStats)
    .map((t: any) => ({
      techId: t.techId,
      name: t.name,
      jobCount: t.jobCount,
      completedCount: t.completedCount,
      totalMins: t.totalMins,
      jobs: t.jobs,
      avgTATMins: t.completedCount > 0 ? Math.round(t.totalMins / t.completedCount) : 0,
      avgTATFormatted: t.completedCount > 0 ? fmtDuration(Math.round(t.totalMins / t.completedCount)) : '—'
    }))
    .sort((a, b) => b.completedCount - a.completedCount || a.avgTATMins - b.avgTATMins)

  // Bottleneck = status with highest average duration (completed entries)
  const bottleneck = [...avgByStatus].filter(s => s.avgMins > 0).sort((a, b) => b.avgMins - a.avgMins)[0] || null

  return c.json({
    totalJobs: jobCards.length,
    completedJobs: completedTATs.length,
    activeJobs: activeJobMins.length,
    avgCompletedTATMins: avgCompletedTAT,
    avgCompletedTATFormatted: fmtDuration(avgCompletedTAT),
    maxCompletedTATFormatted: fmtDuration(maxCompletedTAT),
    minCompletedTATFormatted: fmtDuration(minCompletedTAT),
    avgByStatus,
    techLeaderboard,
    bottleneck: bottleneck ? { status: bottleneck.status, label: bottleneck.label, avgMins: bottleneck.avgMins, avgFormatted: bottleneck.avgFormatted } : null
  })
})

// ─── Twiga Catalogue: Oil Services ──────────────────────────────────────────
api.get('/catalogue/oil', (c) => c.json(oilServiceProducts))

// PUT /catalogue/oil/:brand/tiers  — replace full tier array for a brand
api.put('/catalogue/oil/:brand/tiers', async (c) => {
  const brand = c.req.param('brand') as any
  const idx = oilServiceProducts.findIndex(p => p.brand === brand)
  if (idx === -1) return c.json({ error: 'Brand not found' }, 404)
  const { tiers } = await c.req.json<{ tiers: any[] }>()
  oilServiceProducts[idx] = { ...oilServiceProducts[idx], tiers }
  return c.json(oilServiceProducts[idx])
})

// PATCH /catalogue/oil/:brand/tier/:index — update a single tier row
api.patch('/catalogue/oil/:brand/tier/:index', async (c) => {
  const brand = c.req.param('brand') as any
  const tierIdx = parseInt(c.req.param('index'), 10)
  const idx = oilServiceProducts.findIndex(p => p.brand === brand)
  if (idx === -1) return c.json({ error: 'Brand not found' }, 404)
  if (tierIdx < 0 || tierIdx >= oilServiceProducts[idx].tiers.length)
    return c.json({ error: 'Tier index out of range' }, 404)
  const body = await c.req.json()
  oilServiceProducts[idx].tiers[tierIdx] = { ...oilServiceProducts[idx].tiers[tierIdx], ...body }
  return c.json(oilServiceProducts[idx])
})

// POST /catalogue/oil/:brand/tier — add a new tier row
api.post('/catalogue/oil/:brand/tier', async (c) => {
  const brand = c.req.param('brand') as any
  const idx = oilServiceProducts.findIndex(p => p.brand === brand)
  if (idx === -1) return c.json({ error: 'Brand not found' }, 404)
  const body = await c.req.json()
  oilServiceProducts[idx].tiers.push(body)
  return c.json(oilServiceProducts[idx])
})

// DELETE /catalogue/oil/:brand/tier/:index — remove a tier row
api.delete('/catalogue/oil/:brand/tier/:index', (c) => {
  const brand = c.req.param('brand') as any
  const tierIdx = parseInt(c.req.param('index'), 10)
  const idx = oilServiceProducts.findIndex(p => p.brand === brand)
  if (idx === -1) return c.json({ error: 'Brand not found' }, 404)
  oilServiceProducts[idx].tiers.splice(tierIdx, 1)
  return c.json(oilServiceProducts[idx])
})

// PATCH /catalogue/oil/:brand/fleet — update fleet discounts for a brand
api.patch('/catalogue/oil/:brand/fleet', async (c) => {
  const brand = c.req.param('brand') as any
  const idx = oilServiceProducts.findIndex(p => p.brand === brand)
  if (idx === -1) return c.json({ error: 'Brand not found' }, 404)
  const { fleetDiscount3to5, fleetDiscount5plus } = await c.req.json<{ fleetDiscount3to5: number; fleetDiscount5plus: number }>()
  oilServiceProducts[idx] = { ...oilServiceProducts[idx], fleetDiscount3to5, fleetDiscount5plus }
  return c.json(oilServiceProducts[idx])
})

// ─── Twiga Catalogue: Parts & Accessories ────────────────────────────────────
api.get('/catalogue/parts', (c) => {
  const category = c.req.query('category')
  const q = c.req.query('q')?.toLowerCase()
  let list = catalogueParts
  if (category) list = list.filter(p => p.category === category)
  if (q) list = list.filter(p =>
    p.description.toLowerCase().includes(q) ||
    p.compatibleModels.toLowerCase().includes(q)
  )
  return c.json(list)
})

api.get('/catalogue/parts/categories', (c) => {
  const cats = [...new Set(catalogueParts.map(p => p.category))]
  return c.json(cats)
})

// Add a new part to the catalogue
api.post('/catalogue/parts', async (c) => {
  const body = await c.req.json<Omit<CataloguePart, 'id' | 'margin' | 'batchNumber'>>()
  const newPart: CataloguePart = {
    id: 'cp' + genId(),
    category: body.category,
    description: body.description,
    compatibleModels: body.compatibleModels || '',
    buyingPrice: Number(body.buyingPrice) || 0,
    sellingPrice: Number(body.sellingPrice) || 0,
    margin: Number(body.sellingPrice || 0) - Number(body.buyingPrice || 0),
    stockQuantity: Number(body.stockQuantity) || 0,
    batchNumber: genBatchNumber(),
    ...(body.partSerialNumber ? { partSerialNumber: String(body.partSerialNumber) } : {}),
  }
  catalogueParts.push(newPart)
  return c.json(newPart, 201)
})

// Bulk insert parts — must be registered BEFORE the /:id routes
api.post('/catalogue/parts/bulk', async (c) => {
  const rows = await c.req.json<Omit<CataloguePart, 'id' | 'margin' | 'batchNumber'>[]>()
  if (!Array.isArray(rows) || rows.length === 0) {
    return c.json({ error: 'Payload must be a non-empty array' }, 400)
  }
  const MAX_ROWS = 1000
  const toProcess = rows.slice(0, MAX_ROWS)
  let added   = 0
  let skipped = 0
  const inserted: CataloguePart[] = []

  for (const body of toProcess) {
    // Basic validation
    if (!body.description || !body.category) { skipped++; continue }
    if (!body.sellingPrice || Number(body.sellingPrice) <= 0) { skipped++; continue }

    const newPart: CataloguePart = {
      id: 'cp' + genId(),
      category: String(body.category) as CataloguePart['category'],
      description: String(body.description),
      compatibleModels: body.compatibleModels ? String(body.compatibleModels) : '',
      buyingPrice:  Number(body.buyingPrice)  || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      margin: Number(body.sellingPrice || 0) - Number(body.buyingPrice || 0),
      stockQuantity: Number(body.stockQuantity) || 0,
      batchNumber: genBatchNumber(),
      ...(body.partSerialNumber ? { partSerialNumber: String(body.partSerialNumber) } : {}),
    }
    catalogueParts.push(newPart)
    inserted.push(newPart)
    added++
  }

  return c.json({ added, skipped, items: inserted }, 201)
})

api.put('/catalogue/parts/:id', async (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<CataloguePart>>()
  // Never overwrite batchNumber via PUT
  const { batchNumber: _b, ...safeBody } = body as any
  catalogueParts[idx] = {
    ...catalogueParts[idx],
    ...safeBody,
    margin: (safeBody.sellingPrice ?? catalogueParts[idx].sellingPrice) - (safeBody.buyingPrice ?? catalogueParts[idx].buyingPrice),
  }
  return c.json(catalogueParts[idx])
})

// Deduct stock when a catalogue part is used on a job
api.patch('/catalogue/parts/:id/deduct', async (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { quantity } = await c.req.json<{ quantity: number }>()
  const current = catalogueParts[idx].stockQuantity ?? 0
  if (current < quantity) return c.json({ error: 'Insufficient stock', available: current }, 409)
  const newStock = current - quantity
  catalogueParts[idx] = { ...catalogueParts[idx], stockQuantity: newStock }
  // Fire low-stock alert when stock drops to 5 or below
  if (newStock <= 5) {
    const p = catalogueParts[idx]
    addNotification('low_stock', newStock === 0 ? 'error' : 'warning',
      newStock === 0 ? 'Out of Stock!' : 'Low Stock Alert',
      `${p.description} — ${newStock === 0 ? 'no units remaining' : `only ${newStock} unit${newStock !== 1 ? 's' : ''} left`}. Consider restocking.`,
      { entityId: p.id, entityType: 'part' })
  }
  return c.json(catalogueParts[idx])
})

// Restock: add units to a catalogue part
api.patch('/catalogue/parts/:id/restock', async (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { quantity } = await c.req.json<{ quantity: number }>()
  const current = catalogueParts[idx].stockQuantity ?? 0
  catalogueParts[idx] = { ...catalogueParts[idx], stockQuantity: current + Number(quantity) }
  return c.json(catalogueParts[idx])
})

// ─── Twiga Catalogue: Car Wash ────────────────────────────────────────────────
api.get('/catalogue/carwash', (c) => c.json(carWashPackages))

api.post('/catalogue/carwash', async (c) => {
  const body = await c.req.json<Omit<CarWashPackage, 'id'>>()
  const newPkg: CarWashPackage = { ...body, id: 'cw' + genId() }
  carWashPackages.push(newPkg)
  return c.json(newPkg, 201)
})

api.put('/catalogue/carwash/:id', async (c) => {
  const idx = carWashPackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<CarWashPackage>>()
  carWashPackages[idx] = { ...carWashPackages[idx], ...body }
  return c.json(carWashPackages[idx])
})

api.delete('/catalogue/carwash/:id', (c) => {
  const idx = carWashPackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  carWashPackages.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Twiga Catalogue: Add-on Services ────────────────────────────────────────
api.get('/catalogue/addons', (c) => c.json(addOnServices))

api.post('/catalogue/addons', async (c) => {
  const body = await c.req.json<Omit<AddOnService, 'id'>>()
  const newSvc: AddOnService = { ...body, id: 'ao' + genId() }
  addOnServices.push(newSvc)
  return c.json(newSvc, 201)
})

api.put('/catalogue/addons/:id', async (c) => {
  const idx = addOnServices.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<AddOnService>>()
  addOnServices[idx] = { ...addOnServices[idx], ...body }
  return c.json(addOnServices[idx])
})

api.delete('/catalogue/addons/:id', (c) => {
  const idx = addOnServices.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  addOnServices.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Catalogue: Lubricants ────────────────────────────────────────────────────
api.get('/catalogue/lubricants', (c) => {
  const brand = c.req.query('brand')
  const type  = c.req.query('type')
  const q     = c.req.query('q')?.toLowerCase()
  let list = lubricantProducts
  if (brand) list = list.filter(l => l.brand === brand)
  if (type)  list = list.filter(l => l.lubricantType === type)
  if (q)     list = list.filter(l =>
    l.description.toLowerCase().includes(q) ||
    l.viscosity.toLowerCase().includes(q) ||
    l.brand.toLowerCase().includes(q)
  )
  return c.json(list)
})

api.get('/catalogue/lubricants/brands', (c) => {
  const brands = [...new Set(lubricantProducts.map(l => l.brand))]
  return c.json(brands)
})

api.get('/catalogue/lubricants/types', (c) => {
  const types = [...new Set(lubricantProducts.map(l => l.lubricantType))]
  return c.json(types)
})

api.post('/catalogue/lubricants', async (c) => {
  const body = await c.req.json<Omit<LubricantProduct, 'id' | 'margin' | 'batchNumber'>>()
  const newItem: LubricantProduct = {
    id: 'lub' + genId(),
    brand: body.brand,
    description: body.description,
    viscosity: body.viscosity || '',
    volume: body.volume || '',
    lubricantType: body.lubricantType,
    buyingPrice: Number(body.buyingPrice) || 0,
    sellingPrice: Number(body.sellingPrice) || 0,
    margin: Number(body.sellingPrice || 0) - Number(body.buyingPrice || 0),
    stockQuantity: Number(body.stockQuantity) || 0,
    batchNumber: genBatchNumber(),
    ...(body.mileageInterval ? { mileageInterval: Number(body.mileageInterval) } : {}),
    ...(body.partSerialNumber ? { partSerialNumber: String(body.partSerialNumber) } : {}),
  }
  lubricantProducts.push(newItem)
  return c.json(newItem, 201)
})

// Bulk insert lubricants — must be registered BEFORE the /:id routes
api.post('/catalogue/lubricants/bulk', async (c) => {
  const rows = await c.req.json<Omit<LubricantProduct, 'id' | 'margin'>[]>()
  if (!Array.isArray(rows) || rows.length === 0) {
    return c.json({ error: 'Payload must be a non-empty array' }, 400)
  }
  const MAX_ROWS = 1000
  const toProcess = rows.slice(0, MAX_ROWS)
  let added   = 0
  let skipped = 0
  const inserted: LubricantProduct[] = []

  for (const body of toProcess) {
    // Basic validation
    if (!body.description || !body.brand || !body.lubricantType) { skipped++; continue }
    if (!body.sellingPrice || Number(body.sellingPrice) <= 0)     { skipped++; continue }

    const newItem: LubricantProduct = {
      id: 'lub' + genId(),
      brand: String(body.brand),
      description: String(body.description),
      viscosity: body.viscosity ? String(body.viscosity) : '',
      volume: body.volume ? String(body.volume) : '',
      lubricantType: String(body.lubricantType) as LubricantProduct['lubricantType'],
      buyingPrice:  Number(body.buyingPrice)  || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      margin: Number(body.sellingPrice || 0) - Number(body.buyingPrice || 0),
      stockQuantity: Number(body.stockQuantity) || 0,
      batchNumber: genBatchNumber(),
      ...(body.mileageInterval ? { mileageInterval: Number(body.mileageInterval) } : {}),
      ...(body.partSerialNumber ? { partSerialNumber: String(body.partSerialNumber) } : {}),
    }
    lubricantProducts.push(newItem)
    inserted.push(newItem)
    added++
  }

  return c.json({ added, skipped, items: inserted }, 201)
})

api.put('/catalogue/lubricants/:id', async (c) => {
  const idx = lubricantProducts.findIndex(l => l.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<LubricantProduct>>()
  // Never overwrite batchNumber via PUT
  const { batchNumber: _b, ...safeBody } = body as any
  const updated = { ...lubricantProducts[idx], ...safeBody }
  updated.margin = updated.sellingPrice - updated.buyingPrice
  // Update partSerialNumber (allow clearing with empty string)
  if (safeBody.partSerialNumber !== undefined) {
    updated.partSerialNumber = safeBody.partSerialNumber ? String(safeBody.partSerialNumber) : undefined
  }
  // Clear mileageInterval if type no longer supports it
  if (!['Engine Oil','Transmission Fluid'].includes(updated.lubricantType)) {
    delete updated.mileageInterval
  } else if (safeBody.mileageInterval !== undefined) {
    updated.mileageInterval = safeBody.mileageInterval ? Number(safeBody.mileageInterval) : undefined
  }
  lubricantProducts[idx] = updated
  return c.json(lubricantProducts[idx])
})

api.patch('/catalogue/lubricants/:id/restock', async (c) => {
  const idx = lubricantProducts.findIndex(l => l.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { quantity } = await c.req.json<{ quantity: number }>()
  lubricantProducts[idx] = { ...lubricantProducts[idx], stockQuantity: (lubricantProducts[idx].stockQuantity ?? 0) + Number(quantity) }
  return c.json(lubricantProducts[idx])
})

api.patch('/catalogue/lubricants/:id/deduct', async (c) => {
  const idx = lubricantProducts.findIndex(l => l.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { quantity } = await c.req.json<{ quantity: number }>()
  const current = lubricantProducts[idx].stockQuantity ?? 0
  if (current < quantity) return c.json({ error: 'Insufficient stock', available: current }, 409)
  const newStock = current - quantity
  lubricantProducts[idx] = { ...lubricantProducts[idx], stockQuantity: newStock }
  if (newStock <= 5) {
    const l = lubricantProducts[idx]
    addNotification('low_stock', newStock === 0 ? 'error' : 'warning',
      newStock === 0 ? 'Out of Stock!' : 'Low Stock Alert',
      `${l.description} — ${newStock === 0 ? 'no units remaining' : `only ${newStock} unit${newStock !== 1 ? 's' : ''} left`}. Consider restocking.`,
      { entityId: l.id, entityType: 'lubricant' })
  }
  return c.json(lubricantProducts[idx])
})

api.delete('/catalogue/lubricants/:id', (c) => {
  const idx = lubricantProducts.findIndex(l => l.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  lubricantProducts.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Catalogue Search (unified) ───────────────────────────────────────────────
api.get('/catalogue/search', (c) => {
  const q = (c.req.query('q') || '').toLowerCase()
  if (!q) return c.json({ parts: [], carwash: [], addons: [] })
  return c.json({
    parts: catalogueParts.filter(p =>
      p.description.toLowerCase().includes(q) || p.compatibleModels.toLowerCase().includes(q)
    ).slice(0, 10),
    carwash: carWashPackages.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
    addons: addOnServices.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5),
  })
})

// ─── Appointments ─────────────────────────────────────────────────────────────
api.get('/appointments', (c) => {
  const date   = c.req.query('date')
  const status = c.req.query('status')
  let list = appointments.map(a => ({
    ...a,
    customerName: customers.find(cu => cu.id === a.customerId)?.name,
    vehicleReg:   vehicles.find(v  => v.id  === a.vehicleId)?.registrationNumber,
    vehicleMake:  vehicles.find(v  => v.id  === a.vehicleId)?.make,
    vehicleModel: vehicles.find(v  => v.id  === a.vehicleId)?.model,
    technicianName: users.find(u => u.id === a.assignedTechnician)?.name,
  }))
  if (date)   list = list.filter(a => a.date === date)
  if (status) list = list.filter(a => a.status === status)
  return c.json(list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)))
})

api.get('/appointments/:id', (c) => {
  const a = appointments.find(x => x.id === c.req.param('id'))
  if (!a) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...a,
    customer:      customers.find(cu => cu.id === a.customerId),
    vehicle:       vehicles.find(v  => v.id  === a.vehicleId),
    technicianName: users.find(u => u.id === a.assignedTechnician)?.name,
  })
})

api.post('/appointments', async (c) => {
  const body = await c.req.json<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>()
  const newApt: Appointment = { ...body, id: 'apt' + genId(), createdAt: now(), updatedAt: now() }
  appointments.push(newApt)
  const cust = customers.find(x => x.id === newApt.customerId)
  const veh  = vehicles.find(x => x.id === newApt.vehicleId)
  addNotification('appointment_created', 'info', 'Appointment Scheduled',
    `${cust?.name || 'Customer'} booked for ${newApt.serviceType} on ${newApt.date} at ${newApt.time} — ${veh?.make || ''} ${veh?.registrationNumber || ''}`,
    { entityId: newApt.id, entityType: 'appointment' })
  return c.json(newApt, 201)
})

api.put('/appointments/:id', async (c) => {
  const idx = appointments.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<Appointment>>()
  appointments[idx] = { ...appointments[idx], ...body, updatedAt: now() }
  return c.json(appointments[idx])
})

api.patch('/appointments/:id/status', async (c) => {
  const idx = appointments.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { status } = await c.req.json<{ status: string }>()
  appointments[idx] = { ...appointments[idx], status: status as any, updatedAt: now() }
  const apt = appointments[idx]
  const cust = customers.find(x => x.id === apt.customerId)
  if (status === 'Cancelled') {
    addNotification('appointment_cancelled', 'error', 'Appointment Cancelled',
      `${cust?.name || 'Customer'}\'s ${apt.serviceType} on ${apt.date} at ${apt.time} was cancelled`,
      { entityId: apt.id, entityType: 'appointment' })
  } else if (status === 'Completed') {
    addNotification('job_completed', 'success', 'Appointment Completed',
      `${cust?.name || 'Customer'}\'s ${apt.serviceType} on ${apt.date} marked as completed`,
      { entityId: apt.id, entityType: 'appointment' })
  }
  return c.json(appointments[idx])
})

api.delete('/appointments/:id', (c) => {
  const idx = appointments.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  appointments.splice(idx, 1)
  return c.json({ success: true })
})

// Convert appointment → job card
api.post('/appointments/:id/convert', async (c) => {
  const idx = appointments.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const apt = appointments[idx]
  if (apt.jobCardId) return c.json({ error: 'Already converted', jobCardId: apt.jobCardId }, 400)
  const num = 'GMS-' + new Date().getFullYear() + '-' + String(jobCards.length + 1).padStart(3, '0')
  const newJob: JobCard = {
    id: 'j' + genId(), jobCardNumber: num,
    customerId: apt.customerId, vehicleId: apt.vehicleId,
    assignedTechnician: apt.assignedTechnician || '',
    category: 'Private', status: 'RECEIVED',
    damageDescription: apt.serviceType + (apt.notes ? ' – ' + apt.notes : ''),
    notes: apt.notes || '',
    createdAt: now(), updatedAt: now()
  }
  const ts = now()
  jobCards.push(newJob)
  const cust = customers.find(x => x.id === newJob.customerId)
  const veh  = vehicles.find(x => x.id === newJob.vehicleId)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'JOB_CREATED', description: `Job card created from appointment #${apt.id}`, userId: 'u3', userName: 'System', timestamp: ts })
  addNotification('job_created', 'info', 'New Job Card Created',
    `${num} opened for ${cust?.name || 'customer'} – ${veh?.make || ''} ${veh?.model || ''} (${veh?.registrationNumber || ''})`,
    { jobCardId: newJob.id, jobCardNumber: num })

  // ── Auto-create Entry Gate Pass (same as manual job card creation) ──────────
  const gpNum = 'GMS-GP-' + new Date().getFullYear() + '-' + String(gatePasses.length + 1).padStart(3, '0')
  const entryGP: GatePass = {
    id: 'gp' + genId(),
    passNumber: gpNum,
    jobCardId: newJob.id,
    jobCardNumber: num,
    vehicleReg: veh?.registrationNumber || '',
    vehicleMake: veh?.make,
    vehicleModel: veh?.model,
    vehicleYear: veh?.year,
    vehicleColor: veh?.color,
    customerName: cust?.name || '',
    customerPhone: cust?.phone,
    entryTime: ts,
    status: 'Active',
    createdAt: ts,
    updatedAt: ts,
  }
  gatePasses.push(entryGP)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'GATE_PASS_ENTRY', description: `Entry Gate Pass ${gpNum} issued (from appointment)`, userId: 'u3', userName: 'System', timestamp: ts })

  appointments[idx] = { ...apt, status: 'In Progress', jobCardId: newJob.id, updatedAt: ts }
  return c.json({ jobCard: newJob, appointment: appointments[idx] }, 201)
})

// ─── Expenses ───────────────────────────────────────────────────────────────

// GET /expenses — list all expenses, optionally filtered by jobCardId, category, status, dateFrom, dateTo
api.get('/expenses', (c) => {
  const { jobCardId, category, status, dateFrom, dateTo } = c.req.query() as Record<string, string>
  let list = expenses.map(e => {
    const vnd = e.vendorId ? vendors.find(v => v.id === e.vendorId) : null
    return {
      ...e,
      vendor: vnd ? vnd.name : (e.vendor || undefined),
      vendorId: e.vendorId || undefined,
      vendorTIN: vnd?.tin,
      vendorLocation: vnd?.location,
      jobCardNumber: e.jobCardId ? jobCards.find(j => j.id === e.jobCardId)?.jobCardNumber : undefined,
      vehicleReg: e.jobCardId
        ? vehicles.find(v => v.id === jobCards.find(j => j.id === e.jobCardId)?.vehicleId)?.registrationNumber
        : undefined,
    }
  })
  if (jobCardId) list = list.filter(e => e.jobCardId === jobCardId)
  if (category)  list = list.filter(e => e.category === category)
  if (status)    list = list.filter(e => e.status === status)
  if (dateFrom)  list = list.filter(e => e.date >= dateFrom)
  if (dateTo)    list = list.filter(e => e.date <= dateTo)
  return c.json(list.sort((a, b) => b.date.localeCompare(a.date)))
})

// GET /expenses/summary — totals by category, status breakdown, monthly trend
api.get('/expenses/summary', (c) => {
  const { dateFrom, dateTo } = c.req.query() as Record<string, string>
  let list = expenses
  if (dateFrom) list = list.filter(e => e.date >= dateFrom)
  if (dateTo)   list = list.filter(e => e.date <= dateTo)

  const total       = list.reduce((s, e) => s + e.amount, 0)
  const totalPaid   = list.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0)
  const totalPending= list.filter(e => e.status === 'Pending' || e.status === 'Approved').reduce((s, e) => s + e.amount, 0)
  const jobLinked   = list.filter(e => e.jobCardId).reduce((s, e) => s + e.amount, 0)
  const overhead    = list.filter(e => !e.jobCardId).reduce((s, e) => s + e.amount, 0)

  const byCategory: Record<string, number> = {}
  list.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount })

  const byStatus: Record<string, number> = {}
  list.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + e.amount })

  // monthly trend: last 6 months
  const monthMap: Record<string, number> = {}
  list.forEach(e => {
    const m = e.date.substring(0, 7)
    monthMap[m] = (monthMap[m] || 0) + e.amount
  })
  const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)

  return c.json({ total, totalPaid, totalPending, jobLinked, overhead, byCategory, byStatus, months })
})

// GET /expenses/:id
api.get('/expenses/:id', (c) => {
  const e = expenses.find(x => x.id === c.req.param('id'))
  if (!e) return c.json({ error: 'Not found' }, 404)
  const job = e.jobCardId ? jobCards.find(j => j.id === e.jobCardId) : undefined
  const vnd = e.vendorId ? vendors.find(v => v.id === e.vendorId) : null
  return c.json({ ...e, jobCardNumber: job?.jobCardNumber, vendorName: vnd?.name, vendorTIN: vnd?.tin })
})

// POST /expenses
api.post('/expenses', async (c) => {
  const body = await c.req.json<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>()
  // If vendorId given, sync vendor name
  const vnd = body.vendorId ? vendors.find(v => v.id === body.vendorId) : null
  if (vnd) body.vendor = vnd.name
  const newExp: Expense = {
    ...body,
    id: 'ex' + genId(),
    status: body.status || 'Pending',
    createdAt: now(),
    updatedAt: now(),
  }
  expenses.push(newExp)
  const jc = newExp.jobCardId ? jobCards.find(j => j.id === newExp.jobCardId) : null
  addNotification('expense_created', 'info', 'Expense Recorded',
    `${newExp.category} – ${newExp.description} (TZS ${newExp.amount.toLocaleString()})${jc ? ` for ${jc.jobCardNumber}` : ' [Overhead]'}`,
    { jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber, entityId: newExp.id, entityType: 'expense' })
  return c.json(newExp, 201)
})

// PUT /expenses/:id
api.put('/expenses/:id', async (c) => {
  const idx = expenses.findIndex(e => e.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<Expense>>()
  // If vendorId given, sync vendor name
  if (body.vendorId) {
    const vnd = vendors.find(v => v.id === body.vendorId)
    if (vnd) body.vendor = vnd.name
  }
  expenses[idx] = { ...expenses[idx], ...body, updatedAt: now() }
  return c.json(expenses[idx])
})

// PATCH /expenses/:id/status
api.patch('/expenses/:id/status', async (c) => {
  const idx = expenses.findIndex(e => e.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { status } = await c.req.json<{ status: Expense['status'] }>()
  expenses[idx] = { ...expenses[idx], status, updatedAt: now() }
  if (status === 'Approved' || status === 'Paid') {
    const exp = expenses[idx]
    const jc = exp.jobCardId ? jobCards.find(j => j.id === exp.jobCardId) : null
    addNotification('expense_approved', status === 'Paid' ? 'success' : 'info',
      status === 'Paid' ? 'Expense Paid' : 'Expense Approved',
      `${exp.description} (TZS ${exp.amount.toLocaleString()}) marked as ${status}${jc ? ` – ${jc.jobCardNumber}` : ''}`,
      { jobCardId: jc?.id, jobCardNumber: jc?.jobCardNumber, entityId: exp.id, entityType: 'expense' })
  }
  return c.json(expenses[idx])
})

// DELETE /expenses/:id
api.delete('/expenses/:id', (c) => {
  const idx = expenses.findIndex(e => e.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  expenses.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Vendors ─────────────────────────────────────────────────────────────────

// GET /vendors
api.get('/vendors', (c) => {
  const { status, q } = c.req.query() as Record<string, string>
  let list = [...vendors]
  if (status) list = list.filter(v => v.status === status)
  if (q) {
    const lq = q.toLowerCase()
    list = list.filter(v =>
      v.name.toLowerCase().includes(lq) ||
      v.phone.includes(lq) ||
      (v.email || '').toLowerCase().includes(lq) ||
      (v.tin || '').includes(lq) ||
      (v.location || '').toLowerCase().includes(lq)
    )
  }
  // Enrich with expense count and total spend
  return c.json(list.map(v => ({
    ...v,
    expenseCount: expenses.filter(e => e.vendorId === v.id).length,
    totalSpend:   expenses.filter(e => e.vendorId === v.id).reduce((s, e) => s + e.amount, 0)
  })).sort((a, b) => a.name.localeCompare(b.name)))
})

// GET /vendors/:id
api.get('/vendors/:id', (c) => {
  const v = vendors.find(x => x.id === c.req.param('id'))
  if (!v) return c.json({ error: 'Not found' }, 404)
  const vExpenses = expenses.filter(e => e.vendorId === v.id).map(e => ({
    ...e,
    jobCardNumber: e.jobCardId ? jobCards.find(j => j.id === e.jobCardId)?.jobCardNumber : undefined
  }))
  return c.json({
    ...v,
    expenseCount: vExpenses.length,
    totalSpend:   vExpenses.reduce((s, e) => s + e.amount, 0),
    expenses:     vExpenses
  })
})

// POST /vendors
api.post('/vendors', async (c) => {
  const body = await c.req.json<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>()
  if (!body.name || !body.phone) return c.json({ error: 'Name and phone are required' }, 400)
  const newVendor: Vendor = {
    ...body,
    id: 'vnd' + genId(),
    status: body.status || 'Active',
    createdAt: now(),
    updatedAt: now(),
  }
  vendors.push(newVendor)
  return c.json(newVendor, 201)
})

// PUT /vendors/:id
api.put('/vendors/:id', async (c) => {
  const idx = vendors.findIndex(v => v.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<Vendor>>()
  vendors[idx] = { ...vendors[idx], ...body, updatedAt: now() }
  return c.json(vendors[idx])
})

// PATCH /vendors/:id/status
api.patch('/vendors/:id/status', async (c) => {
  const idx = vendors.findIndex(v => v.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { status } = await c.req.json<{ status: string }>()
  vendors[idx] = { ...vendors[idx], status: status as any, updatedAt: now() }
  return c.json(vendors[idx])
})

// DELETE /vendors/:id
api.delete('/vendors/:id', (c) => {
  const id = c.req.param('id')
  const linked = expenses.some(e => e.vendorId === id)
  if (linked) return c.json({ error: 'Cannot delete vendor with linked expenses. Deactivate instead.' }, 409)
  const idx = vendors.findIndex(v => v.id === id)
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  vendors.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Notifications ───────────────────────────────────────────────────────────

// GET /notifications?unread=true&type=&limit=50
api.get('/notifications', (c) => {
  const unreadOnly = c.req.query('unread') === 'true'
  const typeFilter = c.req.query('type')
  const limit      = parseInt(c.req.query('limit') || '50', 10)
  let list = notifications as Notification[]
  if (unreadOnly) list = list.filter(n => !n.read)
  if (typeFilter) list = list.filter(n => n.type === typeFilter)
  const unreadCount = notifications.filter(n => !n.read).length
  return c.json({ notifications: list.slice(0, limit), unreadCount })
})

// GET /notifications/summary — just the unread count (cheap poll)
api.get('/notifications/summary', (c) => {
  return c.json({ unreadCount: notifications.filter(n => !n.read).length })
})

// PATCH /notifications/read-all — mark all as read  (MUST be before /:id routes)
api.patch('/notifications/read-all', (c) => {
  notifications.forEach(n => { n.read = true })
  return c.json({ success: true })
})

// DELETE /notifications/clear-read — remove all read notifications (MUST be before /:id)
api.delete('/notifications/clear-read', (c) => {
  const before = notifications.length
  const keep   = notifications.filter(n => !n.read)
  notifications.splice(0, notifications.length, ...keep)
  return c.json({ removed: before - notifications.length })
})

// PATCH /notifications/:id/read — mark one as read
api.patch('/notifications/:id/read', (c) => {
  const n = notifications.find(x => x.id === c.req.param('id'))
  if (!n) return c.json({ error: 'Not found' }, 404)
  n.read = true
  return c.json(n)
})

// DELETE /notifications/:id
api.delete('/notifications/:id', (c) => {
  const idx = notifications.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  notifications.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Gate Passes ─────────────────────────────────────────────────────────────

// GET /gate-passes — list all, with optional status filter
api.get('/gate-passes', (c) => {
  const status = c.req.query('status')
  const list = status ? gatePasses.filter(g => g.status === status) : [...gatePasses]
  return c.json(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

// GET /gate-passes/summary — counts by status
api.get('/gate-passes/summary', (c) => {
  const active       = gatePasses.filter(g => g.status === 'Active').length
  const pendingExit  = gatePasses.filter(g => g.status === 'Pending Exit').length
  const cleared      = gatePasses.filter(g => g.status === 'Cleared').length
  const voided       = gatePasses.filter(g => g.status === 'Voided').length
  return c.json({ active, pendingExit, cleared, voided, total: gatePasses.length })
})

// GET /gate-passes/:id
api.get('/gate-passes/:id', (c) => {
  const gp = gatePasses.find(g => g.id === c.req.param('id'))
  if (!gp) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards.find(j => j.id === gp.jobCardId)
  return c.json({ ...gp, jobCard: jc || null })
})

// GET /gate-passes/by-job/:jobCardId — get gate pass for a specific job
api.get('/gate-passes/by-job/:jobCardId', (c) => {
  const gp = gatePasses.find(g => g.jobCardId === c.req.param('jobCardId'))
  if (!gp) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards.find(j => j.id === gp.jobCardId)
  return c.json({ ...gp, jobCard: jc || null })
})

// PATCH /gate-passes/:id/approve — admin approves exit (with signature)
api.patch('/gate-passes/:id/approve', async (c) => {
  const idx = gatePasses.findIndex(g => g.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const gp = gatePasses[idx]
  if (gp.status !== 'Pending Exit') {
    return c.json({ error: 'Gate pass is not in Pending Exit status' }, 400)
  }
  const body = await c.req.json<{ approvedBy: string; signatureData?: string; notes?: string }>()
  if (!body.approvedBy) return c.json({ error: 'approvedBy is required' }, 400)
  const ts = now()
  gatePasses[idx] = {
    ...gp,
    status: 'Cleared',
    approvedBy: body.approvedBy,
    approvedAt: ts,
    exitTime: ts,
    signatureData: body.signatureData,
    notes: body.notes || gp.notes,
    updatedAt: ts,
  }
  const jc = jobCards.find(j => j.id === gp.jobCardId)
  activityLog.push({ id: 'a' + genId(), jobCardId: gp.jobCardId, action: 'GATE_PASS_EXIT', description: `Exit Gate Pass ${gp.passNumber} approved by ${body.approvedBy}`, userId: 'u3', userName: body.approvedBy, timestamp: ts })
  addNotification('gate_pass_cleared', 'success', 'Exit Gate Pass Approved',
    `${gp.vehicleReg} cleared to exit by ${body.approvedBy}${jc ? ' – ' + jc.jobCardNumber : ''}`,
    { jobCardId: gp.jobCardId, jobCardNumber: jc?.jobCardNumber, entityId: gp.id, entityType: 'gate_pass' })
  return c.json(gatePasses[idx])
})

// PATCH /gate-passes/:id/void — admin voids a gate pass
api.patch('/gate-passes/:id/void', async (c) => {
  const idx = gatePasses.findIndex(g => g.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<{ reason?: string; voidedBy?: string }>()
  const ts = now()
  gatePasses[idx] = { ...gatePasses[idx], status: 'Voided', voidReason: body.reason, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: gatePasses[idx].jobCardId, action: 'GATE_PASS_VOIDED', description: `Gate Pass ${gatePasses[idx].passNumber} voided: ${body.reason || 'No reason given'}`, userId: 'u3', userName: body.voidedBy || 'System', timestamp: ts })
  return c.json(gatePasses[idx])
})

// PATCH /gate-passes/:id — update notes
api.patch('/gate-passes/:id', async (c) => {
  const idx = gatePasses.findIndex(g => g.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<GatePass>>()
  gatePasses[idx] = { ...gatePasses[idx], ...body, id: gatePasses[idx].id, updatedAt: now() }
  return c.json(gatePasses[idx])
})

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Fleet Invoices ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: build a line-item snapshot for one job card
function buildFleetLineItem(jobId: string): FleetInvoiceLineItem | null {
  const job = jobCards.find(j => j.id === jobId)
  if (!job) return null
  const vehicle  = vehicles.find(v => v.id === job.vehicleId)
  const svcItems = jobServices.filter(s => s.jobCardId === jobId)
  const partItems = partsConsumption.filter(p => p.jobCardId === jobId)

  const labourCost   = invoices.find(i => i.jobCardId === jobId)?.labourCost ?? 0
  const servicesCost = svcItems.reduce((s, sv) => s + (sv.totalCost ?? 0), 0)
  const partsCost    = partItems.reduce((s, p) => s + (p.totalCost ?? 0), 0)
  const subtotal     = labourCost + servicesCost + partsCost

  const vReg = vehicle?.registrationNumber || ''
  const vDesc = [vehicle?.make, vehicle?.model, vReg].filter(Boolean).join(' ')
  const description = `${job.damageDescription || 'Service'} – ${vDesc}`

  return {
    jobCardId:   job.id,
    jobCardNumber: job.jobCardNumber,
    description,
    labourCost,
    servicesCost,
    partsCost,
    subtotal,
    services: svcItems.map(sv => ({
      name:      sv.serviceName,
      qty:       sv.quantity ?? 1,
      unitPrice: Math.round((sv.totalCost ?? 0) / (sv.quantity || 1)),
      total:     sv.totalCost ?? 0,
    })),
    parts: partItems.map(p => ({
      name:      p.partName,
      qty:       p.quantity,
      unitPrice: p.unitPrice,
      total:     p.totalCost,
    })),
  }
}

// GET /fleet-invoices — list all fleet invoices
api.get('/fleet-invoices', (c) => {
  return c.json(fleetInvoices)
})

// GET /fleet-invoices/eligible-jobs/:customerId
// Returns INVOICED job cards for a customer that are NOT yet in a fleet invoice,
// and whose individual invoice has NOT been fully paid yet.
api.get('/fleet-invoices/eligible-jobs/:customerId', (c) => {
  const customerId = c.req.param('customerId')
  // Collect job IDs already in a fleet invoice
  const usedJobIds = new Set(fleetInvoices.flatMap(fi => fi.lineItems.map(li => li.jobCardId)))

  const eligible = jobCards
    .filter(j =>
      j.customerId === customerId &&
      j.status === 'INVOICED' &&
      !usedJobIds.has(j.id)
    )
    .map(j => {
      const inv     = invoices.find(i => i.jobCardId === j.id)
      const vehicle = vehicles.find(v => v.id === j.vehicleId)
      const li      = buildFleetLineItem(j.id)
      return {
        jobCardId:     j.id,
        jobCardNumber: j.jobCardNumber,
        status:        j.status,
        description:   j.damageDescription || '',
        vehicleReg:    vehicle?.registrationNumber || '',
        vehicleMake:   vehicle?.make || '',
        vehicleModel:  vehicle?.model || '',
        invoiceNumber: inv?.invoiceNumber || '',
        invoiceStatus: inv?.status || 'Issued',
        labourCost:    li?.labourCost ?? 0,
        servicesCost:  li?.servicesCost ?? 0,
        partsCost:     li?.partsCost ?? 0,
        subtotal:      li?.subtotal ?? 0,
        createdAt:     j.createdAt,
      }
    })

  return c.json(eligible)
})

// GET /fleet-invoices/:id
api.get('/fleet-invoices/:id', (c) => {
  const fi = fleetInvoices.find(f => f.id === c.req.param('id'))
  if (!fi) return c.json({ error: 'Not found' }, 404)
  return c.json(fi)
})

// POST /fleet-invoices — create a new fleet invoice
api.post('/fleet-invoices', async (c) => {
  const body = await c.req.json<{
    customerId: string
    jobCardIds: string[]
    discountType?: 'fixed' | 'percentage'
    discountValue?: number
    discountReason?: string
    dueDate?: string
    notes?: string
  }>()

  if (!body.customerId) return c.json({ error: 'customerId required' }, 400)
  if (!Array.isArray(body.jobCardIds) || body.jobCardIds.length < 2)
    return c.json({ error: 'At least 2 job cards required for a fleet invoice' }, 400)

  // Validate no job is already in a fleet invoice
  const usedJobIds = new Set(fleetInvoices.flatMap(fi => fi.lineItems.map(li => li.jobCardId)))
  const alreadyUsed = body.jobCardIds.filter(id => usedJobIds.has(id))
  if (alreadyUsed.length > 0)
    return c.json({ error: `Job cards already in a fleet invoice: ${alreadyUsed.join(', ')}` }, 400)

  const customer = customers.find(c2 => c2.id === body.customerId)
  if (!customer) return c.json({ error: 'Customer not found' }, 404)

  // Build line items
  const lineItems: FleetInvoiceLineItem[] = []
  for (const jid of body.jobCardIds) {
    const li = buildFleetLineItem(jid)
    if (!li) return c.json({ error: `Job card not found: ${jid}` }, 404)
    lineItems.push(li)
  }

  // Calculate totals
  const subtotal = lineItems.reduce((s, li) => s + li.subtotal, 0)
  let discountAmount = 0
  if (body.discountValue && body.discountType) {
    if (body.discountType === 'percentage') {
      discountAmount = Math.round(subtotal * Math.min(body.discountValue, 100) / 100)
    } else {
      discountAmount = Math.min(Math.round(body.discountValue), subtotal)
    }
  }
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const tax           = Math.round(afterDiscount * 0.18)
  const totalAmount   = afterDiscount + tax

  const ts  = now()
  const num = 'FLEET-INV-' + new Date().getFullYear() + '-' + String(fleetInvoices.length + 1).padStart(3, '0')
  const dueDate = body.dueDate || (() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
  })()

  const newFI: FleetInvoice = {
    id: 'fi' + genId(),
    fleetInvoiceNumber: num,
    customerId: body.customerId,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    lineItems,
    subtotal,
    discountType:   body.discountType,
    discountValue:  body.discountValue,
    discountAmount,
    discountReason: body.discountReason,
    tax,
    totalAmount,
    status:    'Issued',
    issuedAt:  ts,
    dueDate,
    amountPaid: 0,
    payments:   [],
    notes:      body.notes,
  }

  fleetInvoices.push(newFI)
  addNotification('invoice_created', 'success', 'Fleet Invoice Created',
    `${num} issued for ${customer.name} — ${lineItems.length} jobs, TZS ${totalAmount.toLocaleString()}`,
    { entityId: newFI.id, entityType: 'fleet_invoice' })

  return c.json(newFI, 201)
})

// PATCH /fleet-invoices/:id/status — record payment (same logic as regular invoices)
api.patch('/fleet-invoices/:id/status', async (c) => {
  const idx = fleetInvoices.findIndex(f => f.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<{
    status?: string
    paymentMethod?: string
    paymentReference?: string
    amountPaid?: number
    paidAt?: string
    dueDate?: string
  }>()

  const prev = fleetInvoices[idx]
  const newPayments = prev.payments ? [...prev.payments] : []
  const newPaymentAmount = body.amountPaid ?? 0

  if (body.paymentMethod && newPaymentAmount > 0) {
    newPayments.push({
      id: 'pay-' + prev.id + '-' + Date.now(),
      amount: newPaymentAmount,
      method: body.paymentMethod as any,
      reference: body.paymentReference,
      paidAt: body.paidAt || now(),
    })
  }

  const totalAmountPaid = newPayments.reduce((s, p) => s + p.amount, 0)
  let newStatus = (body.status as any) || prev.status || 'Issued'
  if (body.paymentMethod && newPaymentAmount > 0) {
    if (totalAmountPaid >= prev.totalAmount) newStatus = 'Paid'
    else if (totalAmountPaid > 0)            newStatus = 'Partially Paid'
  }

  fleetInvoices[idx] = {
    ...prev,
    status: newStatus,
    ...(body.dueDate ? { dueDate: body.dueDate } : {}),
    ...(body.paymentMethod ? { paymentMethod: body.paymentMethod as any, paymentReference: body.paymentReference } : {}),
    amountPaid: totalAmountPaid,
    payments:   newPayments,
    paidAt: newStatus === 'Paid' ? (body.paidAt || now()) : (prev.paidAt || undefined),
  }

  if (newStatus === 'Paid' && prev.status !== 'Paid') {
    addNotification('invoice_paid', 'success', 'Fleet Invoice Paid',
      `${prev.fleetInvoiceNumber} – TZS ${prev.totalAmount.toLocaleString()} received via ${body.paymentMethod || 'payment'} from ${prev.customerName}`,
      { entityId: prev.id, entityType: 'fleet_invoice' })
  } else if (newStatus === 'Partially Paid') {
    addNotification('invoice_paid', 'info', 'Partial Fleet Payment',
      `${prev.fleetInvoiceNumber} – TZS ${totalAmountPaid.toLocaleString()} of TZS ${prev.totalAmount.toLocaleString()} received`,
      { entityId: prev.id, entityType: 'fleet_invoice' })
  }

  return c.json(fleetInvoices[idx])
})

// DELETE /fleet-invoices/:id — void/delete a fleet invoice
api.delete('/fleet-invoices/:id', async (c) => {
  const idx = fleetInvoices.findIndex(f => f.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const fi = fleetInvoices[idx]
  if (fi.status === 'Paid') return c.json({ error: 'Cannot delete a paid fleet invoice' }, 400)
  fleetInvoices.splice(idx, 1)
  return c.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /subscription-plans — list all plans
api.get('/subscription-plans', (c) => {
  return c.json(subscriptionPlans)
})

// POST /subscription-plans — create a new plan
api.post('/subscription-plans', async (c) => {
  const body = await c.req.json<Omit<SubscriptionPlan, 'id' | 'createdAt'>>()
  if (!body.serviceName || !body.billingCycle || !body.visitsPerCycle || !body.cyclePrice) {
    return c.json({ error: 'serviceName, billingCycle, visitsPerCycle and cyclePrice are required' }, 400)
  }
  const plan: SubscriptionPlan = {
    ...body,
    id: 'splan' + genId(),
    isActive: body.isActive !== false,
    createdAt: now(),
  }
  subscriptionPlans.push(plan)
  save()
  return c.json(plan, 201)
})

// PATCH /subscription-plans/:id — update a plan
api.patch('/subscription-plans/:id', async (c) => {
  const idx = subscriptionPlans.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<SubscriptionPlan>>()
  subscriptionPlans[idx] = { ...subscriptionPlans[idx], ...body }
  save()
  return c.json(subscriptionPlans[idx])
})

// DELETE /subscription-plans/:id — soft-deactivate a plan
api.delete('/subscription-plans/:id', (c) => {
  const idx = subscriptionPlans.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  // Only deactivate if no active subscriptions reference it
  const inUse = customerSubscriptions.some(s => s.planId === c.req.param('id') && s.status === 'Active')
  if (inUse) return c.json({ error: 'Cannot delete a plan with active subscribers' }, 400)
  subscriptionPlans[idx].isActive = false
  save()
  return c.json({ success: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /subscriptions — list all (optionally filter by customerId, status)
api.get('/subscriptions', (c) => {
  const { customerId, status, vehicleId } = c.req.query() as Record<string, string>
  let list = [...customerSubscriptions]
  if (customerId) list = list.filter(s => s.customerId === customerId)
  if (vehicleId)  list = list.filter(s => s.vehicleId  === vehicleId)
  if (status)     list = list.filter(s => s.status     === status)
  // Enrich with customer + vehicle names
  return c.json(list.map(s => ({
    ...s,
    customerName: customers.find(c2 => c2.id === s.customerId)?.name ?? '',
    vehicleReg:   s.vehicleId ? (vehicles.find(v => v.id === s.vehicleId)?.registrationNumber ?? '') : '',
  })))
})

// GET /subscriptions/stats — dashboard stats
api.get('/subscriptions/stats', (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7)
  const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3)

  const active   = customerSubscriptions.filter(s => s.status === 'Active')
  const renewing = active.filter(s => {
    if (!s.renewalDate) return false
    const rd = new Date(s.renewalDate); rd.setHours(0,0,0,0)
    return rd >= today && rd <= in7Days
  })
  const overdue  = customerSubscriptions.filter(s => s.paymentStatus === 'Overdue')
  const pending  = customerSubscriptions.filter(s => s.paymentStatus === 'Pending' && s.status === 'Active')
  const expiredPacks = active.filter(s => s.billingCycle === 'visit_pack' && s.visitsUsed >= s.visitsAllowed)

  // Reminders: renewalDate within 3 days, not yet paid, reminder not sent today
  const reminders = active.filter(s => {
    if (s.paymentStatus === 'Paid') return false
    if (!s.renewalDate) return false
    const rd = new Date(s.renewalDate); rd.setHours(0,0,0,0)
    return rd >= today && rd <= in3Days
  })

  return c.json({
    totalActive: active.length,
    renewingIn7Days: renewing.length,
    pendingPayment: pending.length + overdue.length,
    overdueCount: overdue.length,
    exhaustedPacks: expiredPacks.length,
    reminders: reminders.map(s => ({
      id: s.id,
      customerId: s.customerId,
      customerName: customers.find(c2 => c2.id === s.customerId)?.name ?? '',
      serviceName: s.serviceName,
      renewalDate: s.renewalDate,
      daysUntilRenewal: s.renewalDate
        ? Math.ceil((new Date(s.renewalDate).getTime() - today.getTime()) / 86400000)
        : null,
    }))
  })
})

// GET /subscriptions/:id — single subscription detail
api.get('/subscriptions/:id', (c) => {
  const sub = customerSubscriptions.find(s => s.id === c.req.param('id'))
  if (!sub) return c.json({ error: 'Not found' }, 404)
  const customer = customers.find(c2 => c2.id === sub.customerId)
  const vehicle  = sub.vehicleId ? vehicles.find(v => v.id === sub.vehicleId) : undefined
  return c.json({ ...sub, customer, vehicle })
})

// POST /subscriptions — enroll a customer in a plan
api.post('/subscriptions', async (c) => {
  const body = await c.req.json<{
    customerId: string
    vehicleId?: string
    planId: string
    startDate?: string
    notes?: string
  }>()
  if (!body.customerId || !body.planId) {
    return c.json({ error: 'customerId and planId are required' }, 400)
  }
  const plan = subscriptionPlans.find(p => p.id === body.planId)
  if (!plan) return c.json({ error: 'Plan not found' }, 404)
  if (!plan.isActive) return c.json({ error: 'Plan is no longer active' }, 400)

  const startDate = body.startDate || new Date().toISOString().slice(0, 10)

  // Calculate renewalDate only for monthly cycle
  let renewalDate: string | undefined
  if (plan.billingCycle === 'monthly') {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + 1)
    renewalDate = d.toISOString().slice(0, 10)
  }

  // Generate subscription invoice number
  const subInvCount = invoices.filter(i => i.invoiceType === 'subscription').length + 1
  const subInvNumber = 'SUB-' + new Date().getFullYear() + '-' + String(subInvCount).padStart(3, '0')

  // Create subscription invoice in the existing invoices array
  const subInvoice: Invoice = {
    id: 'sinv' + genId(),
    jobCardId: '',              // subscription invoices have no job card
    invoiceNumber: subInvNumber,
    invoiceType: 'subscription',
    subscriptionId: '',         // will be filled after sub is created
    labourCost: 0,
    partsCost: 0,
    tax: 0,
    totalAmount: plan.cyclePrice,
    status: 'Issued',
    issuedAt: new Date().toISOString(),
    dueDate: renewalDate,
  }

  const sub: CustomerSubscription = {
    id: 'sub' + genId(),
    customerId: body.customerId,
    vehicleId: body.vehicleId,
    planId: body.planId,
    serviceName: plan.serviceName,
    serviceType: plan.serviceType,
    billingCycle: plan.billingCycle,
    visitsPerCycle: plan.visitsPerCycle,
    cyclePrice: plan.cyclePrice,
    status: 'Active',
    startDate,
    renewalDate,
    visitsAllowed: plan.visitsPerCycle,
    visitsUsed: 0,
    invoiceId: subInvoice.id,
    subInvoiceNumber: subInvNumber,
    paymentStatus: 'Pending',
    usageLog: [],
    notes: body.notes,
    createdAt: now(),
    updatedAt: now(),
  }

  subInvoice.subscriptionId = sub.id
  invoices.push(subInvoice)
  customerSubscriptions.push(sub)
  save()

  // Notification
  const customer = customers.find(c2 => c2.id === body.customerId)
  addNotification('general', 'success', 'Subscription Enrolled',
    `${customer?.name ?? 'Customer'} enrolled in ${plan.serviceName} (${plan.billingCycle === 'monthly' ? 'Monthly' : `Pack of ${plan.visitsPerCycle}`})`,
    { entityId: sub.id, entityType: 'subscription' })

  return c.json({ subscription: sub, invoice: subInvoice }, 201)
})

// PATCH /subscriptions/:id — update status, payment, notes
api.patch('/subscriptions/:id', async (c) => {
  const idx = customerSubscriptions.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<CustomerSubscription>>()
  customerSubscriptions[idx] = { ...customerSubscriptions[idx], ...body, updatedAt: now() }
  save()
  return c.json(customerSubscriptions[idx])
})

// POST /subscriptions/:id/redeem — consume one visit credit
api.post('/subscriptions/:id/redeem', async (c) => {
  const idx = customerSubscriptions.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Subscription not found' }, 404)
  const sub = customerSubscriptions[idx]
  if (sub.status !== 'Active') return c.json({ error: 'Subscription is not active' }, 400)
  if (sub.visitsUsed >= sub.visitsAllowed) return c.json({ error: 'No visits remaining in this subscription' }, 400)

  const body = await c.req.json<{ jobCardId: string; jobCardNumber: string; note?: string }>()
  if (!body.jobCardId || !body.jobCardNumber) {
    return c.json({ error: 'jobCardId and jobCardNumber are required' }, 400)
  }

  sub.visitsUsed++
  sub.usageLog.push({
    id: 'ulog' + genId(),
    jobCardId: body.jobCardId,
    jobCardNumber: body.jobCardNumber,
    redeemedAt: new Date().toISOString(),
    note: body.note,
  })

  // Auto-expire visit packs when exhausted
  if (sub.billingCycle === 'visit_pack' && sub.visitsUsed >= sub.visitsAllowed) {
    sub.status = 'Expired'
    addNotification('general', 'warning', 'Visit Pack Exhausted',
      `${sub.serviceName} pack for ${customers.find(c2 => c2.id === sub.customerId)?.name ?? 'customer'} has been fully used.`,
      { entityId: sub.id, entityType: 'subscription' })
  }

  sub.updatedAt = now()
  customerSubscriptions[idx] = sub
  save()
  return c.json({ subscription: sub, visitsRemaining: sub.visitsAllowed - sub.visitsUsed })
})

// POST /subscriptions/:id/renew — start a new cycle (reset visits, new invoice)
api.post('/subscriptions/:id/renew', async (c) => {
  const idx = customerSubscriptions.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const sub = customerSubscriptions[idx]

  // Generate new renewal invoice
  const subInvCount = invoices.filter(i => i.invoiceType === 'subscription').length + 1
  const subInvNumber = 'SUB-' + new Date().getFullYear() + '-' + String(subInvCount).padStart(3, '0')

  // New renewalDate = old renewalDate + 1 month (or today + 1 month for visit packs)
  let newRenewalDate: string | undefined
  if (sub.billingCycle === 'monthly') {
    const base = sub.renewalDate ? new Date(sub.renewalDate) : new Date()
    base.setMonth(base.getMonth() + 1)
    newRenewalDate = base.toISOString().slice(0, 10)
  }

  const renewInvoice: Invoice = {
    id: 'sinv' + genId(),
    jobCardId: '',
    invoiceNumber: subInvNumber,
    invoiceType: 'subscription',
    subscriptionId: sub.id,
    labourCost: 0,
    partsCost: 0,
    tax: 0,
    totalAmount: sub.cyclePrice,
    status: 'Issued',
    issuedAt: new Date().toISOString(),
    dueDate: newRenewalDate,
  }
  invoices.push(renewInvoice)

  // Reset cycle
  customerSubscriptions[idx] = {
    ...sub,
    status: 'Active',
    visitsUsed: 0,
    visitsAllowed: sub.visitsPerCycle,
    renewalDate: newRenewalDate,
    invoiceId: renewInvoice.id,
    subInvoiceNumber: subInvNumber,
    paymentStatus: 'Pending',
    reminderSentAt: undefined,
    updatedAt: now(),
  }
  save()

  const customer = customers.find(c2 => c2.id === sub.customerId)
  addNotification('general', 'info', 'Subscription Renewed',
    `${sub.serviceName} for ${customer?.name ?? 'customer'} has been renewed (${subInvNumber}).`,
    { entityId: sub.id, entityType: 'subscription' })

  return c.json({ subscription: customerSubscriptions[idx], invoice: renewInvoice })
})

// POST /subscriptions/:id/mark-paid — mark current cycle invoice as paid
api.post('/subscriptions/:id/mark-paid', async (c) => {
  const idx = customerSubscriptions.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<{ paymentMethod?: string; paymentReference?: string }>()
  const sub = customerSubscriptions[idx]

  // Update subscription invoice status
  if (sub.invoiceId) {
    const invIdx = invoices.findIndex(i => i.id === sub.invoiceId)
    if (invIdx !== -1) {
      invoices[invIdx] = {
        ...invoices[invIdx],
        status: 'Paid',
        paidAt: new Date().toISOString(),
        paymentMethod: (body.paymentMethod as any) ?? invoices[invIdx].paymentMethod,
        paymentReference: body.paymentReference ?? invoices[invIdx].paymentReference,
        amountPaid: sub.cyclePrice,
      }
    }
  }

  customerSubscriptions[idx] = { ...sub, paymentStatus: 'Paid', updatedAt: now() }
  save()
  return c.json(customerSubscriptions[idx])
})

// GET /customers/:id/subscriptions — subscriptions for a specific customer
api.get('/customers/:id/subscriptions', (c) => {
  const customerId = c.req.param('id')
  const subs = customerSubscriptions
    .filter(s => s.customerId === customerId)
    .map(s => ({
      ...s,
      vehicleReg: s.vehicleId ? (vehicles.find(v => v.id === s.vehicleId)?.registrationNumber ?? '') : '',
      vehicleMake: s.vehicleId ? (vehicles.find(v => v.id === s.vehicleId)?.make ?? '') : '',
      vehicleModel: s.vehicleId ? (vehicles.find(v => v.id === s.vehicleId)?.model ?? '') : '',
    }))
  return c.json(subs)
})

// GET /jobcards/:id/active-subscriptions — used by job card to show redemption banner
api.get('/jobcards/:id/active-subscriptions', (c) => {
  const jc = jobCards.find(j => j.id === c.req.param('id'))
  if (!jc) return c.json([])
  const active = customerSubscriptions.filter(s =>
    s.customerId === jc.customerId &&
    s.status === 'Active' &&
    s.visitsUsed < s.visitsAllowed &&
    (!s.vehicleId || s.vehicleId === jc.vehicleId)
  )
  return c.json(active)
})

export default api
