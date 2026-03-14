import { Hono } from 'hono'
import {
  customers, vehicles, jobCards, pfis, partsConsumption,
  invoices, servicePackages, users, activityLog,
  oilServiceProducts, catalogueParts, carWashPackages, addOnServices, appointments,
  type Customer, type Vehicle, type JobCard, type PFI,
  type PartConsumption, type ServicePackage, type User, type Invoice,
  type CataloguePart, type CarWashPackage, type AddOnService, type Appointment
} from '../data/store'

const api = new Hono()

// ─── Helpers ────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).substring(2, 10)
}
function now() {
  return new Date().toISOString()
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
  const invoice = invoices.find(x => x.jobCardId === j.id)
  const logs = activityLog.filter(x => x.jobCardId === j.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return c.json({ ...j, vehicle: v, customer: cu, technicianName: tech?.name, pfi, parts, invoice, logs })
})

api.post('/jobcards', async (c) => {
  const body = await c.req.json<Omit<JobCard, 'id' | 'jobCardNumber' | 'status' | 'createdAt' | 'updatedAt'>>()
  const num = 'GMS-' + new Date().getFullYear() + '-' + String(jobCards.length + 1).padStart(3, '0')
  const newJob: JobCard = { ...body, id: 'j' + genId(), jobCardNumber: num, status: 'RECEIVED', createdAt: now(), updatedAt: now() }
  jobCards.push(newJob)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'JOB_CREATED', description: 'New job card created', userId: 'u3', userName: 'System', timestamp: now() })
  return c.json(newJob, 201)
})

api.patch('/jobcards/:id/status', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { status } = await c.req.json<{ status: string }>()
  const old = jobCards[idx].status
  jobCards[idx] = { ...jobCards[idx], status: status as any, updatedAt: now() }
  activityLog.push({ id: 'a' + genId(), jobCardId: jobCards[idx].id, action: 'STATUS_CHANGE', description: `Status changed from ${old} to ${status}`, userId: 'u2', userName: 'System', timestamp: now() })
  return c.json(jobCards[idx])
})

api.put('/jobcards/:id', async (c) => {
  const idx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<JobCard>>()
  jobCards[idx] = { ...jobCards[idx], ...body, updatedAt: now() }
  return c.json(jobCards[idx])
})

// ─── PFIs ────────────────────────────────────────────────────────────────────
api.get('/pfis', (c) => c.json(pfis))

api.post('/jobcards/:id/pfi', async (c) => {
  const body = await c.req.json<Omit<PFI, 'id' | 'jobCardId' | 'createdAt'>>()
  const newPFI: PFI = { ...body, id: 'p' + genId(), jobCardId: c.req.param('id'), createdAt: now() }
  pfis.push(newPFI)
  const jIdx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (jIdx !== -1) { jobCards[jIdx].status = 'PFI_PREPARATION'; jobCards[jIdx].updatedAt = now() }
  return c.json(newPFI, 201)
})

api.patch('/pfi/:id', async (c) => {
  const idx = pfis.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<PFI>>()
  pfis[idx] = { ...pfis[idx], ...body }
  return c.json(pfis[idx])
})

// Record that a PFI was sent (email delivery happens client-side via mailto / future SMTP)
api.post('/pfi/:id/send', async (c) => {
  const idx = pfis.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { email } = await c.req.json<{ email: string }>()
  // Determine new status based on job category
  const job = jobCards.find(j => j.id === pfis[idx].jobCardId)
  const isInsurance = job?.category === 'Insurance'
  let newStatus = pfis[idx].status
  if (isInsurance && pfis[idx].status === 'Draft') newStatus = 'Submitted'
  if (!isInsurance && pfis[idx].status === 'Draft') newStatus = 'Sent'
  pfis[idx] = { ...pfis[idx], sentAt: now(), sentTo: email, status: newStatus }
  // Log activity
  if (job) {
    activityLog.push({ id: 'a' + genId(), jobCardId: pfis[idx].jobCardId, action: 'PFI_SENT', description: `PFI sent to ${email}`, userId: 'u3', userName: 'System', timestamp: now() })
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
  return c.json({ pfi, job, customer, vehicle, parts })
})

// ─── Parts Consumption ───────────────────────────────────────────────────────
api.get('/jobcards/:id/parts', (c) => {
  return c.json(partsConsumption.filter(x => x.jobCardId === c.req.param('id')))
})

api.post('/jobcards/:id/parts', async (c) => {
  const body = await c.req.json<Omit<PartConsumption, 'id' | 'jobCardId'>>()
  const newPart: PartConsumption = { ...body, id: 'pc' + genId(), jobCardId: c.req.param('id') }
  partsConsumption.push(newPart)
  return c.json(newPart, 201)
})

api.delete('/parts/:id', (c) => {
  const idx = partsConsumption.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  partsConsumption.splice(idx, 1)
  return c.json({ success: true })
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
  const body = await c.req.json<Omit<Invoice, 'id' | 'jobCardId' | 'invoiceNumber' | 'issuedAt'>>()
  const invNum = 'INV-' + new Date().getFullYear() + '-' + String(invoices.length + 1).padStart(3, '0')
  const newInv: Invoice = { ...body, id: 'i' + genId(), jobCardId: c.req.param('id'), invoiceNumber: invNum, issuedAt: now() }
  invoices.push(newInv)
  const jIdx = jobCards.findIndex(x => x.id === c.req.param('id'))
  if (jIdx !== -1) { jobCards[jIdx].status = 'INVOICED'; jobCards[jIdx].updatedAt = now() }
  return c.json(newInv, 201)
})

// ─── Service Packages ────────────────────────────────────────────────────────
api.get('/packages', (c) => c.json(servicePackages))

api.post('/packages', async (c) => {
  const body = await c.req.json<Omit<ServicePackage, 'id'>>()
  const newPkg: ServicePackage = { ...body, id: 'sp' + genId() }
  servicePackages.push(newPkg)
  return c.json(newPkg, 201)
})

api.put('/packages/:id', async (c) => {
  const idx = servicePackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<ServicePackage>>()
  servicePackages[idx] = { ...servicePackages[idx], ...body }
  return c.json(servicePackages[idx])
})

api.delete('/packages/:id', (c) => {
  const idx = servicePackages.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  servicePackages.splice(idx, 1)
  return c.json({ success: true })
})

// ─── Users ───────────────────────────────────────────────────────────────────
api.get('/users', (c) => c.json(users))

api.post('/users', async (c) => {
  const body = await c.req.json<Omit<User, 'id' | 'createdAt'>>()
  const newUser: User = { ...body, id: 'u' + genId(), createdAt: now() }
  users.push(newUser)
  return c.json(newUser, 201)
})

api.put('/users/:id', async (c) => {
  const idx = users.findIndex(x => x.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<User>>()
  users[idx] = { ...users[idx], ...body }
  return c.json(users[idx])
})

// ─── Analytics ───────────────────────────────────────────────────────────────
api.get('/analytics', (c) => {
  const paid = invoices.filter(i => i.status === 'Paid')
  const totalRevenue = paid.reduce((s, i) => s + i.totalAmount, 0)
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

// ─── Twiga Catalogue: Oil Services ──────────────────────────────────────────
api.get('/catalogue/oil', (c) => c.json(oilServiceProducts))

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
  const body = await c.req.json<Omit<CataloguePart, 'id'>>()
  const newPart: CataloguePart = {
    id: 'cp' + genId(),
    category: body.category,
    description: body.description,
    compatibleModels: body.compatibleModels || '',
    buyingPrice: Number(body.buyingPrice) || 0,
    sellingPrice: Number(body.sellingPrice) || 0,
    margin: Number(body.sellingPrice || 0) - Number(body.buyingPrice || 0),
    stockQuantity: Number(body.stockQuantity) || 0,
  }
  catalogueParts.push(newPart)
  return c.json(newPart, 201)
})

api.put('/catalogue/parts/:id', async (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<CataloguePart>>()
  catalogueParts[idx] = { ...catalogueParts[idx], ...body }
  return c.json(catalogueParts[idx])
})

// Deduct stock when a catalogue part is used on a job
api.patch('/catalogue/parts/:id/deduct', async (c) => {
  const idx = catalogueParts.findIndex(p => p.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const { quantity } = await c.req.json<{ quantity: number }>()
  const current = catalogueParts[idx].stockQuantity ?? 0
  if (current < quantity) return c.json({ error: 'Insufficient stock', available: current }, 409)
  catalogueParts[idx] = { ...catalogueParts[idx], stockQuantity: current - quantity }
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

api.put('/catalogue/addons/:id', async (c) => {
  const idx = addOnServices.findIndex(s => s.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<Partial<AddOnService>>()
  addOnServices[idx] = { ...addOnServices[idx], ...body }
  return c.json(addOnServices[idx])
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
  jobCards.push(newJob)
  activityLog.push({ id: 'a' + genId(), jobCardId: newJob.id, action: 'JOB_CREATED', description: `Job card created from appointment #${apt.id}`, userId: 'u3', userName: 'System', timestamp: now() })
  appointments[idx] = { ...apt, status: 'In Progress', jobCardId: newJob.id, updatedAt: now() }
  return c.json({ jobCard: newJob, appointment: appointments[idx] }, 201)
})

export default api
