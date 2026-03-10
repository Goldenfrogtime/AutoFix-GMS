// In-memory data store for GMS demo
// In production, this would connect to Cloudflare D1 or external DB

export type CustomerStatus = 'active' | 'inactive'
export type JobCardStatus =
  | 'RECEIVED'
  | 'INSPECTION'
  | 'PFI_PREPARATION'
  | 'AWAITING_INSURER_APPROVAL'
  | 'REPAIR_IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'INVOICED'
  | 'RELEASED'

export type JobCategory = 'Insurance' | 'Private'
export type UserRole = 'Owner' | 'Manager' | 'Front Desk' | 'Technician' | 'Accountant'
export type PFIStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Revision Requested'
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  idNumber?: string
  createdAt: string
}

export interface Vehicle {
  id: string
  customerId: string
  registrationNumber: string
  make: string
  model: string
  year: number
  vin?: string
  engineNumber?: string
  insurer?: string
  policyNumber?: string
  createdAt: string
}

export interface JobCard {
  id: string
  jobCardNumber: string
  vehicleId: string
  customerId: string
  assignedTechnician: string
  category: JobCategory
  claimReference?: string
  insurer?: string
  assessor?: string
  damageDescription: string
  inspectionNotes?: string
  status: JobCardStatus
  createdAt: string
  updatedAt: string
}

export interface PFI {
  id: string
  jobCardId: string
  labourCost: number
  partsCost: number
  totalEstimate: number
  status: PFIStatus
  notes?: string
  createdAt: string
}

export interface PartConsumption {
  id: string
  jobCardId: string
  partName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface Invoice {
  id: string
  jobCardId: string
  invoiceNumber: string
  labourCost: number
  partsCost: number
  tax: number
  totalAmount: number
  status: InvoiceStatus
  issuedAt: string
  claimReference?: string
  pfiReference?: string
}

export interface ServicePackage {
  id: string
  packageName: string
  description: string
  labourCost: number
  estimatedHours: number
  parts: { name: string; quantity: number; unitCost: number }[]
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  active: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  jobCardId: string
  action: string
  description: string
  userId: string
  userName: string
  timestamp: string
}

// ─── Seed Data ─────────────────────────────────────────────────────────────

export const customers: Customer[] = [
  { id: 'c1', name: 'James Mwangi', phone: '+255 712 345 678', email: 'james.mwangi@email.com', address: '14 Uhuru St, Dar es Salaam', idNumber: 'TZ123456789', createdAt: '2025-01-10T08:00:00Z' },
  { id: 'c2', name: 'Fatuma Hassan', phone: '+255 756 234 567', email: 'fatuma.hassan@email.com', address: '8 Kariakoo Rd, Dar es Salaam', createdAt: '2025-01-15T09:30:00Z' },
  { id: 'c3', name: 'David Kimani', phone: '+255 769 876 543', email: 'd.kimani@business.co.tz', address: '22 Samora Ave, Dodoma', idNumber: 'TZ987654321', createdAt: '2025-02-01T11:00:00Z' },
  { id: 'c4', name: 'Amina Odhiambo', phone: '+255 783 456 789', email: 'amina.o@gmail.com', address: '5 Mwembe Tayari, Mombasa Rd', createdAt: '2025-02-14T14:00:00Z' },
  { id: 'c5', name: 'Robert Ndegwa', phone: '+255 798 123 456', email: 'r.ndegwa@fleet.co.tz', address: '33 Industrial Zone, Arusha', idNumber: 'TZ456789012', createdAt: '2025-03-01T08:30:00Z' },
]

export const vehicles: Vehicle[] = [
  { id: 'v1', customerId: 'c1', registrationNumber: 'T123 ABC', make: 'Toyota', model: 'Corolla', year: 2020, vin: '1NXBR32E85Z123456', engineNumber: '4ZZ-FE12345', insurer: 'Jubilee Insurance', policyNumber: 'JUB-2024-789', createdAt: '2025-01-10T08:10:00Z' },
  { id: 'v2', customerId: 'c2', registrationNumber: 'T456 DEF', make: 'Nissan', model: 'X-Trail', year: 2019, vin: 'JN8BT3DD0PW123456', engineNumber: 'QR25DE67890', insurer: 'Sanlam Tanzania', policyNumber: 'SAN-2024-456', createdAt: '2025-01-15T09:40:00Z' },
  { id: 'v3', customerId: 'c3', registrationNumber: 'T789 GHI', make: 'Suzuki', model: 'Swift', year: 2022, vin: 'JS1ZC44A0B0012345', engineNumber: 'K12B-98765', insurer: 'UAP Insurance', policyNumber: 'UAP-2024-321', createdAt: '2025-02-01T11:10:00Z' },
  { id: 'v4', customerId: 'c4', registrationNumber: 'T321 JKL', make: 'Toyota', model: 'Land Cruiser', year: 2021, vin: 'JT111UT0XB0012345', engineNumber: '1HZ-56789', insurer: 'Jubilee Insurance', policyNumber: 'JUB-2024-990', createdAt: '2025-02-14T14:10:00Z' },
  { id: 'v5', customerId: 'c5', registrationNumber: 'T654 MNO', make: 'Isuzu', model: 'D-Max', year: 2023, vin: 'JAABXS16KH4012345', engineNumber: '4JJ1-34567', insurer: 'Britam Insurance', policyNumber: 'BRI-2024-112', createdAt: '2025-03-01T08:40:00Z' },
]

export const jobCards: JobCard[] = [
  { id: 'j1', jobCardNumber: 'GMS-2025-001', vehicleId: 'v1', customerId: 'c1', assignedTechnician: 'u4', category: 'Insurance', claimReference: 'CLM-JUB-78901', insurer: 'Jubilee Insurance', assessor: 'Thomas Mlay', damageDescription: 'Front bumper damage and hood dent from collision. Right headlight broken.', inspectionNotes: 'Moderate structural damage. Requires panel beating and painting.', status: 'REPAIR_IN_PROGRESS', createdAt: '2025-03-01T09:00:00Z', updatedAt: '2025-03-03T14:00:00Z' },
  { id: 'j2', jobCardNumber: 'GMS-2025-002', vehicleId: 'v2', customerId: 'c2', assignedTechnician: 'u4', category: 'Insurance', claimReference: 'CLM-SAN-45612', insurer: 'Sanlam Tanzania', assessor: 'Grace Njoro', damageDescription: 'Rear-end collision. Bumper, boot lid and rear lamps damaged.', status: 'AWAITING_INSURER_APPROVAL', createdAt: '2025-03-03T10:00:00Z', updatedAt: '2025-03-04T09:00:00Z' },
  { id: 'j3', jobCardNumber: 'GMS-2025-003', vehicleId: 'v3', customerId: 'c3', assignedTechnician: 'u4', category: 'Private', damageDescription: 'Major service + brake pad replacement.', status: 'COMPLETED', createdAt: '2025-02-20T08:00:00Z', updatedAt: '2025-02-24T16:00:00Z' },
  { id: 'j4', jobCardNumber: 'GMS-2025-004', vehicleId: 'v4', customerId: 'c4', assignedTechnician: 'u4', category: 'Insurance', claimReference: 'CLM-JUB-66789', insurer: 'Jubilee Insurance', assessor: 'Samuel Weru', damageDescription: 'Side impact damage. Left doors and A-pillar affected.', status: 'INSPECTION', createdAt: '2025-03-05T08:00:00Z', updatedAt: '2025-03-05T08:00:00Z' },
  { id: 'j5', jobCardNumber: 'GMS-2025-005', vehicleId: 'v5', customerId: 'c5', assignedTechnician: 'u4', category: 'Private', damageDescription: 'Engine overhaul and gearbox service.', status: 'WAITING_FOR_PARTS', createdAt: '2025-03-04T11:00:00Z', updatedAt: '2025-03-05T10:00:00Z' },
  { id: 'j6', jobCardNumber: 'GMS-2025-006', vehicleId: 'v1', customerId: 'c1', assignedTechnician: 'u4', category: 'Insurance', claimReference: 'CLM-JUB-12350', insurer: 'Jubilee Insurance', assessor: 'Thomas Mlay', damageDescription: 'Windscreen crack and wiper motor failure.', status: 'INVOICED', createdAt: '2025-02-15T09:00:00Z', updatedAt: '2025-02-22T15:00:00Z' },
]

export const pfis: PFI[] = [
  { id: 'p1', jobCardId: 'j1', labourCost: 350000, partsCost: 480000, totalEstimate: 830000, status: 'Approved', notes: 'Includes panel beating, paint and new bumper', createdAt: '2025-03-02T10:00:00Z' },
  { id: 'p2', jobCardId: 'j2', labourCost: 180000, partsCost: 320000, totalEstimate: 500000, status: 'Submitted', notes: 'Rear bumper, boot lid, tail lights replacement', createdAt: '2025-03-04T10:00:00Z' },
  { id: 'p3', jobCardId: 'j6', labourCost: 80000, partsCost: 120000, totalEstimate: 200000, status: 'Approved', createdAt: '2025-02-16T09:00:00Z' },
]

export const partsConsumption: PartConsumption[] = [
  { id: 'pc1', jobCardId: 'j1', partName: 'Front Bumper Assembly', quantity: 1, unitCost: 280000, totalCost: 280000 },
  { id: 'pc2', jobCardId: 'j1', partName: '2K Paint Material', quantity: 3, unitCost: 45000, totalCost: 135000 },
  { id: 'pc3', jobCardId: 'j1', partName: 'Right Headlight Unit', quantity: 1, unitCost: 65000, totalCost: 65000 },
  { id: 'pc4', jobCardId: 'j3', partName: 'Brake Pads (Set)', quantity: 1, unitCost: 45000, totalCost: 45000 },
  { id: 'pc5', jobCardId: 'j3', partName: 'Engine Oil (5L)', quantity: 2, unitCost: 35000, totalCost: 70000 },
  { id: 'pc6', jobCardId: 'j3', partName: 'Oil Filter', quantity: 1, unitCost: 15000, totalCost: 15000 },
  { id: 'pc7', jobCardId: 'j6', partName: 'Windscreen Glass', quantity: 1, unitCost: 95000, totalCost: 95000 },
  { id: 'pc8', jobCardId: 'j6', partName: 'Wiper Motor Assembly', quantity: 1, unitCost: 25000, totalCost: 25000 },
]

export const invoices: Invoice[] = [
  { id: 'i1', jobCardId: 'j3', invoiceNumber: 'INV-2025-001', labourCost: 120000, partsCost: 130000, tax: 37500, totalAmount: 287500, status: 'Paid', issuedAt: '2025-02-25T10:00:00Z' },
  { id: 'i2', jobCardId: 'j6', invoiceNumber: 'INV-2025-002', labourCost: 80000, partsCost: 120000, tax: 30000, totalAmount: 230000, status: 'Paid', issuedAt: '2025-02-22T15:00:00Z', claimReference: 'CLM-JUB-12350', pfiReference: 'p3' },
]

export const servicePackages: ServicePackage[] = [
  { id: 'sp1', packageName: 'Minor Service', description: 'Oil change, filter replacement, basic inspection', labourCost: 50000, estimatedHours: 2, parts: [{ name: 'Engine Oil 5L', quantity: 1, unitCost: 35000 }, { name: 'Oil Filter', quantity: 1, unitCost: 15000 }] },
  { id: 'sp2', packageName: 'Major Service', description: 'Full service including plugs, belts, fluids', labourCost: 150000, estimatedHours: 6, parts: [{ name: 'Engine Oil 5L', quantity: 2, unitCost: 35000 }, { name: 'Oil Filter', quantity: 1, unitCost: 15000 }, { name: 'Air Filter', quantity: 1, unitCost: 20000 }, { name: 'Spark Plugs (Set)', quantity: 1, unitCost: 40000 }] },
  { id: 'sp3', packageName: 'Brake Service', description: 'Brake pads, fluid and disc inspection', labourCost: 80000, estimatedHours: 3, parts: [{ name: 'Brake Pads (Set)', quantity: 1, unitCost: 45000 }, { name: 'Brake Fluid', quantity: 1, unitCost: 12000 }] },
  { id: 'sp4', packageName: 'Oil Change', description: 'Quick oil and filter change', labourCost: 25000, estimatedHours: 1, parts: [{ name: 'Engine Oil 5L', quantity: 1, unitCost: 35000 }, { name: 'Oil Filter', quantity: 1, unitCost: 15000 }] },
]

export const users: User[] = [
  { id: 'u1', name: 'Michael Osei', email: 'michael.osei@garage.co.tz', role: 'Owner', phone: '+255 712 000 001', active: true, createdAt: '2024-12-01T08:00:00Z' },
  { id: 'u2', name: 'Sandra Kiprop', email: 'sandra.kiprop@garage.co.tz', role: 'Manager', phone: '+255 712 000 002', active: true, createdAt: '2024-12-01T08:00:00Z' },
  { id: 'u3', name: 'Kevin Mutua', email: 'kevin.mutua@garage.co.tz', role: 'Front Desk', phone: '+255 712 000 003', active: true, createdAt: '2025-01-05T08:00:00Z' },
  { id: 'u4', name: 'Peter Abuya', email: 'peter.abuya@garage.co.tz', role: 'Technician', phone: '+255 712 000 004', active: true, createdAt: '2025-01-05T08:00:00Z' },
  { id: 'u5', name: 'Esther Wanjiru', email: 'esther.wanjiru@garage.co.tz', role: 'Accountant', phone: '+255 712 000 005', active: true, createdAt: '2025-01-10T08:00:00Z' },
]

export const activityLog: ActivityLog[] = [
  { id: 'a1', jobCardId: 'j1', action: 'STATUS_CHANGE', description: 'Status changed from RECEIVED to INSPECTION', userId: 'u3', userName: 'Kevin Mutua', timestamp: '2025-03-01T10:00:00Z' },
  { id: 'a2', jobCardId: 'j1', action: 'PFI_CREATED', description: 'PFI created with estimate 830,000 TZS', userId: 'u2', userName: 'Sandra Kiprop', timestamp: '2025-03-02T10:00:00Z' },
  { id: 'a3', jobCardId: 'j1', action: 'STATUS_CHANGE', description: 'Status changed to REPAIR_IN_PROGRESS after insurer approval', userId: 'u2', userName: 'Sandra Kiprop', timestamp: '2025-03-03T14:00:00Z' },
  { id: 'a4', jobCardId: 'j2', action: 'STATUS_CHANGE', description: 'PFI submitted to Sanlam Tanzania for approval', userId: 'u3', userName: 'Kevin Mutua', timestamp: '2025-03-04T09:00:00Z' },
  { id: 'a5', jobCardId: 'j4', action: 'JOB_CREATED', description: 'New job card created - Vehicle received for inspection', userId: 'u3', userName: 'Kevin Mutua', timestamp: '2025-03-05T08:00:00Z' },
]
