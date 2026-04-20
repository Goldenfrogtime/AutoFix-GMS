import { Hono } from 'hono'
import {
  customers, vehicles, jobCards, pfis, partsConsumption,
  invoices, servicePackages, users, activityLog, sessions,
  oilServiceProducts, catalogueParts, carWashPackages, addOnServices, appointments,
  jobServices, expenses, notifications, lubricantProducts, vendors, gatePasses,
  fleetInvoices,
  subscriptionPlans,
  customerSubscriptions,
  jobCardPhotos,
  customerNotifDispatches,
  garageSettings,
  salesTargets,
  salesCommissions,
  saUpsellTargets,
  saUpsellCommissions,
  techReferralCommissions,
  updateGarageSettings,
  ROLE_PERMISSIONS,
  type Customer, type Vehicle, type JobCard, type PFI,
  type PartConsumption, type ServicePackage, type User, type Invoice,
  type CataloguePart, type CarWashPackage, type AddOnService, type Appointment,
  type JobService, type Expense, type Notification, type NotificationType, type NotificationPriority,
  type LubricantProduct, type Permission, type StatusTimelineEntry, type JobCardStatus, type Vendor,
  type GatePass, type FleetInvoice, type FleetInvoiceLineItem,
  type SubscriptionPlan, type CustomerSubscription, type SubscriptionStatus,
  type JobCardPhoto, type PhotoCategory,
  type CustomerNotifDispatch, type NotifChannel, type NotifDispatchStatus,
  type GarageSettings,
  type SalesTarget, type SalesCommission, type TargetPeriod,
  type SAUpsellTarget, type SAUpsellCommission, type TechReferralCommission
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

// ─── Global Auth Middleware ──────────────────────────────────────────────────
// All routes except /auth/login require a valid Bearer token.
// Returns 401 if token is missing/invalid or if the user account is inactive.
api.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  // Allow login endpoint without auth
  if (path.endsWith('/auth/login')) return next()
  // All other routes need a valid session
  const user = getSessionUser(c)
  if (!user) return c.json({ error: 'Unauthenticated' }, 401)
  // Attach user to context for downstream handlers
  ;(c as any).user = user
  return next()
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
  // Use context-cached user if already resolved by auth middleware
  if ((c as any).user) return (c as any).user as User
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

/** Returns 403 JSON if the current user lacks the given permission */
function requirePerm(c: any, permission: Permission): Response | null {
  const user = getSessionUser(c)
  if (!can(user, permission)) {
    return c.json({ error: 'Permission denied', required: permission }, 403) as any
  }
  return null
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

// ─── Customer Notification Dispatcher ────────────────────────────────────────
// Sends a customer-facing message via the configured channels (SMS / email /
// WhatsApp) and records each dispatch attempt in customerNotifDispatches.
// If no channels are enabled, the notification is recorded as 'simulated'.
async function dispatchCustomerNotification(opts: {
  triggerEvent: string
  subject: string
  body: string
  customer: Customer | null
  jobCardId?: string
}): Promise<void> {
  const { triggerEvent, subject, body, customer, jobCardId } = opts
  if (!customer) return

  const channels: { channel: NotifChannel; enabled: boolean; recipientPhone?: string; recipientEmail?: string }[] = [
    { channel: 'sms',      enabled: garageSettings.smsEnabled && !!(customer.phone || customer.email), recipientPhone: customer.phone },
    { channel: 'email',    enabled: garageSettings.emailEnabled && !!customer.email,                    recipientEmail: customer.email },
    { channel: 'whatsapp', enabled: garageSettings.whatsappEnabled && !!(customer.phone),              recipientPhone: customer.phone },
  ]

  const activeChannels = channels.filter(ch => ch.enabled)

  // If no channels are configured, log a simulated dispatch so the record exists
  if (!activeChannels.length) {
    const d: CustomerNotifDispatch = {
      id: 'cnd' + genId(),
      channel: 'sms',
      recipientPhone: customer.phone || undefined,
      recipientEmail: customer.email || undefined,
      recipientName: customer.name,
      subject,
      body,
      triggerEvent,
      jobCardId,
      customerId: customer.id,
      status: 'simulated',
      sentAt: now(),
    }
    customerNotifDispatches.unshift(d)
    if (customerNotifDispatches.length > 1000) customerNotifDispatches.splice(1000)
    return
  }

  for (const ch of activeChannels) {
    let status: NotifDispatchStatus = 'sent'
    let errorMessage: string | undefined

    try {
      // ── SMS ──────────────────────────────────────────────────────────────────
      if (ch.channel === 'sms' && garageSettings.smsApiKey) {
        if (garageSettings.smsProvider === 'africastalking') {
          const res = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'apiKey': garageSettings.smsApiKey,
            },
            body: new URLSearchParams({
              username: 'sandbox',
              to: customer.phone || '',
              message: body,
              from: garageSettings.smsSenderId || 'GMS',
            }).toString(),
          })
          if (!res.ok) throw new Error('AT SMS HTTP ' + res.status)
        } else {
          // BongoLive / Nexmo / other: record as simulated (keys present but provider not integrated)
          status = 'simulated'
        }
      }

      // ── Email ─────────────────────────────────────────────────────────────────
      if (ch.channel === 'email' && garageSettings.emailApiKey && garageSettings.emailProvider === 'sendgrid') {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + garageSettings.emailApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: customer.email, name: customer.name }] }],
            from: { email: garageSettings.emailFrom || 'noreply@gms.local', name: garageSettings.garageName },
            subject,
            content: [{ type: 'text/plain', value: body }],
          }),
        })
        if (!res.ok) throw new Error('SendGrid HTTP ' + res.status)
      } else if (ch.channel === 'email') {
        status = 'simulated'
      }

      // ── WhatsApp ──────────────────────────────────────────────────────────────
      if (ch.channel === 'whatsapp') {
        // WhatsApp (360dialog / Twilio) integration recorded as simulated unless
        // the provider is explicitly wired up.
        status = 'simulated'
      }
    } catch (err: any) {
      status = 'failed'
      errorMessage = err?.message || 'Unknown error'
    }

    const d: CustomerNotifDispatch = {
      id: 'cnd' + genId(),
      channel: ch.channel,
      recipientPhone: ch.recipientPhone,
      recipientEmail: ch.recipientEmail,
      recipientName: customer.name,
      subject,
      body,
      triggerEvent,
      jobCardId,
      customerId: customer.id,
      status,
      errorMessage,
      sentAt: now(),
    }
    customerNotifDispatches.unshift(d)
    if (customerNotifDispatches.length > 1000) customerNotifDispatches.splice(1000)
  }
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
  const DONE_STATUSES = ['COMPLETED', 'INVOICED', 'RELEASED', 'PAID', 'CLOSED']
  const active = jobCards.filter(j => !DONE_STATUSES.includes(j.status) && j.status !== 'REJECTED').length
  const pendingApproval = jobCards.filter(j => j.status === 'PENDING_APPROVAL').length
  const inProgress = jobCards.filter(j => j.status === 'WORK_IN_PROGRESS' || j.status === 'REPAIR_IN_PROGRESS').length
  const awaitingApproval = jobCards.filter(j => j.status === 'AWAITING_INSURER_APPROVAL' || j.status === 'PFI_PENDING' || j.status === 'CUSTOMER_APPROVAL').length
  const completed = jobCards.filter(j => j.status === 'COMPLETED' || j.status === 'PAID' || j.status === 'CLOSED').length
  const readyPickup = jobCards.filter(j => j.status === 'RELEASED' || j.status === 'FINISHED' || j.status === 'CUSTOMER_SIGNOFF').length
  const pendingInvoices = jobCards.filter(j => j.status === 'INVOICED').length
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0)
  const recentJobs = [...jobCards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(j => {
    const v = vehicles.find(v => v.id === j.vehicleId)
    const cu = customers.find(cx => cx.id === j.customerId)
    return { ...j, vehicleReg: v?.registrationNumber, vehicleMake: v?.make, vehicleModel: v?.model, customerName: cu?.name }
  })
  return c.json({ active, pendingApproval, inProgress, awaitingApproval, completed, readyPickup, pendingInvoices, totalRevenue, recentJobs })
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
  const creator = (c as any).user as User | undefined
  const newCustomer: Customer = {
    ...body,
    id: 'c' + genId(),
    createdAt: now(),
    // Auto-tag Sales rep if the creator is a Sales role
    salesRepId:   body.salesRepId   || (creator?.role === 'Sales' ? creator.id   : undefined),
    salesRepName: body.salesRepName || (creator?.role === 'Sales' ? creator.name : undefined),
  }
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
  const _p = requirePerm(c, 'customers.delete'); if (_p) return _p
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
  const _p = requirePerm(c, 'vehicles.edit'); if (_p) return _p
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
  const _p1 = requirePerm(c, 'jobcards.create'); if (_p1) return _p1
  const body = await c.req.json<Omit<JobCard, 'id' | 'jobCardNumber' | 'status' | 'createdAt' | 'updatedAt'>>()
  const num = 'GMS-' + new Date().getFullYear() + '-' + String(jobCards.length + 1).padStart(3, '0')
  const ts = now()
  // New pipeline: start as DRAFT then auto-advance to PENDING_APPROVAL
  const firstEntry: StatusTimelineEntry = {
    status: 'PENDING_APPROVAL',
    enteredAt: ts,
    technician: body.assignedTechnician || undefined
  }
  // Record technicianAssignedAt if a technician is already assigned
  const techAssignedAt = body.assignedTechnician ? ts : undefined
  const newJob: JobCard = {
    ...body,
    id: 'j' + genId(),
    jobCardNumber: num,
    status: 'PENDING_APPROVAL',  // Start directly at PENDING_APPROVAL
    statusTimeline: [firstEntry],
    technicianAssignedAt: techAssignedAt,
    createdAt: ts,
    updatedAt: ts
  }
  jobCards.push(newJob)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'JOB_CREATED', description: 'New job card created — awaiting approval', userId: 'u3', userName: 'System', timestamp: ts })
  const cust = customers.find(x => x.id === newJob.customerId)
  const veh  = vehicles.find(x => x.id === newJob.vehicleId)
  addNotification('job_created', 'warning', 'New Job Card — Approval Required',
    `${num} created for ${cust?.name || 'customer'} – ${veh?.make || ''} ${veh?.model || ''} (${veh?.registrationNumber || ''}) — awaiting Admin/Workshop Controller approval`,
    { jobCardId: newJob.id, jobCardNumber: num })

  // Dispatch customer notification if enabled
  if (garageSettings.notifyOnJobCreate && cust) {
    dispatchCustomerNotification({
      triggerEvent: 'job_created',
      subject: 'Your Vehicle Has Been Received',
      body: `Dear ${cust.name}, your vehicle (${veh?.registrationNumber || ''} ${veh?.make || ''} ${veh?.model || ''}) has been received at ${garageSettings.garageName}. Job Card: ${num}. We will keep you updated on the progress.`,
      customer: cust,
      jobCardId: newJob.id,
    })
  }

  // NOTE: Gate Pass IN is no longer auto-created at job creation.
  // It will be auto-created in Phase 2 after Preliminary Check + Customer Signature.

  return c.json(newJob, 201)
})

api.patch('/jobcards/:id/status', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<{ status: string; userId?: string; userName?: string }>()
  const status = body.status
  const old = jobCards[idx].status
  const ts = now()
  const userId = body.userId
  const userName = body.userName

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

  // Compute total TAT when reaching CLOSED or COMPLETED (legacy)
  let completedAt = jobCards[idx].completedAt
  let totalTATMins = jobCards[idx].totalTATMins
  if (status === 'COMPLETED' || status === 'CLOSED') {
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
  activityLog.push({ id: 'a' + genId(), jobCardId: jobCards[idx].id, action: 'STATUS_CHANGE', description: `Status changed from ${old} to ${status}`, userId: userId || 'u2', userName: userName || 'System', timestamp: ts })
  const jc = jobCards[idx]
  const statusLabels: Record<string, string> = {
    DRAFT: 'Draft', PENDING_APPROVAL: 'Pending Approval', APPROVED: 'Approved',
    REJECTED: 'Rejected', PRE_HANDOVER: 'Pre-Handover', HANDED_OVER: 'Handed Over',
    INSPECTION: 'Inspection', PFI_PENDING: 'PFI Pending', PFI_APPROVED: 'PFI Approved',
    CUSTOMER_APPROVAL: 'Customer Approval', PARTS_RELEASED: 'Parts Released',
    WORK_IN_PROGRESS: 'Work In Progress', FINISHED: 'Finished',
    QUALITY_CONTROL: 'Quality Control', CUSTOMER_SIGNOFF: 'Customer Sign-off',
    INVOICED: 'Invoiced', PAID: 'Paid', CLOSED: 'Closed',
    // Legacy
    RECEIVED: 'Received', PFI_PREPARATION: 'PFI Preparation',
    AWAITING_INSURER_APPROVAL: 'Awaiting Insurer Approval', REPAIR_IN_PROGRESS: 'Repair In Progress',
    WAITING_FOR_PARTS: 'Waiting for Parts', QUALITY_CHECK: 'Quality Check',
    COMPLETED: 'Completed', RELEASED: 'Released'
  }
  const isCompleted = status === 'COMPLETED' || status === 'CLOSED' || status === 'PAID'
  const isWaiting   = status === 'WAITING_FOR_PARTS' || status === 'CUSTOMER_APPROVAL' || status === 'PFI_PENDING'
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

// ─── Approve / Reject / Cancel a Job Card ───────────────────────────────────
// decision: 'APPROVED' | 'REJECTED' | 'CANCELLED'
// Only Admin or Workshop Controller should call this.
api.patch('/jobcards/:id/approve', async (c) => {
  const _p2 = requirePerm(c, 'jobcards.approve'); if (_p2) return _p2
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  const { decision, notes, reason, userId, userName } = await c.req.json<{
    decision: 'APPROVED' | 'REJECTED' | 'CANCELLED'
    notes?: string
    reason?: string
    userId?: string
    userName?: string
  }>()

  if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(decision)) {
    return c.json({ error: 'Invalid decision. Must be APPROVED, REJECTED, or CANCELLED' }, 400)
  }
  if (jc.status !== 'PENDING_APPROVAL') {
    return c.json({ error: `Job card is not pending approval. Current status: ${jc.status}` }, 400)
  }
  if (decision === 'REJECTED' && !reason?.trim()) {
    return c.json({ error: 'Rejection reason is required' }, 400)
  }

  const ts = now()
  const timeline: StatusTimelineEntry[] = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)

  let newStatus: JobCardStatus
  let extraFields: Partial<JobCard> = {}

  if (decision === 'APPROVED') {
    newStatus = 'APPROVED'
    extraFields = { approvedBy: userId, approvedByName: userName, approvedAt: ts, approvalNotes: notes }
    const newEntry = openTimelineEntry(jc, newStatus, ts)
    timeline.push(newEntry)
    activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'JOB_APPROVED', description: `Job card approved by ${userName || 'Admin/Workshop Controller'}${notes ? ': ' + notes : ''}`, userId: userId || 'system', userName: userName || 'System', timestamp: ts })
    addNotification('job_status', 'success', 'Job Card Approved ✓',
      `${jc.jobCardNumber} has been approved by ${userName || 'Admin/Workshop Controller'}`,
      { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  } else if (decision === 'REJECTED') {
    newStatus = 'REJECTED'
    extraFields = { rejectedBy: userId, rejectedByName: userName, rejectedAt: ts, rejectionReason: reason }
    const newEntry = openTimelineEntry(jc, newStatus, ts)
    timeline.push(newEntry)
    activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'JOB_REJECTED', description: `Job card rejected by ${userName || 'Admin/Workshop Controller'}: ${reason}`, userId: userId || 'system', userName: userName || 'System', timestamp: ts })
    addNotification('job_status', 'warning', 'Job Card Rejected',
      `${jc.jobCardNumber} was rejected — ${reason}`,
      { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  } else {
    // CANCELLED
    newStatus = 'REJECTED' // We use REJECTED status but record cancel reason
    extraFields = { cancelledBy: userId, cancelledByName: userName, cancelledAt: ts, cancelReason: reason || 'Cancelled by Admin/Workshop Controller' }
    const newEntry = openTimelineEntry(jc, newStatus, ts)
    timeline.push(newEntry)
    activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'JOB_CANCELLED', description: `Job card cancelled by ${userName || 'Admin/Workshop Controller'}`, userId: userId || 'system', userName: userName || 'System', timestamp: ts })
  }

  jobCards[idx] = { ...jc, status: newStatus, statusTimeline: timeline, ...extraFields, updatedAt: ts }
  return c.json(jobCards[idx])
})

// ─── Preliminary Check (Phase 2) ────────────────────────────────────────────
// POST /jobcards/:id/preliminary-check
// Called by Service Advisor after completing the preliminary check + customer signature.
// Saves check data, advances status APPROVED → PRE_HANDOVER → HANDED_OVER,
// and auto-generates the Entry Gate Pass.
api.post('/jobcards/:id/preliminary-check', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]

  // Allow from PRE_HANDOVER or APPROVED
  if (!['PRE_HANDOVER', 'APPROVED'].includes(jc.status)) {
    return c.json({ error: `Preliminary check can only be completed from PRE_HANDOVER or APPROVED status. Current: ${jc.status}` }, 400)
  }

  const body = await c.req.json<{
    spareTyre: string; jack: string; wheelSpanner: string; triangle: string
    toolbox: string; fireExtinguisher: string
    fuelLevelCheck: string; mileageAtHandover: number
    existingDamage: string; vehicleCondition: string
    valuables: string[]; notes: string
    serviceAdvisorName: string; serviceAdvisorSignature: string
    customerName: string; customerSignature: string
    completedBy: string; completedByName: string
  }>()

  if (!body.customerSignature) {
    return c.json({ error: 'Customer signature is required to complete handover' }, 400)
  }
  if (!body.serviceAdvisorSignature) {
    return c.json({ error: 'Service Advisor signature is required' }, 400)
  }

  const ts = now()
  const cust = customers.find(x => x.id === jc.customerId)
  const veh  = vehicles.find(x => x.id === jc.vehicleId)

  // Build preliminary check record
  const prelimCheck = {
    spareTyre: body.spareTyre || 'Absent',
    jack: body.jack || 'Absent',
    wheelSpanner: body.wheelSpanner || 'Absent',
    triangle: body.triangle || 'Absent',
    toolbox: body.toolbox || 'Absent',
    fireExtinguisher: body.fireExtinguisher || 'Absent',
    fuelLevelCheck: body.fuelLevelCheck || '',
    mileageAtHandover: body.mileageAtHandover || 0,
    existingDamage: body.existingDamage || '',
    vehicleCondition: body.vehicleCondition || 'Good',
    valuables: body.valuables || [],
    notes: body.notes || '',
    serviceAdvisorName: body.serviceAdvisorName || body.completedByName || '',
    serviceAdvisorSignature: body.serviceAdvisorSignature,
    customerName: body.customerName || cust?.name || '',
    customerSignature: body.customerSignature,
    completedAt: ts,
    completedBy: body.completedBy || '',
    completedByName: body.completedByName || '',
  }

  // Advance timeline: PRE_HANDOVER → HANDED_OVER
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'HANDED_OVER', ts))

  // Auto-generate Entry Gate Pass
  const gpNum = 'GMS-GP-' + new Date().getFullYear() + '-' + String(gatePasses.length + 1).padStart(3, '0')
  const entryGP: GatePass = {
    id: 'gp' + genId(),
    passNumber: gpNum,
    jobCardId: jc.id,
    jobCardNumber: jc.jobCardNumber,
    vehicleReg: veh?.registrationNumber || '',
    vehicleMake: veh?.make,
    vehicleModel: veh?.model,
    vehicleYear: veh?.year,
    vehicleColor: (veh as any)?.color,
    customerName: cust?.name || body.customerName || '',
    customerPhone: cust?.phone,
    entryTime: ts,
    status: 'Active',
    notes: `Entry after preliminary check — SA: ${body.completedByName}`,
    createdAt: ts,
    updatedAt: ts,
  }
  gatePasses.push(entryGP)

  // Save everything
  jobCards[idx] = {
    ...jc,
    status: 'HANDED_OVER',
    statusTimeline: timeline,
    preliminaryCheck: prelimCheck as any,
    gatePassInId: entryGP.id,
    // Update mileage from the check form if provided
    mileageIn: body.mileageAtHandover || jc.mileageIn,
    fuelLevel: body.fuelLevelCheck || jc.fuelLevel,
    updatedAt: ts,
  }

  activityLog.push({
    id: 'a' + genId(), jobCardId: jc.id,
    action: 'PRELIMINARY_CHECK',
    description: `Preliminary check completed by ${body.completedByName}. Customer signed. Gate Pass ${gpNum} issued.`,
    userId: body.completedBy || 'system', userName: body.completedByName || 'System', timestamp: ts
  })

  addNotification('job_status', 'success', 'Vehicle Handed Over',
    `${jc.jobCardNumber} — preliminary check done, customer signed. Gate Pass ${gpNum} issued.`,
    { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: entryGP.id, entityType: 'gate_pass' })

  return c.json({ jobCard: jobCards[idx], gatePass: entryGP })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /jobcards/:id/start-inspection ─────────────────────────────────────
// HANDED_OVER → INSPECTION. Technician/SA begins the inspection.
api.post('/jobcards/:id/start-inspection', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'HANDED_OVER') {
    return c.json({ error: `Job must be HANDED_OVER to start inspection. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<{ userId?: string; userName?: string }>()
  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'INSPECTION', ts))
  jobCards[idx] = { ...jc, status: 'INSPECTION', statusTimeline: timeline, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'STATUS_CHANGE', description: `Inspection started by ${body.userName || 'system'}`, userId: body.userId || 'system', userName: body.userName || 'System', timestamp: ts })
  addNotification('job_status', 'info', 'Inspection Started', `${jc.jobCardNumber} — vehicle under inspection.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/complete-inspection ───────────────────────────────────
// Saves inspection form data. INSPECTION → PFI_PENDING.
api.post('/jobcards/:id/complete-inspection', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  // Accept HANDED_OVER as well — the frontend auto-calls start-inspection first,
  // but guard here too in case of race conditions or direct API calls.
  if (!['INSPECTION', 'HANDED_OVER'].includes(jc.status)) {
    return c.json({ error: `Job must be in INSPECTION or HANDED_OVER status. Current: ${jc.status}` }, 400)
  }
  // If still HANDED_OVER, advance to INSPECTION inline
  if (jc.status === 'HANDED_OVER') {
    const ts0 = now()
    const tl0 = jc.statusTimeline ? [...jc.statusTimeline] : []
    const openE = tl0.findLast ? tl0.findLast((e: any) => !e.exitedAt) : [...tl0].reverse().find((e: any) => !e.exitedAt)
    if (openE) closeTimelineEntry(openE, ts0)
    tl0.push(openTimelineEntry(jc, 'INSPECTION', ts0))
    jobCards[idx] = { ...jc, status: 'INSPECTION', statusTimeline: tl0, updatedAt: ts0 }
  }
  const body = await c.req.json<any>()
  if (!body.technicianSignature) return c.json({ error: 'Technician signature required' }, 400)

  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'PFI_PENDING', ts))

  const inspData = {
    engineOilTopup: body.engineOilTopup || 'N/A', airFilter: body.airFilter || 'N/A',
    acFilter: body.acFilter || 'N/A', sparkPlugs: body.sparkPlugs || 'N/A',
    bulbs: body.bulbs || 'N/A', tiresCondition: body.tiresCondition || 'N/A',
    brakeConditions: body.brakeConditions || 'N/A', leakages: body.leakages || 'N/A',
    coolantLevel: body.coolantLevel || 'N/A', wiperBlades: body.wiperBlades || 'N/A',
    battery: body.battery || 'N/A', fireExtinguisher: body.fireExtinguisher || 'N/A',
    brakeFluidLevel: body.brakeFluidLevel || 'N/A', triangle: body.triangle || 'N/A',
    hydraulic: body.hydraulic || 'N/A', airFreshener: body.airFreshener || 'N/A',
    recommendedService: body.recommendedService || '',
    technicianName: body.technicianName || '', technicianSignature: body.technicianSignature,
    serviceAdvisorName: body.serviceAdvisorName || '', serviceAdvisorSignature: body.serviceAdvisorSignature || '',
    customerApproval: body.customerApproval || 'Approved',
    notes: body.notes || '',
    completedAt: ts, completedBy: body.completedBy || '', completedByName: body.completedByName || '',
  }

  jobCards[idx] = { ...jc, status: 'PFI_PENDING', statusTimeline: timeline, inspectionData: inspData as any, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'INSPECTION_COMPLETE', description: `Inspection completed by ${body.completedByName}. Moved to PFI Pending.`, userId: body.completedBy || 'system', userName: body.completedByName || 'System', timestamp: ts })
  addNotification('job_status', 'info', 'Inspection Complete', `${jc.jobCardNumber} — inspection done, awaiting PFI.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/customer-approval ────────────────────────────────────
// Customer signs approval of cost estimate. PFI_APPROVED → CUSTOMER_APPROVAL → PARTS_RELEASED
api.post('/jobcards/:id/customer-approval', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (!['PFI_APPROVED', 'CUSTOMER_APPROVAL'].includes(jc.status)) {
    return c.json({ error: `Job must be in PFI_APPROVED or CUSTOMER_APPROVAL. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<any>()
  if (!body.approvalSignature) return c.json({ error: 'Customer signature is required' }, 400)
  if (!body.approvedBy) return c.json({ error: 'Customer name is required' }, 400)

  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'PARTS_RELEASED', ts))

  const approvalData = {
    approvedBy: body.approvedBy,
    approvalSignature: body.approvalSignature,
    approvalNotes: body.approvalNotes || '',
    approvedAt: ts,
    approvedByUserId: body.recordedBy || '',
    approvedByUserName: body.recordedByName || '',
    totalApproved: body.totalApproved || 0,
  }

  jobCards[idx] = { ...jc, status: 'PARTS_RELEASED', statusTimeline: timeline, customerApprovalData: approvalData as any, partsReleasedAt: ts, partsReleasedBy: body.recordedBy || '', partsReleasedByName: body.recordedByName || '', updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'CUSTOMER_APPROVED', description: `Customer ${body.approvedBy} approved cost. Parts released.`, userId: body.recordedBy || 'system', userName: body.recordedByName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Customer Approved', `${jc.jobCardNumber} — customer signed off cost. Parts released for repair.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/start-work ───────────────────────────────────────────
// PARTS_RELEASED → WORK_IN_PROGRESS
api.post('/jobcards/:id/start-work', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'PARTS_RELEASED') {
    return c.json({ error: `Job must be PARTS_RELEASED to start work. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<{ userId?: string; userName?: string }>()
  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'WORK_IN_PROGRESS', ts))
  jobCards[idx] = { ...jc, status: 'WORK_IN_PROGRESS', statusTimeline: timeline, workStartedAt: ts, workStartedBy: body.userId || '', workStartedByName: body.userName || '', updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'STATUS_CHANGE', description: `Work started by ${body.userName || 'system'}`, userId: body.userId || 'system', userName: body.userName || 'System', timestamp: ts })
  addNotification('job_status', 'info', 'Repair Started', `${jc.jobCardNumber} — repair work in progress.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/finish-work ──────────────────────────────────────────
// WORK_IN_PROGRESS → FINISHED
api.post('/jobcards/:id/finish-work', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'WORK_IN_PROGRESS') {
    return c.json({ error: `Job must be WORK_IN_PROGRESS. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<{ userId?: string; userName?: string; notes?: string }>()
  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'FINISHED', ts))
  jobCards[idx] = { ...jc, status: 'FINISHED', statusTimeline: timeline, workFinishedAt: ts, workFinishedBy: body.userId || '', workFinishedByName: body.userName || '', updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'STATUS_CHANGE', description: `Work finished by ${body.userName || 'system'}. Awaiting QC.`, userId: body.userId || 'system', userName: body.userName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Work Finished', `${jc.jobCardNumber} — repair finished, pending Quality Control.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/complete-qc ──────────────────────────────────────────
// Saves QC form data. FINISHED → QUALITY_CONTROL → CUSTOMER_SIGNOFF
api.post('/jobcards/:id/complete-qc', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (!['FINISHED', 'QUALITY_CONTROL'].includes(jc.status)) {
    return c.json({ error: `Job must be FINISHED or QUALITY_CONTROL. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<any>()
  if (!body.qcOfficerSignature) return c.json({ error: 'QC officer signature required' }, 400)
  // Require all works completed
  if (body.allWorksCompleted !== 'Yes') return c.json({ error: 'All works must be completed before QC sign-off' }, 400)

  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'CUSTOMER_SIGNOFF', ts))

  const qcRecord = {
    engineOilLevel: body.engineOilLevel || 'N/A', fuelLevel: body.fuelLevel || 'N/A',
    boltsTightened: body.boltsTightened || 'Yes', leakages: body.leakages || 'No',
    cleanWork: body.cleanWork || 'Yes', allWorksCompleted: body.allWorksCompleted || 'Yes',
    notes: body.notes || '',
    technicianName: body.technicianName || '', technicianSignature: body.technicianSignature || '',
    qcOfficerName: body.qcOfficerName || '', qcOfficerSignature: body.qcOfficerSignature,
    completedAt: ts, completedBy: body.completedBy || '', completedByName: body.completedByName || '',
  }

  jobCards[idx] = { ...jc, status: 'CUSTOMER_SIGNOFF', statusTimeline: timeline, qcData: qcRecord as any, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'QC_COMPLETE', description: `QC completed by ${body.completedByName}. Awaiting customer sign-off.`, userId: body.completedBy || 'system', userName: body.completedByName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Quality Control Passed', `${jc.jobCardNumber} — QC approved, vehicle ready for customer sign-off.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/customer-signoff ─────────────────────────────────────
// Customer final sign-off. CUSTOMER_SIGNOFF → INVOICED (auto-create invoice)
api.post('/jobcards/:id/customer-signoff', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'CUSTOMER_SIGNOFF') {
    return c.json({ error: `Job must be in CUSTOMER_SIGNOFF. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<any>()
  if (!body.customerSignature) return c.json({ error: 'Customer signature required' }, 400)
  if (!body.customerName) return c.json({ error: 'Customer name required' }, 400)

  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'INVOICED', ts))

  const signoffRecord = {
    customerName: body.customerName, customerSignature: body.customerSignature,
    signoffNotes: body.signoffNotes || '', satisfactionRating: body.satisfactionRating || 5,
    signedAt: ts, witnessName: body.witnessName || '', witnessSignature: body.witnessSignature || '',
    recordedBy: body.recordedBy || '', recordedByName: body.recordedByName || '',
  }

  // ── Auto-create invoice ────────────────────────────────────────────────────
  const jcSvcs  = jobServices.filter(s => s.jobCardId === jc.id)
  const jcParts = partsConsumption.filter(p => p.jobCardId === jc.id)
  const labourCost = jcSvcs.reduce((s, sv) => s + sv.totalCost, 0)
  const partsCost  = jcParts.reduce((s, p)  => s + p.totalCost, 0)
  const subtotal   = labourCost + partsCost
  const pfi        = (jc as any).pfi
  const discountAmt = pfi?.discountAmount || 0
  const applyVAT    = pfi?.tax > 0
  const taxBase     = subtotal - discountAmt
  const taxAmt      = applyVAT ? Math.round(taxBase * 0.18) : 0
  const totalAmount = taxBase + taxAmt

  const invYear = new Date().getFullYear()
  const invNum  = `GMS-INV-${invYear}-${String(invoices.length + 1).padStart(3, '0')}`

  const newInv: Invoice = {
    id: 'inv' + genId(), jobCardId: jc.id, invoiceNumber: invNum,
    labourCost, partsCost, discountAmount: discountAmt, discountReason: pfi?.discountReason || '',
    tax: taxAmt, totalAmount, status: 'Unpaid',
    claimReference: jc.claimReference || '', pfiReference: pfi?.id || '',
    paymentMethod: 'Cash', issuedAt: ts, createdAt: ts,
  } as any
  invoices.push(newInv)

  jobCards[idx] = {
    ...jc, status: 'INVOICED', statusTimeline: timeline,
    customerSignoffData: signoffRecord as any,
    invoice: newInv as any,
    completedAt: ts, totalTATMins: Math.round((new Date(ts).getTime() - new Date(jc.createdAt).getTime()) / 60000),
    updatedAt: ts,
  }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'CUSTOMER_SIGNOFF', description: `Customer ${body.customerName} signed off. Invoice ${invNum} generated.`, userId: body.recordedBy || 'system', userName: body.recordedByName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Vehicle Ready — Invoice Generated', `${jc.jobCardNumber} — customer signed off. Invoice ${invNum} issued.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber, entityId: newInv.id, entityType: 'invoice' })

  // Dispatch customer notification — vehicle ready
  if (garageSettings.notifyOnJobComplete) {
    const custReady = customers.find(x => x.id === jc.customerId)
    if (custReady) {
      dispatchCustomerNotification({
        triggerEvent: 'job_completed',
        subject: 'Your Vehicle Is Ready for Collection',
        body: `Dear ${custReady.name}, your vehicle (${jc.vehicleReg || ''}) is ready for collection from ${garageSettings.garageName}. Invoice ${invNum} of TZS ${newInv.totalAmount.toLocaleString()} has been issued. Please come to settle the bill and collect your vehicle. Thank you!`,
        customer: custReady,
        jobCardId: jc.id,
      })
    }
  }

  return c.json({ jobCard: jobCards[idx], invoice: newInv })
})

// ─── POST /jobcards/:id/mark-paid ────────────────────────────────────────────
// INVOICED → PAID
api.post('/jobcards/:id/mark-paid', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'INVOICED') {
    return c.json({ error: `Job must be INVOICED to mark paid. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<{ paymentMethod?: string; paymentRef?: string; userId?: string; userName?: string }>()
  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'PAID', ts))
  // Update invoice status
  const invIdx = invoices.findIndex(i => i.jobCardId === jc.id)
  if (invIdx !== -1) {
    invoices[invIdx] = { ...invoices[invIdx], status: 'Paid', paidAt: ts, paymentMethod: (body.paymentMethod as any) || 'Cash', paymentReference: body.paymentRef }
  }
  jobCards[idx] = { ...jc, status: 'PAID', statusTimeline: timeline, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'STATUS_CHANGE', description: `Payment recorded by ${body.userName || 'system'}. Method: ${body.paymentMethod || 'Cash'}.`, userId: body.userId || 'system', userName: body.userName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Payment Received', `${jc.jobCardNumber} — payment received. Job ready for closure.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })

  // ── Auto-record Sales Commission if job originated from a Sales Rep ──────
  const salesRepId = (jc as any).salesRepId as string | undefined
  if (salesRepId) {
    const inv = invIdx !== -1 ? invoices[invIdx] : undefined
    const saleAmount = inv ? (inv as any).totalAmount || (inv as any).total || 0 : 0
    const periodKey = ts.slice(0, 7) // 'YYYY-MM'
    // Find applicable commission rate from monthly target
    const target = salesTargets.find(t => t.salesRepId === salesRepId && t.period === 'monthly' && t.periodKey === periodKey)
    const commissionRate = target ? target.commissionRate : 5 // default 5%
    const rep = users.find(u => u.id === salesRepId)
    const commission: SalesCommission = {
      id: 'sc' + genId(),
      salesRepId,
      salesRepName: (rep?.name || (jc as any).salesRepName || 'Sales Rep'),
      invoiceId: inv ? (inv as any).id : '',
      jobCardId: jc.id,
      jobCardNumber: jc.jobCardNumber,
      customerName: customers.find(x => x.id === jc.customerId)?.name || '',
      saleAmount,
      commissionRate,
      commissionEarned: Math.round(saleAmount * commissionRate / 100),
      periodKey,
      paidAt: ts,
      createdAt: ts,
    }
    salesCommissions.push(commission)
    addNotification('job_status', 'info', 'Commission Recorded',
      `Commission of TZS ${commission.commissionEarned.toLocaleString()} (${commissionRate}%) recorded for ${commission.salesRepName} on job ${jc.jobCardNumber}.`,
      { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  }

  // ── Auto-record SA Upsell Commissions ─────────────────────────────────────
  const periodKeyPaid = ts.slice(0, 7) // 'YYYY-MM'
  const custNamePaid = customers.find(x => x.id === jc.customerId)?.name || ''
  const invPaid = invIdx !== -1 ? invoices[invIdx] : undefined

  // Parts upsells — any part added by a Service Advisor on this job
  const jobParts = partsConsumption.filter(p => p.jobCardId === jc.id && p.addedById)
  for (const part of jobParts) {
    const advisor = users.find(u => u.id === part.addedById && u.role === 'Service Advisor')
    if (!advisor) continue
    // Find SA's target for this period to get commission rate
    const saTarget = saUpsellTargets.find(t => t.advisorId === advisor.id && t.periodKey === periodKeyPaid)
    const saRate = saTarget ? saTarget.commissionRate : 0
    if (saRate === 0) continue // no target set, no commission
    const saComm: SAUpsellCommission = {
      id: 'sau' + genId(),
      advisorId: advisor.id,
      advisorName: advisor.name,
      jobCardId: jc.id,
      jobCardNumber: jc.jobCardNumber,
      customerName: custNamePaid,
      itemType: 'part',
      itemName: part.partName,
      saleAmount: part.totalCost,
      commissionRate: saRate,
      commissionEarned: Math.round(part.totalCost * saRate / 100),
      periodKey: periodKeyPaid,
      invoiceId: invPaid ? (invPaid as any).id : '',
      createdAt: ts,
    }
    saUpsellCommissions.push(saComm)
  }

  // Add-on upsells — any Add-on JobService added by a Service Advisor
  const jobAddons = jobServices.filter(s => s.jobCardId === jc.id && s.category === 'Add-on' && s.addedById)
  for (const addon of jobAddons) {
    const advisor = users.find(u => u.id === addon.addedById && u.role === 'Service Advisor')
    if (!advisor) continue
    const saTarget = saUpsellTargets.find(t => t.advisorId === advisor.id && t.periodKey === periodKeyPaid)
    const saRate = saTarget ? saTarget.commissionRate : 0
    if (saRate === 0) continue
    const saComm: SAUpsellCommission = {
      id: 'sau' + genId(),
      advisorId: advisor.id,
      advisorName: advisor.name,
      jobCardId: jc.id,
      jobCardNumber: jc.jobCardNumber,
      customerName: custNamePaid,
      itemType: 'addon',
      itemName: addon.serviceName,
      saleAmount: addon.totalCost,
      commissionRate: saRate,
      commissionEarned: Math.round(addon.totalCost * saRate / 100),
      periodKey: periodKeyPaid,
      invoiceId: invPaid ? (invPaid as any).id : '',
      createdAt: ts,
    }
    saUpsellCommissions.push(saComm)
  }

  // ── Auto-record Technician Referral Commission ─────────────────────────────
  const referredById = (jc as any).referredById as string | undefined
  if (referredById) {
    const techRef = users.find(u => u.id === referredById)
    const invAmountRef = invPaid ? (invPaid as any).totalAmount || 0 : 0
    const refRate = garageSettings.techReferralCommissionRate ?? 3
    const refComm: TechReferralCommission = {
      id: 'trc' + genId(),
      technicianId: referredById,
      technicianName: techRef?.name || (jc as any).referredByName || 'Technician',
      jobCardId: jc.id,
      jobCardNumber: jc.jobCardNumber,
      customerName: custNamePaid,
      invoiceAmount: invAmountRef,
      commissionRate: refRate,
      commissionEarned: Math.round(invAmountRef * refRate / 100),
      periodKey: periodKeyPaid,
      invoiceId: invPaid ? (invPaid as any).id : '',
      createdAt: ts,
    }
    techReferralCommissions.push(refComm)
    addNotification('job_status', 'info', 'Referral Commission Recorded',
      `Referral commission of TZS ${refComm.commissionEarned.toLocaleString()} (${refRate}%) recorded for ${refComm.technicianName} on job ${jc.jobCardNumber}.`,
      { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  }

  save()
  return c.json(jobCards[idx])
})

// ─── POST /jobcards/:id/close ─────────────────────────────────────────────────
// PAID → CLOSED (issues exit gate pass, finalises job)
api.post('/jobcards/:id/close', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]
  if (jc.status !== 'PAID') {
    return c.json({ error: `Job must be PAID to close. Current: ${jc.status}` }, 400)
  }
  const body = await c.req.json<{ userId?: string; userName?: string; notes?: string }>()
  const ts = now()
  const timeline = jc.statusTimeline ? [...jc.statusTimeline] : []
  const openEntry = timeline.findLast ? timeline.findLast((e: any) => !e.exitedAt) : [...timeline].reverse().find((e: any) => !e.exitedAt)
  if (openEntry) closeTimelineEntry(openEntry, ts)
  timeline.push(openTimelineEntry(jc, 'CLOSED', ts))

  // Mark the active gate pass as Pending Exit
  const gp = gatePasses.find(g => g.jobCardId === jc.id && g.status === 'Active')
  if (gp) { gp.status = 'Pending Exit'; gp.updatedAt = ts }

  jobCards[idx] = { ...jc, status: 'CLOSED', statusTimeline: timeline, updatedAt: ts }
  activityLog.push({ id: 'a' + genId(), jobCardId: jc.id, action: 'STATUS_CHANGE', description: `Job closed by ${body.userName || 'system'}. Gate pass set to Pending Exit.`, userId: body.userId || 'system', userName: body.userName || 'System', timestamp: ts })
  addNotification('job_status', 'success', 'Job Closed', `${jc.jobCardNumber} — job closed. Vehicle exit pending.`, { jobCardId: jc.id, jobCardNumber: jc.jobCardNumber })
  return c.json(jobCards[idx])
})

// ─── Photo Documentation ─────────────────────────────────────────────────────
// GET /jobcards/:id/photos        — list all photos for a job (optionally filter by category)
// POST /jobcards/:id/photos       — upload a new photo (base64 data URL)
// DELETE /photos/:id              — remove a photo
// GET /jobcards/:id/photos/stats  — count per category

const PHOTO_CATEGORIES: PhotoCategory[] = ['intake', 'damage', 'repair_progress', 'final']
const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  intake: 'Vehicle Intake',
  damage: 'Damage Documentation',
  repair_progress: 'Repair Progress',
  final: 'Final / Completed',
}

api.get('/jobcards/:id/photos', (c) => {
  const jobCardId = c.req.param('id')
  const category = c.req.query('category') as PhotoCategory | undefined
  let photos = jobCardPhotos.filter(p => p.jobCardId === jobCardId)
  if (category && PHOTO_CATEGORIES.includes(category)) {
    photos = photos.filter(p => p.category === category)
  }
  // Return without full base64 for listing (thumbnail only)
  return c.json(photos.map(p => ({ ...p, fileUrl: p.thumbnail || p.fileUrl })))
})

api.get('/jobcards/:id/photos/stats', (c) => {
  const jobCardId = c.req.param('id')
  const counts: Record<string, number> = {}
  for (const cat of PHOTO_CATEGORIES) {
    counts[cat] = jobCardPhotos.filter(p => p.jobCardId === jobCardId && p.category === cat).length
  }
  return c.json({ total: jobCardPhotos.filter(p => p.jobCardId === jobCardId).length, counts })
})

api.get('/photos/:id', (c) => {
  const photo = jobCardPhotos.find(p => p.id === c.req.param('id'))
  if (!photo) return c.json({ error: 'Not found' }, 404)
  return c.json(photo)  // full resolution
})

api.post('/jobcards/:id/photos', async (c) => {
  const jobCardId = c.req.param('id')
  const jc = jobCards.find(x => x.id === jobCardId)
  if (!jc) return c.json({ error: 'Job card not found' }, 404)

  const body = await c.req.json<{
    category: PhotoCategory
    fileUrl: string        // base64 data URL
    fileName: string
    fileSize?: number
    mimeType?: string
    description?: string
    uploadedBy?: string
    uploadedByName?: string
  }>()

  if (!body.fileUrl) return c.json({ error: 'fileUrl (base64) is required' }, 400)
  if (!PHOTO_CATEGORIES.includes(body.category)) {
    return c.json({ error: `category must be one of: ${PHOTO_CATEGORIES.join(', ')}` }, 400)
  }

  // Generate a thumbnail (just store the same data URL for in-memory demo)
  // In production this would be a resized version stored in R2
  const photo: JobCardPhoto = {
    id: 'ph' + genId(),
    jobCardId,
    category: body.category,
    fileUrl: body.fileUrl,
    thumbnail: body.fileUrl,  // in-memory: same; production: resized
    fileName: body.fileName || 'photo.jpg',
    fileSize: body.fileSize || 0,
    mimeType: body.mimeType || 'image/jpeg',
    description: body.description || '',
    uploadedBy: body.uploadedBy || '',
    uploadedByName: body.uploadedByName || '',
    uploadedAt: now(),
  }
  jobCardPhotos.push(photo)

  activityLog.push({
    id: 'a' + genId(), jobCardId,
    action: 'PHOTO_UPLOADED',
    description: `Photo uploaded: ${PHOTO_CATEGORY_LABELS[body.category]} — ${body.fileName || 'photo'}`,
    userId: body.uploadedBy || 'system',
    userName: body.uploadedByName || 'System',
    timestamp: photo.uploadedAt,
  })

  return c.json(photo, 201)
})

api.delete('/photos/:id', (c) => {
  const idx = jobCardPhotos.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const [removed] = jobCardPhotos.splice(idx, 1)
  activityLog.push({
    id: 'a' + genId(), jobCardId: removed.jobCardId,
    action: 'PHOTO_DELETED',
    description: `Photo deleted: ${PHOTO_CATEGORY_LABELS[removed.category]} — ${removed.fileName}`,
    userId: 'system', userName: 'System', timestamp: now(),
  })
  return c.json({ success: true })
})

// ─── Reopen a Job Card ───────────────────────────────────────────────────────
// Allowed from: RELEASED, COMPLETED, INVOICED, PAID, CLOSED
// Sets status back to REPAIR_IN_PROGRESS, records reason, increments reopenCount
api.post('/jobcards/:id/reopen', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const jc = jobCards[idx]

  const REOPENABLE = ['RELEASED', 'COMPLETED', 'INVOICED', 'PAID', 'CLOSED']
  if (!REOPENABLE.includes(jc.status)) {
    return c.json({ error: `Job card cannot be reopened from status: ${jc.status}. Only completed/closed jobs can be reopened.` }, 400)
  }

  const { reason } = await c.req.json<{ reason: string }>()
  if (!reason || !reason.trim()) {
    return c.json({ error: 'A reason is required to reopen a job card' }, 400)
  }

  const ts = now()
  const prevStatus = jc.status
  // Reopened jobs go to WORK_IN_PROGRESS (new pipeline)
  const isLegacy = ['RELEASED','COMPLETED','INVOICED'].includes(prevStatus)
  const newStatus: JobCardStatus = isLegacy ? 'REPAIR_IN_PROGRESS' : 'WORK_IN_PROGRESS'

  // ── Timeline: close current open entry, open new entry ──
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
    const currentStatus = jobCards[jIdx].status
    // New pipeline: jobs in PFI_PENDING stay in PFI_PENDING (admin approval will advance them)
    // Legacy pipeline: advance to PFI_PREPARATION
    const nextStatus = currentStatus === 'PFI_PENDING' ? 'PFI_PENDING' : 'PFI_PREPARATION'
    // Close current timeline entry and open next
    const timeline: StatusTimelineEntry[] = jobCards[jIdx].statusTimeline
      ? [...jobCards[jIdx].statusTimeline!]
      : []
    const openEntry = timeline.findLast ? timeline.findLast(e => !e.exitedAt) : [...timeline].reverse().find(e => !e.exitedAt)
    if (openEntry) closeTimelineEntry(openEntry, ts)
    timeline.push(openTimelineEntry(jobCards[jIdx], nextStatus as any, ts))
    jobCards[jIdx].status = nextStatus as any
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

  // ── Sync job card status when PFI status changes ─────────────────────────
  // PFI_PENDING → PFI_APPROVED when PFI is approved
  // PFI_APPROVED → PFI_PENDING when PFI is rejected/reset to draft
  if (body.status) {
    const linkedJobIdx = jobCards.findIndex(j => j.id === pfis[idx].jobCardId)
    if (linkedJobIdx !== -1) {
      const linkedJob = jobCards[linkedJobIdx]
      const ts2 = now()
      if (body.status === 'Approved' && linkedJob.status === 'PFI_PENDING') {
        const tl = linkedJob.statusTimeline ? [...linkedJob.statusTimeline] : []
        const oe = tl.findLast ? tl.findLast((e: any) => !e.exitedAt) : [...tl].reverse().find((e: any) => !e.exitedAt)
        if (oe) closeTimelineEntry(oe, ts2)
        tl.push(openTimelineEntry(linkedJob, 'PFI_APPROVED', ts2))
        jobCards[linkedJobIdx] = { ...linkedJob, status: 'PFI_APPROVED', statusTimeline: tl, updatedAt: ts2 }
        activityLog.push({ id: 'a' + genId(), jobCardId: linkedJob.id, action: 'STATUS_CHANGE', description: 'PFI approved — job advanced to PFI Approved.', userId: 'system', userName: 'System', timestamp: ts2 })
        addNotification('job_status', 'success', 'PFI Approved', `${linkedJob.jobCardNumber} — PFI approved, awaiting customer cost approval.`, { jobCardId: linkedJob.id, jobCardNumber: linkedJob.jobCardNumber })
      } else if ((body.status === 'Rejected' || body.status === 'Draft') && linkedJob.status === 'PFI_APPROVED') {
        const tl = linkedJob.statusTimeline ? [...linkedJob.statusTimeline] : []
        const oe = tl.findLast ? tl.findLast((e: any) => !e.exitedAt) : [...tl].reverse().find((e: any) => !e.exitedAt)
        if (oe) closeTimelineEntry(oe, ts2)
        tl.push(openTimelineEntry(linkedJob, 'PFI_PENDING', ts2))
        jobCards[linkedJobIdx] = { ...linkedJob, status: 'PFI_PENDING', statusTimeline: tl, updatedAt: ts2 }
      }
    }
  }

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
  const partAdder = (c as any).user as User | undefined
  const newPart: PartConsumption = {
    ...body,
    id: 'pc' + genId(),
    jobCardId,
    addedById: partAdder?.id,
    addedByName: partAdder?.name,
  }

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
  const svcAdder = (c as any).user as User | undefined
  // Only stamp addedById for Add-on category (for SA upsell KPI)
  const isAddon = body.category === 'Add-on'
  const newSvc: JobService = {
    ...body,
    id: 'svc' + genId(),
    jobCardId,
    ...(isAddon ? { addedById: svcAdder?.id, addedByName: svcAdder?.name } : {}),
  }

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

  // ── Recalculate next-service mileage after oil-service removal ──────────────
  // If the deleted service had a lubricant, re-derive nextServiceMileage from
  // whichever oil service (with a lubricant interval) remains on this job card.
  // If none remain, clear the fields.
  if (svc.lubricantId) {
    const jcIdx = jobCards.findIndex(j => j.id === svc.jobCardId)
    if (jcIdx !== -1) {
      // Find remaining oil services on this job that have a lubricant with an interval
      const remainingOilSvcs = jobServices.filter(
        s => s.jobCardId === svc.jobCardId && s.lubricantId
      )
      const jc = jobCards[jcIdx]
      if (remainingOilSvcs.length === 0) {
        // No more oil services — clear next-service fields
        jobCards[jcIdx] = {
          ...jc,
          nextServiceMileage: undefined,
          nextServiceLubricant: undefined,
          updatedAt: now(),
        }
      } else {
        // Recalculate from the first remaining oil service that has an interval
        let newNextMileage: number | undefined
        let newNextLubricant: string | undefined
        for (const remainSvc of remainingOilSvcs) {
          const lub = lubricantProducts.find(l => l.id === remainSvc.lubricantId)
          if (lub?.mileageInterval && jc.mileageIn) {
            newNextMileage  = jc.mileageIn + lub.mileageInterval
            newNextLubricant = lub.description
            break
          }
        }
        jobCards[jcIdx] = {
          ...jc,
          nextServiceMileage:  newNextMileage,
          nextServiceLubricant: newNextLubricant,
          updatedAt: now(),
        }
      }
    }
  }

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

    // Dispatch payment receipt to customer
    if (garageSettings.notifyOnInvoicePaid && jc) {
      const custPaid = customers.find(x => x.id === jc.customerId)
      if (custPaid) {
        dispatchCustomerNotification({
          triggerEvent: 'invoice_paid',
          subject: 'Payment Receipt — ' + inv.invoiceNumber,
          body: `Dear ${custPaid.name}, we have received your payment of TZS ${inv.totalAmount.toLocaleString()} for invoice ${inv.invoiceNumber} (Job ${jc.jobCardNumber}). Thank you for choosing ${garageSettings.garageName}!`,
          customer: custPaid,
          jobCardId: jc.id,
        })
      }
    }

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
  const EARLY_STATUSES = ['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','PRE_HANDOVER','RECEIVED','INSPECTION','PFI_PREPARATION']
  const pipelineJobs   = jobCards.filter(j =>
    !invoicedJobIds.has(j.id) &&
    !EARLY_STATUSES.includes(j.status)
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
  const _p3 = requirePerm(c, 'users.create'); if (_p3) return _p3
  const body = await c.req.json<Omit<User, 'id' | 'createdAt'>>()
  const newUser: User = { ...body, id: 'u' + genId(), createdAt: now() }
  users.push(newUser)
  return c.json(safeUser(newUser), 201)
})

api.put('/users/:id', async (c) => {
  const _p4 = requirePerm(c, 'users.edit'); if (_p4) return _p4
  const idx = users.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<User>>()
  users[idx] = { ...users[idx], ...body }
  return c.json(safeUser(users[idx]))
})

api.delete('/users/:id', (c) => {
  const _p5 = requirePerm(c, 'users.delete'); if (_p5) return _p5
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
    DRAFT: 'Draft', PENDING_APPROVAL: 'Pending Approval', APPROVED: 'Approved',
    REJECTED: 'Rejected', PRE_HANDOVER: 'Pre-Handover', HANDED_OVER: 'Handed Over',
    INSPECTION: 'Inspection', PFI_PENDING: 'PFI Pending', PFI_APPROVED: 'PFI Approved',
    CUSTOMER_APPROVAL: 'Customer Approval', PARTS_RELEASED: 'Parts Released',
    WORK_IN_PROGRESS: 'Work In Progress', FINISHED: 'Finished',
    QUALITY_CONTROL: 'Quality Control', CUSTOMER_SIGNOFF: 'Customer Sign-off',
    INVOICED: 'Invoiced', PAID: 'Paid', CLOSED: 'Closed',
    // Legacy
    RECEIVED: 'Received', PFI_PREPARATION: 'PFI Preparation',
    AWAITING_INSURER_APPROVAL: 'Awaiting Insurer Approval', REPAIR_IN_PROGRESS: 'Repair In Progress',
    WAITING_FOR_PARTS: 'Waiting for Parts', QUALITY_CHECK: 'Quality Check',
    COMPLETED: 'Completed', RELEASED: 'Released'
  }
  const STATUS_FLOW_LIST = [
    'DRAFT','PENDING_APPROVAL','APPROVED','PRE_HANDOVER','HANDED_OVER',
    'INSPECTION','PFI_PENDING','PFI_APPROVED','CUSTOMER_APPROVAL','PARTS_RELEASED',
    'WORK_IN_PROGRESS','FINISHED','QUALITY_CONTROL','CUSTOMER_SIGNOFF',
    'INVOICED','PAID','CLOSED',
    // Legacy
    'RECEIVED','PFI_PREPARATION','AWAITING_INSURER_APPROVAL','REPAIR_IN_PROGRESS',
    'WAITING_FOR_PARTS','QUALITY_CHECK','COMPLETED','RELEASED'
  ]

  // Per-status average durations across all job cards (closed entries only)
  const statusTotals: Record<string, { totalMins: number; count: number }> = {}
  STATUS_FLOW_LIST.forEach(s => { statusTotals[s] = { totalMins: 0, count: 0 } })

  // Per-technician stats
  const techStats: Record<string, { name: string; jobCount: number; totalMins: number; completedCount: number }> = {}

  // Completed jobs TAT
  const completedTATs: number[] = []
  const activeJobMins: number[] = []

  jobCards.forEach(j => {
    // TAT for completed jobs (new pipeline: PAID/CLOSED; legacy: COMPLETED/INVOICED/RELEASED)
    const DONE_STATUSES = ['COMPLETED', 'INVOICED', 'RELEASED', 'PAID', 'CLOSED']
    if (DONE_STATUSES.includes(j.status)) {
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
    reorderLevel: Number((body as any).reorderLevel) || 5,
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
      reorderLevel: Number((body as any).reorderLevel) || 5,
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

// Delete a single catalogue part
api.delete('/catalogue/parts/:id', (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  catalogueParts.splice(idx, 1)
  save()
  return c.json({ success: true })
})

// ─── Admin: Bulk-clear catalogue collections ──────────────────────────────────
// DELETE /admin/catalogue/clear?collections=parts,carwash,addons
// Requires Admin role. Wipes the chosen collections immediately.
api.delete('/admin/catalogue/clear', (c) => {
  const user = (c as any).user as any
  if (!user || user.role !== 'Admin') return c.json({ error: 'Forbidden' }, 403)
  const raw = (c.req.query('collections') || 'parts,carwash,addons').split(',').map(s => s.trim())
  const cleared: string[] = []
  if (raw.includes('parts'))   { catalogueParts.splice(0);  cleared.push('parts')   }
  if (raw.includes('carwash')) { carWashPackages.splice(0); cleared.push('carwash') }
  if (raw.includes('addons'))  { addOnServices.splice(0);   cleared.push('addons')  }
  save()
  return c.json({ success: true, cleared })
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
  return c.json(list.sort((a, b) => {
    const ka = String((a.date||'') + (a.time||''));
    const kb = String((b.date||'') + (b.time||''));
    return ka.localeCompare(kb);
  }))
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

  // Dispatch appointment confirmation to customer
  if (garageSettings.notifyOnAppointment && cust) {
    dispatchCustomerNotification({
      triggerEvent: 'appointment_created',
      subject: 'Appointment Confirmation',
      body: `Dear ${cust.name}, your appointment at ${garageSettings.garageName} has been confirmed for ${newApt.date} at ${newApt.time} (${newApt.serviceType}). Vehicle: ${veh?.registrationNumber || ''} ${veh?.make || ''} ${veh?.model || ''}. See you then!`,
      customer: cust,
    })
  }

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
  return c.json(list.sort((a, b) => String(b.date||'').localeCompare(String(a.date||''))))
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
  const _p6 = requirePerm(c, 'expenses.delete'); if (_p6) return _p6
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
  const unreadOnly   = c.req.query('unread') === 'true'
  const typeFilter   = c.req.query('type')
  const jobCardIdFilter = c.req.query('jobCardId')
  const limit        = parseInt(c.req.query('limit') || '50', 10)
  let list = notifications as Notification[]
  if (unreadOnly)      list = list.filter(n => !n.read)
  if (typeFilter)      list = list.filter(n => n.type === typeFilter)
  if (jobCardIdFilter) list = list.filter(n => n.jobCardId === jobCardIdFilter)
  const unreadCount = notifications.filter(n => !n.read).length
  return c.json({ notifications: list.slice(0, limit), unreadCount })
})

// GET /notifications/summary — unread count + pending-approval jobs (cheap poll)
api.get('/notifications/summary', (c) => {
  const pendingJobs = jobCards
    .filter(j => j.status === 'PENDING_APPROVAL')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const pendingApprovalCount = pendingJobs.length
  // Return the three most-recent pending jobs for the approval toast
  const pendingApprovalJobs = pendingJobs.slice(0, 3).map(j => {
    const v = vehicles.find(vv => vv.id === j.vehicleId)
    const c2 = customers.find(cc => cc.id === j.customerId)
    return {
      id: j.id,
      jobCardNumber: j.jobCardNumber,
      customerName: j.customerName,
      vehicleReg: v?.registrationNumber || j.vehicleId,
      makeModel: v ? (v.make + ' ' + v.model) : '',
      createdAt: j.createdAt,
    }
  })
  return c.json({
    unreadCount: notifications.filter(n => !n.read).length,
    pendingApprovalCount,
    pendingApprovalJobs,
  })
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

// ─── Finance Reports ─────────────────────────────────────────────────────────
// GET /reports/finance?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns P&L summary, revenue by category/insurer, top technicians by revenue,
// monthly revenue breakdown, expense breakdown
api.get('/reports/finance', (c) => {
  const fromStr = c.req.query('from')
  const toStr   = c.req.query('to')
  const fromMs  = fromStr ? new Date(fromStr).getTime() : 0
  const toMs    = toStr   ? new Date(toStr + 'T23:59:59').getTime() : Infinity

  const paidInv = invoices.filter(i => {
    if (!['Paid','Partially Paid'].includes(i.status)) return false
    const d = new Date(i.paidAt || i.issuedAt).getTime()
    return d >= fromMs && d <= toMs
  })

  const revenue     = paidInv.reduce((s, i) => s + (i.amountPaid || i.totalAmount), 0)
  const labourRev   = paidInv.reduce((s, i) => s + (i.labourCost || 0), 0)
  const partsRev    = paidInv.reduce((s, i) => s + (i.partsCost || 0), 0)
  const taxCollected= paidInv.reduce((s, i) => s + (i.tax || 0), 0)
  const discounts   = paidInv.reduce((s, i) => s + (i.discountAmount || 0), 0)

  // Cost of goods (buying expenses auto-created when parts/services added)
  const filteredExp = expenses.filter(e => {
    const d = new Date(e.date || e.createdAt || '').getTime()
    return d >= fromMs && d <= toMs
  })
  const cogsCost    = filteredExp.filter(e => e.category === 'Parts & Materials').reduce((s, e) => s + e.amount, 0)
  const labourCost  = filteredExp.filter(e => e.category === 'Labour').reduce((s, e) => s + e.amount, 0)
  const otherCost   = filteredExp.filter(e => !['Parts & Materials','Labour'].includes(e.category)).reduce((s, e) => s + e.amount, 0)
  const totalCost   = cogsCost + labourCost + otherCost
  const grossMargin = revenue - totalCost
  const marginPct   = revenue > 0 ? Math.round(grossMargin / revenue * 100) : 0

  // Revenue by job category (Insurance vs Private)
  const byCategory: Record<string, number> = {}
  paidInv.forEach(i => {
    const jc = jobCards.find(j => j.id === i.jobCardId)
    const cat = jc?.category || 'Unknown'
    byCategory[cat] = (byCategory[cat] || 0) + (i.amountPaid || i.totalAmount)
  })

  // Revenue by insurer
  const byInsurer: Record<string, number> = {}
  paidInv.forEach(i => {
    const jc = jobCards.find(j => j.id === i.jobCardId)
    if (jc?.insurer) {
      byInsurer[jc.insurer] = (byInsurer[jc.insurer] || 0) + (i.amountPaid || i.totalAmount)
    }
  })

  // Monthly revenue (last 12 months)
  const monthly: Record<string, number> = {}
  paidInv.forEach(i => {
    const d = new Date(i.paidAt || i.issuedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthly[key] = (monthly[key] || 0) + (i.amountPaid || i.totalAmount)
  })

  // Expense breakdown by category
  const expByCategory: Record<string, number> = {}
  filteredExp.forEach(e => {
    expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount
  })

  // Top technicians by job count and revenue
  const techMap: Record<string, { name: string; jobCount: number; revenue: number }> = {}
  paidInv.forEach(i => {
    const jc = jobCards.find(j => j.id === i.jobCardId)
    const techId   = jc?.assignedTechnician || 'unassigned'
    const techUser = users.find(u => u.id === techId)
    const techName = techUser?.name || jc?.workFinishedByName || 'Unassigned'
    if (!techMap[techId]) techMap[techId] = { name: techName, jobCount: 0, revenue: 0 }
    techMap[techId].jobCount++
    techMap[techId].revenue += (i.amountPaid || i.totalAmount)
  })
  const topTechnicians = Object.entries(techMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Jobs created in period
  const jobsCreated = jobCards.filter(j => {
    const d = new Date(j.createdAt).getTime()
    return d >= fromMs && d <= toMs
  }).length

  // Unpaid invoices total
  const unpaidTotal = invoices
    .filter(i => i.status === 'Unpaid' || i.status === 'Overdue')
    .reduce((s, i) => s + i.totalAmount, 0)

  return c.json({
    summary: { revenue, labourRev, partsRev, taxCollected, discounts,
               cogsCost, labourCost, otherCost, totalCost, grossMargin, marginPct,
               invoiceCount: paidInv.length, jobsCreated, unpaidTotal },
    byCategory,
    byInsurer,
    monthly,
    expByCategory,
    topTechnicians,
  })
})

// ─── Enhanced Analytics: per-service-type margin ─────────────────────────────
api.get('/analytics/margin-by-service', (c) => {
  const marginMap: Record<string, { revenue: number; cost: number; count: number }> = {}
  jobCards.forEach(jc => {
    const inv = invoices.find(i => i.jobCardId === jc.id && ['Paid','Partially Paid'].includes(i.status))
    if (!inv) return
    const svcs = jobServices.filter(s => s.jobCardId === jc.id)
    svcs.forEach(sv => {
      const cat = sv.category
      if (!marginMap[cat]) marginMap[cat] = { revenue: 0, cost: 0, count: 0 }
      marginMap[cat].revenue += sv.totalCost
      marginMap[cat].count++
    })
    // Buying cost from auto-expenses
    const buyExpenses = expenses.filter(e => e.jobCardId === jc.id && e.category === 'Parts & Materials')
    buyExpenses.forEach(e => {
      const sv = svcs.find(s => s.autoExpenseId === e.id)
      const cat = sv?.category || 'Parts'
      if (!marginMap[cat]) marginMap[cat] = { revenue: 0, cost: 0, count: 0 }
      marginMap[cat].cost += e.amount
    })
  })
  const result = Object.entries(marginMap).map(([category, v]) => ({
    category, ...v,
    margin: v.revenue - v.cost,
    marginPct: v.revenue > 0 ? Math.round((v.revenue - v.cost) / v.revenue * 100) : 0,
  }))
  return c.json(result)
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — GARAGE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

// GET /settings — return current garage settings (strip secret keys)
api.get('/settings', (c) => {
  const safe = { ...garageSettings }
  // Mask API keys in GET response (show only last 4 chars)
  if (safe.smsApiKey) safe.smsApiKey = '••••' + safe.smsApiKey.slice(-4)
  if (safe.emailApiKey) safe.emailApiKey = '••••' + safe.emailApiKey.slice(-4)
  return c.json(safe)
})

// PATCH /settings — update any subset of garage settings
api.patch('/settings', async (c) => {
  const _p7 = requirePerm(c, 'settings.manage'); if (_p7) return _p7
  const body = await c.req.json<Partial<GarageSettings>>()
  // Reject attempts to patch updatedAt directly
  delete (body as any).updatedAt
  updateGarageSettings(body)
  return c.json({ ok: true, settings: garageSettings })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — ACTIVITY / AUDIT LOG VIEWER
// ─────────────────────────────────────────────────────────────────────────────

// GET /activity-log — paginated audit log with optional filters
api.get('/activity-log', (c) => {
  const { page: rawPage, limit: rawLimit, userId, jobCardId, search } = c.req.query()
  const page  = Math.max(1, parseInt(rawPage  || '1',  10))
  const limit = Math.min(200, Math.max(1, parseInt(rawLimit || '50', 10)))

  let entries = [...activityLog].reverse()   // newest first

  if (userId)    entries = entries.filter(e => (e as any).userId === userId)
  if (jobCardId) entries = entries.filter(e => (e as any).jobCardId === jobCardId || e.detail?.includes(jobCardId))
  if (search) {
    const q = search.toLowerCase()
    entries = entries.filter(e =>
      e.action?.toLowerCase().includes(q) ||
      e.detail?.toLowerCase().includes(q) ||
      (e as any).userName?.toLowerCase().includes(q)
    )
  }

  const total = entries.length
  const slice = entries.slice((page - 1) * limit, page * limit)
  return c.json({ total, page, limit, entries: slice })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — PARTS STOCK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /catalogue/parts/low-stock — parts at or below reorderLevel
api.get('/catalogue/parts/low-stock', (c) => {
  const items = catalogueParts.filter(p => {
    const qty = p.stockQuantity ?? 0
    const reorder = (p as any).reorderLevel ?? 5
    return qty <= reorder
  }).map(p => ({
    ...p,
    status: (p.stockQuantity ?? 0) === 0 ? 'out' : 'low',
  }))
  return c.json(items)
})

// PATCH /catalogue/parts/:id/stock — adjust stock qty (add / subtract)
api.patch('/catalogue/parts/:id/stock', async (c) => {
  const part = catalogueParts.find(p => p.id === c.req.param('id'))
  if (!part) return c.json({ error: 'Part not found' }, 404)
  const { adjustment, note } = await c.req.json<{ adjustment: number; note?: string }>()
  const prev = part.stockQuantity ?? 0
  part.stockQuantity = Math.max(0, prev + adjustment)
  const reorderLevel = (part as any).reorderLevel ?? 5
  if (part.stockQuantity <= reorderLevel) {
    addNotification(
      'low_stock',
      part.stockQuantity === 0 ? 'error' : 'warning',
      'Stock Alert',
      part.stockQuantity === 0
        ? part.description + ' is now OUT OF STOCK'
        : part.description + ' is low on stock (' + part.stockQuantity + ' remaining)',
      undefined, undefined
    )
  }
  return c.json({ ok: true, stockQuantity: part.stockQuantity, prev, note })
})

// PATCH /catalogue/parts/:id/reorder — set reorder level
api.patch('/catalogue/parts/:id/reorder', async (c) => {
  const part = catalogueParts.find(p => p.id === c.req.param('id'))
  if (!part) return c.json({ error: 'Part not found' }, 404)
  const { reorderLevel } = await c.req.json<{ reorderLevel: number }>()
  ;(part as any).reorderLevel = Math.max(0, reorderLevel)
  return c.json({ ok: true, reorderLevel: (part as any).reorderLevel })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — LUBRICANTS STOCK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /catalogue/lubricants/low-stock — lubricants at or below reorderLevel (default 5)
api.get('/catalogue/lubricants/low-stock', (c) => {
  const items = lubricantProducts.filter(l => {
    const qty = l.stockQuantity ?? 0
    const reorder = (l as any).reorderLevel ?? 5
    return qty <= reorder
  }).map(l => ({
    ...l,
    status: (l.stockQuantity ?? 0) === 0 ? 'out' : 'low',
  }))
  return c.json(items)
})

// PATCH /catalogue/lubricants/:id/stock — adjust lubricant stock quantity
api.patch('/catalogue/lubricants/:id/stock', async (c) => {
  const lub = lubricantProducts.find(l => l.id === c.req.param('id'))
  if (!lub) return c.json({ error: 'Lubricant not found' }, 404)
  const { adjustment, note } = await c.req.json<{ adjustment: number; note?: string }>()
  const prev = lub.stockQuantity ?? 0
  lub.stockQuantity = Math.max(0, prev + adjustment)
  const reorderLevel = (lub as any).reorderLevel ?? 5
  if (lub.stockQuantity <= reorderLevel) {
    addNotification(
      'low_stock',
      lub.stockQuantity === 0 ? 'error' : 'warning',
      'Lubricant Stock Alert',
      lub.stockQuantity === 0
        ? lub.description + ' is now OUT OF STOCK'
        : lub.description + ' is low on stock (' + lub.stockQuantity + ' remaining)',
      undefined
    )
  }
  return c.json({ ok: true, stockQuantity: lub.stockQuantity, prev, note })
})

// PATCH /catalogue/lubricants/:id/reorder — set lubricant reorder level
api.patch('/catalogue/lubricants/:id/reorder', async (c) => {
  const lub = lubricantProducts.find(l => l.id === c.req.param('id'))
  if (!lub) return c.json({ error: 'Lubricant not found' }, 404)
  const { reorderLevel } = await c.req.json<{ reorderLevel: number }>()
  ;(lub as any).reorderLevel = Math.max(0, reorderLevel)
  return c.json({ ok: true, reorderLevel: (lub as any).reorderLevel })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — APPOINTMENT REMINDER FLAGS
// ─────────────────────────────────────────────────────────────────────────────

// GET /appointments/due-reminders — upcoming appointments whose reminder hasn't been sent
api.get('/appointments/due-reminders', (c) => {
  const now    = new Date()
  const in24h  = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const due = appointments.filter(a => {
    if (a.status === 'cancelled' || a.status === 'completed') return false
    if ((a as any).reminderSentAt) return false
    const apptDate = new Date(a.appointmentDate)
    return apptDate >= now && apptDate <= in24h
  })
  return c.json(due)
})

// POST /appointments/:id/mark-reminder — flag reminder as sent
api.post('/appointments/:id/mark-reminder', async (c) => {
  const appt = appointments.find(a => a.id === c.req.param('id'))
  if (!appt) return c.json({ error: 'Appointment not found' }, 404)
  ;(appt as any).reminderSentAt = new Date().toISOString()
  addNotification(
    'appointment_reminder',
    'info',
    'Appointment Reminder Sent',
    'Reminder marked for appointment on ' + appt.appointmentDate,
    undefined, undefined
  )
  return c.json({ ok: true, reminderSentAt: (appt as any).reminderSentAt })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — INVOICE OVERDUE AUTO-FLAG
// ─────────────────────────────────────────────────────────────────────────────

// POST /invoices/run-overdue-check — mark unpaid past-due invoices as Overdue
api.post('/invoices/run-overdue-check', (c) => {
  const today = new Date().toISOString().slice(0, 10)
  let flagged = 0
  invoices.forEach(inv => {
    if (inv.status !== 'Unpaid' && inv.status !== 'Partial') return
    if (!inv.dueDate) return
    if (inv.dueDate < today) {
      if (inv.status !== 'Overdue') {
        inv.status = 'Overdue'
        flagged++
        addNotification(
          'invoice_overdue',
          'error',
          'Invoice Overdue',
          inv.invoiceNumber + ' is overdue (due ' + inv.dueDate + ')',
          inv.id, inv.jobCardId
        )
      }
    }
  })
  return c.json({ ok: true, flagged })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — DASHBOARD LOW-STOCK SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

// GET /dashboard/alerts — quick summary of actionable alerts
api.get('/dashboard/alerts', (c) => {
  const today = new Date().toISOString().slice(0, 10)
  const in24h  = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const overdueInvoices = invoices.filter(inv =>
    (inv.status === 'Unpaid' || inv.status === 'Partial' || inv.status === 'Overdue') &&
    inv.dueDate && inv.dueDate < today
  ).length

  const lowStockParts = catalogueParts.filter(p => {
    const qty = p.stockQuantity ?? 0
    const reorder = (p as any).reorderLevel ?? 5
    return qty <= reorder
  }).length

  const lowStockLubs = lubricantProducts.filter(l => {
    const qty = l.stockQuantity ?? 0
    const reorder = (l as any).reorderLevel ?? 5
    return qty <= reorder
  }).length

  const upcomingAppts = appointments.filter(a => {
    if (a.status === 'cancelled') return false
    const d = new Date(a.appointmentDate)
    return d >= new Date() && d <= in24h
  }).length

  const unreadNotifs = notifications.filter(n => !n.isRead).length

  return c.json({ overdueInvoices, lowStockParts, lowStockLubs, upcomingAppts, unreadNotifs })
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — CUSTOMER NOTIFICATION DISPATCH LOG
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer-notifications — paginated dispatch log
api.get('/customer-notifications', (c) => {
  const { page: rawPage, limit: rawLimit, channel, status, search, jobCardId } = c.req.query()
  const page  = Math.max(1, parseInt(rawPage  || '1',  10))
  const limit = Math.min(200, Math.max(1, parseInt(rawLimit || '50', 10)))

  let entries = [...customerNotifDispatches]  // already newest-first

  if (channel)    entries = entries.filter(e => e.channel === channel)
  if (status)     entries = entries.filter(e => e.status === status)
  if (jobCardId)  entries = entries.filter(e => e.jobCardId === jobCardId)
  if (search) {
    const q = search.toLowerCase()
    entries = entries.filter(e =>
      e.recipientName.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.triggerEvent.toLowerCase().includes(q)
    )
  }

  const total = entries.length
  const slice = entries.slice((page - 1) * limit, page * limit)
  return c.json({ total, page, limit, entries: slice })
})

// POST /customer-notifications/manual — manually send a customer notification
api.post('/customer-notifications/manual', async (c) => {
  const { customerId, subject, body, channels: chans } = await c.req.json<{
    customerId: string
    subject: string
    body: string
    channels: NotifChannel[]
  }>()
  const cust = customers.find(x => x.id === customerId)
  if (!cust) return c.json({ error: 'Customer not found' }, 404)

  const dispatched: CustomerNotifDispatch[] = []
  for (const channel of (chans || ['sms'])) {
    const d: CustomerNotifDispatch = {
      id: 'cnd' + genId(),
      channel,
      recipientPhone: cust.phone || undefined,
      recipientEmail: cust.email || undefined,
      recipientName: cust.name,
      subject,
      body,
      triggerEvent: 'manual',
      customerId: cust.id,
      status: 'simulated',
      sentAt: now(),
    }
    customerNotifDispatches.unshift(d)
    if (customerNotifDispatches.length > 1000) customerNotifDispatches.splice(1000)
    dispatched.push(d)
  }

  return c.json({ ok: true, dispatched })
})

// POST /appointments/:id/send-reminder — mark + dispatch reminder
api.post('/appointments/:id/send-reminder', async (c) => {
  const appt = appointments.find(a => a.id === c.req.param('id'))
  if (!appt) return c.json({ error: 'Appointment not found' }, 404)
  ;(appt as any).reminderSentAt = now()

  const cust = customers.find(x => x.id === appt.customerId)
  const veh  = vehicles.find(x => x.id === appt.vehicleId)

  addNotification(
    'appointment_reminder',
    'info',
    'Appointment Reminder Sent',
    `Reminder sent to ${cust?.name || 'customer'} for ${appt.serviceType} on ${appt.appointmentDate}`,
    { entityId: appt.id, entityType: 'appointment' }
  )

  if (cust) {
    await dispatchCustomerNotification({
      triggerEvent: 'appointment_reminder',
      subject: 'Appointment Reminder — ' + (appt as any).appointmentDate,
      body: `Dear ${cust.name}, this is a reminder that your vehicle (${veh?.registrationNumber || ''}) is booked for ${appt.serviceType} at ${garageSettings.garageName} on ${(appt as any).appointmentDate} at ${(appt as any).time || ''}. Please arrive on time.`,
      customer: cust,
    })
  }

  return c.json({ ok: true, reminderSentAt: (appt as any).reminderSentAt })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SALES ROUTES ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helper: periodKey for a date ─────────────────────────────────────────────
function getPeriodKey(period: TargetPeriod, date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (period === 'monthly')   return `${y}-${String(m).padStart(2,'0')}`
  if (period === 'quarterly') return `${y}-Q${Math.ceil(m / 3)}`
  return `${y}`
}

// GET /sales/dashboard — Sales Rep personal summary + Admin/WC overview
api.get('/sales/dashboard', async (c) => {
  const user = (c as any).user as User
  const isSalesRep = user.role === 'Sales'
  const isAdmin    = user.role === 'Admin' || user.role === 'Workshop Controller'

  if (!isSalesRep && !isAdmin) return c.json({ error: 'Forbidden' }, 403)

  const monthKey = getPeriodKey('monthly')
  const quarterKey = getPeriodKey('quarterly')
  const yearKey = getPeriodKey('annual')

  if (isSalesRep) {
    // Personal dashboard for Sales Rep
    const myJobs = jobCards.filter((j: any) => j.salesRepId === user.id)
    const myInvoices = invoices.filter((i: any) => {
      const job = jobCards.find(j => j.id === (i as any).jobCardId)
      return job && (job as any).salesRepId === user.id
    })
    const myComms = salesCommissions.filter(sc => sc.salesRepId === user.id)
    const monthComms = myComms.filter(sc => sc.periodKey === monthKey)
    const monthTarget = salesTargets.find(t => t.salesRepId === user.id && t.period === 'monthly' && t.periodKey === monthKey)
    const qtrTarget = salesTargets.find(t => t.salesRepId === user.id && t.period === 'quarterly' && t.periodKey === quarterKey)
    const annTarget = salesTargets.find(t => t.salesRepId === user.id && t.period === 'annual' && t.periodKey === yearKey)

    const monthRevenue = monthComms.reduce((s, sc) => s + sc.saleAmount, 0)
    const monthCommEarned = monthComms.reduce((s, sc) => s + sc.commissionEarned, 0)

    return c.json({
      repId: user.id,
      repName: user.name,
      stats: {
        totalJobs: myJobs.length,
        activeJobs: myJobs.filter(j => !['CLOSED','PAID','CANCELLED'].includes(j.status)).length,
        paidJobs: myJobs.filter(j => j.status === 'PAID' || j.status === 'CLOSED').length,
        totalRevenue: myInvoices.filter((i: any) => i.status === 'Paid').reduce((s: number, i: any) => s + ((i as any).totalAmount || 0), 0),
        monthRevenue,
        monthCommEarned,
        totalCommEarned: myComms.reduce((s, sc) => s + sc.commissionEarned, 0),
      },
      targets: {
        monthly: monthTarget || null,
        quarterly: qtrTarget || null,
        annual: annTarget || null,
      },
      recentJobs: myJobs.slice(-5).reverse().map(j => ({
        id: j.id,
        jobCardNumber: j.jobCardNumber,
        status: j.status,
        customerName: customers.find(x => x.id === j.customerId)?.name || '',
        createdAt: j.createdAt,
      })),
      recentCommissions: myComms.slice(-5).reverse(),
    })
  }

  // Admin / Workshop Controller overview
  const salesUsers = users.filter(u => u.role === 'Sales')
  const leaderboard = salesUsers.map(rep => {
    const repJobs = jobCards.filter((j: any) => j.salesRepId === rep.id)
    const repComms = salesCommissions.filter(sc => sc.salesRepId === rep.id)
    const monthComms = repComms.filter(sc => sc.periodKey === monthKey)
    const monthTarget = salesTargets.find(t => t.salesRepId === rep.id && t.period === 'monthly' && t.periodKey === monthKey)
    const monthRevenue = monthComms.reduce((s, sc) => s + sc.saleAmount, 0)
    return {
      repId: rep.id,
      repName: rep.name,
      email: rep.email,
      totalJobs: repJobs.length,
      paidJobs: repJobs.filter(j => j.status === 'PAID' || j.status === 'CLOSED').length,
      totalRevenue: repComms.reduce((s, sc) => s + sc.saleAmount, 0),
      totalCommission: repComms.reduce((s, sc) => s + sc.commissionEarned, 0),
      monthRevenue,
      monthTarget: monthTarget?.targetAmount || 0,
      monthProgress: monthTarget ? Math.min(100, Math.round(monthRevenue / monthTarget.targetAmount * 100)) : 0,
    }
  }).sort((a, b) => b.monthRevenue - a.monthRevenue)

  return c.json({ leaderboard, monthKey, quarterKey, yearKey })
})

// GET /sales/my-sales — Sales Rep own job cards & commissions
api.get('/sales/my-sales', async (c) => {
  const user = (c as any).user as User
  const repId = user.role === 'Sales' ? user.id : (new URL(c.req.url).searchParams.get('repId') || '')
  if (!repId) return c.json({ error: 'repId required' }, 400)
  if (user.role === 'Sales' && repId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const myJobs = jobCards.filter((j: any) => j.salesRepId === repId).map(j => ({
    ...j,
    customerName: customers.find(x => x.id === j.customerId)?.name || '',
    vehicleReg: vehicles.find(x => x.id === j.vehicleId)?.registrationNumber || '',
  }))
  const myComms = salesCommissions.filter(sc => sc.salesRepId === repId)

  return c.json({ jobs: myJobs, commissions: myComms })
})

// GET /sales/targets — list targets (Sales Rep sees own; Admin/WC sees all)
api.get('/sales/targets', async (c) => {
  const user = (c as any).user as User
  const params = new URL(c.req.url).searchParams
  let targets = [...salesTargets]
  if (user.role === 'Sales') {
    targets = targets.filter(t => t.salesRepId === user.id)
  } else if (params.get('repId')) {
    targets = targets.filter(t => t.salesRepId === params.get('repId'))
  }
  return c.json(targets)
})

// POST /sales/targets — Admin/WC creates or updates a target for a rep
api.post('/sales/targets', async (c) => {
  const user = (c as any).user as User
  if (user.role !== 'Admin' && user.role !== 'Workshop Controller')
    return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json<{
    salesRepId: string
    period: TargetPeriod
    periodKey: string
    targetAmount: number
    commissionRate: number
  }>()

  const rep = users.find(u => u.id === body.salesRepId && u.role === 'Sales')
  if (!rep) return c.json({ error: 'Sales rep not found' }, 404)

  const ts = now()
  // Upsert: update if same rep+period+periodKey already exists
  const existIdx = salesTargets.findIndex(
    t => t.salesRepId === body.salesRepId && t.period === body.period && t.periodKey === body.periodKey
  )
  if (existIdx !== -1) {
    salesTargets[existIdx] = {
      ...salesTargets[existIdx],
      targetAmount: body.targetAmount,
      commissionRate: body.commissionRate,
      updatedAt: ts,
    }
    return c.json(salesTargets[existIdx])
  }

  const target: SalesTarget = {
    id: 'st' + genId(),
    salesRepId: body.salesRepId,
    salesRepName: rep.name,
    period: body.period,
    periodKey: body.periodKey,
    targetAmount: body.targetAmount,
    commissionRate: body.commissionRate,
    createdAt: ts,
    updatedAt: ts,
  }
  salesTargets.push(target)
  return c.json(target, 201)
})

// GET /sales/leaderboard — Admin/WC: ranked list of all reps by revenue
api.get('/sales/leaderboard', async (c) => {
  const user = (c as any).user as User
  if (user.role !== 'Admin' && user.role !== 'Workshop Controller')
    return c.json({ error: 'Forbidden' }, 403)

  const params = new URL(c.req.url).searchParams
  const period: TargetPeriod = (params.get('period') as TargetPeriod) || 'monthly'
  const periodKey = params.get('periodKey') || getPeriodKey(period)

  const salesUsers = users.filter(u => u.role === 'Sales')
  const board = salesUsers.map(rep => {
    const repComms = salesCommissions.filter(sc => sc.salesRepId === rep.id && sc.periodKey === periodKey)
    const repJobs  = jobCards.filter((j: any) => j.salesRepId === rep.id)
    const target   = salesTargets.find(t => t.salesRepId === rep.id && t.period === period && t.periodKey === periodKey)
    const revenue  = repComms.reduce((s, sc) => s + sc.saleAmount, 0)
    return {
      repId: rep.id,
      repName: rep.name,
      email: rep.email,
      salesCount: repComms.length,
      revenue,
      commission: repComms.reduce((s, sc) => s + sc.commissionEarned, 0),
      targetAmount: target?.targetAmount || 0,
      commissionRate: target?.commissionRate || 5,
      progress: target ? Math.min(100, Math.round(revenue / target.targetAmount * 100)) : 0,
      activeJobs: repJobs.filter(j => !['CLOSED','PAID','CANCELLED'].includes(j.status)).length,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  return c.json({ period, periodKey, leaderboard: board })
})

// GET /sales/commission/:repId — commissions for a rep
api.get('/sales/commission/:repId', async (c) => {
  const user = (c as any).user as User
  const repId = c.req.param('repId')
  if (user.role === 'Sales' && user.id !== repId) return c.json({ error: 'Forbidden' }, 403)

  const params = new URL(c.req.url).searchParams
  let comms = salesCommissions.filter(sc => sc.salesRepId === repId)
  const period = params.get('period')
  if (period) comms = comms.filter(sc => sc.periodKey === period)

  const totalEarned = comms.reduce((s, sc) => s + sc.commissionEarned, 0)
  const totalRevenue = comms.reduce((s, sc) => s + sc.saleAmount, 0)

  return c.json({ repId, commissions: comms, totalEarned, totalRevenue })
})

// POST /sales/sell — Sales Rep creates a sale (new or existing customer/vehicle)
// Creates a Job Card automatically tagged to the rep and set to PENDING_APPROVAL
api.post('/sales/sell', async (c) => {
  const user = (c as any).user as User
  if (user.role !== 'Sales') return c.json({ error: 'Forbidden — only Sales reps can use this endpoint' }, 403)

  const body = await c.req.json<{
    customerId: string
    vehicleId: string
    productType: 'service_package' | 'carwash' | 'subscription'
    productId: string
    notes?: string
    damageDescription?: string
  }>()

  const cust = customers.find(x => x.id === body.customerId)
  if (!cust) return c.json({ error: 'Customer not found' }, 404)
  const veh = vehicles.find(x => x.id === body.vehicleId)
  if (!veh) return c.json({ error: 'Vehicle not found' }, 404)

  const ts = now()
  const num = 'GMS-' + new Date().getFullYear() + '-' + String(jobCards.length + 1).padStart(3, '0')

  // Determine job category label from product type
  const productLabel: Record<string, string> = {
    service_package: 'Service Package',
    carwash: 'Car Wash',
    subscription: 'Subscription Service',
  }

  const newJob: JobCard = {
    id: 'j' + genId(),
    jobCardNumber: num,
    vehicleId: body.vehicleId,
    customerId: body.customerId,
    category: 'Private',
    assignedTechnician: '',
    status: 'PENDING_APPROVAL',
    statusTimeline: [{
      status: 'PENDING_APPROVAL',
      enteredAt: ts,
    }],
    damageDescription: body.damageDescription || `${productLabel[body.productType] || 'Sale'} — created by Sales Rep ${user.name}`,
    createdAt: ts,
    updatedAt: ts,
    // Sales attribution
    salesRepId: user.id,
    salesRepName: user.name,
    isSalesJob: true,
    productType: body.productType,
    productId: body.productId,
    notes: body.notes,
  } as any

  jobCards.push(newJob)
  activityLog.push({
    id: 'a' + genId(),
    jobCardId: newJob.id,
    action: 'JOB_CREATED',
    description: `Sales job created by ${user.name} (${productLabel[body.productType]}). Awaiting Admin/Workshop approval.`,
    userId: user.id,
    userName: user.name,
    timestamp: ts,
  })

  addNotification('job_created', 'warning', 'New Sales Job — Approval Required',
    `${num} created by Sales Rep ${user.name} for ${cust.name} — ${productLabel[body.productType]} — awaiting approval`,
    { jobCardId: newJob.id, jobCardNumber: num })

  return c.json(newJob, 201)
})

// ═══════════════════════════════════════════════════════════════════════════════
// ── STAFF PERFORMANCE ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// GET /staff-performance/sa-targets — list all SA upsell targets (Admin/WC sees all; SA sees own)
api.get('/staff-performance/sa-targets', async (c) => {
  const user = (c as any).user as User
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const isAdminOrWC = user.role === 'Admin' || user.role === 'Workshop Controller'
  const list = isAdminOrWC
    ? saUpsellTargets
    : saUpsellTargets.filter(t => t.advisorId === user.id)
  return c.json(list)
})

// POST /staff-performance/sa-targets — Admin sets upsell target for an SA
api.post('/staff-performance/sa-targets', async (c) => {
  const user = (c as any).user as User
  if (!user || (user.role !== 'Admin' && user.role !== 'Workshop Controller')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const body = await c.req.json<{ advisorId: string; periodKey: string; targetAmount: number; commissionRate: number }>()
  if (!body.advisorId || !body.periodKey || body.targetAmount == null || body.commissionRate == null) {
    return c.json({ error: 'advisorId, periodKey, targetAmount and commissionRate are required' }, 400)
  }
  const advisor = users.find(u => u.id === body.advisorId && u.role === 'Service Advisor')
  if (!advisor) return c.json({ error: 'Service Advisor not found' }, 404)
  const ts = now()
  // Upsert: replace if same advisor+period exists
  const existingIdx = saUpsellTargets.findIndex(t => t.advisorId === body.advisorId && t.periodKey === body.periodKey)
  if (existingIdx !== -1) {
    saUpsellTargets[existingIdx] = {
      ...saUpsellTargets[existingIdx],
      targetAmount: body.targetAmount,
      commissionRate: body.commissionRate,
      updatedAt: ts,
    }
    save()
    return c.json(saUpsellTargets[existingIdx])
  }
  const newTarget: SAUpsellTarget = {
    id: 'sat' + genId(),
    advisorId: body.advisorId,
    advisorName: advisor.name,
    periodKey: body.periodKey,
    targetAmount: body.targetAmount,
    commissionRate: body.commissionRate,
    createdAt: ts,
    updatedAt: ts,
  }
  saUpsellTargets.push(newTarget)
  save()
  return c.json(newTarget, 201)
})

// DELETE /staff-performance/sa-targets/:id
api.delete('/staff-performance/sa-targets/:id', async (c) => {
  const user = (c as any).user as User
  if (!user || (user.role !== 'Admin' && user.role !== 'Workshop Controller')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const idx = saUpsellTargets.findIndex(t => t.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  saUpsellTargets.splice(idx, 1)
  save()
  return c.json({ success: true })
})

// GET /staff-performance/sa-kpi?period=YYYY-MM — SA upsell KPI summary
api.get('/staff-performance/sa-kpi', async (c) => {
  const user = (c as any).user as User
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const isAdminOrWC = user.role === 'Admin' || user.role === 'Workshop Controller'
  const period = c.req.query('period') || now().slice(0, 7)

  // Determine which advisors to include
  const advisors = isAdminOrWC
    ? users.filter(u => u.role === 'Service Advisor' && u.active !== false)
    : users.filter(u => u.id === user.id && u.role === 'Service Advisor')

  const result = advisors.map(advisor => {
    const target = saUpsellTargets.find(t => t.advisorId === advisor.id && t.periodKey === period)
    const comms = saUpsellCommissions.filter(sc => sc.advisorId === advisor.id && sc.periodKey === period)
    const totalUpsellRevenue = comms.reduce((s, c) => s + c.saleAmount, 0)
    const totalCommissionEarned = comms.reduce((s, c) => s + c.commissionEarned, 0)
    const upsellCount = comms.length

    // Upsell rate: % of their job cards in that period that had at least one upsell
    const periodStart = new Date(period + '-01')
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59)
    // Jobs where this SA added parts — derive by checking partsConsumption and jobServices
    const relevantJobIds = new Set([
      ...partsConsumption.filter(p => p.addedById === advisor.id).map(p => p.jobCardId),
      ...jobServices.filter(s => s.addedById === advisor.id && s.category === 'Add-on').map(s => s.jobCardId),
    ])
    // Jobs created by this SA in the period (by checking jobCards' createdAt)
    const saJobIds = new Set(
      jobCards
        .filter(j => {
          const d = new Date(j.createdAt)
          return d >= periodStart && d <= periodEnd
        })
        .map(j => j.id)
    )
    const upsellJobCount = [...relevantJobIds].filter(id => saJobIds.has(id)).length
    const upsellRate = saJobIds.size > 0 ? Math.round((upsellJobCount / saJobIds.size) * 100) : 0

    return {
      advisorId: advisor.id,
      advisorName: advisor.name,
      period,
      targetAmount: target?.targetAmount ?? null,
      commissionRate: target?.commissionRate ?? null,
      totalUpsellRevenue,
      totalCommissionEarned,
      upsellCount,
      upsellRate,
      jobsInPeriod: saJobIds.size,
      commissions: isAdminOrWC ? comms : comms, // always return for own view
    }
  })

  return c.json({ period, advisors: result })
})

// GET /staff-performance/tech-referrals?period=YYYY-MM — tech referral KPI
api.get('/staff-performance/tech-referrals', async (c) => {
  const user = (c as any).user as User
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const isAdminOrWC = user.role === 'Admin' || user.role === 'Workshop Controller'
  const period = c.req.query('period') || now().slice(0, 7)

  const technicians = isAdminOrWC
    ? users.filter(u => u.role === 'Technician' && u.active !== false)
    : users.filter(u => u.id === user.id && u.role === 'Technician')

  const result = technicians.map(tech => {
    const comms = techReferralCommissions.filter(t => t.technicianId === tech.id && t.periodKey === period)
    const totalInvoiceValue = comms.reduce((s, c) => s + c.invoiceAmount, 0)
    const totalCommission = comms.reduce((s, c) => s + c.commissionEarned, 0)
    return {
      technicianId: tech.id,
      technicianName: tech.name,
      period,
      referralCount: comms.length,
      totalInvoiceValue,
      totalCommission,
      commissions: comms,
    }
  })

  const globalRate = garageSettings.techReferralCommissionRate ?? 3
  return c.json({ period, technicians: result, globalRate })
})

// GET /staff-performance/referral-rate — get global tech referral commission rate
api.get('/staff-performance/referral-rate', async (c) => {
  return c.json({ rate: garageSettings.techReferralCommissionRate ?? 3 })
})

// PUT /staff-performance/referral-rate — Admin sets global tech referral commission rate
api.put('/staff-performance/referral-rate', async (c) => {
  const user = (c as any).user as User
  if (!user || (user.role !== 'Admin' && user.role !== 'Workshop Controller')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const body = await c.req.json<{ rate: number }>()
  if (body.rate == null || body.rate < 0 || body.rate > 100) {
    return c.json({ error: 'rate must be between 0 and 100' }, 400)
  }
  updateGarageSettings({ techReferralCommissionRate: body.rate })
  save()
  return c.json({ rate: body.rate })
})

export default api
