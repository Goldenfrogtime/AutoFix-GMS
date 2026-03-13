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
export type PFIStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Sent'
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue'
export type CustomerType = 'Individual' | 'Corporate'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  idNumber?: string
  customerType: CustomerType
  companyName?: string
  contactPerson?: string
  taxPin?: string
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
  sentAt?: string     // ISO timestamp when last emailed
  sentTo?: string     // email address it was sent to
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

// ─── Twiga Group Catalogue Types ────────────────────────────────────────────

export type OilBrand = 'Toyota' | 'Total' | 'Castrol'
export type PriceTier = 'Standard' | 'Prestige' | 'Premier'

export interface OilServiceTier {
  engineSize: string
  standardPrice: number
  prestigePrice: number
  premierPrice: number
  standardMargin: number
  prestigeMargin: number
  premierMargin: number
}

export interface OilServiceProduct {
  id: string
  brand: OilBrand
  tiers: OilServiceTier[]
  fleetDiscount3to5: number   // discount per car for 3-5 vehicles
  fleetDiscount5plus: number  // discount per car for 5+ vehicles
}

export interface CataloguePart {
  id: string
  category: 'Air Filter' | 'AC Filter' | 'Spark Plugs' | 'Oil Filter' | 'Diesel Filter' | 'Accessory'
  description: string
  compatibleModels: string   // comma-separated makes/models
  buyingPrice: number
  sellingPrice: number
  margin: number
}

export interface CarWashPackage {
  id: string
  name: string
  type: 'Standard' | 'AddOn' | 'DeepClean' | 'Monthly'
  price: number
  vehicleCount?: number    // for monthly packages
  description: string
  includes?: string[]
}

export interface AddOnService {
  id: string
  name: string
  price: number
  unit: string    // e.g. 'Per Job', 'Per Tyre'
  description: string
  category: 'Diagnostic' | 'Inspection' | 'Tyres' | 'Alignment'
}

// ─── Seed Data ─────────────────────────────────────────────────────────────

export const customers: Customer[] = [
  { id: 'c1', name: 'James Mwangi', phone: '+255 712 345 678', email: 'james.mwangi@email.com', address: '14 Uhuru St, Dar es Salaam', idNumber: 'TZ123456789', customerType: 'Individual', createdAt: '2025-01-10T08:00:00Z' },
  { id: 'c2', name: 'Fatuma Hassan', phone: '+255 756 234 567', email: 'fatuma.hassan@email.com', address: '8 Kariakoo Rd, Dar es Salaam', customerType: 'Individual', createdAt: '2025-01-15T09:30:00Z' },
  { id: 'c3', name: 'Twiga Fleet Services Ltd', phone: '+255 769 876 543', email: 'd.kimani@business.co.tz', address: '22 Samora Ave, Dodoma', customerType: 'Corporate', companyName: 'Twiga Fleet Services Ltd', contactPerson: 'David Kimani', taxPin: 'TIN-987654321', createdAt: '2025-02-01T11:00:00Z' },
  { id: 'c4', name: 'Amina Odhiambo', phone: '+255 783 456 789', email: 'amina.o@gmail.com', address: '5 Mwembe Tayari, Mombasa Rd', customerType: 'Individual', createdAt: '2025-02-14T14:00:00Z' },
  { id: 'c5', name: 'Ndegwa Logistics Co.', phone: '+255 798 123 456', email: 'r.ndegwa@fleet.co.tz', address: '33 Industrial Zone, Arusha', customerType: 'Corporate', companyName: 'Ndegwa Logistics Co.', contactPerson: 'Robert Ndegwa', taxPin: 'TIN-456789012', createdAt: '2025-03-01T08:30:00Z' },
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
  { id: 'p4', jobCardId: 'j3', labourCost: 150000, partsCost: 130000, totalEstimate: 280000, status: 'Sent', notes: 'Major service estimate – brakes, oil, plugs', createdAt: '2025-02-20T09:00:00Z', sentAt: '2025-02-21T10:00:00Z', sentTo: 'd.kimani@business.co.tz' },
  { id: 'p5', jobCardId: 'j5', labourCost: 400000, partsCost: 250000, totalEstimate: 650000, status: 'Draft', notes: 'Engine overhaul and gearbox – awaiting customer approval', createdAt: '2025-03-05T12:00:00Z' },
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

// ─── Twiga Group Oil Service Products ────────────────────────────────────────

export const oilServiceProducts: OilServiceProduct[] = [
  {
    id: 'oil-toyota',
    brand: 'Toyota',
    fleetDiscount3to5: 5000,
    fleetDiscount5plus: 8000,
    tiers: [
      { engineSize: 'Up to 4 Litres',    standardPrice: 120000, prestigePrice: 150000, premierPrice: 170000, standardMargin: 35840, prestigeMargin: 65840, premierMargin: 85840 },
      { engineSize: 'Above 4 – 5 Litres',standardPrice: 150000, prestigePrice: 170000, premierPrice: 190000, standardMargin: 42500, prestigeMargin: 62500, premierMargin: 82500 },
      { engineSize: '6 Litres',           standardPrice: 180000, prestigePrice: 210000, premierPrice: 240000, standardMargin: 50000, prestigeMargin: 80000, premierMargin: 110000 },
      { engineSize: '7 Litres',           standardPrice: 210000, prestigePrice: 230000, premierPrice: 270000, standardMargin: 52500, prestigeMargin: 72500, premierMargin: 112500 },
      { engineSize: '8 Litres',           standardPrice: 250000, prestigePrice: 270000, premierPrice: 300000, standardMargin: 70000, prestigeMargin: 90000, premierMargin: 120000 },
      { engineSize: '9 Litres',           standardPrice: 270000, prestigePrice: 300000, premierPrice: 320000, standardMargin: 72500, prestigeMargin: 102500, premierMargin: 122500 },
      { engineSize: '10 Litres',          standardPrice: 320000, prestigePrice: 340000, premierPrice: 360000, standardMargin: 82500, prestigeMargin: 102500, premierMargin: 122500 },
      { engineSize: '11 Litres',          standardPrice: 330000, prestigePrice: 350000, premierPrice: 370000, standardMargin: 81000, prestigeMargin: 104000, premierMargin: 124000 },
    ]
  },
  {
    id: 'oil-total',
    brand: 'Total',
    fleetDiscount3to5: 0,
    fleetDiscount5plus: 0,
    tiers: [
      { engineSize: 'Up to 4 Litres',    standardPrice: 110000, prestigePrice: 130000, premierPrice: 160000, standardMargin: 35840, prestigeMargin: 55840, premierMargin: 85840 },
      { engineSize: 'Above 4 – 5 Litres',standardPrice: 130000, prestigePrice: 150000, premierPrice: 180000, standardMargin: 35000, prestigeMargin: 55000, premierMargin: 85000 },
    ]
  },
  {
    id: 'oil-castrol',
    brand: 'Castrol',
    fleetDiscount3to5: 0,
    fleetDiscount5plus: 0,
    tiers: [
      { engineSize: 'Above 4 – 5 Litres',standardPrice: 260000, prestigePrice: 277000, premierPrice: 307000, standardMargin: 30000, prestigeMargin: 47000, premierMargin: 77000 },
      { engineSize: '6 Litres',           standardPrice: 305000, prestigePrice: 322000, premierPrice: 352000, standardMargin: 30000, prestigeMargin: 47000, premierMargin: 77000 },
      { engineSize: '7 Litres',           standardPrice: 350000, prestigePrice: 367000, premierPrice: 397000, standardMargin: 30000, prestigeMargin: 47000, premierMargin: 77000 },
      { engineSize: '8 Litres',           standardPrice: 390000, prestigePrice: 407000, premierPrice: 437000, standardMargin: 30000, prestigeMargin: 47000, premierMargin: 77000 },
      { engineSize: '9 Litres',           standardPrice: 430000, prestigePrice: 447000, premierPrice: 477000, standardMargin: 30000, prestigeMargin: 47000, premierMargin: 77000 },
    ]
  },
]

// ─── Twiga Group Accessories & Parts Catalogue ───────────────────────────────

export const catalogueParts: CataloguePart[] = [
  // Air Filters
  { id: 'af1',  category: 'Air Filter', description: 'Air Filter IST/VITZ/PROBOX/SIENTA/PORTE',                           compatibleModels: 'IST, VITZ, PROBOX, SIENTA, PORTE',                              buyingPrice: 7000,  sellingPrice: 25000, margin: 18000 },
  { id: 'af2',  category: 'Air Filter', description: 'Air Filter COROLLA NEW/SPACIO/RUN X/ALLEX/ALLION/PREMIO',           compatibleModels: 'COROLLA, SPACIO, RUN X, ALLEX, ALLION, PREMIO',                  buyingPrice: 8000,  sellingPrice: 25000, margin: 17000 },
  { id: 'af3',  category: 'Air Filter', description: 'Air Filter HARRIER CHOGO/KLUGER/MAZDA VERISA',                      compatibleModels: 'HARRIER, KLUGER, MAZDA VERISA',                                  buyingPrice: 9000,  sellingPrice: 30000, margin: 21000 },
  { id: 'af4',  category: 'Air Filter', description: 'Air Filter ALPHARD',                                                 compatibleModels: 'ALPHARD',                                                         buyingPrice: 9000,  sellingPrice: 25000, margin: 16000 },
  { id: 'af5',  category: 'Air Filter', description: 'Air Filter PREMIO NEW/ANACONDA/ALLION NEW',                          compatibleModels: 'PREMIO NEW, ANACONDA, ALLION NEW',                               buyingPrice: 9000,  sellingPrice: 30000, margin: 21000 },
  { id: 'af6',  category: 'Air Filter', description: 'Air Filter RACTIS/VITZ NEW',                                         compatibleModels: 'RACTIS, VITZ NEW',                                               buyingPrice: 7000,  sellingPrice: 25000, margin: 18000 },
  { id: 'af7',  category: 'Air Filter', description: 'Air Filter MARK X/CROWN',                                            compatibleModels: 'MARK X, CROWN',                                                  buyingPrice: 9500,  sellingPrice: 30000, margin: 20500 },
  { id: 'af8',  category: 'Air Filter', description: 'Air Filter RAV 4 MISS TZ/VANGUARD',                                  compatibleModels: 'RAV4, VANGUARD',                                                 buyingPrice: 11000, sellingPrice: 35000, margin: 24000 },
  { id: 'af9',  category: 'Air Filter', description: 'Air Filter MAZDA CX5',                                               compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 13000, sellingPrice: 35000, margin: 22000 },
  { id: 'af10', category: 'Air Filter', description: 'Air Filter SUBARU',                                                  compatibleModels: 'SUBARU',                                                         buyingPrice: 10000, sellingPrice: 30000, margin: 20000 },
  { id: 'af11', category: 'Air Filter', description: 'Air Filter HILUX REVO/FORTUNER',                                     compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 20000, sellingPrice: 50000, margin: 30000 },
  { id: 'af12', category: 'Air Filter', description: 'Air Filter VDJ200',                                                  compatibleModels: 'VDJ200',                                                         buyingPrice: 20000, sellingPrice: 50000, margin: 30000 },
  { id: 'af13', category: 'Air Filter', description: 'Air Filter PRADO 150',                                               compatibleModels: 'PRADO 150',                                                      buyingPrice: 20000, sellingPrice: 50000, margin: 30000 },
  { id: 'af14', category: 'Air Filter', description: 'Air Filter BENZ',                                                    compatibleModels: 'MERCEDES-BENZ',                                                  buyingPrice: 30000, sellingPrice: 55000, margin: 25000 },
  { id: 'af15', category: 'Air Filter', description: 'Air Filter BMW',                                                     compatibleModels: 'BMW',                                                            buyingPrice: 30000, sellingPrice: 55000, margin: 25000 },
  { id: 'af16', category: 'Air Filter', description: 'Air Filter LANDROVER DISCOVERY 4',                                   compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 30000, sellingPrice: 60000, margin: 30000 },
  { id: 'af17', category: 'Air Filter', description: 'Air Filter VW',                                                      compatibleModels: 'VOLKSWAGEN',                                                     buyingPrice: 30000, sellingPrice: 60000, margin: 30000 },
  { id: 'af18', category: 'Air Filter', description: 'Air Filter FORD RANGER T6/RAPTOR/EVEREST',                           compatibleModels: 'FORD RANGER T6, RAPTOR, EVEREST',                                buyingPrice: 30000, sellingPrice: 70000, margin: 40000 },
  // AC Filters
  { id: 'ac1',  category: 'AC Filter',  description: 'AC Filter IST/SIENTA/PORTE/RUN X/ALLEX/SPACIO NEW',                  compatibleModels: 'IST, SIENTA, PORTE, RUN X, ALLEX, SPACIO NEW',                  buyingPrice: 6000,  sellingPrice: 20000, margin: 14000 },
  { id: 'ac2',  category: 'AC Filter',  description: 'AC Filter HARRIER CHOGO/KLUGER',                                     compatibleModels: 'HARRIER, KLUGER',                                                buyingPrice: 7000,  sellingPrice: 25000, margin: 18000 },
  { id: 'ac3',  category: 'AC Filter',  description: 'AC Filter ALPHARD/IPSUM',                                            compatibleModels: 'ALPHARD, IPSUM',                                                 buyingPrice: 7000,  sellingPrice: 25000, margin: 18000 },
  { id: 'ac4',  category: 'AC Filter',  description: 'AC Filter VDJ200/PRADO 120-150/PREMIO NEW/ALLION NEW/ANACONDA/WISH', compatibleModels: 'VDJ200, PRADO 120/150, PREMIO NEW, ALLION NEW, ANACONDA, WISH',  buyingPrice: 7000,  sellingPrice: 25000, margin: 18000 },
  { id: 'ac5',  category: 'AC Filter',  description: 'AC Filter FORTUNER/HILUX REVO',                                      compatibleModels: 'FORTUNER, HILUX REVO',                                           buyingPrice: 12000, sellingPrice: 30000, margin: 18000 },
  { id: 'ac6',  category: 'AC Filter',  description: 'AC Filter BENZ',                                                     compatibleModels: 'MERCEDES-BENZ',                                                  buyingPrice: 20000, sellingPrice: 40000, margin: 20000 },
  { id: 'ac7',  category: 'AC Filter',  description: 'AC Filter BMW',                                                      compatibleModels: 'BMW',                                                            buyingPrice: 20000, sellingPrice: 40000, margin: 20000 },
  { id: 'ac8',  category: 'AC Filter',  description: 'AC Filter LANDROVER DISCOVERY 4',                                    compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 20000, sellingPrice: 40000, margin: 20000 },
  { id: 'ac9',  category: 'AC Filter',  description: 'AC Filter FORD RANGER RT/EVEREST',                                   compatibleModels: 'FORD RANGER, EVEREST',                                           buyingPrice: 18000, sellingPrice: 35000, margin: 17000 },
  { id: 'ac10', category: 'AC Filter',  description: 'AC Filter SUBARU',                                                   compatibleModels: 'SUBARU',                                                         buyingPrice: 7000,  sellingPrice: 20000, margin: 13000 },
  { id: 'ac11', category: 'AC Filter',  description: 'AC Filter VW TOUREG',                                                compatibleModels: 'VW TOUAREG',                                                     buyingPrice: 20000, sellingPrice: 40000, margin: 20000 },
  // Spark Plugs
  { id: 'sp1',  category: 'Spark Plugs',description: 'Spark Plugs IST/RUN X/ALLEX/SPACIO NEW/PREMIO',                     compatibleModels: 'IST, RUN X, ALLEX, SPACIO NEW, PREMIO',                         buyingPrice: 4000,  sellingPrice: 15000, margin: 11000 },
  { id: 'sp2',  category: 'Spark Plugs',description: 'Spark Plugs HARRIER CHOGO/KLUGER/ALPHARD/VANGUARD',                  compatibleModels: 'HARRIER, KLUGER, ALPHARD, VANGUARD',                             buyingPrice: 5000,  sellingPrice: 25000, margin: 20000 },
  { id: 'sp3',  category: 'Spark Plugs',description: 'Spark Plugs ANACONDA/WISH NEW',                                      compatibleModels: 'ANACONDA, WISH NEW',                                             buyingPrice: 5000,  sellingPrice: 25000, margin: 20000 },
  { id: 'sp4',  category: 'Spark Plugs',description: 'Spark Plugs RACTIS/VITZ NEW',                                        compatibleModels: 'RACTIS, VITZ NEW',                                               buyingPrice: 5000,  sellingPrice: 25000, margin: 20000 },
  // General Accessories
  { id: 'acc1', category: 'Accessory',  description: 'Coolant',                                                            compatibleModels: 'Universal',                                                      buyingPrice: 5800,  sellingPrice: 15000, margin: 9200 },
  { id: 'acc2', category: 'Accessory',  description: 'Wiper Blades',                                                       compatibleModels: 'Universal',                                                      buyingPrice: 7500,  sellingPrice: 15000, margin: 7500 },
  { id: 'acc3', category: 'Accessory',  description: 'Fire Extinguisher',                                                  compatibleModels: 'Universal',                                                      buyingPrice: 12000, sellingPrice: 25000, margin: 13000 },
  { id: 'acc4', category: 'Accessory',  description: 'Air Freshener (Standard)',                                            compatibleModels: 'Universal',                                                      buyingPrice: 2000,  sellingPrice: 5000,  margin: 3000 },
  { id: 'acc5', category: 'Accessory',  description: 'Air Freshener (Premium)',                                             compatibleModels: 'Universal',                                                      buyingPrice: 12000, sellingPrice: 17000, margin: 5000 },
  { id: 'acc6', category: 'Accessory',  description: 'Bulbs',                                                              compatibleModels: 'Universal',                                                      buyingPrice: 850,   sellingPrice: 3000,  margin: 2150 },
  { id: 'acc7', category: 'Accessory',  description: 'Warning Triangle',                                                   compatibleModels: 'Universal',                                                      buyingPrice: 7000,  sellingPrice: 15000, margin: 8000 },
  // Oil Filters
  { id: 'of1',  category: 'Oil Filter', description: 'Oil Filter IST/SPACIO/RUN X/RACTIS/WISH',                            compatibleModels: 'IST, SPACIO, RUN X, RACTIS, WISH',                              buyingPrice: 4500,  sellingPrice: 15000, margin: 10500 },
  { id: 'of2',  category: 'Oil Filter', description: 'Oil Filter HARRIER/KLUGER/ALPHARD/NOAH VOXY',                        compatibleModels: 'HARRIER, KLUGER, ALPHARD, NOAH, VOXY',                          buyingPrice: 4500,  sellingPrice: 15000, margin: 10500 },
  { id: 'of3',  category: 'Oil Filter', description: 'Oil Filter MARK X/CROWN',                                            compatibleModels: 'MARK X, CROWN',                                                  buyingPrice: 6000,  sellingPrice: 20000, margin: 14000 },
  { id: 'of4',  category: 'Oil Filter', description: 'Oil Filter PRADO 120/150',                                           compatibleModels: 'PRADO 120, PRADO 150',                                           buyingPrice: 6000,  sellingPrice: 20000, margin: 14000 },
  { id: 'of5',  category: 'Oil Filter', description: 'Oil Filter HILUX REVO/FORTUNER',                                     compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 6000,  sellingPrice: 20000, margin: 14000 },
  { id: 'of6',  category: 'Oil Filter', description: 'Oil Filter LANDROVER DISCOVERY 4',                                   compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 15000, sellingPrice: 30000, margin: 15000 },
  { id: 'of7',  category: 'Oil Filter', description: 'Oil Filter MAZDA CX5',                                               compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 15000, sellingPrice: 30000, margin: 15000 },
  { id: 'of8',  category: 'Oil Filter', description: 'Oil Filter VDJ200',                                                  compatibleModels: 'VDJ200',                                                         buyingPrice: 6000,  sellingPrice: 20000, margin: 14000 },
  { id: 'of9',  category: 'Oil Filter', description: 'Oil Filter LANDCRUISER/COASTER 1HZ',                                 compatibleModels: 'LAND CRUISER, COASTER 1HZ',                                      buyingPrice: 13000, sellingPrice: 30000, margin: 17000 },
  { id: 'of10', category: 'Oil Filter', description: 'Oil Filter SUBARU',                                                  compatibleModels: 'SUBARU',                                                         buyingPrice: 4500,  sellingPrice: 15000, margin: 10500 },
  { id: 'of11', category: 'Oil Filter', description: 'Diesel Filter VDJ200',                                               compatibleModels: 'VDJ200',                                                         buyingPrice: 10000, sellingPrice: 40000, margin: 30000 },
  { id: 'of12', category: 'Oil Filter', description: 'Diesel Filter PRADO 120/150',                                        compatibleModels: 'PRADO 120, PRADO 150',                                           buyingPrice: 15000, sellingPrice: 40000, margin: 25000 },
  { id: 'of13', category: 'Oil Filter', description: 'Diesel Filter LANDROVER',                                            compatibleModels: 'LAND ROVER',                                                     buyingPrice: 25000, sellingPrice: 60000, margin: 35000 },
  { id: 'of14', category: 'Oil Filter', description: 'Diesel Filter MAZDA CX5',                                            compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 18000, sellingPrice: 35000, margin: 17000 },
  { id: 'of15', category: 'Oil Filter', description: 'Diesel Filter 1HZ',                                                  compatibleModels: 'LAND CRUISER 1HZ',                                               buyingPrice: 15000, sellingPrice: 40000, margin: 25000 },
  { id: 'of16', category: 'Oil Filter', description: 'Diesel Filter HILUX REVO/FORTUNER',                                  compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 15000, sellingPrice: 40000, margin: 25000 },
  { id: 'of17', category: 'Oil Filter', description: 'Diesel Filter FORD RANGER',                                          compatibleModels: 'FORD RANGER',                                                    buyingPrice: 35000, sellingPrice: 70000, margin: 35000 },
]

// ─── Twiga Group Car Wash Packages ───────────────────────────────────────────

export const carWashPackages: CarWashPackage[] = [
  { id: 'cw1', name: 'Standard Car Wash – Body Only',        type: 'Standard',   price: 5000,   description: 'Basic exterior car wash, body only' },
  { id: 'cw2', name: 'Standard Car Wash – Full Body & Vacuum',type:'Standard',   price: 10000,  description: 'Full body exterior wash + interior vacuum', includes: ['Body Wash','Interior Vacuum'] },
  { id: 'cw3', name: 'Engine Wash',                           type: 'AddOn',     price: 25000,  description: 'Thorough engine bay cleaning' },
  { id: 'cw4', name: 'Body Wax',                              type: 'AddOn',     price: 0,      description: 'Body waxing and polish treatment' },
  { id: 'cw5', name: 'Leather Treatment',                     type: 'AddOn',     price: 0,      description: 'Interior leather conditioning and treatment' },
  { id: 'cw6', name: 'Prestige Deep Clean',                   type: 'DeepClean', price: 150000, description: 'Premier Car Wash + all add-ons included', includes: ['Body Wash','Vacuum','Engine Wash','Body Wax','Leather Treatment'] },
  { id: 'cw7', name: 'Premier Deep Clean',                    type: 'DeepClean', price: 200000, description: 'Prestige Deep Clean + seat removal + body polish', includes: ['Body Wash','Vacuum','Engine Wash','Body Wax','Leather Treatment','Seat Removal','Body Polish'] },
  { id: 'cw8', name: 'Monthly – 3 Vehicles (Standard)',       type: 'Monthly',   price: 80000,  vehicleCount: 3,  description: '20 standard washes/month for 3-vehicle fleet (TZS 4,000/wash)' },
  { id: 'cw9', name: 'Monthly – 5 Vehicles (Standard)',       type: 'Monthly',   price: 120000, vehicleCount: 5,  description: '20 standard washes/month for 5-vehicle fleet (TZS 6,000/wash)' },
  { id: 'cw10',name: 'Monthly – 10 Vehicles (Standard)',      type: 'Monthly',   price: 160000, vehicleCount: 10, description: '20 standard washes/month for 10-vehicle fleet (TZS 8,000/wash)' },
]

// ─── Twiga Group Add-on Services ─────────────────────────────────────────────

export const addOnServices: AddOnService[] = [
  { id: 'aos1', name: 'Diagnosis',        price: 30000, unit: 'Per Job',  category: 'Diagnostic', description: 'Plug & read only – electronic fault code scanning and diagnosis' },
  { id: 'aos2', name: 'Full Check-Up',    price: 25000, unit: 'Per Job',  category: 'Inspection', description: 'Full inspection of all suspension, electrical and engine parts (excludes diagnosis)' },
  { id: 'aos3', name: 'Tyre Change',      price: 4000,  unit: 'Per Tyre', category: 'Tyres',      description: 'Tyre removal and fitting per single tyre' },
  { id: 'aos4', name: 'Wheel Balancing',  price: 4000,  unit: 'Per Tyre', category: 'Tyres',      description: 'Wheel balancing per single tyre' },
  { id: 'aos5', name: 'Wheel Alignment',  price: 30000, unit: 'Per Job',  category: 'Alignment',  description: 'Full 4-wheel alignment service' },
]

// ─── Appointments ───────────────────────────────────────────────────────────

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show'
export type AppointmentServiceType = 'Oil Change' | 'Major Service' | 'Minor Service' | 'Brake Service' | 'Tyre Service' | 'Diagnosis' | 'Car Wash' | 'Body Repair' | 'Electrical' | 'Other'

export interface Appointment {
  id: string
  customerId: string
  vehicleId: string
  serviceType: AppointmentServiceType
  status: AppointmentStatus
  date: string          // YYYY-MM-DD
  time: string          // HH:MM (24h)
  estimatedDuration: number  // minutes
  assignedTechnician?: string
  notes?: string
  jobCardId?: string    // set when converted to job card
  createdAt: string
  updatedAt: string
}

export const appointments: Appointment[] = [
  { id: 'apt1', customerId: 'c1', vehicleId: 'v1', serviceType: 'Oil Change',     status: 'Confirmed',  date: '2026-03-13', time: '08:00', estimatedDuration: 60,  assignedTechnician: 'u4', notes: 'Customer requests Castrol oil', createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z' },
  { id: 'apt2', customerId: 'c2', vehicleId: 'v2', serviceType: 'Minor Service',   status: 'Scheduled',  date: '2026-03-13', time: '10:00', estimatedDuration: 120, assignedTechnician: 'u4', notes: '', createdAt: '2026-03-11T08:00:00Z', updatedAt: '2026-03-11T08:00:00Z' },
  { id: 'apt3', customerId: 'c3', vehicleId: 'v3', serviceType: 'Major Service',   status: 'Scheduled',  date: '2026-03-14', time: '09:00', estimatedDuration: 240, assignedTechnician: 'u4', notes: 'Fleet vehicle – priority handling', createdAt: '2026-03-11T09:00:00Z', updatedAt: '2026-03-11T09:00:00Z' },
  { id: 'apt4', customerId: 'c4', vehicleId: 'v4', serviceType: 'Diagnosis',       status: 'Confirmed',  date: '2026-03-14', time: '14:00', estimatedDuration: 60,  notes: 'Engine light on', createdAt: '2026-03-12T07:00:00Z', updatedAt: '2026-03-12T07:00:00Z' },
  { id: 'apt5', customerId: 'c1', vehicleId: 'v1', serviceType: 'Brake Service',   status: 'Scheduled',  date: '2026-03-17', time: '11:00', estimatedDuration: 90,  assignedTechnician: 'u4', notes: 'Front brakes squeaking', createdAt: '2026-03-12T11:00:00Z', updatedAt: '2026-03-12T11:00:00Z' },
  { id: 'apt6', customerId: 'c5', vehicleId: 'v5', serviceType: 'Tyre Service',    status: 'Completed',  date: '2026-03-12', time: '08:30', estimatedDuration: 60,  assignedTechnician: 'u4', notes: 'Replace all 4 tyres', createdAt: '2026-03-10T14:00:00Z', updatedAt: '2026-03-12T10:00:00Z' },
  { id: 'apt7', customerId: 'c2', vehicleId: 'v2', serviceType: 'Car Wash',        status: 'Cancelled',  date: '2026-03-12', time: '15:00', estimatedDuration: 30,  notes: 'Customer cancelled', createdAt: '2026-03-11T16:00:00Z', updatedAt: '2026-03-12T07:00:00Z' },
]
