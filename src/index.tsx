import { Hono } from 'hono'
import { cors } from 'hono/cors'
import api from './routes/api'

const app = new Hono()
app.use('/api/*', cors())
app.route('/api', api)

// ─── Main HTML Shell ─────────────────────────────────────────────────────────
app.get('/', (c) => c.html(shell()))
app.get('*', (c) => c.html(shell()))

function shell() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>GMS – Garage Management System</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
        garage: { 50:'#f0fdf4',100:'#dcfce7',500:'#22c55e',600:'#16a34a',700:'#15803d',900:'#14532d' }
      }
    }
  }
}
</script>
<style>
*{box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f1f5f9;margin:0}
.sidebar{transition:transform .3s ease}
.nav-item{transition:all .2s ease}
.nav-item:hover,.nav-item.active{background:rgba(255,255,255,.12);transform:translateX(4px)}
.nav-item.active{border-left:3px solid #60a5fa}
.card{background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 8px 24px rgba(0,0,0,.04);transition:box-shadow .2s}
.card:hover{box-shadow:0 4px 16px rgba(0,0,0,.12)}
.badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:.72rem;font-weight:600;letter-spacing:.03em}
.btn-primary{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;font-size:.9rem}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.4)}
.btn-secondary{background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;border-radius:10px;padding:9px 18px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;font-size:.9rem}
.btn-secondary:hover{background:#e2e8f0}
.btn-danger{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:10px;padding:9px 18px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;font-size:.9rem}
.btn-danger:hover{background:#fecaca}
.form-input{width:100%;padding:9px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:.9rem;outline:none;transition:border-color .2s;background:#fff}
.form-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.form-label{display:block;margin-bottom:5px;font-weight:600;color:#374151;font-size:.85rem}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px)}
.modal-box{background:#fff;border-radius:20px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.table-row:hover{background:#f8fafc}
.stat-card{background:linear-gradient(135deg,var(--g1),var(--g2));border-radius:16px;padding:20px 24px;color:#fff;position:relative;overflow:hidden}
.stat-card::before{content:'';position:absolute;right:-20px;top:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.1)}
.status-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:99px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.timeline-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.page{display:none}
.page.active{display:block}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#f1f5f9}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
.progress-bar{height:6px;border-radius:3px;background:#e2e8f0}
.progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#3b82f6,#06b6d4);transition:width .6s ease}
.search-input{padding:9px 13px 9px 38px;border:1.5px solid #e2e8f0;border-radius:10px;outline:none;font-size:.9rem;width:260px;transition:border-color .2s}
.search-input:focus{border-color:#3b82f6;width:320px}
.tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:.75rem;font-weight:600}
</style>
</head>
<body>
<div class="flex h-screen overflow-hidden">

<!-- SIDEBAR -->
<aside id="sidebar" class="sidebar w-64 flex-shrink-0 flex flex-col text-white overflow-y-auto z-50" style="background:linear-gradient(180deg,#1e3a8a 0%,#1d4ed8 50%,#1e40af 100%)">
  <div class="p-5 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <i class="fas fa-car-side text-white text-lg"></i>
      </div>
      <div>
        <h1 class="font-bold text-base leading-tight">AutoFix GMS</h1>
        <p class="text-xs text-blue-200">Garage Management</p>
      </div>
    </div>
  </div>
  <nav class="flex-1 p-3 space-y-1">
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-2 pb-1">Main</p>
    <a class="nav-item active flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-white" onclick="showPage('dashboard')">
      <i class="fas fa-chart-pie w-5 text-center"></i> Dashboard
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('jobcards')">
      <i class="fas fa-clipboard-list w-5 text-center"></i> Job Cards
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Operations</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('customers')">
      <i class="fas fa-users w-5 text-center"></i> Customers
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('vehicles')">
      <i class="fas fa-car w-5 text-center"></i> Vehicles
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('claims')">
      <i class="fas fa-shield-alt w-5 text-center"></i> Claims & PFIs
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('invoices')">
      <i class="fas fa-file-invoice-dollar w-5 text-center"></i> Invoices
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Management</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('packages')">
      <i class="fas fa-box-open w-5 text-center"></i> Service Packages
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('analytics')">
      <i class="fas fa-chart-bar w-5 text-center"></i> Analytics
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('users')">
      <i class="fas fa-user-cog w-5 text-center"></i> Users & Roles
    </a>
  </nav>
  <div class="p-3 border-t border-white/10">
    <div class="flex items-center gap-3 px-3 py-2">
      <div class="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-bold">MO</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold truncate">Michael Osei</p>
        <p class="text-xs text-blue-200">Owner</p>
      </div>
      <i class="fas fa-chevron-right text-blue-300 text-xs"></i>
    </div>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="flex-1 flex flex-col overflow-hidden">
  <!-- Top Bar -->
  <header class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
    <div class="flex items-center gap-3">
      <button class="lg:hidden text-gray-500" onclick="toggleSidebar()"><i class="fas fa-bars text-lg"></i></button>
      <div class="relative hidden sm:block">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input class="search-input" type="text" placeholder="Search jobs, vehicles, customers…" id="globalSearch" oninput="handleGlobalSearch(this.value)"/>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <button class="relative text-gray-500 hover:text-gray-700" title="Notifications">
        <i class="fas fa-bell text-lg"></i>
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
      </button>
      <button class="btn-primary text-sm" onclick="showNewJobModal()">
        <i class="fas fa-plus"></i> New Job Card
      </button>
    </div>
  </header>

  <!-- Pages Container -->
  <div class="flex-1 overflow-y-auto p-6" id="pageContainer">

    <!-- ═══ DASHBOARD ═══ -->
    <div id="page-dashboard" class="page active">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p class="text-gray-500 text-sm mt-1">Welcome back, Michael! Here's what's happening today.</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-400">Today</p>
          <p class="text-sm font-semibold text-gray-700" id="todayDate"></p>
        </div>
      </div>
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="dashStats"></div>
      <!-- Content Grid -->
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card p-5 mb-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-800">Recent Job Cards</h3>
              <button class="text-brand-600 text-sm font-semibold hover:underline" onclick="showPage('jobcards')">View All →</button>
            </div>
            <div id="recentJobsList"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-gray-800 mb-4">Job Status Overview</h3>
            <div style="height:220px"><canvas id="statusChart"></canvas></div>
          </div>
        </div>
        <div class="space-y-5">
          <div class="card p-5">
            <h3 class="font-bold text-gray-800 mb-4">By Insurer</h3>
            <div id="insurerList"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors" onclick="showNewJobModal()">
                <i class="fas fa-plus-circle"></i> Create New Job Card
              </button>
              <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-sm transition-colors" onclick="showPage('customers');setTimeout(()=>showNewCustomerModal(),200)">
                <i class="fas fa-user-plus"></i> Add New Customer
              </button>
              <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm transition-colors" onclick="showPage('claims')">
                <i class="fas fa-shield-check"></i> Manage Claims & PFIs
              </button>
              <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm transition-colors" onclick="showPage('invoices')">
                <i class="fas fa-file-invoice"></i> View Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ JOB CARDS ═══ -->
    <div id="page-jobcards" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Job Cards</h2>
          <p class="text-gray-500 text-sm mt-1">Manage all repair and service jobs</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input" type="text" placeholder="Search job cards…" id="jobSearch" oninput="filterJobCards(this.value)"/>
          </div>
          <select class="form-input w-auto" id="jobStatusFilter" onchange="filterJobCards()">
            <option value="">All Statuses</option>
            <option>RECEIVED</option><option>INSPECTION</option><option>PFI_PREPARATION</option>
            <option>AWAITING_INSURER_APPROVAL</option><option>REPAIR_IN_PROGRESS</option>
            <option>WAITING_FOR_PARTS</option><option>QUALITY_CHECK</option>
            <option>COMPLETED</option><option>INVOICED</option><option>RELEASED</option>
          </select>
          <button class="btn-primary" onclick="showNewJobModal()"><i class="fas fa-plus"></i> New Job</button>
        </div>
      </div>
      <!-- Kanban-style status strips -->
      <div class="flex gap-2 mb-5 flex-wrap" id="jobStatusStrips"></div>
      <!-- Jobs Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Job #</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer / Vehicle</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Insurer</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
          </tr></thead>
          <tbody id="jobCardsTable"></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ JOB DETAIL ═══ -->
    <div id="page-jobdetail" class="page">
      <div class="flex items-center gap-3 mb-6">
        <button class="btn-secondary text-sm" onclick="showPage('jobcards')"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900" id="jobDetailTitle">Job Card Detail</h2>
          <p class="text-gray-500 text-sm mt-1" id="jobDetailSub"></p>
        </div>
        <div id="jobDetailActions" class="flex gap-2"></div>
      </div>
      <div id="jobDetailContent"></div>
    </div>

    <!-- ═══ CUSTOMERS ═══ -->
    <div id="page-customers" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Customers</h2>
          <p class="text-gray-500 text-sm mt-1">Manage customer profiles and history</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input" type="text" placeholder="Search customers…" oninput="filterCustomers(this.value)"/>
          </div>
          <button class="btn-primary" onclick="showNewCustomerModal()"><i class="fas fa-user-plus"></i> Add Customer</button>
        </div>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="customersGrid"></div>
    </div>

    <!-- ═══ VEHICLES ═══ -->
    <div id="page-vehicles" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Vehicles</h2>
          <p class="text-gray-500 text-sm mt-1">Fleet and vehicle registry</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input" type="text" placeholder="Search vehicles…" oninput="filterVehicles(this.value)"/>
          </div>
          <button class="btn-primary" onclick="showNewVehicleModal()"><i class="fas fa-plus"></i> Add Vehicle</button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Reg. Number</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Make / Model</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Year</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Insurer</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">VIN</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
          </tr></thead>
          <tbody id="vehiclesTable"></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ CLAIMS & PFIs ═══ -->
    <div id="page-claims" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Claims & PFIs</h2>
          <p class="text-gray-500 text-sm mt-1">Insurance claim management and pro forma invoices</p>
        </div>
      </div>
      <!-- PFI Status Tabs -->
      <div class="flex gap-2 mb-5">
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white" onclick="filterPFIs('all',this)">All</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Submitted',this)">Submitted</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Approved',this)">Approved</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Rejected',this)">Rejected</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Draft',this)">Drafts</button>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="claimsGrid"></div>
    </div>

    <!-- ═══ INVOICES ═══ -->
    <div id="page-invoices" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Invoices</h2>
          <p class="text-gray-500 text-sm mt-1">Billing and payment tracking</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-xs text-gray-400">Total Revenue</p>
            <p class="text-lg font-bold text-green-600" id="totalRevDisplay">—</p>
          </div>
        </div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Job Card</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Labour</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Parts</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Tax</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
          </tr></thead>
          <tbody id="invoicesTable"></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ PACKAGES ═══ -->
    <div id="page-packages" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Service Packages</h2>
          <p class="text-gray-500 text-sm mt-1">Predefined service bundles to speed up job creation</p>
        </div>
        <button class="btn-primary" onclick="showNewPackageModal()"><i class="fas fa-plus"></i> New Package</button>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5" id="packagesGrid"></div>
    </div>

    <!-- ═══ ANALYTICS ═══ -->
    <div id="page-analytics" class="page">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Analytics & Margin Report</h2>
        <p class="text-gray-500 text-sm mt-1">Business performance and profitability overview</p>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="analyticsStats"></div>
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4">Revenue Breakdown</h3>
          <div style="height:260px"><canvas id="revenueChart"></canvas></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4">Jobs by Insurer</h3>
          <div style="height:260px"><canvas id="insurerChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- ═══ USERS ═══ -->
    <div id="page-users" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Users & Roles</h2>
          <p class="text-gray-500 text-sm mt-1">Manage team access and permissions</p>
        </div>
        <button class="btn-primary" onclick="showNewUserModal()"><i class="fas fa-user-plus"></i> Add User</button>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="usersGrid"></div>
    </div>

  </div>
</main>
</div>

<!-- ═══════════════════ MODALS ═══════════════════ -->

<!-- New Job Card Modal -->
<div id="modal-newJob" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">New Job Card</h3><p class="text-sm text-gray-500">Create a new repair or service job</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newJob')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newJobForm" onsubmit="submitNewJob(event)">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Customer</label><select class="form-input" id="job-customerId" onchange="loadCustomerVehicles()" required><option value="">Select customer…</option></select></div>
        <div><label class="form-label">Vehicle</label><select class="form-input" id="job-vehicleId" required><option value="">Select vehicle…</option></select></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Job Category</label><select class="form-input" id="job-category" onchange="toggleInsuranceFields()" required><option>Insurance</option><option>Private</option></select></div>
        <div><label class="form-label">Assigned Technician</label><select class="form-input" id="job-technician" required><option value="">Select…</option></select></div>
      </div>
      <div id="insuranceFields">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div><label class="form-label">Claim Reference #</label><input class="form-input" id="job-claimRef" placeholder="e.g. CLM-JUB-12345"/></div>
          <div><label class="form-label">Insurer Name</label><input class="form-input" id="job-insurer" placeholder="e.g. Jubilee Insurance"/></div>
        </div>
        <div class="mb-4"><label class="form-label">Assessor Name</label><input class="form-input" id="job-assessor" placeholder="e.g. Thomas Mlay"/></div>
      </div>
      <div class="mb-4"><label class="form-label">Damage / Service Description</label><textarea class="form-input" id="job-damage" rows="3" required placeholder="Describe the damage or service required…"></textarea></div>
      <div class="mb-6"><label class="form-label">Initial Inspection Notes</label><textarea class="form-input" id="job-notes" rows="2" placeholder="Technician inspection notes…"></textarea></div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newJob')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Create Job Card</button>
      </div>
    </form>
  </div>
</div>

<!-- New Customer Modal -->
<div id="modal-newCustomer" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Add Customer</h3><p class="text-sm text-gray-500">Create a new customer profile</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newCustomer')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newCustomerForm" onsubmit="submitNewCustomer(event)">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Full Name</label><input class="form-input" id="cust-name" required placeholder="John Doe"/></div>
        <div><label class="form-label">Phone Number</label><input class="form-input" id="cust-phone" required placeholder="+255 7XX XXX XXX"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Email Address</label><input class="form-input" type="email" id="cust-email" placeholder="john@example.com"/></div>
        <div><label class="form-label">ID Number (optional)</label><input class="form-input" id="cust-id" placeholder="TZ123456789"/></div>
      </div>
      <div class="mb-6"><label class="form-label">Address</label><input class="form-input" id="cust-address" placeholder="Street, City"/></div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newCustomer')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Add Customer</button>
      </div>
    </form>
  </div>
</div>

<!-- New Vehicle Modal -->
<div id="modal-newVehicle" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Add Vehicle</h3><p class="text-sm text-gray-500">Register a new vehicle</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newVehicle')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newVehicleForm" onsubmit="submitNewVehicle(event)">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Owner (Customer)</label><select class="form-input" id="veh-customerId" required><option value="">Select customer…</option></select></div>
        <div><label class="form-label">Registration Number</label><input class="form-input" id="veh-reg" required placeholder="T123 ABC"/></div>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div><label class="form-label">Make</label><input class="form-input" id="veh-make" required placeholder="Toyota"/></div>
        <div><label class="form-label">Model</label><input class="form-input" id="veh-model" required placeholder="Corolla"/></div>
        <div><label class="form-label">Year</label><input class="form-input" type="number" id="veh-year" required min="1990" max="2030" placeholder="2022"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">VIN (optional)</label><input class="form-input" id="veh-vin" placeholder="17-character VIN"/></div>
        <div><label class="form-label">Engine Number</label><input class="form-input" id="veh-engine" placeholder="Engine number"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div><label class="form-label">Insurance Company</label><input class="form-input" id="veh-insurer" placeholder="Jubilee Insurance"/></div>
        <div><label class="form-label">Policy Number</label><input class="form-input" id="veh-policy" placeholder="JUB-2024-XXXX"/></div>
      </div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newVehicle')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Add Vehicle</button>
      </div>
    </form>
  </div>
</div>

<!-- New Package Modal -->
<div id="modal-newPackage" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">New Service Package</h3></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newPackage')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newPackageForm" onsubmit="submitNewPackage(event)">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Package Name</label><input class="form-input" id="pkg-name" required placeholder="e.g. Major Service"/></div>
        <div><label class="form-label">Labour Cost (TZS)</label><input class="form-input" type="number" id="pkg-labour" required min="0"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Estimated Hours</label><input class="form-input" type="number" id="pkg-hours" required min="0.5" step="0.5"/></div>
        <div></div>
      </div>
      <div class="mb-4"><label class="form-label">Description</label><textarea class="form-input" id="pkg-desc" rows="2" placeholder="Brief description of this service package…"></textarea></div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newPackage')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Package</button>
      </div>
    </form>
  </div>
</div>

<!-- New User Modal -->
<div id="modal-newUser" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Add Team Member</h3></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newUser')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newUserForm" onsubmit="submitNewUser(event)">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Full Name</label><input class="form-input" id="usr-name" required/></div>
        <div><label class="form-label">Email</label><input class="form-input" type="email" id="usr-email" required/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div><label class="form-label">Phone</label><input class="form-input" id="usr-phone"/></div>
        <div><label class="form-label">Role</label>
          <select class="form-input" id="usr-role" required>
            <option>Owner</option><option>Manager</option><option>Front Desk</option><option>Technician</option><option>Accountant</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newUser')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Add User</button>
      </div>
    </form>
  </div>
</div>

<!-- Status Update Modal -->
<div id="modal-statusUpdate" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:440px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Update Job Status</h3></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-statusUpdate')"><i class="fas fa-times"></i></button>
    </div>
    <div id="statusUpdateContent"></div>
  </div>
</div>

<!-- Toast Notification -->
<div id="toast" class="fixed bottom-6 right-6 z-50 hidden">
  <div class="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium">
    <i id="toastIcon" class="fas fa-check-circle text-green-400"></i>
    <span id="toastMsg"></span>
  </div>
</div>

<script>
// ═══ GLOBAL STATE ═══
let allJobCards = [], allCustomers = [], allVehicles = [], allPFIs = [], allInvoices = [], allPackages = [], allUsers = [];
let statusChart = null, revenueChart = null, insurerChart = null;

const STATUS_CONFIG = {
  RECEIVED: { label:'Received', color:'#6366f1', bg:'#eef2ff', text:'#4f46e5' },
  INSPECTION: { label:'Inspection', color:'#f59e0b', bg:'#fffbeb', text:'#d97706' },
  PFI_PREPARATION: { label:'PFI Prep', color:'#8b5cf6', bg:'#f5f3ff', text:'#7c3aed' },
  AWAITING_INSURER_APPROVAL: { label:'Awaiting Approval', color:'#f97316', bg:'#fff7ed', text:'#ea580c' },
  REPAIR_IN_PROGRESS: { label:'In Progress', color:'#3b82f6', bg:'#eff6ff', text:'#2563eb' },
  WAITING_FOR_PARTS: { label:'Waiting Parts', color:'#ec4899', bg:'#fdf2f8', text:'#db2777' },
  QUALITY_CHECK: { label:'Quality Check', color:'#14b8a6', bg:'#f0fdfa', text:'#0d9488' },
  COMPLETED: { label:'Completed', color:'#22c55e', bg:'#f0fdf4', text:'#16a34a' },
  INVOICED: { label:'Invoiced', color:'#10b981', bg:'#ecfdf5', text:'#059669' },
  RELEASED: { label:'Released', color:'#64748b', bg:'#f8fafc', text:'#475569' }
};

const STATUS_FLOW = ['RECEIVED','INSPECTION','PFI_PREPARATION','AWAITING_INSURER_APPROVAL','REPAIR_IN_PROGRESS','WAITING_FOR_PARTS','QUALITY_CHECK','COMPLETED','INVOICED','RELEASED'];

const PFI_STATUS_CONFIG = {
  Draft:{ bg:'#f8fafc', text:'#64748b', icon:'fa-file' },
  Submitted:{ bg:'#eff6ff', text:'#2563eb', icon:'fa-paper-plane' },
  Approved:{ bg:'#f0fdf4', text:'#16a34a', icon:'fa-check-circle' },
  Rejected:{ bg:'#fef2f2', text:'#dc2626', icon:'fa-times-circle' },
  'Revision Requested':{ bg:'#fff7ed', text:'#ea580c', icon:'fa-redo' }
};

const ROLE_CONFIG = {
  Owner:{ bg:'#fee2e2', text:'#dc2626', icon:'fa-crown' },
  Manager:{ bg:'#fef3c7', text:'#d97706', icon:'fa-user-tie' },
  'Front Desk':{ bg:'#dbeafe', text:'#2563eb', icon:'fa-concierge-bell' },
  Technician:{ bg:'#dcfce7', text:'#16a34a', icon:'fa-wrench' },
  Accountant:{ bg:'#f5f3ff', text:'#7c3aed', icon:'fa-calculator' }
};

// ═══ UTILS ═══
function fmt(n) { return 'TZS ' + Number(n).toLocaleString('en-TZ'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }
function showToast(msg, type='success') {
  const t = document.getElementById('toast'), i = document.getElementById('toastIcon'), m = document.getElementById('toastMsg');
  i.className = 'fas ' + (type==='success' ? 'fa-check-circle text-green-400' : type==='error' ? 'fa-times-circle text-red-400' : 'fa-info-circle text-blue-400');
  m.textContent = msg; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

function statusBadge(s) {
  const c = STATUS_CONFIG[s] || { bg:'#f1f5f9', text:'#64748b', label:s };
  return \`<span class="status-pill" style="background:\${c.bg};color:\${c.text}">\${c.label}</span>\`;
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => { n.classList.remove('active'); n.style.color=''; });
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+page+"'")) {
      n.classList.add('active'); n.style.color='#fff';
    }
  });
  if (page === 'dashboard') loadDashboard();
  if (page === 'jobcards') loadJobCards();
  if (page === 'customers') loadCustomers();
  if (page === 'vehicles') loadVehicles();
  if (page === 'claims') loadClaims();
  if (page === 'invoices') loadInvoices();
  if (page === 'packages') loadPackages();
  if (page === 'analytics') loadAnalytics();
  if (page === 'users') loadUsers();
  window.scrollTo(0, 0);
}

// ═══ DASHBOARD ═══
async function loadDashboard() {
  const { data } = await axios.get('/api/dashboard');
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const stats = [
    { label:'Active Jobs', value:data.active, icon:'fa-clipboard-list', g1:'#2563eb', g2:'#3b82f6' },
    { label:'In Progress', value:data.inProgress, icon:'fa-tools', g1:'#16a34a', g2:'#22c55e' },
    { label:'Awaiting Approval', value:data.awaitingApproval, icon:'fa-clock', g1:'#d97706', g2:'#f59e0b' },
    { label:'Monthly Revenue', value:fmt(data.totalRevenue), icon:'fa-coins', g1:'#7c3aed', g2:'#8b5cf6' }
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s => \`
    <div class="stat-card" style="--g1:\${s.g1};--g2:\${s.g2}">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">\${s.label}</p>
          <p class="text-2xl font-bold">\${s.value}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <i class="fas \${s.icon} text-white"></i>
        </div>
      </div>
    </div>
  \`).join('');
  document.getElementById('recentJobsList').innerHTML = data.recentJobs.map(j => \`
    <div class="table-row flex items-center justify-between py-3 border-b border-gray-50 cursor-pointer rounded-lg px-2 hover:bg-blue-50 transition-colors" onclick="viewJobDetail('\${j.id}')">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style="background:\${STATUS_CONFIG[j.status]?.bg||'#f1f5f9'};color:\${STATUS_CONFIG[j.status]?.color||'#64748b'}">
          <i class="fas fa-car-side"></i>
        </div>
        <div>
          <p class="font-semibold text-sm text-gray-800">\${j.jobCardNumber}</p>
          <p class="text-xs text-gray-500">\${j.vehicleMake||''} \${j.vehicleModel||''} · \${j.vehicleReg||''}</p>
        </div>
      </div>
      <div class="text-right">
        \${statusBadge(j.status)}
        <p class="text-xs text-gray-400 mt-1">\${fmtDate(j.updatedAt)}</p>
      </div>
    </div>
  \`).join('');
  // Status Chart
  const statuses = Object.entries(data.recentJobs.reduce((acc,j) => { acc[j.status]=(acc[j.status]||0)+1; return acc; }, {}));
  const analyticsData = await axios.get('/api/analytics');
  const byStatus = analyticsData.data.byStatus;
  const labels = Object.keys(byStatus).map(s => STATUS_CONFIG[s]?.label || s);
  const values = Object.values(byStatus);
  const colors = Object.keys(byStatus).map(s => STATUS_CONFIG[s]?.color || '#94a3b8');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(document.getElementById('statusChart'), {
    type:'doughnut',
    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{size:11}, padding:12 } } }, cutout:'65%' }
  });
  // Insurer List
  const { byInsurer } = analyticsData.data;
  const insurerColors = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ec4899'];
  document.getElementById('insurerList').innerHTML = Object.entries(byInsurer).map(([insurer, count], i) => \`
    <div class="mb-3">
      <div class="flex justify-between text-sm mb-1">
        <span class="font-semibold text-gray-700">\${insurer}</span>
        <span class="text-gray-500">\${count} jobs</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:\${count * 20}%;background:\${insurerColors[i%insurerColors.length]}"></div></div>
    </div>
  \`).join('') || '<p class="text-gray-400 text-sm">No insurance jobs yet</p>';
}

// ═══ JOB CARDS ═══
async function loadJobCards() {
  const { data } = await axios.get('/api/jobcards');
  allJobCards = data;
  renderJobCards(data);
  renderStatusStrips(data);
}

function renderStatusStrips(jobs) {
  const counts = STATUS_FLOW.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});
  document.getElementById('jobStatusStrips').innerHTML = STATUS_FLOW.map(s => \`
    <button onclick="document.getElementById('jobStatusFilter').value='\${s}';filterJobCards()" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80" style="background:\${STATUS_CONFIG[s].bg};color:\${STATUS_CONFIG[s].text}">
      <span class="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">\${counts[s]}</span>
      \${STATUS_CONFIG[s].label}
    </button>
  \`).join('');
}

function renderJobCards(jobs) {
  const tbody = document.getElementById('jobCardsTable');
  if (!jobs.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-400"><i class="fas fa-clipboard text-3xl mb-3 block"></i>No job cards found</td></tr>'; return; }
  tbody.innerHTML = jobs.map(j => \`
    <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="viewJobDetail('\${j.id}')">
      <td class="px-4 py-3">
        <p class="font-bold text-blue-600 text-sm">\${j.jobCardNumber}</p>
        <p class="text-xs text-gray-400">\${fmtDate(j.createdAt)}</p>
      </td>
      <td class="px-4 py-3">
        <p class="font-semibold text-gray-800 text-sm">\${j.customer?.name||'—'}</p>
        <p class="text-xs text-gray-500"><i class="fas fa-car text-xs mr-1"></i>\${j.vehicle?.registrationNumber||'—'} · \${j.vehicle?.make||''} \${j.vehicle?.model||''}</p>
      </td>
      <td class="px-4 py-3">
        <span class="tag \${j.category==='Insurance'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}">\${j.category}</span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">\${j.insurer||'—'}</td>
      <td class="px-4 py-3">\${statusBadge(j.status)}</td>
      <td class="px-4 py-3 text-xs text-gray-500">\${fmtDate(j.updatedAt)}</td>
      <td class="px-4 py-3">
        <div class="flex gap-2" onclick="event.stopPropagation()">
          <button class="text-blue-500 hover:text-blue-700 text-sm" onclick="viewJobDetail('\${j.id}')" title="View"><i class="fas fa-eye"></i></button>
          <button class="text-amber-500 hover:text-amber-700 text-sm" onclick="showStatusModal('\${j.id}','\${j.status}')" title="Update Status"><i class="fas fa-exchange-alt"></i></button>
        </div>
      </td>
    </tr>
  \`).join('');
}

function filterJobCards(search) {
  const q = (search || document.getElementById('jobSearch').value || '').toLowerCase();
  const statusFilter = document.getElementById('jobStatusFilter').value;
  let filtered = allJobCards;
  if (statusFilter) filtered = filtered.filter(j => j.status === statusFilter);
  if (q) filtered = filtered.filter(j =>
    j.jobCardNumber.toLowerCase().includes(q) ||
    (j.customer?.name||'').toLowerCase().includes(q) ||
    (j.vehicle?.registrationNumber||'').toLowerCase().includes(q) ||
    (j.insurer||'').toLowerCase().includes(q) ||
    (j.claimReference||'').toLowerCase().includes(q)
  );
  renderJobCards(filtered);
}

async function viewJobDetail(id) {
  const { data: j } = await axios.get('/api/jobcards/' + id);
  showPage('jobdetail');
  document.getElementById('jobDetailTitle').textContent = j.jobCardNumber;
  document.getElementById('jobDetailSub').textContent = (j.vehicle?.make||'') + ' ' + (j.vehicle?.model||'') + ' · ' + (j.vehicle?.registrationNumber||'') + ' · ' + (j.customer?.name||'');
  
  const canMakeInvoice = j.status === 'COMPLETED' && !j.invoice;
  const canMakePFI = j.category === 'Insurance' && !j.pfi;
  
  document.getElementById('jobDetailActions').innerHTML = \`
    <button class="btn-secondary text-sm" onclick="showStatusModal('\${j.id}','\${j.status}')"><i class="fas fa-exchange-alt"></i> Update Status</button>
    \${canMakePFI ? \`<button class="btn-secondary text-sm" onclick="showPFIModal('\${j.id}')"><i class="fas fa-file-invoice"></i> Create PFI</button>\` : ''}
    \${canMakeInvoice ? \`<button class="btn-primary text-sm" onclick="showInvoiceModal('\${j.id}',\${j.pfi?.labourCost||0},\${j.parts?.reduce((s,p)=>s+p.totalCost,0)||0})"><i class="fas fa-receipt"></i> Generate Invoice</button>\` : ''}
  \`;
  
  const totalPartsCost = j.parts ? j.parts.reduce((s, p) => s + p.totalCost, 0) : 0;
  
  document.getElementById('jobDetailContent').innerHTML = \`
    <div class="grid lg:grid-cols-3 gap-5">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Status Progress -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Repair Progress</h4>
          <div class="flex items-center gap-1 flex-wrap">
            \${STATUS_FLOW.map((s, i) => {
              const cur = STATUS_FLOW.indexOf(j.status);
              const done = i < cur;
              const active = i === cur;
              return \`<div class="flex items-center">
                <div class="flex flex-col items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all \${active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}">\${done ? '<i class="fas fa-check text-xs"></i>' : (i+1)}</div>
                  <p class="text-xs text-center mt-1 leading-tight max-w-16 \${active?'text-blue-600 font-semibold':done?'text-green-600':'text-gray-400'}">\${STATUS_CONFIG[s].label}</p>
                </div>
                \${i < STATUS_FLOW.length-1 ? \`<div class="h-0.5 w-4 mx-0.5 mb-5 \${i < cur ? 'bg-green-400' : 'bg-gray-200'}"></div>\` : ''}
              </div>\`;
            }).join('')}
          </div>
        </div>
        <!-- Details -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Job Details</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Category</p><p class="font-semibold">\${j.category}</p></div>
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Technician</p><p class="font-semibold">\${j.technicianName||'—'}</p></div>
            \${j.claimReference ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Claim Ref</p><p class="font-semibold">\${j.claimReference}</p></div>\` : ''}
            \${j.insurer ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Insurer</p><p class="font-semibold">\${j.insurer}</p></div>\` : ''}
            \${j.assessor ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Assessor</p><p class="font-semibold">\${j.assessor}</p></div>\` : ''}
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Created</p><p class="font-semibold">\${fmtDate(j.createdAt)}</p></div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-gray-400 text-xs font-semibold uppercase mb-2">Damage / Service Description</p>
            <p class="text-sm text-gray-700">\${j.damageDescription}</p>
          </div>
          \${j.inspectionNotes ? \`<div class="mt-3 pt-3 border-t border-gray-100"><p class="text-gray-400 text-xs font-semibold uppercase mb-2">Inspection Notes</p><p class="text-sm text-gray-700">\${j.inspectionNotes}</p></div>\` : ''}
        </div>
        <!-- Parts Consumption -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-gray-800">Parts Consumed</h4>
            <button class="btn-secondary text-xs" onclick="showPartsModal('\${j.id}')"><i class="fas fa-plus"></i> Add Part</button>
          </div>
          \${j.parts && j.parts.length ? \`
            <table class="w-full text-sm">
              <thead><tr class="text-xs text-gray-400 uppercase border-b">
                <th class="text-left pb-2">Part</th><th class="text-right pb-2">Qty</th><th class="text-right pb-2">Unit Cost</th><th class="text-right pb-2">Total</th>
              </tr></thead>
              <tbody>\${j.parts.map(p => \`
                <tr class="border-b border-gray-50">
                  <td class="py-2 font-medium">\${p.partName}</td>
                  <td class="py-2 text-right">\${p.quantity}</td>
                  <td class="py-2 text-right">\${fmt(p.unitCost)}</td>
                  <td class="py-2 text-right font-semibold">\${fmt(p.totalCost)}</td>
                </tr>
              \`).join('')}</tbody>
              <tfoot><tr><td colspan="3" class="pt-3 font-bold text-gray-600 text-right">Total Parts Cost:</td><td class="pt-3 font-bold text-right text-blue-600">\${fmt(totalPartsCost)}</td></tr></tfoot>
            </table>
          \` : '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-box-open text-2xl mb-2 block"></i>No parts recorded yet</p>'}
        </div>
        <!-- Activity Log -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Activity Log</h4>
          <div class="space-y-3">
            \${j.logs && j.logs.length ? j.logs.map(log => \`
              <div class="flex gap-3">
                <div class="timeline-dot bg-blue-400 mt-1.5 flex-shrink-0"></div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-700">\${log.description}</p>
                  <p class="text-xs text-gray-400 mt-0.5">\${log.userName} · \${fmtDate(log.timestamp)}</p>
                </div>
              </div>
            \`).join('') : '<p class="text-gray-400 text-sm">No activity yet</p>'}
          </div>
        </div>
      </div>
      <!-- Sidebar -->
      <div class="space-y-5">
        <!-- Customer -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Customer</h4>
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">\${(j.customer?.name||'?').charAt(0)}</div>
            <div><p class="font-semibold text-gray-800">\${j.customer?.name||'—'}</p><p class="text-xs text-gray-500">\${j.customer?.phone||''}</p></div>
          </div>
          <p class="text-xs text-gray-500">\${j.customer?.email||''}</p>
          <p class="text-xs text-gray-500 mt-1">\${j.customer?.address||''}</p>
        </div>
        <!-- Vehicle -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Vehicle</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-400">Reg #</span><span class="font-semibold">\${j.vehicle?.registrationNumber||'—'}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Make</span><span class="font-semibold">\${j.vehicle?.make||'—'} \${j.vehicle?.model||''}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Year</span><span class="font-semibold">\${j.vehicle?.year||'—'}</span></div>
            \${j.vehicle?.vin ? \`<div class="flex justify-between"><span class="text-gray-400">VIN</span><span class="font-mono text-xs">\${j.vehicle.vin}</span></div>\` : ''}
            \${j.vehicle?.insurer ? \`<div class="flex justify-between"><span class="text-gray-400">Insurer</span><span class="font-semibold text-xs text-right max-w-28">\${j.vehicle.insurer}</span></div>\` : ''}
          </div>
        </div>
        <!-- PFI -->
        \${j.pfi ? \`
          <div class="card p-5">
            <h4 class="font-bold text-gray-800 mb-4">PFI – Pro Forma Invoice</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">Labour</span><span class="font-semibold">\${fmt(j.pfi.labourCost)}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Parts</span><span class="font-semibold">\${fmt(j.pfi.partsCost)}</span></div>
              <div class="flex justify-between border-t pt-2 font-bold"><span>Total Estimate</span><span class="text-blue-600">\${fmt(j.pfi.totalEstimate)}</span></div>
            </div>
            <div class="mt-3">
              <span class="badge" style="background:\${PFI_STATUS_CONFIG[j.pfi.status]?.bg};color:\${PFI_STATUS_CONFIG[j.pfi.status]?.text}">\${j.pfi.status}</span>
            </div>
          </div>
        \` : ''}
        <!-- Invoice -->
        \${j.invoice ? \`
          <div class="card p-5 border-2 border-green-200">
            <h4 class="font-bold text-gray-800 mb-4"><i class="fas fa-receipt text-green-500 mr-2"></i>Invoice</h4>
            <p class="text-xs text-gray-400 mb-2">\${j.invoice.invoiceNumber}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">Labour</span><span>\${fmt(j.invoice.labourCost)}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Parts</span><span>\${fmt(j.invoice.partsCost)}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Tax (18%)</span><span>\${fmt(j.invoice.tax)}</span></div>
              <div class="flex justify-between border-t pt-2 font-bold text-green-600"><span>Total</span><span>\${fmt(j.invoice.totalAmount)}</span></div>
            </div>
            <div class="mt-2"><span class="badge \${j.invoice.status==='Paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}">\${j.invoice.status}</span></div>
          </div>
        \` : ''}
      </div>
    </div>
  \`;
}

// Parts Modal
function showPartsModal(jobId) {
  openModal('modal-statusUpdate');
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-4">Record parts used for this job</p>
    <div class="mb-3"><label class="form-label">Part Name</label><input class="form-input" id="part-name" required placeholder="e.g. Front Bumper Assembly"/></div>
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div><label class="form-label">Qty</label><input class="form-input" type="number" id="part-qty" required min="1" value="1"/></div>
      <div><label class="form-label">Unit Cost (TZS)</label><input class="form-input" type="number" id="part-unit" required min="0"/></div>
      <div><label class="form-label">Total</label><input class="form-input" id="part-total" readonly placeholder="Auto"/></div>
    </div>
    <div class="flex gap-3">
      <button type="button" class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button type="button" class="btn-primary flex-1" id="part-submit-btn"><i class="fas fa-plus"></i> Add Part</button>
    </div>
  \`;
  const calcTotal = () => {
    const q = +document.getElementById('part-qty').value||0;
    const u = +document.getElementById('part-unit').value||0;
    document.getElementById('part-total').value = (q*u).toLocaleString();
  };
  document.getElementById('part-qty').addEventListener('input', calcTotal);
  document.getElementById('part-unit').addEventListener('input', calcTotal);
  document.getElementById('part-submit-btn').addEventListener('click', async () => {
    const qty = +document.getElementById('part-qty').value;
    const unit = +document.getElementById('part-unit').value;
    const name = document.getElementById('part-name').value;
    if (!name || !qty || !unit) { showToast('Please fill all fields', 'error'); return; }
    await axios.post('/api/jobcards/' + jobId + '/parts', { partName: name, quantity: qty, unitCost: unit, totalCost: qty*unit });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    showToast('Part added successfully');
  });
}

// PFI Modal
function showPFIModal(jobId) {
  openModal('modal-statusUpdate');
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-4">Create a Pro Forma Invoice for insurer approval</p>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><label class="form-label">Labour Cost (TZS)</label><input class="form-input" type="number" id="pfi-labour" required min="0"/></div>
      <div><label class="form-label">Parts Cost (TZS)</label><input class="form-input" type="number" id="pfi-parts" required min="0"/></div>
    </div>
    <div class="mb-3"><label class="form-label">Total Estimate</label><input class="form-input" id="pfi-total" readonly placeholder="Auto-calculated"/></div>
    <div class="mb-5"><label class="form-label">Notes</label><textarea class="form-input" id="pfi-notes" rows="2" placeholder="Additional notes for insurer…"></textarea></div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button class="btn-primary flex-1" id="pfi-submit"><i class="fas fa-paper-plane"></i> Submit PFI</button>
    </div>
  \`;
  const calcTotal = () => {
    const l = +document.getElementById('pfi-labour').value||0, p = +document.getElementById('pfi-parts').value||0;
    document.getElementById('pfi-total').value = fmt(l+p);
  };
  document.getElementById('pfi-labour').oninput = calcTotal;
  document.getElementById('pfi-parts').oninput = calcTotal;
  document.getElementById('pfi-submit').onclick = async () => {
    const l = +document.getElementById('pfi-labour').value, p = +document.getElementById('pfi-parts').value;
    await axios.post('/api/jobcards/' + jobId + '/pfi', { labourCost:l, partsCost:p, totalEstimate:l+p, status:'Submitted', notes:document.getElementById('pfi-notes').value });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    showToast('PFI submitted to insurer');
  };
}

// Invoice Modal
function showInvoiceModal(jobId, labourCost, partsCost) {
  openModal('modal-statusUpdate');
  const tax = Math.round((labourCost + partsCost) * 0.18);
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-4">Generate final invoice for this job</p>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><label class="form-label">Labour Cost</label><input class="form-input" type="number" id="inv-labour" value="\${labourCost}"/></div>
      <div><label class="form-label">Parts Cost</label><input class="form-input" type="number" id="inv-parts" value="\${partsCost}"/></div>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div><label class="form-label">Tax (TZS)</label><input class="form-input" type="number" id="inv-tax" value="\${tax}"/></div>
      <div><label class="form-label">Status</label><select class="form-input" id="inv-status"><option>Issued</option><option>Paid</option></select></div>
    </div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button class="btn-primary flex-1" id="inv-submit"><i class="fas fa-receipt"></i> Generate Invoice</button>
    </div>
  \`;
  document.getElementById('inv-submit').onclick = async () => {
    const l = +document.getElementById('inv-labour').value, p = +document.getElementById('inv-parts').value, t = +document.getElementById('inv-tax').value;
    await axios.post('/api/jobcards/' + jobId + '/invoice', { labourCost:l, partsCost:p, tax:t, totalAmount:l+p+t, status:document.getElementById('inv-status').value });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    showToast('Invoice generated successfully');
  };
}

// Status Update Modal
function showStatusModal(jobId, currentStatus) {
  openModal('modal-statusUpdate');
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-600 mb-4">Current: \${statusBadge(currentStatus)}</p>
    <div class="space-y-2 mb-5">
      \${STATUS_FLOW.map((s, i) => {
        const isCurrentOrPrev = i <= currentIdx;
        return \`<button class="w-full text-left px-4 py-3 rounded-xl border-2 transition-all \${s === currentStatus ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'} \${isCurrentOrPrev && s !== currentStatus ? 'opacity-40' : ''}" onclick="updateJobStatus('\${jobId}','\${s}')"
          \${isCurrentOrPrev && s !== currentStatus ? 'disabled' : ''}>
          <div class="flex items-center gap-3">
            <span class="status-pill" style="background:\${STATUS_CONFIG[s].bg};color:\${STATUS_CONFIG[s].text}">\${STATUS_CONFIG[s].label}</span>
            \${s === currentStatus ? '<span class="ml-auto text-xs text-blue-500 font-semibold">Current</span>' : ''}
          </div>
        </button>\`;
      }).join('')}
    </div>
    <button class="btn-secondary w-full" onclick="closeModal('modal-statusUpdate')">Cancel</button>
  \`;
}

async function updateJobStatus(jobId, status) {
  await axios.patch('/api/jobcards/' + jobId + '/status', { status });
  closeModal('modal-statusUpdate');
  const activePage = document.querySelector('.page.active')?.id;
  if (activePage === 'page-jobdetail') viewJobDetail(jobId);
  else loadJobCards();
  showToast('Status updated to ' + STATUS_CONFIG[status]?.label);
}

// New Job Modal
async function showNewJobModal() {
  const [custs, techs] = await Promise.all([axios.get('/api/customers'), axios.get('/api/users')]);
  allCustomers = custs.data; allVehicles = (await axios.get('/api/vehicles')).data;
  document.getElementById('job-customerId').innerHTML = '<option value="">Select customer…</option>' + custs.data.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
  document.getElementById('job-technician').innerHTML = '<option value="">Select…</option>' + techs.data.filter(u => u.role === 'Technician').map(u => \`<option value="\${u.id}">\${u.name}</option>\`).join('');
  openModal('modal-newJob');
}

function loadCustomerVehicles() {
  const custId = document.getElementById('job-customerId').value;
  const cvs = allVehicles.filter(v => v.customerId === custId);
  document.getElementById('job-vehicleId').innerHTML = '<option value="">Select vehicle…</option>' + cvs.map(v => \`<option value="\${v.id}">\${v.registrationNumber} – \${v.make} \${v.model}</option>\`).join('');
}

function toggleInsuranceFields() {
  const cat = document.getElementById('job-category').value;
  document.getElementById('insuranceFields').style.display = cat === 'Insurance' ? 'block' : 'none';
}

async function submitNewJob(e) {
  e.preventDefault();
  const cat = document.getElementById('job-category').value;
  const payload = {
    customerId: document.getElementById('job-customerId').value,
    vehicleId: document.getElementById('job-vehicleId').value,
    assignedTechnician: document.getElementById('job-technician').value,
    category: cat,
    damageDescription: document.getElementById('job-damage').value,
    inspectionNotes: document.getElementById('job-notes').value,
    ...(cat === 'Insurance' ? {
      claimReference: document.getElementById('job-claimRef').value,
      insurer: document.getElementById('job-insurer').value,
      assessor: document.getElementById('job-assessor').value,
    } : {})
  };
  const { data } = await axios.post('/api/jobcards', payload);
  closeModal('modal-newJob');
  document.getElementById('newJobForm').reset();
  showToast('Job card ' + data.jobCardNumber + ' created!');
  loadJobCards();
  showPage('jobcards');
}

// ═══ CUSTOMERS ═══
async function loadCustomers() {
  const { data } = await axios.get('/api/customers');
  allCustomers = data;
  renderCustomers(data);
}

function renderCustomers(list) {
  document.getElementById('customersGrid').innerHTML = list.map(c => \`
    <div class="card p-5 hover:shadow-lg transition-shadow cursor-pointer" onclick="viewCustomerDetail('\${c.id}')">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold">\${c.name.charAt(0)}</div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-900">\${c.name}</h3>
          <p class="text-sm text-gray-500">\${c.phone}</p>
          <p class="text-xs text-gray-400">\${c.email||'—'}</p>
        </div>
      </div>
      <div class="flex gap-3 border-t pt-3">
        <div class="text-center flex-1">
          <p class="text-lg font-bold text-blue-600">\${c.vehicleCount}</p>
          <p class="text-xs text-gray-400">Vehicles</p>
        </div>
        <div class="border-l"></div>
        <div class="text-center flex-1">
          <p class="text-lg font-bold text-green-600">\${c.jobCount}</p>
          <p class="text-xs text-gray-400">Jobs</p>
        </div>
        <div class="border-l"></div>
        <div class="text-center flex-1">
          <p class="text-xs text-gray-400">Since</p>
          <p class="text-xs font-semibold text-gray-600">\${fmtDate(c.createdAt)}</p>
        </div>
      </div>
    </div>
  \`).join('') || '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-users text-4xl mb-3 block"></i>No customers found</div>';
}

function filterCustomers(q) {
  const lq = q.toLowerCase();
  renderCustomers(allCustomers.filter(c => c.name.toLowerCase().includes(lq) || c.phone.includes(lq) || (c.email||'').toLowerCase().includes(lq)));
}

async function viewCustomerDetail(id) {
  const { data: c } = await axios.get('/api/customers/' + id);
  openModal('modal-statusUpdate');
  document.getElementById('statusUpdateContent').innerHTML = \`
    <div class="flex items-center gap-4 mb-5">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">\${c.name.charAt(0)}</div>
      <div><h3 class="text-xl font-bold">\${c.name}</h3><p class="text-gray-500">\${c.phone} · \${c.email||'—'}</p></div>
    </div>
    <div class="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-2">
      <div class="flex gap-2"><i class="fas fa-map-marker-alt text-gray-400 w-4"></i><span>\${c.address||'—'}</span></div>
      \${c.idNumber ? \`<div class="flex gap-2"><i class="fas fa-id-card text-gray-400 w-4"></i><span>\${c.idNumber}</span></div>\` : ''}
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-blue-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-blue-600">\${c.vehicles?.length||0}</p><p class="text-xs text-gray-500">Vehicles</p></div>
      <div class="bg-green-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-green-600">\${c.jobs?.length||0}</p><p class="text-xs text-gray-500">Job Cards</p></div>
    </div>
    <div class="mb-4">
      <p class="font-semibold text-gray-700 text-sm mb-2">Vehicles</p>
      \${c.vehicles?.map(v => \`<div class="flex items-center gap-2 py-2 border-b text-sm"><i class="fas fa-car text-blue-400"></i><span class="font-medium">\${v.registrationNumber}</span><span class="text-gray-500">\${v.make} \${v.model} \${v.year}</span></div>\`).join('')||'<p class="text-gray-400 text-sm">No vehicles</p>'}
    </div>
    <button class="btn-secondary w-full" onclick="closeModal('modal-statusUpdate')">Close</button>
  \`;
}

function showNewCustomerModal() { openModal('modal-newCustomer'); }

async function submitNewCustomer(e) {
  e.preventDefault();
  const payload = { name:document.getElementById('cust-name').value, phone:document.getElementById('cust-phone').value, email:document.getElementById('cust-email').value, address:document.getElementById('cust-address').value, idNumber:document.getElementById('cust-id').value };
  await axios.post('/api/customers', payload);
  closeModal('modal-newCustomer');
  document.getElementById('newCustomerForm').reset();
  showToast('Customer added successfully');
  loadCustomers();
}

// ═══ VEHICLES ═══
async function loadVehicles() {
  const { data } = await axios.get('/api/vehicles');
  allVehicles = data;
  renderVehicles(data);
}

function renderVehicles(list) {
  document.getElementById('vehiclesTable').innerHTML = list.map(v => \`
    <tr class="table-row border-b border-gray-50">
      <td class="px-4 py-3"><span class="font-bold text-blue-600 text-sm">\${v.registrationNumber}</span></td>
      <td class="px-4 py-3"><span class="font-semibold text-gray-800">\${v.make}</span><span class="text-gray-500"> \${v.model}</span></td>
      <td class="px-4 py-3 text-gray-600">\${v.year}</td>
      <td class="px-4 py-3 text-sm text-gray-700">\${v.customerName||'—'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">\${v.insurer||'—'}</td>
      <td class="px-4 py-3 font-mono text-xs text-gray-400">\${v.vin||'—'}</td>
      <td class="px-4 py-3">
        <button class="text-blue-500 hover:text-blue-700 text-sm mr-2" title="View jobs" onclick="showPage('jobcards')"><i class="fas fa-clipboard-list"></i></button>
      </td>
    </tr>
  \`).join('');
}

function filterVehicles(q) {
  const lq = q.toLowerCase();
  renderVehicles(allVehicles.filter(v => v.registrationNumber.toLowerCase().includes(lq) || v.make.toLowerCase().includes(lq) || v.model.toLowerCase().includes(lq) || (v.customerName||'').toLowerCase().includes(lq)));
}

async function showNewVehicleModal() {
  if (!allCustomers.length) { const { data } = await axios.get('/api/customers'); allCustomers = data; }
  document.getElementById('veh-customerId').innerHTML = '<option value="">Select customer…</option>' + allCustomers.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
  openModal('modal-newVehicle');
}

async function submitNewVehicle(e) {
  e.preventDefault();
  const payload = { customerId:document.getElementById('veh-customerId').value, registrationNumber:document.getElementById('veh-reg').value, make:document.getElementById('veh-make').value, model:document.getElementById('veh-model').value, year:+document.getElementById('veh-year').value, vin:document.getElementById('veh-vin').value, engineNumber:document.getElementById('veh-engine').value, insurer:document.getElementById('veh-insurer').value, policyNumber:document.getElementById('veh-policy').value };
  await axios.post('/api/vehicles', payload);
  closeModal('modal-newVehicle');
  document.getElementById('newVehicleForm').reset();
  showToast('Vehicle registered successfully');
  loadVehicles();
}

// ═══ CLAIMS ═══
async function loadClaims() {
  const [pfiData, jobData] = await Promise.all([axios.get('/api/pfis'), axios.get('/api/jobcards')]);
  allPFIs = pfiData.data; allJobCards = jobData.data;
  renderClaims(allPFIs);
}

function renderClaims(pfis) {
  const grid = document.getElementById('claimsGrid');
  if (!pfis.length) { grid.innerHTML = '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-shield-alt text-4xl mb-3 block"></i>No PFIs found</div>'; return; }
  grid.innerHTML = pfis.map(pfi => {
    const job = allJobCards.find(j => j.id === pfi.jobCardId);
    const cfg = PFI_STATUS_CONFIG[pfi.status] || PFI_STATUS_CONFIG['Draft'];
    return \`
      <div class="card p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-bold text-gray-900">\${job?.jobCardNumber||'—'}</p>
            <p class="text-sm text-gray-500">\${job?.customer?.name||'—'}</p>
          </div>
          <span class="badge" style="background:\${cfg.bg};color:\${cfg.text}"><i class="fas \${cfg.icon} mr-1"></i>\${pfi.status}</span>
        </div>
        \${job?.insurer ? \`<div class="flex items-center gap-2 mb-3 text-sm text-gray-600"><i class="fas fa-shield-alt text-blue-400"></i>\${job.insurer}</div>\` : ''}
        \${job?.claimReference ? \`<p class="text-xs text-gray-400 mb-3"><i class="fas fa-hashtag mr-1"></i>\${job.claimReference}</p>\` : ''}
        <div class="bg-gray-50 rounded-xl p-3 mb-4">
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Labour</span><span class="font-semibold">\${fmt(pfi.labourCost)}</span></div>
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Parts</span><span class="font-semibold">\${fmt(pfi.partsCost)}</span></div>
          <div class="flex justify-between text-sm font-bold border-t pt-2"><span>Total</span><span class="text-blue-600">\${fmt(pfi.totalEstimate)}</span></div>
        </div>
        \${pfi.notes ? \`<p class="text-xs text-gray-500 mb-3 italic">"\${pfi.notes}"</p>\` : ''}
        <div class="flex gap-2">
          \${pfi.status === 'Submitted' ? \`
            <button class="btn-primary text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Approved')"><i class="fas fa-check"></i> Approve</button>
            <button class="btn-danger text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Rejected')"><i class="fas fa-times"></i> Reject</button>
          \` : ''}
          \${pfi.status === 'Draft' ? \`<button class="btn-primary text-xs w-full" onclick="updatePFIStatus('\${pfi.id}','Submitted')"><i class="fas fa-paper-plane"></i> Submit to Insurer</button>\` : ''}
        </div>
      </div>
    \`;
  }).join('');
}

function filterPFIs(status, btn) {
  document.querySelectorAll('#page-claims .flex button').forEach(b => { b.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'; });
  btn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white';
  renderClaims(status === 'all' ? allPFIs : allPFIs.filter(p => p.status === status));
}

async function updatePFIStatus(pfiId, status) {
  await axios.patch('/api/pfi/' + pfiId, { status });
  showToast('PFI status updated to ' + status, status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info');
  loadClaims();
}

// ═══ INVOICES ═══
async function loadInvoices() {
  const { data } = await axios.get('/api/invoices');
  allInvoices = data;
  const total = data.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  document.getElementById('totalRevDisplay').textContent = fmt(total);
  document.getElementById('invoicesTable').innerHTML = data.map(inv => \`
    <tr class="table-row border-b border-gray-50">
      <td class="px-4 py-3 font-bold text-blue-600 text-sm">\${inv.invoiceNumber}</td>
      <td class="px-4 py-3 text-sm font-medium text-gray-700">\${inv.jobCardNumber||'—'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">\${inv.customerName||'—'}</td>
      <td class="px-4 py-3 text-sm">\${fmt(inv.labourCost)}</td>
      <td class="px-4 py-3 text-sm">\${fmt(inv.partsCost)}</td>
      <td class="px-4 py-3 text-sm">\${fmt(inv.tax)}</td>
      <td class="px-4 py-3 font-bold text-green-600">\${fmt(inv.totalAmount)}</td>
      <td class="px-4 py-3"><span class="badge \${inv.status==='Paid'?'bg-green-100 text-green-700':inv.status==='Overdue'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}">\${inv.status}</span></td>
    </tr>
  \`).join('') || '<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-file-invoice text-3xl mb-3 block"></i>No invoices yet</td></tr>';
}

// ═══ PACKAGES ═══
async function loadPackages() {
  const { data } = await axios.get('/api/packages');
  allPackages = data;
  document.getElementById('packagesGrid').innerHTML = data.map(pkg => \`
    <div class="card p-5">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <i class="fas fa-box-open text-white"></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-900">\${pkg.packageName}</h3>
          <p class="text-xs text-gray-400">\${pkg.estimatedHours}h estimated</p>
        </div>
      </div>
      <p class="text-sm text-gray-600 mb-4">\${pkg.description||'—'}</p>
      \${pkg.parts?.length ? \`
        <div class="bg-gray-50 rounded-xl p-3 mb-4">
          <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Included Parts</p>
          \${pkg.parts.map(p => \`<div class="flex justify-between text-xs py-1"><span>\${p.name} x\${p.quantity}</span><span class="text-gray-500">\${fmt(p.unitCost)}</span></div>\`).join('')}
        </div>
      \` : ''}
      <div class="flex items-center justify-between border-t pt-3">
        <span class="text-xs text-gray-500">Labour Cost</span>
        <span class="font-bold text-blue-600">\${fmt(pkg.labourCost)}</span>
      </div>
    </div>
  \`).join('');
}

function showNewPackageModal() { openModal('modal-newPackage'); }

async function submitNewPackage(e) {
  e.preventDefault();
  const payload = { packageName:document.getElementById('pkg-name').value, description:document.getElementById('pkg-desc').value, labourCost:+document.getElementById('pkg-labour').value, estimatedHours:+document.getElementById('pkg-hours').value, parts:[] };
  await axios.post('/api/packages', payload);
  closeModal('modal-newPackage');
  document.getElementById('newPackageForm').reset();
  showToast('Service package created');
  loadPackages();
}

// ═══ ANALYTICS ═══
async function loadAnalytics() {
  const { data } = await axios.get('/api/analytics');
  const stats = [
    { label:'Total Revenue', value:fmt(data.totalRevenue), icon:'fa-coins', color:'#2563eb' },
    { label:'Total Margin', value:fmt(data.margin), icon:'fa-chart-line', color:'#16a34a' },
    { label:'Avg Job Value', value:fmt(data.avgJobValue), icon:'fa-file-invoice', color:'#7c3aed' },
    { label:'Invoices Paid', value:data.invoiceCount, icon:'fa-check-double', color:'#d97706' },
  ];
  document.getElementById('analyticsStats').innerHTML = stats.map(s => \`
    <div class="card p-5 border-l-4" style="border-color:\${s.color}">
      <div class="flex items-center gap-3 mb-1">
        <i class="fas \${s.icon}" style="color:\${s.color}"></i>
        <p class="text-xs text-gray-500 font-semibold uppercase">\${s.label}</p>
      </div>
      <p class="text-xl font-bold text-gray-900">\${s.value}</p>
    </div>
  \`).join('');
  // Revenue Breakdown Chart
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(document.getElementById('revenueChart'), {
    type:'bar',
    data:{ labels:['Labour','Parts','Tax','Net Margin'], datasets:[{ data:[data.totalLabour, data.totalParts, data.totalRevenue - data.totalLabour - data.totalParts - data.margin, data.margin], backgroundColor:['#3b82f6','#8b5cf6','#f59e0b','#22c55e'], borderRadius:8, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ ticks:{ callback: v => 'TZS ' + (v/1000).toFixed(0) + 'k' } } } }
  });
  // Insurer Chart
  const insurerLabels = Object.keys(data.byInsurer);
  const insurerValues = Object.values(data.byInsurer);
  if (insurerChart) insurerChart.destroy();
  insurerChart = new Chart(document.getElementById('insurerChart'), {
    type:'pie',
    data:{ labels:insurerLabels, datasets:[{ data:insurerValues, backgroundColor:['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ec4899'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11}, padding:12 } } } }
  });
}

// ═══ USERS ═══
async function loadUsers() {
  const { data } = await axios.get('/api/users');
  allUsers = data;
  document.getElementById('usersGrid').innerHTML = data.map(u => {
    const rc = ROLE_CONFIG[u.role] || { bg:'#f1f5f9', text:'#64748b', icon:'fa-user' };
    return \`
      <div class="card p-5">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold" style="background:linear-gradient(135deg,\${rc.text},\${rc.text}aa)">\${u.name.charAt(0)}</div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">\${u.name}</h3>
            <p class="text-sm text-gray-500">\${u.email}</p>
          </div>
          <span class="w-2 h-2 rounded-full mt-2 \${u.active ? 'bg-green-400' : 'bg-gray-300'}" title="\${u.active?'Active':'Inactive'}"></span>
        </div>
        <div class="flex items-center justify-between">
          <span class="badge" style="background:\${rc.bg};color:\${rc.text}"><i class="fas \${rc.icon} mr-1"></i>\${u.role}</span>
          <p class="text-xs text-gray-400">\${u.phone||''}</p>
        </div>
      </div>
    \`;
  }).join('');
}

function showNewUserModal() { openModal('modal-newUser'); }

async function submitNewUser(e) {
  e.preventDefault();
  const payload = { name:document.getElementById('usr-name').value, email:document.getElementById('usr-email').value, phone:document.getElementById('usr-phone').value, role:document.getElementById('usr-role').value, active:true };
  await axios.post('/api/users', payload);
  closeModal('modal-newUser');
  document.getElementById('newUserForm').reset();
  showToast('Team member added');
  loadUsers();
}

// ═══ GLOBAL SEARCH ═══
function handleGlobalSearch(q) {
  if (!q) return;
  if (allJobCards.some(j => j.jobCardNumber.toLowerCase().includes(q.toLowerCase()))) {
    showPage('jobcards');
    document.getElementById('jobSearch').value = q;
    filterJobCards(q);
  }
}

// ═══ INIT ═══
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
loadDashboard();
</script>
</body>
</html>`;
}

export default app
