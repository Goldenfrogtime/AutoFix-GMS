# Twiga AutoGroup – Garage Management System

## Project Overview
- **Name**: Twiga AutoGroup GMS (Garage Management System)
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

### ✅ Branding & White-Labelling
Every customer-facing surface is driven by the tenant's own branding record —
no code change is needed to rebrand the system for a new client.

**Branded surfaces**
- Login screen (full logo lockup on the brand gradient)
- App shell: sidebar, mobile top bar, page title, theme colour
- Browser favicons + PWA app icons / web manifest
- PDF documents: invoices, quotations, Pro Forma Invoices, service cards,
  gate passes, fleet invoices
- HTML emails for quotations and Pro Forma Invoices

**Configured in Settings → Branding**
| Setting | Applies to |
|---|---|
| Icon / mark logo | Sidebar, favicon, email avatar |
| Full logo | Documents, light backgrounds |
| Light logo | Login screen, dark backgrounds, PDF letterheads |
| Primary / Accent / Dark colours | Whole UI + document letterheads |
| Display name, tagline | App shell, documents, emails |
| P.O. Box, document footer | PDF letterhead + footer |
| Bank / payment details | Printed on invoices |
| Email signature | Outgoing emails |

Colours are applied as CSS custom properties (`--brand-primary`,
`--brand-accent`, `--brand-dark`), so a colour change restyles the entire
app instantly without a rebuild.

**Brand assets** live in `public/static/brand/` — logo lockups (navy +
white, 1x/2x), gear/giraffe marks, and app icons (16/32/48/180/512 plus a
multi-resolution `favicon.ico`). Twiga brand navy is `#122886`.

**Document type split**: insurance jobs produce a **Pro Forma Invoice**
(`PFI-` ref, "subject to insurer approval"), while private customers get a
**Quotation** (`QTE-` ref, 14-day validity note).

## Job Card Status Workflow
```
RECEIVED → INSPECTION → PFI_PREPARATION → AWAITING_INSURER_APPROVAL
→ REPAIR_IN_PROGRESS → WAITING_FOR_PARTS → QUALITY_CHECK
→ COMPLETED → INVOICED → RELEASED
```

## Functional Entry URIs
| Route | Purpose |
|---|---|
| `GET /` | Main app shell (SPA) |
| `GET /api/branding` | **Public** — tenant identity for the login screen (no auth) |
| `PATCH /api/branding` | Update branding (requires `settings.manage`) |
| `GET /api/settings` | Full garage settings (auth; API keys masked) |
| `PATCH /api/settings` | Update settings (requires `settings.manage`) |
| `GET /static/brand/*` | Brand assets (logos, icons) |
| `GET /favicon.ico`, `/apple-touch-icon.png` | Browser/device icons |
| `GET /manifest.webmanifest` | PWA manifest |

All other `/api/*` routes require a `Bearer` token except `/api/auth/login`.

## Data Models
- **Customers**: name, phone, email, address, ID number
- **Vehicles**: registration, make, model, year, VIN, insurer, policy
- **JobCards**: customer, vehicle, technician, category, claim ref, insurer, assessor, status
- **PFIs**: labour cost, parts cost, total estimate, approval status
- **Invoices**: invoice number, labour, parts, tax, total, payment status
- **PartsConsumption**: part name, quantity, unit cost per job
- **ServicePackages**: predefined bundles with parts lists
- **Users**: name, email, role, active status
- **GarageSettings**: garage profile, financial defaults, notification config,
  plus branding (logos, brand colours, tagline, document footer, bank details,
  email signature)

## Storage
- **Runtime**: In-memory store, persisted to `gms-data.json`
- **Data directory**: `RAILWAY_VOLUME_MOUNT_PATH` → `DATA_DIR` → `/app/data`
- **Logos**: stored as data URLs inside the settings record (1 MB cap per logo)

## Tech Stack
- **Backend**: Hono framework on Cloudflare Pages/Workers
- **Frontend**: Vanilla JS + Tailwind CSS (CDN) + Chart.js + Font Awesome
- **Build**: Vite + @hono/vite-build
- **Runtime**: Cloudflare Workers edge

## Branding Onboarding Guide (for a new client)
1. Sign in as an Admin (or any role with `settings.manage`).
2. **Settings → Garage Profile** — set garage name, address, phone, email,
   website and TIN. *These print on every document, so complete them first.*
3. **Settings → Branding** — upload the three logo variants, pick the brand
   colours (live preview), and fill in P.O. Box, document footer, bank details
   and email signature.
4. Press **Save Branding**. The login screen, app shell, PDFs and emails all
   update immediately.
5. Generate one invoice and one quotation PDF to confirm the letterhead.

## Automated Branded Email (SendGrid)

Quotations, Pro Forma Invoices and invoices can be **sent automatically**,
fully branded, with the PDF attached.

**Setup — Settings → Notifications → Email Channel**
1. Tick **Enable email notifications**.
2. Provider: **SendGrid**.
3. Paste your SendGrid **API key** (needs the *Mail Send* permission).
4. **From Address** — must be a **verified sender** in SendGrid, or it rejects
   the message with HTTP 403.
5. Save, then use **Send Test** to confirm delivery end-to-end.

A status pill next to "Email Channel" shows **Ready** or **Not configured**,
and the send dialog shows the same status before you send.

**Sending**: open a quote/PFI → **Send Email Now**. The PDF is generated in the
browser (identical to the preview) and attached server-side. On failure the
document is **not** marked as sent, and SendGrid's actual error is shown.

Every attempt — success or failure — is recorded in the dispatch history.

| Endpoint | Purpose |
|---|---|
| `GET /api/email/status` | Is delivery configured? |
| `POST /api/email/test` | Send a branded test email |
| `POST /api/pfi/:id/email` | Send quotation / PFI + PDF |
| `POST /api/invoices/:id/email` | Send invoice + PDF |

`SENDGRID_API_BASE` can be set to target the EU endpoint
(`https://api.eu.sendgrid.com`) or a staging server.

## Live Settings Updates
Changes saved in **Settings → Garage Profile** or **Branding** apply
immediately across the running app — no refresh required. Saving propagates
through `applySettingsEverywhere()`, which refreshes the settings cache used by
PDFs and emails, re-applies brand colours and logos, clears the PDF logo raster
cache, re-probes email status, and re-renders the current page plus any open
document preview.

## Known Limitations
- **Other providers**: only SendGrid is implemented. Selecting Mailgun or SMTP
  reports "not implemented" rather than silently failing to send.
- **`mailto:` fallback**: the "Open Email Client" button sends plain text —
  `mailto:` cannot carry HTML. Use **Send Email Now** (automated) or
  **Copy branded email** to paste the branded layout into Gmail/Outlook.
- **Logo in emails**: email clients need a publicly reachable URL to load the
  logo. On localhost the image may not render in the received email.

## Deployment
- **Platform**: Railway (Node) — `npx tsx server.mjs`; also builds for Cloudflare Pages
- **Status**: Active in sandbox / Ready for deployment
- **Tech Stack**: Hono + TypeScript + Tailwind (CDN) + jsPDF
- **Last Updated**: September 2026 (branding onboarding release)
