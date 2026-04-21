// In-memory data store for GMS demo
// In production, this would connect to Cloudflare D1 or external DB

export type CustomerStatus = 'active' | 'inactive'
export type JobCardStatus =
  // ── New Pipeline (Phase 1+) ──────────────────────────────────────────────
  | 'DRAFT'                    // created, awaiting admin/manager approval
  | 'PENDING_APPROVAL'         // submitted for approval
  | 'APPROVED'                 // approved by Admin/Manager — ready for pre-handover
  | 'REJECTED'                 // rejected, returned to creator for correction
  | 'PRE_HANDOVER'             // Service Advisor performing preliminary check
  | 'HANDED_OVER'              // customer signed, gate pass IN issued
  | 'INSPECTION'               // under inspection (simple or full check-up)
  | 'PFI_PENDING'              // PFI generated, awaiting Admin/Manager approval
  | 'PFI_APPROVED'             // Admin approved PFI, awaiting customer cost approval
  | 'CUSTOMER_APPROVAL'        // awaiting customer signature on cost
  | 'PARTS_RELEASED'           // customer approved, parts/lubricants deducted
  | 'WORK_IN_PROGRESS'         // active repair/service work
  | 'FINISHED'                 // technician & SA signed off
  | 'QUALITY_CONTROL'          // QC review by Manager
  | 'CUSTOMER_SIGNOFF'         // customer final inspection & signature
  | 'INVOICED'                 // invoice generated
  | 'PAID'                     // payment received
  | 'CLOSED'                   // out-gate pass issued, vehicle released
  // ── Legacy Statuses (kept for historical records) ────────────────────────
  | 'RECEIVED'
  | 'PFI_PREPARATION'
  | 'AWAITING_INSURER_APPROVAL'
  | 'REPAIR_IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'RELEASED'

export type JobCategory = 'Insurance' | 'Private'
export type UserRole =
  | 'Admin'
  | 'Workshop Controller'
  | 'Service Advisor'
  | 'Technician'
  | 'Finance'
  | 'Quality Control'
  | 'Sales'

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
  | 'jobcards.approve'           // approve/reject job cards (Admin + Workshop Controller)
  | 'jobcards.preliminary_check' // pre-handover check (Service Advisor)
  | 'jobcards.inspection'        // full vehicle inspection (Technician + QC)
  | 'jobcards.qc'                // quality-control sign-off (Quality Control)
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
  // Sales
  | 'sales.view_own'          // see own sales dashboard & history
  | 'sales.manage_targets'    // Admin/WC: set targets for reps
  | 'sales.view_leaderboard'  // Admin/WC: view all-rep performance
  // Staff Performance
  | 'staff_performance.view'  // Admin/WC: see all; SA/Technician: see own

// ─── RBAC: Role → Permissions Map ─────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  // Full access to all modules, settings, users, reports and approvals.
  Admin: [
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit','jobcards.delete',
    'jobcards.change_status','jobcards.assign_technician','jobcards.approve',
    'jobcards.preliminary_check','jobcards.inspection','jobcards.qc',
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
    'sales.view_own','sales.manage_targets','sales.view_leaderboard',
    'staff_performance.view',
  ],

  // ── 2. Workshop Controller ────────────────────────────────────────────────
  // Manages all workshop operations: approves jobs, assigns technicians,
  // oversees workflow, manages parts & catalogue. Full ops access, no finance.
  'Workshop Controller': [
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit',
    'jobcards.change_status','jobcards.assign_technician','jobcards.approve',
    'jobcards.preliminary_check','jobcards.inspection','jobcards.qc',
    'appointments.view','appointments.create','appointments.edit','appointments.delete','appointments.convert',
    'customers.view','customers.create','customers.edit',
    'vehicles.view','vehicles.create','vehicles.edit',
    'pfis.view','pfis.create','pfis.approve','pfis.send',
    'invoices.view',
    'expenses.view','expenses.create',
    'packages.view','packages.manage',
    'oil_services.view',
    'parts.view','parts.manage','parts.restock',
    'carwash.view','carwash.manage',
    'addons.view','addons.manage',
    'analytics.view',
    'users.view',
    'notifications.view',
    'settings.view',
    'sales.view_own','sales.manage_targets','sales.view_leaderboard',
    'staff_performance.view',
  ],

  // ── 3. Service Advisor ────────────────────────────────────────────────────
  // Customer-facing: creates job cards, manages appointments, does pre-handover
  // preliminary check, creates PFIs. Cannot approve jobs or access finance.
  'Service Advisor': [
    'dashboard.view',
    'jobcards.view','jobcards.create','jobcards.edit',
    'jobcards.change_status','jobcards.preliminary_check',
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
    'staff_performance.view',
  ],

  // ── 4. Technician ─────────────────────────────────────────────────────────
  // Workshop floor: views assigned jobs, updates job status, performs
  // inspections, records parts used. No customer financials or admin access.
  Technician: [
    'dashboard.view',
    'jobcards.view','jobcards.change_status','jobcards.inspection',
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
    'staff_performance.view',
  ],

  // ── 5. Finance ────────────────────────────────────────────────────────────
  // Manages all money flows: invoices, expenses, payments, financial reports.
  // Cannot create job cards or modify workshop operations.
  Finance: [
    'dashboard.view',
    'jobcards.view',
    'customers.view',
    'vehicles.view',
    'pfis.view','pfis.approve',
    'invoices.view','invoices.create','invoices.mark_paid',
    'expenses.view','expenses.create','expenses.approve','expenses.delete',
    'analytics.view',
    'finance.view',
    'parts.view',
    'notifications.view',
  ],

  // ── 6. Quality Control ────────────────────────────────────────────────────
  // Final inspection before vehicle release: performs QC sign-off,
  // views job cards and parts. Read-only on everything else.
  'Quality Control': [
    'dashboard.view',
    'jobcards.view','jobcards.change_status','jobcards.inspection','jobcards.qc',
    'appointments.view',
    'customers.view',
    'vehicles.view',
    'pfis.view',
    'parts.view',
    'oil_services.view',
    'packages.view',
    'notifications.view',
  ],

  // ── 7. Sales ──────────────────────────────────────────────────────────────
  // Customer acquisition & product sales: service packages, car wash,
  // subscriptions. Cannot access finance, parts, or admin settings.
  // Job cards auto-created from sales go through normal approval workflow.
  Sales: [
    'dashboard.view',
    'customers.view','customers.create','customers.edit',
    'vehicles.view','vehicles.create','vehicles.edit',
    'jobcards.view',
    'packages.view',
    'carwash.view',
    'addons.view',
    'notifications.view',
    'sales.view_own',
    'sales.sell_package',
    'sales.sell_carwash',
    'sales.sell_subscription',
    'sales.view_commission',
    'sales.create_customer',
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
  salesRepId?: string           // Sales rep who brought in this customer
  salesRepName?: string
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
  mileageOut?: number          // odometer reading at handover (km) — for service card
  fuelLevel?: string           // fuel level at intake: 'Empty'|'1/4'|'1/2'|'3/4'|'Full'
  nextServiceMileage?: number  // calculated: mileageIn + lubricant mileageInterval
  nextServiceLubricant?: string // name of lubricant that triggered the next service calc
  serviceCardIssuedAt?: string  // ISO timestamp when a service card was last generated
  technicianAssignedAt?: string // ISO timestamp — when a technician was first/last assigned
  statusTimeline?: StatusTimelineEntry[]  // per-status time tracking
  completedAt?: string         // ISO timestamp — when status reached COMPLETED
  totalTATMins?: number        // working minutes from RECEIVED → COMPLETED
  reopenCount?: number         // how many times this job has been reopened (0 = never)
  reopenedAt?: string          // ISO timestamp of the most recent reopen
  reopenReason?: string        // reason given for the most recent reopen
  // ── Phase 1: Approval Workflow ──────────────────────────────────────────
  approvalNotes?: string        // notes added by approver
  approvedBy?: string           // userId of approver
  approvedByName?: string       // name of approver
  approvedAt?: string           // ISO timestamp of approval
  rejectedBy?: string           // userId of person who rejected
  rejectedByName?: string       // name of rejector
  rejectedAt?: string           // ISO timestamp of rejection
  rejectionReason?: string      // reason for rejection
  cancelledBy?: string          // userId of person who cancelled
  cancelledByName?: string
  cancelledAt?: string
  cancelReason?: string
  // ── Phase 2: Preliminary Check & Signature ─────────────────────────────
  preliminaryCheck?: {
    // PDF items (Present / Absent)
    spareTyre: 'Present' | 'Absent'
    jack: 'Present' | 'Absent'
    wheelSpanner: 'Present' | 'Absent'
    triangle: 'Present' | 'Absent'
    toolbox: 'Present' | 'Absent'
    fireExtinguisher: 'Present' | 'Absent'
    // Suggested additional items
    fuelLevelCheck: string        // e.g. "Empty", "1/4", "1/2", "3/4", "Full"
    mileageAtHandover: number     // odometer reading at handover
    existingDamage: string        // free text
    vehicleCondition: string      // e.g. "Good", "Fair", "Poor"
    // Valuable items (up to 5 free-text lines from PDF)
    valuables: string[]
    // General notes
    notes: string
    // Signatures
    serviceAdvisorName: string
    serviceAdvisorSignature: string   // base64 PNG
    customerName: string
    customerSignature: string         // base64 PNG
    completedAt: string               // ISO timestamp
    completedBy: string               // userId
    completedByName: string
  }
  gatePassInId?: string           // id of the auto-generated entry Gate Pass
  // ── Phase 3: Post-Handover workflow data ───────────────────────────────────
  inspectionData?: {
    // Simple Check Inspection items (from PDF)
    engineOilTopup:   string; airFilter:      string; acFilter:       string
    sparkPlugs:       string; bulbs:          string; tiresCondition: string
    brakeConditions:  string; leakages:       string; coolantLevel:   string
    wiperBlades:      string; battery:        string; fireExtinguisher: string
    brakeFluidLevel:  string; triangle:       string; hydraulic:      string
    airFreshener:     string
    // Recommendations
    recommendedService: string
    // Sign-offs
    technicianName:   string; technicianSignature: string
    serviceAdvisorName: string; serviceAdvisorSignature: string
    customerApproval: string  // "Approved" | "Declined"
    notes: string
    completedAt: string; completedBy: string; completedByName: string
  }
  customerApprovalData?: {
    approvedBy:       string       // customer name
    approvalSignature: string      // base64 PNG
    approvalNotes:    string
    approvedAt:       string
    approvedByUserId: string
    approvedByUserName: string
    totalApproved:    number       // TZS amount customer agreed to
  }
  partsReleasedAt?: string        // ISO when parts were released
  partsReleasedBy?: string
  partsReleasedByName?: string
  workStartedAt?: string          // when WORK_IN_PROGRESS began
  workStartedBy?: string
  workStartedByName?: string
  workFinishedAt?: string         // when FINISHED was set
  workFinishedBy?: string
  workFinishedByName?: string
  qcData?: {
    // Quality Control Form items (from PDF)
    engineOilLevel:   string; fuelLevel:      string
    boltsTightened:   string; leakages:       string
    cleanWork:        string; allWorksCompleted: string
    notes:            string
    // Sign-off
    technicianName:   string; technicianSignature: string
    qcOfficerName:    string; qcOfficerSignature:  string
    completedAt:      string; completedBy: string; completedByName: string
  }
  customerSignoffData?: {
    customerName:     string
    customerSignature: string     // base64 PNG
    signoffNotes:     string
    satisfactionRating: number    // 1-5
    signedAt:         string
    witnessName:      string
    witnessSignature: string      // base64 PNG
    recordedBy:       string
    recordedByName:   string
  }
  // ── Sales attribution ───────────────────────────────────────────────────
  salesRepId?: string           // Sales rep who created the sale that led to this job
  salesRepName?: string
  isSalesJob?: boolean          // true = originated from a Sales rep sale
  // ── Technician referral ─────────────────────────────────────────────────
  referredById?: string         // Technician who referred the customer (optional)
  referredByName?: string
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
  tax: number                             // 18% VAT on totalEstimate
  totalAmount: number                     // totalEstimate + tax
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
  autoExpenseId?: string   // id of the auto-generated buying-cost expense
  batchNumber?: string        // copied from catalogue item at time of use (e.g. BAT-2026-0042)
  partSerialNumber?: string   // supplier-assigned part/serial number copied from catalogue
  partId?: string             // id of the source catalogue item (for traceability)
  addedById?: string          // user who added this part (for SA upsell KPI)
  addedByName?: string
}

export interface Invoice {
  id: string
  jobCardId: string
  invoiceNumber: string
  invoiceType?: 'standard' | 'subscription'   // subscription invoices get SUB-YYYY-NNN numbering
  subscriptionId?: string                      // links to CustomerSubscription when invoiceType='subscription'
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
  autoExpenseId?: string   // id of the auto-generated buying-cost expense
  batchNumber?: string     // batch number copied from lubricant/catalogue item at time of use
  addedById?: string       // user who added this service (for SA upsell KPI — Add-ons only)
  addedByName?: string
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
  userRole?: string
  timestamp: string
}

// ─── Sales Targets ───────────────────────────────────────────────────────────
export type TargetPeriod = 'monthly' | 'quarterly' | 'annual'

export interface SalesTarget {
  id: string
  salesRepId: string
  salesRepName: string
  period: TargetPeriod
  periodKey: string        // e.g. '2026-04' (monthly) | '2026-Q2' (quarterly) | '2026' (annual)
  targetAmount: number     // TZS revenue target
  commissionRate: number   // % of revenue earned as commission (e.g. 5 = 5%)
  createdAt: string
  updatedAt: string
}

// ─── Sales Commissions ────────────────────────────────────────────────────────
export interface SalesCommission {
  id: string
  salesRepId: string
  salesRepName: string
  invoiceId: string
  jobCardId: string
  jobCardNumber: string
  customerName: string
  saleAmount: number        // invoice totalAmount at time of payment
  commissionRate: number    // % applied
  commissionEarned: number  // saleAmount * commissionRate / 100
  periodKey: string         // 'YYYY-MM' of the payment date
  paidAt: string            // ISO timestamp of invoice payment
  createdAt: string
}

// ─── Staff Performance Types ─────────────────────────────────────────────────

/** Monthly upsell revenue target for a Service Advisor */
export interface SAUpsellTarget {
  id: string
  advisorId: string
  advisorName: string
  periodKey: string       // 'YYYY-MM'
  targetAmount: number    // TZS upsell revenue target
  commissionRate: number  // % of upsell revenue earned as commission (e.g. 5 = 5%)
  createdAt: string
  updatedAt: string
}

/** Commission record for a single upsell item (part or add-on) by a Service Advisor */
export interface SAUpsellCommission {
  id: string
  advisorId: string
  advisorName: string
  jobCardId: string
  jobCardNumber: string
  customerName: string
  itemType: 'part' | 'addon'  // PartConsumption or Add-on JobService
  itemName: string
  saleAmount: number           // totalCost of the item at invoice payment time
  commissionRate: number       // % applied from the SA's target for that month
  commissionEarned: number     // saleAmount * commissionRate / 100
  periodKey: string            // 'YYYY-MM' of the invoice payment date
  invoiceId: string
  createdAt: string
}

/** Commission record for a Technician who referred a customer */
export interface TechReferralCommission {
  id: string
  technicianId: string
  technicianName: string
  jobCardId: string
  jobCardNumber: string
  customerName: string
  invoiceAmount: number   // total invoice amount
  commissionRate: number  // global flat rate applied
  commissionEarned: number
  periodKey: string       // 'YYYY-MM' of the invoice payment date
  invoiceId: string
  createdAt: string
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
  reorderLevel: number       // trigger low-stock alert when stockQuantity <= reorderLevel
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
  auto?: boolean              // true = system-generated from a job part/service (not manual)
}



export const customers: Customer[] = []

export const vehicles: Vehicle[] = []

export const jobCards: JobCard[] = []

export const pfis: PFI[] = []

export const partsConsumption: PartConsumption[] = []

export const invoices: Invoice[] = []

export const servicePackages: ServicePackage[] = []

// ─── Demo / seed users — one per role so every role can be tested immediately ─
// Change credentials after first login via Users & Roles page.
export const users: User[] = [
  // ── 1. Admin ──────────────────────────────────────────────────────────────
  {
    id: 'u-default-admin',
    name: 'Sarah Mwangi',
    email: 'admin@autofix.co.tz',
    role: 'Admin',
    active: true,
    password: 'Admin2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 2. Workshop Controller ────────────────────────────────────────────────
  {
    id: 'u-workshop-ctrl',
    name: 'James Odhiambo',
    email: 'workshop@autofix.co.tz',
    role: 'Workshop Controller',
    active: true,
    password: 'Workshop2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 3. Service Advisor ────────────────────────────────────────────────────
  {
    id: 'u-service-advisor',
    name: 'Amina Hassan',
    email: 'advisor@autofix.co.tz',
    role: 'Service Advisor',
    active: true,
    password: 'Advisor2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 4. Technician ─────────────────────────────────────────────────────────
  {
    id: 'u-technician',
    name: 'Juma Mwangi',
    email: 'technician@autofix.co.tz',
    role: 'Technician',
    active: true,
    password: 'Tech2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 5. Finance ────────────────────────────────────────────────────────────
  {
    id: 'u-finance',
    name: 'Grace Kimani',
    email: 'finance@autofix.co.tz',
    role: 'Finance',
    active: true,
    password: 'Finance2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 6. Quality Control ────────────────────────────────────────────────────
  {
    id: 'u-quality-control',
    name: 'David Njoroge',
    email: 'qc@autofix.co.tz',
    role: 'Quality Control',
    active: true,
    password: 'QC2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // ── 7. Sales ──────────────────────────────────────────────────────────────
  {
    id: 'u-sales-rep',
    name: 'Omar Sharif',
    email: 'sales@autofix.co.tz',
    role: 'Sales',
    active: true,
    password: 'Sales2025!',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

// ─── Active Sessions (token → userId) ────────────────────────────────────────
export const sessions: Map<string, string> = new Map()

export const activityLog: ActivityLog[] = []

export const salesTargets: SalesTarget[] = []

export const salesCommissions: SalesCommission[] = []

// ── Staff Performance arrays ──────────────────────────────────────────────────
export const saUpsellTargets: SAUpsellTarget[] = []
export const saUpsellCommissions: SAUpsellCommission[] = []
export const techReferralCommissions: TechReferralCommission[] = []

// ─── Lubricants Catalogue Inventory ──────────────────────────────────────────
export const lubricantProducts: LubricantProduct[] = []

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

export const catalogueParts: CataloguePart[] = []

// ─── Twiga Group Car Wash Packages ───────────────────────────────────────────

export const carWashPackages: CarWashPackage[] = []

// ─── Twiga Group Add-on Services ─────────────────────────────────────────────

export const addOnServices: AddOnService[] = []

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

// ─── Gate Passes ─────────────────────────────────────────────────────────────

export type GatePassStatus = 'Active' | 'Pending Exit' | 'Cleared' | 'Voided'

export interface GatePass {
  id: string
  passNumber: string          // GMS-GP-2026-001
  jobCardId: string
  jobCardNumber?: string
  // Vehicle snapshot (denormalised for quick display)
  vehicleReg: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  vehicleColor?: string
  // Customer snapshot
  customerName: string
  customerPhone?: string
  // Timing
  entryTime: string           // ISO — set when job card created
  exitTime?: string           // ISO — set when exit approved
  // Status
  status: GatePassStatus
  // Approval
  approvedBy?: string
  approvedAt?: string
  signatureData?: string      // base64 PNG from canvas
  // Meta
  voidReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const gatePasses: GatePass[] = []

// ─── Photo Documentation ─────────────────────────────────────────────────────
export type PhotoCategory = 'intake' | 'damage' | 'repair_progress' | 'final'

export interface JobCardPhoto {
  id: string
  jobCardId: string
  category: PhotoCategory
  fileUrl: string       // base64 data URL stored in memory (production: object-storage URL)
  thumbnail?: string    // smaller base64 for list views
  fileName: string
  fileSize: number      // bytes
  mimeType: string
  description: string
  uploadedBy: string    // userId
  uploadedByName: string
  uploadedAt: string    // ISO timestamp
}

export const jobCardPhotos: JobCardPhoto[] = []

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
  | 'gate_pass_exit_pending'
  | 'gate_pass_cleared'

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

// ─── Fleet Invoices ──────────────────────────────────────────────────────────
// A single consolidated invoice covering multiple job cards for one customer.

export interface FleetInvoiceLineItem {
  jobCardId: string
  jobCardNumber: string
  description: string          // e.g. "Full Service – Land Cruiser T677AQQ"
  labourCost: number
  partsCost: number
  servicesCost: number         // from jobServices
  subtotal: number             // labourCost + partsCost + servicesCost
  // Detail snapshots for PDF rendering
  services: { name: string; qty: number; unitPrice: number; total: number }[]
  parts:    { name: string; qty: number; unitPrice: number; total: number }[]
}

export interface FleetInvoice {
  id: string
  fleetInvoiceNumber: string       // FLEET-INV-2026-001
  customerId: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  lineItems: FleetInvoiceLineItem[]
  // Totals
  subtotal: number                 // sum of all line item subtotals
  discountType?: 'fixed' | 'percentage'
  discountValue?: number
  discountAmount: number
  discountReason?: string
  tax: number                      // 18% of (subtotal − discount)
  totalAmount: number
  // Payment tracking (same ledger as Invoice)
  status: InvoiceStatus
  issuedAt: string
  dueDate?: string
  paidAt?: string
  paymentMethod?: PaymentMethod
  paymentReference?: string
  amountPaid?: number
  payments?: {
    id: string
    amount: number
    method: PaymentMethod
    reference?: string
    paidAt: string
  }[]
  notes?: string
}

export const fleetInvoices: FleetInvoice[] = []

// ─── Subscription Plans & Customer Subscriptions ─────────────────────────────

export type SubscriptionServiceType = 'oil_change' | 'car_wash' | 'service_package' | 'add_on'
export type SubscriptionBillingCycle = 'monthly' | 'visit_pack'
export type SubscriptionStatus = 'Active' | 'Paused' | 'Expired' | 'Cancelled'

/**
 * SubscriptionPlan — a reusable template created by staff.
 * One plan per service type / billing cycle combination.
 * e.g. "Oil Change – Monthly", "Car Wash – Pack of 5"
 */
export interface SubscriptionPlan {
  id: string
  serviceType: SubscriptionServiceType
  serviceId: string          // id of the linked catalogue item (OilServiceProduct, CarWashPackage, etc.)
  serviceName: string        // denormalized for display
  billingCycle: SubscriptionBillingCycle
  visitsPerCycle: number     // 1 for monthly single-visit; N for visit packs
  cyclePrice: number         // TZS per month or per pack
  description?: string
  isActive: boolean          // can be soft-disabled
  createdAt: string
}

export interface SubscriptionUsageEntry {
  id: string
  jobCardId: string
  jobCardNumber: string
  redeemedAt: string         // ISO timestamp
  note?: string
}

/**
 * CustomerSubscription — one instance per customer + plan enrollment.
 * Tracks credits, usage log, renewal dates and payment status.
 */
export interface CustomerSubscription {
  id: string
  customerId: string
  vehicleId?: string         // optional — can be customer-wide
  planId: string

  // Snapshot of plan values at enrollment time (immutable after creation)
  serviceName: string
  serviceType: SubscriptionServiceType
  billingCycle: SubscriptionBillingCycle
  visitsPerCycle: number
  cyclePrice: number

  status: SubscriptionStatus
  startDate: string          // ISO date
  renewalDate?: string       // ISO date — null for visit packs (no expiry until pack exhausted)

  // Credits
  visitsAllowed: number      // = visitsPerCycle at enrollment / renewal
  visitsUsed: number         // incremented on each redemption

  // Payment
  invoiceId?: string         // subscription invoice (current cycle)
  subInvoiceNumber?: string  // e.g. SUB-2026-001
  paymentStatus: 'Paid' | 'Pending' | 'Overdue'

  // Reminder tracking
  reminderSentAt?: string

  // Usage ledger
  usageLog: SubscriptionUsageEntry[]

  notes?: string
  createdAt: string
  updatedAt: string
}

export const subscriptionPlans: SubscriptionPlan[] = []
export const customerSubscriptions: CustomerSubscription[] = []

// ─── Customer Notification Dispatch Log ──────────────────────────────────────
export type NotifChannel = 'sms' | 'email' | 'whatsapp'
export type NotifDispatchStatus = 'sent' | 'failed' | 'simulated'

export interface CustomerNotifDispatch {
  id: string
  channel: NotifChannel
  recipientPhone?: string        // phone / WhatsApp number
  recipientEmail?: string        // email address
  recipientName: string
  subject: string                // short label, e.g. "Job Status Update"
  body: string                   // message body
  triggerEvent: string           // e.g. 'job_status_changed', 'invoice_paid'
  jobCardId?: string
  customerId?: string
  status: NotifDispatchStatus
  errorMessage?: string          // if failed
  sentAt: string                 // ISO timestamp
}

export const customerNotifDispatches: CustomerNotifDispatch[] = []

// ─── Garage Settings ─────────────────────────────────────────────────────────
export interface GarageSettings {
  // Profile
  garageName: string
  address: string
  phone: string
  email: string
  website?: string
  logoUrl?: string            // base64 data URL or storage URL
  tinNumber?: string          // tax identification number
  vatRate: number             // e.g. 18 for 18%
  currency: string            // e.g. 'TZS'

  // Invoice & numbering
  invoicePrefix: string       // e.g. 'GMS-INV'
  jobCardPrefix: string       // e.g. 'GMS'
  pfiPrefix: string           // e.g. 'GMS-PFI'
  invoiceFooterNote?: string  // printed on every invoice

  // Notification channels
  notifyOnJobCreate: boolean
  notifyOnJobStatus: boolean
  notifyOnJobComplete: boolean
  notifyOnInvoicePaid: boolean
  notifyOnAppointment: boolean
  smsEnabled: boolean
  smsProvider: 'bongolive' | 'africastalking' | 'nexmo' | 'none'
  smsApiKey?: string
  smsSenderId?: string
  emailEnabled: boolean
  emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'none'
  emailApiKey?: string
  emailFrom?: string
  whatsappEnabled: boolean
  whatsappNumber?: string     // Twilio / 360dialog number

  // ── Staff Performance ─────────────────────────────────────────────────────
  techReferralCommissionRate: number  // flat global % rate for technician referral commissions (default 3)

  updatedAt: string
}

export const defaultGarageSettings: GarageSettings = {
  garageName: 'Twiga Group Garage',
  address: '',
  phone: '',
  email: '',
  vatRate: 18,
  currency: 'TZS',
  invoicePrefix: 'GMS-INV',
  jobCardPrefix: 'GMS',
  pfiPrefix: 'GMS-PFI',
  notifyOnJobCreate: true,
  notifyOnJobStatus: true,
  notifyOnJobComplete: true,
  notifyOnInvoicePaid: true,
  notifyOnAppointment: true,
  smsEnabled: false,
  smsProvider: 'none',
  emailEnabled: false,
  emailProvider: 'none',
  whatsappEnabled: false,
  techReferralCommissionRate: 3,
  updatedAt: new Date().toISOString(),
}

// Single mutable settings object — loaded from / saved to gms-data.json
export let garageSettings: GarageSettings = { ...defaultGarageSettings }
export function updateGarageSettings(patch: Partial<GarageSettings>): void {
  garageSettings = { ...garageSettings, ...patch, updatedAt: new Date().toISOString() }
}

// ─── Persistence — load saved data on startup ─────────────────────────────────
// This must be the last statement in the module so all arrays are declared first.
import { load as _loadPersistedData } from './persist.js'
_loadPersistedData()
