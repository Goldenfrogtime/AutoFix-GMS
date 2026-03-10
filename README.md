# AutoFix GMS – Garage Management System

## Project Overview
- **Name**: AutoFix GMS (Garage Management System)
- **Goal**: Digitize the insurance repair workflow between garages, insurers, and assessors
- **Integration**: Designed to connect with ClaimFlow (insurer) and Assessor Hub platforms

## Live URL
- **Development**: https://3000-iybd97o8pn6ohans0d2t4-de59bda9.sandbox.novita.ai

## Modules Implemented

### ✅ Dashboard
- KPI stats: Active jobs, In Progress, Awaiting Approval, Monthly Revenue
- Recent job cards list
- Job status doughnut chart
- Jobs by Insurer breakdown with progress bars
- Quick Actions panel

### ✅ Job Card Management
- Full CRUD for job cards
- 10-step status workflow with visual progress tracker
- Status filter strips and search
- Job detail view with vehicle, customer, PFI, invoice, parts & activity log panels

### ✅ Customer & Vehicle CRM
- Customer card grid with vehicle count, job count
- Customer detail modal with full history
- Vehicle registry table with search
- Link vehicles to customers and insurers

### ✅ Claims & PFIs
- Pro Forma Invoice creation and submission
- PFI approval/rejection workflow (insurer simulation)
- Filter by status: Draft, Submitted, Approved, Rejected

### ✅ Invoices
- Auto-generated invoices on job completion
- Labour, parts, tax breakdown
- Payment status tracking

### ✅ Service Packages
- Predefined service bundles with labour cost, hours, parts list
- Packages: Minor Service, Major Service, Brake Service, Oil Change

### ✅ Analytics & Margin Report
- Revenue, margin, average job value metrics
- Revenue breakdown bar chart
- Jobs by Insurer pie chart

### ✅ Users & Roles
- 5 roles: Owner, Manager, Front Desk, Technician, Accountant
- User cards with role badges and active status

## Job Card Status Workflow
```
RECEIVED → INSPECTION → PFI_PREPARATION → AWAITING_INSURER_APPROVAL
→ REPAIR_IN_PROGRESS → WAITING_FOR_PARTS → QUALITY_CHECK
→ COMPLETED → INVOICED → RELEASED
```

## Data Models
- **Customers**: name, phone, email, address, ID number
- **Vehicles**: registration, make, model, year, VIN, insurer, policy
- **JobCards**: customer, vehicle, technician, category, claim ref, insurer, assessor, status
- **PFIs**: labour cost, parts cost, total estimate, approval status
- **Invoices**: invoice number, labour, parts, tax, total, payment status
- **PartsConsumption**: part name, quantity, unit cost per job
- **ServicePackages**: predefined bundles with parts lists
- **Users**: name, email, role, active status

## Storage
- **Runtime**: In-memory store (for demo/development)
- **Production**: Designed for Cloudflare D1 SQLite database

## Tech Stack
- **Backend**: Hono framework on Cloudflare Pages/Workers
- **Frontend**: Vanilla JS + Tailwind CSS (CDN) + Chart.js + Font Awesome
- **Build**: Vite + @hono/vite-build
- **Runtime**: Cloudflare Workers edge

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: Development / Ready for Cloudflare deployment
- **Last Updated**: March 2026
