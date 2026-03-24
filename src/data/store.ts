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

// ─── RBAC: Permission Keys ─────────────────────────────────────────────────────
// Each permission key maps to a feature/action in the system.
// Roles are assigned a set of these keys.
export type Permission =
  // Dashboard
  | 'dashboard.view'
  // Job Cards
  | 'jobcards.view'
  | 'jobcards.create'
  | 'jobcards.edit'
  | 'jobcards.delete'
  | 'jobcards.change_status'
  | 'jobcards.assign_technician'
  // Appointments
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.edit'
  | 'appointments.delete'
  | 'appointments.convert'
  // Customers
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  // Vehicles
  | 'vehicles.view'
  | 'vehicles.create'
  | 'vehicles.edit'
  // PFIs
  | 'pfis.view'
  | 'pfis.create'
  | 'pfis.approve'
  | 'pfis.send'
  // Invoices
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.mark_paid'
  // Expenses
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.approve'
  | 'expenses.delete'
  // Service Packages
  | 'packages.view'
  | 'packages.manage'
  // Oil Services
  | 'oil_services.view'
  // Parts Catalogue
  | 'parts.view'
  | 'parts.manage'
  | 'parts.restock'
  // Car Wash
  | 'carwash.view'
  | 'carwash.manage'
  // Add-on Services
  | 'addons.view'
  | 'addons.manage'
  // Analytics
  | 'analytics.view'
  // Users & Roles
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_roles'
  // Finance
  | 'finance.view'
  // Notifications
  | 'notifications.view'
  // Settings
  | 'settings.view'
  | 'settings.manage'

// ─── RBAC: Role → Permissions Map ─────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Owner: [
    // Full access to everything
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit','jobcards.delete','jobcards.change_status','jobcards.assign_technician',
    'appointments.view','appointments.create','appointments.edit','appointments.delete','appointments.convert',
    'customers.view','customers.create','customers.edit','customers.delete',
    'vehicles.view','vehicles.create','vehicles.edit',
    'pfis.view','pfis.create','pfis.approve','pfis.send',
    'invoices.view','invoices.create','invoices.mark_paid',
    'expenses.view','expenses.create','expenses.approve','expenses.delete',
    'packages.view','packages.manage',
    'oil_services.view',
    'parts.view','parts.manage','parts.restock',
    'carwash.view','carwash.manage',
    'addons.view','addons.manage',
    'analytics.view',
    'finance.view',
    'users.view','users.create','users.edit','users.delete','users.manage_roles',
    'notifications.view',
    'settings.view','settings.manage',
  ],
  Manager: [
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit','jobcards.change_status','jobcards.assign_technician',
    'appointments.view','appointments.create','appointments.edit','appointments.delete','appointments.convert',
    'customers.view','customers.create','customers.edit',
    'vehicles.view','vehicles.create','vehicles.edit',
    'pfis.view','pfis.create','pfis.approve','pfis.send',
    'invoices.view','invoices.create','invoices.mark_paid',
    'expenses.view','expenses.create','expenses.approve',
    'packages.view','packages.manage',
    'oil_services.view',
    'parts.view','parts.manage','parts.restock',
    'carwash.view','carwash.manage',
    'addons.view','addons.manage',
    'analytics.view',
    'finance.view',
    'users.view',
    'notifications.view',
  ],
  'Front Desk': [
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit','jobcards.change_status',
    'appointments.view','appointments.create','appointments.edit','appointments.convert',
    'customers.view','customers.create','customers.edit',
    'vehicles.view','vehicles.create','vehicles.edit',
    'pfis.view','pfis.create','pfis.send',
    'invoices.view',
    'expenses.view','expenses.create',
    'packages.view',
    'oil_services.view',
    'parts.view',
    'carwash.view',
    'addons.view',
    'notifications.view',
  ],
  Technician: [
    'dashboard.view',
    'jobcards.view','jobcards.change_status',
    'appointments.view',
    'customers.view',
    'vehicles.view',
    'pfis.view',
    'parts.view',
    'oil_services.view',
    'packages.view',
    'carwash.view',
    'addons.view',
    'notifications.view',
  ],
  Accountant: [
    'dashboard.view',
    'jobcards.view',
    'customers.view',
    'vehicles.view',
    'pfis.view',
    'invoices.view','invoices.create','invoices.mark_paid',
    'expenses.view','expenses.create','expenses.approve','expenses.delete',
    'analytics.view',
    'finance.view',
    'parts.view',
    'notifications.view',
  ],
}
export type PFIStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Sent'
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue'
export type PaymentMethod = 'Mobile Money' | 'Bank' | 'Lipa Number' | 'Cash'
export type CustomerType = 'Individual' | 'Corporate'

export interface Customer {
  id: string
  name: string
  phone: string
  whatsapp?: string             // WhatsApp number (if different from phone)
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

// ─── Time Tracking ───────────────────────────────────────────────────────────
export interface StatusTimelineEntry {
  status: JobCardStatus
  enteredAt: string          // ISO timestamp — when job entered this status
  exitedAt?: string          // ISO timestamp — when job left this status
  durationMins?: number      // working minutes spent in this status (8am–6pm Mon–Sun)
  technician?: string        // technician assigned during this status
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
  mileageIn?: number           // odometer reading at intake (km)
  fuelLevel?: string           // fuel level at intake: 'Empty'|'1/4'|'1/2'|'3/4'|'Full'
  nextServiceMileage?: number  // calculated: mileageIn + lubricant mileageInterval
  nextServiceLubricant?: string // name of lubricant that triggered the next service calc
  technicianAssignedAt?: string // ISO timestamp — when a technician was first/last assigned
  statusTimeline?: StatusTimelineEntry[]  // per-status time tracking
  completedAt?: string         // ISO timestamp — when status reached COMPLETED
  totalTATMins?: number        // working minutes from RECEIVED → COMPLETED
  createdAt: string
  updatedAt: string
}

export interface PFI {
  id: string
  jobCardId: string
  labourCost: number
  partsCost: number
  discountType?: 'fixed' | 'percentage'  // type of discount applied
  discountValue?: number                  // amount (TZS) or percentage (0–100)
  discountAmount?: number                 // resolved discount in TZS (always)
  discountReason?: string                 // optional note e.g. "Loyal customer"
  totalEstimate: number                   // (labour + parts) − discount
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
  discountType?: 'fixed' | 'percentage'  // carried from PFI
  discountValue?: number                  // original entered value
  discountAmount?: number                 // resolved TZS discount
  discountReason?: string
  tax: number
  totalAmount: number                     // (labour + parts) − discount + tax
  status: InvoiceStatus
  issuedAt: string
  dueDate?: string        // ISO date string — payment due date
  paidAt?: string         // ISO timestamp when payment was received
  claimReference?: string
  pfiReference?: string
  paymentMethod?: PaymentMethod        // how the invoice was paid
  paymentReference?: string            // e.g. M-Pesa code, bank ref, etc.
  amountPaid?: number                  // total amount received so far (sum of all payments)
  payments?: {                         // ledger of individual payment transactions
    id: string                           // unique ID for edit/delete
    amount: number
    method: PaymentMethod
    reference?: string
    paidAt: string
  }[]
}

// A service (package / oil service / car wash / add-on) added to a job card
export type JobServiceCategory = 'Service Package' | 'Oil Service' | 'Car Wash' | 'Add-on'
export interface JobService {
  id: string
  jobCardId: string
  category: JobServiceCategory
  serviceId: string        // id of the source catalogue item
  serviceName: string      // display name
  description?: string
  quantity: number         // e.g. number of tyres for 'Per Tyre' add-ons
  unitCost: number
  totalCost: number
  notes?: string           // e.g. oil brand/tier for oil services
  lubricantId?: string     // id of the LubricantProduct used (for oil services)
}

export interface ServicePackage {
  id: string
  packageName: string
  description: string
  labourCost: number
  estimatedHours: number
  sellingPrice: number   // 0 = auto (labourCost + parts total)
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
  password?: string   // hashed/plain for demo; omitted from API responses
  lastLogin?: string
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
  stockQuantity: number      // units in stock
  batchNumber?: string       // system-generated on create (e.g. BAT-2026-0042)
  partSerialNumber?: string  // supplier-assigned serial / part number
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
  category: 'Diagnostic' | 'Inspection' | 'Tyres' | 'Alignment' | 'Other'
}

// ─── Lubricants Catalogue ─────────────────────────────────────────────────────
export type LubricantBrand = 'Toyota' | 'Total' | 'Castrol' | 'Shell' | 'Mobil' | 'Valvoline' | 'Other'
export type LubricantType  = 'Engine Oil' | 'Gear Oil' | 'Transmission Fluid' | 'Brake Fluid' | 'Power Steering Fluid' | 'Coolant' | 'Grease' | 'Other'

export interface LubricantProduct {
  id: string
  brand: LubricantBrand
  description: string          // e.g. "Toyota Synthetic 5W-30"
  viscosity: string            // e.g. "5W-30", "10W-40", "ATF"
  volume: string               // e.g. "1L", "4L", "5L", "20L"
  lubricantType: LubricantType
  buyingPrice: number
  sellingPrice: number
  margin: number
  stockQuantity: number        // litres / bottles in stock
  mileageInterval?: number     // km between services (Engine Oil & Transmission Oil only)
  batchNumber?: string         // system-generated on create (e.g. BAT-2026-0042)
  partSerialNumber?: string    // supplier-assigned serial / part number
}

// ─── Vendors ─────────────────────────────────────────────────────────────────
export type VendorStatus = 'Active' | 'Inactive'

export interface Vendor {
  id: string
  name: string
  phone: string
  email?: string
  tin?: string                  // Tax Identification Number
  vrn?: string                  // VAT Registration Number (optional)
  location?: string             // Physical address / area
  status: VendorStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'Parts & Materials'
  | 'Labour'
  | 'Subcontractor'
  | 'Equipment & Tools'
  | 'Utilities'
  | 'Rent & Facilities'
  | 'Marketing & Admin'
  | 'Transport & Delivery'
  | 'Miscellaneous'

export type ExpenseStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected'

export interface Expense {
  id: string
  jobCardId?: string          // optional – if linked to a specific job
  vendorId?: string           // linked registered vendor
  category: ExpenseCategory
  description: string
  amount: number
  vendor?: string             // supplier / payee name
  receiptRef?: string         // receipt or invoice number
  status: ExpenseStatus
  paymentMethod?: PaymentMethod  // how the expense was / will be paid
  paidBy?: string             // staff member who paid (kept for legacy)
  notes?: string
  date: string                // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}



export const customers: Customer[] = []

export const vehicles: Vehicle[] = []

export const jobCards: JobCard[] = []

export const pfis: PFI[] = []

export const partsConsumption: PartConsumption[] = []

export const invoices: Invoice[] = []

export const servicePackages: ServicePackage[] = [
  {
    id: 'sp1',
    packageName: 'Minor Service',
    description: 'Oil change, filter replacement and basic inspection. Ideal for regular maintenance intervals.',
    labourCost: 50000,
    estimatedHours: 2,
    sellingPrice: 0,
    parts: [
      { name: 'Engine Oil 5L', quantity: 1, unitCost: 35000 },
      { name: 'Oil Filter',    quantity: 1, unitCost: 15000 },
    ]
  },
  {
    id: 'sp2',
    packageName: 'Major Service',
    description: 'Full service including spark plugs, belts, all filters and fluids top-up. Comprehensive vehicle health check.',
    labourCost: 150000,
    estimatedHours: 6,
    sellingPrice: 0,
    parts: [
      { name: 'Engine Oil 5L',     quantity: 2, unitCost: 35000 },
      { name: 'Oil Filter',        quantity: 1, unitCost: 15000 },
      { name: 'Air Filter',        quantity: 1, unitCost: 20000 },
      { name: 'Spark Plugs (Set)', quantity: 1, unitCost: 40000 },
    ]
  },
  {
    id: 'sp3',
    packageName: 'Brake Service',
    description: 'Brake pad replacement, brake fluid flush and full disc/drum inspection. Restore stopping power and safety.',
    labourCost: 80000,
    estimatedHours: 3,
    sellingPrice: 0,
    parts: [
      { name: 'Brake Pads (Set)', quantity: 1, unitCost: 45000 },
      { name: 'Brake Fluid',      quantity: 1, unitCost: 12000 },
    ]
  },
  {
    id: 'sp4',
    packageName: 'Oil Change',
    description: 'Quick oil and filter change. In-and-out service with multi-point visual check.',
    labourCost: 25000,
    estimatedHours: 1,
    sellingPrice: 0,
    parts: [
      { name: 'Engine Oil 5L', quantity: 1, unitCost: 35000 },
      { name: 'Oil Filter',    quantity: 1, unitCost: 15000 },
    ]
  },
  {
    id: 'sp5',
    packageName: 'AC Service',
    description: 'Air conditioning regas, system pressure test, condenser clean and cabin filter replacement.',
    labourCost: 60000,
    estimatedHours: 2,
    sellingPrice: 0,
    parts: [
      { name: 'AC Refrigerant Gas', quantity: 1, unitCost: 35000 },
      { name: 'Cabin Air Filter',   quantity: 1, unitCost: 18000 },
    ]
  },
  {
    id: 'sp6',
    packageName: 'Suspension Check & Repair',
    description: 'Full suspension inspection, shock absorber assessment, ball joint and tie rod check. Report with recommendations.',
    labourCost: 70000,
    estimatedHours: 3,
    sellingPrice: 0,
    parts: []
  },
  {
    id: 'sp7',
    packageName: 'Electrical Diagnostic',
    description: 'Full electronic scan, fault code reading and clearing, battery and alternator load test.',
    labourCost: 45000,
    estimatedHours: 2,
    sellingPrice: 0,
    parts: []
  },
  {
    id: 'sp8',
    packageName: 'Tyre Rotation & Balancing',
    description: 'Rotate all four tyres, wheel balancing, tyre pressure adjustment and tread depth check.',
    labourCost: 30000,
    estimatedHours: 1,
    sellingPrice: 0,
    parts: []
  },
]

// Default admin user — always present so the Owner can first log in.
// Change email/password after first login via Users & Roles page.
export const users: User[] = [
  {
    id: 'u-default-admin',
    name: 'System Admin',
    email: 'admin@autofix.co.tz',
    role: 'Owner',
    active: true,
    password: 'Admin2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
]

// ─── Active Sessions (token → userId) ────────────────────────────────────────
export const sessions: Map<string, string> = new Map()

export const activityLog: ActivityLog[] = []

// ─── Lubricants Catalogue Inventory ──────────────────────────────────────────
export const lubricantProducts: LubricantProduct[] = [
  // ── Toyota Engine Oils ──────────────────────────────────────────────────────
  { id: 'lub-001', batchNumber: 'BAT-2026-0001', brand: 'Toyota', description: 'Toyota Genuine Motor Oil 5W-30',   viscosity: '5W-30',  volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 55000,  sellingPrice: 85000,  margin: 30000, stockQuantity: 40, mileageInterval: 10000 },
  { id: 'lub-002', batchNumber: 'BAT-2026-0002', brand: 'Toyota', description: 'Toyota Genuine Motor Oil 10W-30',  viscosity: '10W-30', volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 52000,  sellingPrice: 80000,  margin: 28000, stockQuantity: 30, mileageInterval: 10000 },
  { id: 'lub-003', batchNumber: 'BAT-2026-0003', brand: 'Toyota', description: 'Toyota Genuine Motor Oil 10W-40',  viscosity: '10W-40', volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 54000,  sellingPrice: 82000,  margin: 28000, stockQuantity: 25, mileageInterval: 10000 },
  { id: 'lub-004', batchNumber: 'BAT-2026-0004', brand: 'Toyota', description: 'Toyota ATF Type T-IV (Auto Trans)', viscosity: 'ATF',    volume: '1L',  lubricantType: 'Transmission Fluid', buyingPrice: 12000, sellingPrice: 20000, margin: 8000, stockQuantity: 48, mileageInterval: 40000 },
  { id: 'lub-005', batchNumber: 'BAT-2026-0005', brand: 'Toyota', description: 'Toyota Long Life Coolant',          viscosity: 'N/A',    volume: '2L',  lubricantType: 'Coolant',    buyingPrice: 18000,  sellingPrice: 28000,  margin: 10000, stockQuantity: 20 },
  // ── Total Engine Oils ───────────────────────────────────────────────────────
  { id: 'lub-006', batchNumber: 'BAT-2026-0006', brand: 'Total',  description: 'Total Quartz 9000 5W-40',           viscosity: '5W-40',  volume: '5L',  lubricantType: 'Engine Oil', buyingPrice: 68000,  sellingPrice: 98000,  margin: 30000, stockQuantity: 35, mileageInterval: 15000 },
  { id: 'lub-007', batchNumber: 'BAT-2026-0007', brand: 'Total',  description: 'Total Quartz 7000 10W-40',          viscosity: '10W-40', volume: '5L',  lubricantType: 'Engine Oil', buyingPrice: 58000,  sellingPrice: 88000,  margin: 30000, stockQuantity: 28, mileageInterval: 10000 },
  { id: 'lub-008', batchNumber: 'BAT-2026-0008', brand: 'Total',  description: 'Total Quartz 5000 15W-40',          viscosity: '15W-40', volume: '5L',  lubricantType: 'Engine Oil', buyingPrice: 48000,  sellingPrice: 72000,  margin: 24000, stockQuantity: 32, mileageInterval: 7500  },
  { id: 'lub-009', batchNumber: 'BAT-2026-0009', brand: 'Total',  description: 'Total Transmission ATF Dexron III', viscosity: 'ATF',    volume: '1L',  lubricantType: 'Transmission Fluid', buyingPrice: 10000, sellingPrice: 17000, margin: 7000, stockQuantity: 36, mileageInterval: 40000 },
  { id: 'lub-010', batchNumber: 'BAT-2026-0010', brand: 'Total',  description: 'Total Brake Fluid DOT 4',           viscosity: 'DOT 4',  volume: '500ml', lubricantType: 'Brake Fluid', buyingPrice: 8000,  sellingPrice: 14000,  margin: 6000,  stockQuantity: 24 },
  // ── Castrol Engine Oils ─────────────────────────────────────────────────────
  { id: 'lub-011', batchNumber: 'BAT-2026-0011', brand: 'Castrol', description: 'Castrol EDGE 5W-30',               viscosity: '5W-30',  volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 72000,  sellingPrice: 105000, margin: 33000, stockQuantity: 22, mileageInterval: 15000 },
  { id: 'lub-012', batchNumber: 'BAT-2026-0012', brand: 'Castrol', description: 'Castrol GTX 10W-40',               viscosity: '10W-40', volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 60000,  sellingPrice: 90000,  margin: 30000, stockQuantity: 18, mileageInterval: 10000 },
  { id: 'lub-013', batchNumber: 'BAT-2026-0013', brand: 'Castrol', description: 'Castrol GTX 15W-40',               viscosity: '15W-40', volume: '5L',  lubricantType: 'Engine Oil', buyingPrice: 55000,  sellingPrice: 80000,  margin: 25000, stockQuantity: 20, mileageInterval: 7500  },
  { id: 'lub-014', batchNumber: 'BAT-2026-0014', brand: 'Castrol', description: 'Castrol Power Steering Fluid',     viscosity: 'N/A',    volume: '1L',  lubricantType: 'Power Steering Fluid', buyingPrice: 9000, sellingPrice: 15000, margin: 6000, stockQuantity: 16 },
  // ── Shell ───────────────────────────────────────────────────────────────────
  { id: 'lub-015', batchNumber: 'BAT-2026-0015', brand: 'Shell',  description: 'Shell Helix Ultra 5W-40',           viscosity: '5W-40',  volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 74000,  sellingPrice: 108000, margin: 34000, stockQuantity: 15, mileageInterval: 15000 },
  { id: 'lub-016', batchNumber: 'BAT-2026-0016', brand: 'Shell',  description: 'Shell Helix HX7 10W-40',            viscosity: '10W-40', volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 62000,  sellingPrice: 92000,  margin: 30000, stockQuantity: 12, mileageInterval: 10000 },
  { id: 'lub-017', batchNumber: 'BAT-2026-0017', brand: 'Shell',  description: 'Shell Spirax Gear Oil 80W-90',      viscosity: '80W-90', volume: '1L',  lubricantType: 'Gear Oil',   buyingPrice: 11000,  sellingPrice: 18000,  margin: 7000,  stockQuantity: 20 },
  // ── Mobil ───────────────────────────────────────────────────────────────────
  { id: 'lub-018', batchNumber: 'BAT-2026-0018', brand: 'Mobil',  description: 'Mobil 1 5W-30 Full Synthetic',      viscosity: '5W-30',  volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 78000,  sellingPrice: 115000, margin: 37000, stockQuantity: 10, mileageInterval: 15000 },
  { id: 'lub-019', batchNumber: 'BAT-2026-0019', brand: 'Mobil',  description: 'Mobil Super 10W-40',                viscosity: '10W-40', volume: '4L',  lubricantType: 'Engine Oil', buyingPrice: 60000,  sellingPrice: 90000,  margin: 30000, stockQuantity: 14, mileageInterval: 10000 },
]

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
  { id: 'af1',  batchNumber: 'BAT-2026-0020', category: 'Air Filter', description: 'Air Filter IST/VITZ/PROBOX/SIENTA/PORTE',                           compatibleModels: 'IST, VITZ, PROBOX, SIENTA, PORTE',                              buyingPrice: 7000,  sellingPrice: 25000, margin: 18000, stockQuantity: 25 },
  { id: 'af2',  batchNumber: 'BAT-2026-0021', category: 'Air Filter', description: 'Air Filter COROLLA NEW/SPACIO/RUN X/ALLEX/ALLION/PREMIO',           compatibleModels: 'COROLLA, SPACIO, RUN X, ALLEX, ALLION, PREMIO',                  buyingPrice: 8000,  sellingPrice: 25000, margin: 17000, stockQuantity: 8 },
  { id: 'af3',  batchNumber: 'BAT-2026-0022', category: 'Air Filter', description: 'Air Filter HARRIER CHOGO/KLUGER/MAZDA VERISA',                      compatibleModels: 'HARRIER, KLUGER, MAZDA VERISA',                                  buyingPrice: 9000,  sellingPrice: 30000, margin: 21000, stockQuantity: 5 },
  { id: 'af4',  batchNumber: 'BAT-2026-0023', category: 'Air Filter', description: 'Air Filter ALPHARD',                                                 compatibleModels: 'ALPHARD',                                                         buyingPrice: 9000,  sellingPrice: 25000, margin: 16000, stockQuantity: 28 },
  { id: 'af5',  batchNumber: 'BAT-2026-0024', category: 'Air Filter', description: 'Air Filter PREMIO NEW/ANACONDA/ALLION NEW',                          compatibleModels: 'PREMIO NEW, ANACONDA, ALLION NEW',                               buyingPrice: 9000,  sellingPrice: 30000, margin: 21000, stockQuantity: 13 },
  { id: 'af6',  batchNumber: 'BAT-2026-0025', category: 'Air Filter', description: 'Air Filter RACTIS/VITZ NEW',                                         compatibleModels: 'RACTIS, VITZ NEW',                                               buyingPrice: 7000,  sellingPrice: 25000, margin: 18000, stockQuantity: 12 },
  { id: 'af7',  batchNumber: 'BAT-2026-0026', category: 'Air Filter', description: 'Air Filter MARK X/CROWN',                                            compatibleModels: 'MARK X, CROWN',                                                  buyingPrice: 9500,  sellingPrice: 30000, margin: 20500, stockQuantity: 12 },
  { id: 'af8',  batchNumber: 'BAT-2026-0027', category: 'Air Filter', description: 'Air Filter RAV 4 MISS TZ/VANGUARD',                                  compatibleModels: 'RAV4, VANGUARD',                                                 buyingPrice: 11000, sellingPrice: 35000, margin: 24000, stockQuantity: 9 },
  { id: 'af9',  batchNumber: 'BAT-2026-0028', category: 'Air Filter', description: 'Air Filter MAZDA CX5',                                               compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 13000, sellingPrice: 35000, margin: 22000, stockQuantity: 28 },
  { id: 'af10', batchNumber: 'BAT-2026-0029', category: 'Air Filter', description: 'Air Filter SUBARU',                                                  compatibleModels: 'SUBARU',                                                         buyingPrice: 10000, sellingPrice: 30000, margin: 20000, stockQuantity: 8 },
  { id: 'af11', batchNumber: 'BAT-2026-0030', category: 'Air Filter', description: 'Air Filter HILUX REVO/FORTUNER',                                     compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 20000, sellingPrice: 50000, margin: 30000, stockQuantity: 26 },
  { id: 'af12', batchNumber: 'BAT-2026-0031', category: 'Air Filter', description: 'Air Filter VDJ200',                                                  compatibleModels: 'VDJ200',                                                         buyingPrice: 20000, sellingPrice: 50000, margin: 30000, stockQuantity: 28 },
  { id: 'af13', batchNumber: 'BAT-2026-0032', category: 'Air Filter', description: 'Air Filter PRADO 150',                                               compatibleModels: 'PRADO 150',                                                      buyingPrice: 20000, sellingPrice: 50000, margin: 30000, stockQuantity: 22 },
  { id: 'af14', batchNumber: 'BAT-2026-0033', category: 'Air Filter', description: 'Air Filter BENZ',                                                    compatibleModels: 'MERCEDES-BENZ',                                                  buyingPrice: 30000, sellingPrice: 55000, margin: 25000, stockQuantity: 7 },
  { id: 'af15', batchNumber: 'BAT-2026-0034', category: 'Air Filter', description: 'Air Filter BMW',                                                     compatibleModels: 'BMW',                                                            buyingPrice: 30000, sellingPrice: 55000, margin: 25000, stockQuantity: 23 },
  { id: 'af16', batchNumber: 'BAT-2026-0035', category: 'Air Filter', description: 'Air Filter LANDROVER DISCOVERY 4',                                   compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 30000, sellingPrice: 60000, margin: 30000, stockQuantity: 18 },
  { id: 'af17', batchNumber: 'BAT-2026-0036', category: 'Air Filter', description: 'Air Filter VW',                                                      compatibleModels: 'VOLKSWAGEN',                                                     buyingPrice: 30000, sellingPrice: 60000, margin: 30000, stockQuantity: 6 },
  { id: 'af18', batchNumber: 'BAT-2026-0037', category: 'Air Filter', description: 'Air Filter FORD RANGER T6/RAPTOR/EVEREST',                           compatibleModels: 'FORD RANGER T6, RAPTOR, EVEREST',                                buyingPrice: 30000, sellingPrice: 70000, margin: 40000, stockQuantity: 5 },
  // AC Filters
  { id: 'ac1',  batchNumber: 'BAT-2026-0038', category: 'AC Filter',  description: 'AC Filter IST/SIENTA/PORTE/RUN X/ALLEX/SPACIO NEW',                  compatibleModels: 'IST, SIENTA, PORTE, RUN X, ALLEX, SPACIO NEW',                  buyingPrice: 6000,  sellingPrice: 20000, margin: 14000, stockQuantity: 7 },
  { id: 'ac2',  batchNumber: 'BAT-2026-0039', category: 'AC Filter',  description: 'AC Filter HARRIER CHOGO/KLUGER',                                     compatibleModels: 'HARRIER, KLUGER',                                                buyingPrice: 7000,  sellingPrice: 25000, margin: 18000, stockQuantity: 11 },
  { id: 'ac3',  batchNumber: 'BAT-2026-0040', category: 'AC Filter',  description: 'AC Filter ALPHARD/IPSUM',                                            compatibleModels: 'ALPHARD, IPSUM',                                                 buyingPrice: 7000,  sellingPrice: 25000, margin: 18000, stockQuantity: 12 },
  { id: 'ac4',  batchNumber: 'BAT-2026-0041', category: 'AC Filter',  description: 'AC Filter VDJ200/PRADO 120-150/PREMIO NEW/ALLION NEW/ANACONDA/WISH', compatibleModels: 'VDJ200, PRADO 120/150, PREMIO NEW, ALLION NEW, ANACONDA, WISH',  buyingPrice: 7000,  sellingPrice: 25000, margin: 18000, stockQuantity: 21 },
  { id: 'ac5',  batchNumber: 'BAT-2026-0042', category: 'AC Filter',  description: 'AC Filter FORTUNER/HILUX REVO',                                      compatibleModels: 'FORTUNER, HILUX REVO',                                           buyingPrice: 12000, sellingPrice: 30000, margin: 18000, stockQuantity: 24 },
  { id: 'ac6',  batchNumber: 'BAT-2026-0043', category: 'AC Filter',  description: 'AC Filter BENZ',                                                     compatibleModels: 'MERCEDES-BENZ',                                                  buyingPrice: 20000, sellingPrice: 40000, margin: 20000, stockQuantity: 5 },
  { id: 'ac7',  batchNumber: 'BAT-2026-0044', category: 'AC Filter',  description: 'AC Filter BMW',                                                      compatibleModels: 'BMW',                                                            buyingPrice: 20000, sellingPrice: 40000, margin: 20000, stockQuantity: 22 },
  { id: 'ac8',  batchNumber: 'BAT-2026-0045', category: 'AC Filter',  description: 'AC Filter LANDROVER DISCOVERY 4',                                    compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 20000, sellingPrice: 40000, margin: 20000, stockQuantity: 11 },
  { id: 'ac9',  batchNumber: 'BAT-2026-0046', category: 'AC Filter',  description: 'AC Filter FORD RANGER RT/EVEREST',                                   compatibleModels: 'FORD RANGER, EVEREST',                                           buyingPrice: 18000, sellingPrice: 35000, margin: 17000, stockQuantity: 27 },
  { id: 'ac10', batchNumber: 'BAT-2026-0047', category: 'AC Filter',  description: 'AC Filter SUBARU',                                                   compatibleModels: 'SUBARU',                                                         buyingPrice: 7000,  sellingPrice: 20000, margin: 13000, stockQuantity: 25 },
  { id: 'ac11', batchNumber: 'BAT-2026-0048', category: 'AC Filter',  description: 'AC Filter VW TOUREG',                                                compatibleModels: 'VW TOUAREG',                                                     buyingPrice: 20000, sellingPrice: 40000, margin: 20000, stockQuantity: 27 },
  // Spark Plugs
  { id: 'sp1',  batchNumber: 'BAT-2026-0049', category: 'Spark Plugs',description: 'Spark Plugs IST/RUN X/ALLEX/SPACIO NEW/PREMIO',                     compatibleModels: 'IST, RUN X, ALLEX, SPACIO NEW, PREMIO',                         buyingPrice: 4000,  sellingPrice: 15000, margin: 11000, stockQuantity: 22 },
  { id: 'sp2',  batchNumber: 'BAT-2026-0050', category: 'Spark Plugs',description: 'Spark Plugs HARRIER CHOGO/KLUGER/ALPHARD/VANGUARD',                  compatibleModels: 'HARRIER, KLUGER, ALPHARD, VANGUARD',                             buyingPrice: 5000,  sellingPrice: 25000, margin: 20000, stockQuantity: 18 },
  { id: 'sp3',  batchNumber: 'BAT-2026-0051', category: 'Spark Plugs',description: 'Spark Plugs ANACONDA/WISH NEW',                                      compatibleModels: 'ANACONDA, WISH NEW',                                             buyingPrice: 5000,  sellingPrice: 25000, margin: 20000, stockQuantity: 12 },
  { id: 'sp4',  batchNumber: 'BAT-2026-0052', category: 'Spark Plugs',description: 'Spark Plugs RACTIS/VITZ NEW',                                        compatibleModels: 'RACTIS, VITZ NEW',                                               buyingPrice: 5000,  sellingPrice: 25000, margin: 20000, stockQuantity: 19 },
  // General Accessories
  { id: 'acc1', batchNumber: 'BAT-2026-0053', category: 'Accessory',  description: 'Coolant',                                                            compatibleModels: 'Universal',                                                      buyingPrice: 5800,  sellingPrice: 15000, margin: 9200, stockQuantity: 23 },
  { id: 'acc2', batchNumber: 'BAT-2026-0054', category: 'Accessory',  description: 'Wiper Blades',                                                       compatibleModels: 'Universal',                                                      buyingPrice: 7500,  sellingPrice: 15000, margin: 7500, stockQuantity: 13 },
  { id: 'acc3', batchNumber: 'BAT-2026-0055', category: 'Accessory',  description: 'Fire Extinguisher',                                                  compatibleModels: 'Universal',                                                      buyingPrice: 12000, sellingPrice: 25000, margin: 13000, stockQuantity: 30 },
  { id: 'acc4', batchNumber: 'BAT-2026-0056', category: 'Accessory',  description: 'Air Freshener (Standard)',                                            compatibleModels: 'Universal',                                                      buyingPrice: 2000,  sellingPrice: 5000,  margin: 3000, stockQuantity: 5 },
  { id: 'acc5', batchNumber: 'BAT-2026-0057', category: 'Accessory',  description: 'Air Freshener (Premium)',                                             compatibleModels: 'Universal',                                                      buyingPrice: 12000, sellingPrice: 17000, margin: 5000, stockQuantity: 29 },
  { id: 'acc6', batchNumber: 'BAT-2026-0058', category: 'Accessory',  description: 'Bulbs',                                                              compatibleModels: 'Universal',                                                      buyingPrice: 850,   sellingPrice: 3000,  margin: 2150, stockQuantity: 30 },
  { id: 'acc7', batchNumber: 'BAT-2026-0059', category: 'Accessory',  description: 'Warning Triangle',                                                   compatibleModels: 'Universal',                                                      buyingPrice: 7000,  sellingPrice: 15000, margin: 8000, stockQuantity: 10 },
  // Oil Filters
  { id: 'of1',  batchNumber: 'BAT-2026-0060', category: 'Oil Filter', description: 'Oil Filter IST/SPACIO/RUN X/RACTIS/WISH',                            compatibleModels: 'IST, SPACIO, RUN X, RACTIS, WISH',                              buyingPrice: 4500,  sellingPrice: 15000, margin: 10500, stockQuantity: 27 },
  { id: 'of2',  batchNumber: 'BAT-2026-0061', category: 'Oil Filter', description: 'Oil Filter HARRIER/KLUGER/ALPHARD/NOAH VOXY',                        compatibleModels: 'HARRIER, KLUGER, ALPHARD, NOAH, VOXY',                          buyingPrice: 4500,  sellingPrice: 15000, margin: 10500, stockQuantity: 18 },
  { id: 'of3',  batchNumber: 'BAT-2026-0062', category: 'Oil Filter', description: 'Oil Filter MARK X/CROWN',                                            compatibleModels: 'MARK X, CROWN',                                                  buyingPrice: 6000,  sellingPrice: 20000, margin: 14000, stockQuantity: 15 },
  { id: 'of4',  batchNumber: 'BAT-2026-0063', category: 'Oil Filter', description: 'Oil Filter PRADO 120/150',                                           compatibleModels: 'PRADO 120, PRADO 150',                                           buyingPrice: 6000,  sellingPrice: 20000, margin: 14000, stockQuantity: 13 },
  { id: 'of5',  batchNumber: 'BAT-2026-0064', category: 'Oil Filter', description: 'Oil Filter HILUX REVO/FORTUNER',                                     compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 6000,  sellingPrice: 20000, margin: 14000, stockQuantity: 9 },
  { id: 'of6',  batchNumber: 'BAT-2026-0065', category: 'Oil Filter', description: 'Oil Filter LANDROVER DISCOVERY 4',                                   compatibleModels: 'LAND ROVER DISCOVERY 4',                                         buyingPrice: 15000, sellingPrice: 30000, margin: 15000, stockQuantity: 11 },
  { id: 'of7',  batchNumber: 'BAT-2026-0066', category: 'Oil Filter', description: 'Oil Filter MAZDA CX5',                                               compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 15000, sellingPrice: 30000, margin: 15000, stockQuantity: 29 },
  { id: 'of8',  batchNumber: 'BAT-2026-0067', category: 'Oil Filter', description: 'Oil Filter VDJ200',                                                  compatibleModels: 'VDJ200',                                                         buyingPrice: 6000,  sellingPrice: 20000, margin: 14000, stockQuantity: 15 },
  { id: 'of9',  batchNumber: 'BAT-2026-0068', category: 'Oil Filter', description: 'Oil Filter LANDCRUISER/COASTER 1HZ',                                 compatibleModels: 'LAND CRUISER, COASTER 1HZ',                                      buyingPrice: 13000, sellingPrice: 30000, margin: 17000, stockQuantity: 8 },
  { id: 'of10', batchNumber: 'BAT-2026-0069', category: 'Oil Filter', description: 'Oil Filter SUBARU',                                                  compatibleModels: 'SUBARU',                                                         buyingPrice: 4500,  sellingPrice: 15000, margin: 10500, stockQuantity: 7 },
  { id: 'of11', batchNumber: 'BAT-2026-0070', category: 'Oil Filter', description: 'Diesel Filter VDJ200',                                               compatibleModels: 'VDJ200',                                                         buyingPrice: 10000, sellingPrice: 40000, margin: 30000, stockQuantity: 17 },
  { id: 'of12', batchNumber: 'BAT-2026-0071', category: 'Oil Filter', description: 'Diesel Filter PRADO 120/150',                                        compatibleModels: 'PRADO 120, PRADO 150',                                           buyingPrice: 15000, sellingPrice: 40000, margin: 25000, stockQuantity: 8 },
  { id: 'of13', batchNumber: 'BAT-2026-0072', category: 'Oil Filter', description: 'Diesel Filter LANDROVER',                                            compatibleModels: 'LAND ROVER',                                                     buyingPrice: 25000, sellingPrice: 60000, margin: 35000, stockQuantity: 16 },
  { id: 'of14', batchNumber: 'BAT-2026-0073', category: 'Oil Filter', description: 'Diesel Filter MAZDA CX5',                                            compatibleModels: 'MAZDA CX5',                                                      buyingPrice: 18000, sellingPrice: 35000, margin: 17000, stockQuantity: 16 },
  { id: 'of15', batchNumber: 'BAT-2026-0074', category: 'Oil Filter', description: 'Diesel Filter 1HZ',                                                  compatibleModels: 'LAND CRUISER 1HZ',                                               buyingPrice: 15000, sellingPrice: 40000, margin: 25000, stockQuantity: 24 },
  { id: 'of16', batchNumber: 'BAT-2026-0075', category: 'Oil Filter', description: 'Diesel Filter HILUX REVO/FORTUNER',                                  compatibleModels: 'HILUX REVO, FORTUNER',                                           buyingPrice: 15000, sellingPrice: 40000, margin: 25000, stockQuantity: 13 },
  { id: 'of17', batchNumber: 'BAT-2026-0076', category: 'Oil Filter', description: 'Diesel Filter FORD RANGER',                                          compatibleModels: 'FORD RANGER',                                                    buyingPrice: 35000, sellingPrice: 70000, margin: 35000, stockQuantity: 30 },
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

export const appointments: Appointment[] = []

// ─── Job Services (packages / oil / car wash / add-ons added to a job) ────────
export const jobServices: JobService[] = []

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const vendors: Vendor[] = []

// ─── Expenses ───────────────────────────────────────────────────────────────
export const expenses: Expense[] = []

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'job_created'
  | 'job_status'
  | 'job_completed'
  | 'pfi_created'
  | 'pfi_sent'
  | 'pfi_approved'
  | 'pfi_rejected'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'appointment_created'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'expense_created'
  | 'expense_approved'
  | 'low_stock'
  | 'parts_added'
  | 'service_added'

export type NotificationPriority = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  read: boolean
  // optional links
  jobCardId?: string
  jobCardNumber?: string
  entityId?: string        // pfi id, invoice id, appointment id, expense id, part id
  entityType?: string      // 'pfi' | 'invoice' | 'appointment' | 'expense' | 'part'
  createdAt: string
}

export const notifications: Notification[] = []

// ─── Persistence — load saved data on startup ─────────────────────────────────
// This must be the last statement in the module so all arrays are declared first.
import { load as _loadPersistedData } from './persist.js'
_loadPersistedData()
