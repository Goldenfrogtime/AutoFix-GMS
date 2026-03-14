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
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
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
.parts-cat-tab{padding:6px 16px;border-radius:99px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s}
.parts-cat-tab:hover{border-color:#3b82f6;color:#2563eb;background:#eff6ff}
.parts-cat-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}
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
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('appointments')">
      <i class="fas fa-calendar-check w-5 text-center"></i> Appointments
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Operations</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('customers')">
      <i class="fas fa-users w-5 text-center"></i> Customers
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('vehicles')">
      <i class="fas fa-car w-5 text-center"></i> Vehicles
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('claims')">
      <i class="fas fa-file-invoice w-5 text-center"></i> PFIs
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('invoices')">
      <i class="fas fa-file-invoice-dollar w-5 text-center"></i> Invoices
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Management</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('packages')">
      <i class="fas fa-box-open w-5 text-center"></i> Service Packages
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('oil-services')">
      <i class="fas fa-oil-can w-5 text-center"></i> Oil Services
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('parts-catalogue')">
      <i class="fas fa-cubes w-5 text-center"></i> Parts Catalogue
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('car-wash')">
      <i class="fas fa-shower w-5 text-center"></i> Car Wash
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('add-ons')">
      <i class="fas fa-wrench w-5 text-center"></i> Add-on Services
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
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-gray-800">Today's Appointments</h3>
              <button class="text-blue-600 text-xs font-semibold hover:underline" onclick="showPage('appointments')">View All →</button>
            </div>
            <div id="dashTodayApts"><p class="text-gray-400 text-sm text-center py-4">Loading…</p></div>
          </div>
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
                <i class="fas fa-file-invoice"></i> Manage PFIs
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
    <!-- ═══ APPOINTMENTS ═══ -->
    <div id="page-appointments" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Appointments</h2>
          <p class="text-gray-500 text-sm mt-1">Schedule and manage vehicle service appointments</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-primary" onclick="showNewAppointmentModal()"><i class="fas fa-plus"></i> New Appointment</button>
        </div>
      </div>

      <!-- Stat chips -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5" id="apt-statChips"></div>

      <!-- Filters bar -->
      <div class="card p-4 mb-5">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[180px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search customer, vehicle, service…" oninput="filterAppointments()" id="apt-search"/>
          </div>
          <input type="date" id="apt-dateFilter" class="form-input w-auto text-sm" onchange="filterAppointments()" title="Filter by date"/>
          <select id="apt-statusFilter" class="form-input w-auto text-sm" onchange="filterAppointments()">
            <option value="">All Statuses</option>
            <option>Scheduled</option><option>Confirmed</option><option>In Progress</option>
            <option>Completed</option><option>Cancelled</option><option>No Show</option>
          </select>
          <button class="btn-secondary text-sm" onclick="clearAptFilters()"><i class="fas fa-times mr-1"></i>Clear</button>
        </div>
      </div>

      <!-- View toggle: List / Calendar -->
      <div class="flex gap-2 mb-4">
        <button id="apt-view-list" class="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white" onclick="setAptView('list')"><i class="fas fa-list mr-1"></i>List</button>
        <button id="apt-view-calendar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="setAptView('calendar')"><i class="fas fa-calendar-alt mr-1"></i>Calendar</button>
      </div>

      <!-- List View -->
      <div id="apt-listView">
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead><tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Date &amp; Time</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Vehicle</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Technician</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Duration</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr></thead>
            <tbody id="apt-tableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- Calendar View -->
      <div id="apt-calendarView" class="hidden">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <button class="btn-secondary text-sm px-3 py-2" onclick="calNav(-1)"><i class="fas fa-chevron-left"></i></button>
            <h3 class="text-lg font-bold text-gray-800" id="cal-monthLabel"></h3>
            <button class="btn-secondary text-sm px-3 py-2" onclick="calNav(1)"><i class="fas fa-chevron-right"></i></button>
          </div>
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Sun</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Mon</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Tue</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Wed</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Thu</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Fri</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Sat</div>
          </div>
          <div class="grid grid-cols-7 gap-1" id="cal-grid"></div>
        </div>
        <!-- Day detail panel -->
        <div id="cal-dayPanel" class="card p-5 mt-4 hidden">
          <h4 class="font-bold text-gray-800 mb-3" id="cal-dayTitle"></h4>
          <div id="cal-dayList"></div>
        </div>
      </div>
    </div>

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
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Customers</h2>
          <p class="text-gray-500 text-sm mt-1">Manage customer profiles and history</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input" type="text" placeholder="Search customers…" id="customerSearchInput" oninput="filterCustomers(this.value)"/>
          </div>
          <button class="btn-primary" onclick="showNewCustomerModal()"><i class="fas fa-user-plus"></i> Add Customer</button>
        </div>
      </div>
      <!-- Customer Type Tabs -->
      <div class="flex gap-2 mb-5" id="customerTypeTabs">
        <button id="custTab-all" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white transition-all" onclick="setCustomerTab('all',this)">
          <i class="fas fa-users"></i> All Customers <span id="custCount-all" class="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full ml-1">0</span>
        </button>
        <button id="custTab-Individual" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all" onclick="setCustomerTab('Individual',this)">
          <i class="fas fa-user"></i> Individual <span id="custCount-Individual" class="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full ml-1">0</span>
        </button>
        <button id="custTab-Corporate" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all" onclick="setCustomerTab('Corporate',this)">
          <i class="fas fa-building"></i> Corporate <span id="custCount-Corporate" class="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full ml-1">0</span>
        </button>
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
          <button class="btn-secondary" onclick="showFleetUploadModal()"><i class="fas fa-file-upload"></i> Upload Fleet</button>
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
            <th class="text-left px-4 py-3 font-semibold text-gray-600">VIN / Chassis</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
          </tr></thead>
          <tbody id="vehiclesTable"></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ PFIs ═══ -->
    <div id="page-claims" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Pro Forma Invoices</h2>
          <p class="text-gray-500 text-sm mt-1">PFIs for insurance claims and private / individual customers</p>
        </div>
      </div>
      <!-- Filter row: category tabs + status tabs -->
      <div class="flex flex-wrap gap-2 mb-3" id="pfi-catTabs">
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white" onclick="filterPFICategory('all',this)">All Jobs</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFICategory('Insurance',this)"><i class="fas fa-shield-alt mr-1"></i>Insurance</button>
        <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFICategory('Private',this)"><i class="fas fa-user mr-1"></i>Private</button>
      </div>
      <div class="flex flex-wrap gap-2 mb-5" id="pfi-statusTabs">
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-white" onclick="filterPFIs('all',this)">All Statuses</button>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Draft',this)">Drafts</button>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Submitted',this)">Submitted</button>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Approved',this)">Approved</button>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Sent',this)">Sent</button>
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="filterPFIs('Rejected',this)">Rejected</button>
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

    <!-- ═══ OIL SERVICES ═══ -->
    <div id="page-oil-services" class="page">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Oil Services – Pricing</h2>
        <p class="text-gray-500 text-sm mt-1">Toyota, Total & Castrol oil service packages with 3 customer tiers and fleet discounts</p>
      </div>
      <!-- Brand Tabs -->
      <div class="flex gap-2 mb-6" id="oilBrandTabs">
        <button class="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow" onclick="showOilBrand('Toyota',this)">🛢 Toyota</button>
        <button class="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="showOilBrand('Total',this)">🛢 Total</button>
        <button class="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="showOilBrand('Castrol',this)">🛢 Castrol</button>
      </div>
      <!-- Fleet Discount Banner -->
      <div id="oilFleetBanner" class="hidden card p-4 mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div class="flex items-center gap-3">
          <i class="fas fa-truck text-amber-500 text-xl"></i>
          <div>
            <p class="font-bold text-amber-800">Fleet Discounts Available (Toyota Only)</p>
            <p class="text-sm text-amber-700">3–5 vehicles: <strong>TZS 5,000 off</strong> per car &nbsp;|&nbsp; 5+ vehicles: <strong>TZS 8,000 off</strong> per car</p>
          </div>
        </div>
      </div>
      <!-- Pricing Table -->
      <div class="card overflow-hidden" id="oilPricingTable"></div>
    </div>

    <!-- ═══ PARTS CATALOGUE ═══ -->
    <div id="page-parts-catalogue" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Parts & Accessories Catalogue</h2>
          <p class="text-gray-500 text-sm mt-1">Complete Twiga Group parts list with buying price, selling price & margin</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input" type="text" placeholder="Search parts or models…" id="partsSearch" oninput="filterParts(this.value)"/>
          </div>
          <button onclick="showAddCataloguePartModal()" class="btn-primary flex items-center gap-2">
            <i class="fas fa-plus"></i> Add Part
          </button>
        </div>
      </div>
      <!-- Category tabs -->
      <div class="flex flex-wrap gap-2 mb-5" id="partsCategoryTabs">
        <button onclick="setPartsCategoryTab('')" class="parts-cat-tab active" data-cat="">All</button>
        <button onclick="setPartsCategoryTab('Air Filter')" class="parts-cat-tab" data-cat="Air Filter">Air Filter</button>
        <button onclick="setPartsCategoryTab('AC Filter')" class="parts-cat-tab" data-cat="AC Filter">AC Filter</button>
        <button onclick="setPartsCategoryTab('Oil Filter')" class="parts-cat-tab" data-cat="Oil Filter">Oil Filter</button>
        <button onclick="setPartsCategoryTab('Diesel Filter')" class="parts-cat-tab" data-cat="Diesel Filter">Diesel Filter</button>
        <button onclick="setPartsCategoryTab('Spark Plugs')" class="parts-cat-tab" data-cat="Spark Plugs">Spark Plugs</button>
        <button onclick="setPartsCategoryTab('Accessory')" class="parts-cat-tab" data-cat="Accessory">Accessory</button>
      </div>
      <!-- Stats row -->
      <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5" id="partsStats"></div>
      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Compatible Models</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-600">Buy Price</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-600">Sell Price</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-600">Margin %</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-600">In Stock</th>
            <th class="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
          </tr></thead>
          <tbody id="partsTable"></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ CAR WASH ═══ -->
    <div id="page-car-wash" class="page">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Car Wash Packages</h2>
        <p class="text-gray-500 text-sm mt-1">Standard, deep clean and monthly fleet packages</p>
      </div>
      <div class="grid lg:grid-cols-3 gap-6" id="carWashGrid"></div>
    </div>

    <!-- ═══ ADD-ON SERVICES ═══ -->
    <div id="page-add-ons" class="page">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Add-on Services</h2>
        <p class="text-gray-500 text-sm mt-1">Diagnostic, inspection, tyre and alignment services</p>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5" id="addOnsGrid"></div>
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
      <!-- Customer Type Toggle -->
      <div class="mb-5">
        <label class="form-label">Customer Type</label>
        <div class="flex gap-2 mt-1">
          <button type="button" id="custType-Individual" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 font-semibold text-sm transition-all" onclick="selectCustType('Individual')">
            <i class="fas fa-user"></i> Individual
          </button>
          <button type="button" id="custType-Corporate" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm transition-all hover:border-gray-300" onclick="selectCustType('Corporate')">
            <i class="fas fa-building"></i> Corporate
          </button>
        </div>
        <input type="hidden" id="cust-type" value="Individual"/>
      </div>
      <!-- Corporate Fields (hidden by default) -->
      <div id="corporateFields" class="hidden">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div><label class="form-label">Company Name</label><input class="form-input" id="cust-company" placeholder="Acme Ltd"/></div>
          <div><label class="form-label">Contact Person</label><input class="form-input" id="cust-contact" placeholder="Jane Doe"/></div>
        </div>
        <div class="mb-4"><label class="form-label">Tax PIN / TIN</label><input class="form-input" id="cust-taxpin" placeholder="TIN-123456789"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label" id="cust-name-label">Full Name</label><input class="form-input" id="cust-name" required placeholder="John Doe"/></div>
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
        <div><label class="form-label">VIN / Chassis Number</label><input class="form-input" id="veh-vin" placeholder="17-character VIN / Chassis Number"/></div>
        <div><label class="form-label">Engine Number</label><input class="form-input" id="veh-engine" placeholder="Engine number"/></div>
      </div>
      <div class="grid grid-cols-1 gap-4 mb-6">
        <div><label class="form-label">Insurance Company</label><input class="form-input" id="veh-insurer" placeholder="Jubilee Insurance"/></div>
      </div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newVehicle')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Add Vehicle</button>
      </div>
    </form>
  </div>
</div>

<!-- Send PFI Modal -->
<div id="modal-sendPFI" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:640px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-paper-plane text-blue-500 mr-2"></i>Send PFI to Customer</h3>
        <p class="text-sm text-gray-500 mt-0.5" id="sendPFI-subtitle">Pro Forma Invoice</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-sendPFI')"><i class="fas fa-times"></i></button>
    </div>

    <!-- PFI summary strip -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5" id="sendPFI-summary"></div>

    <!-- Email fields -->
    <div class="mb-4">
      <label class="form-label">Recipient Email <span class="text-red-500">*</span></label>
      <input class="form-input" type="email" id="sendPFI-email" placeholder="customer@example.com" required/>
    </div>
    <div class="mb-4">
      <label class="form-label">Subject</label>
      <input class="form-input" type="text" id="sendPFI-subject" placeholder="Pro Forma Invoice – GMS-2025-001"/>
    </div>
    <div class="mb-5">
      <label class="form-label">Message</label>
      <textarea class="form-input" id="sendPFI-message" rows="5"></textarea>
      <p class="text-xs text-gray-400 mt-1">The PDF will be attached automatically when downloaded. Use the "Copy & Open Email" option to send via your email client with the PDF attached.</p>
    </div>

    <!-- PDF Preview box -->
    <div class="border border-gray-200 rounded-xl overflow-hidden mb-5">
      <div class="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
        <span class="text-xs font-semibold text-gray-600"><i class="fas fa-file-pdf text-red-500 mr-1.5"></i>PDF Preview</span>
        <button class="text-xs text-blue-600 hover:underline font-semibold" onclick="downloadPFIFromModal()"><i class="fas fa-download mr-1"></i>Download PDF</button>
      </div>
      <div id="sendPFI-previewBox" class="p-4 font-mono text-xs text-gray-600 bg-white max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap"></div>
    </div>

    <div class="flex gap-3 justify-end">
      <button class="btn-secondary" onclick="closeModal('modal-sendPFI')">Cancel</button>
      <button class="btn-secondary" onclick="copyAndOpenEmail()"><i class="fas fa-external-link-alt mr-1"></i>Copy &amp; Open Email Client</button>
      <button class="btn-primary" onclick="submitSendPFI()"><i class="fas fa-paper-plane mr-1"></i><span id="sendPFI-btnLabel">Send &amp; Record</span></button>
    </div>
  </div>
</div>

<!-- New / Edit Appointment Modal -->
<div id="modal-appointment" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:620px">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-gray-900" id="apt-modal-title"><i class="fas fa-calendar-plus text-blue-500 mr-2"></i>New Appointment</h3>
        <p class="text-sm text-gray-500 mt-0.5" id="apt-modal-sub">Book a vehicle service appointment</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-appointment')"><i class="fas fa-times"></i></button>
    </div>
    <form id="appointmentForm" onsubmit="submitAppointment(event)">
      <input type="hidden" id="apt-id"/>
      <!-- Customer + Vehicle -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Customer <span class="text-red-500">*</span></label>
          <select class="form-input" id="apt-customerId" required onchange="aptLoadVehicles()">
            <option value="">Select customer…</option>
          </select>
        </div>
        <div>
          <label class="form-label">Vehicle <span class="text-red-500">*</span></label>
          <select class="form-input" id="apt-vehicleId" required>
            <option value="">Select vehicle…</option>
          </select>
        </div>
      </div>
      <!-- Service + Status -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Service Type <span class="text-red-500">*</span></label>
          <select class="form-input" id="apt-serviceType" required>
            <option value="">Select service…</option>
            <option>Oil Change</option><option>Minor Service</option><option>Major Service</option>
            <option>Brake Service</option><option>Tyre Service</option><option>Diagnosis</option>
            <option>Car Wash</option><option>Body Repair</option><option>Electrical</option><option>Other</option>
          </select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-input" id="apt-status">
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
      </div>
      <!-- Date + Time + Duration -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label class="form-label">Date <span class="text-red-500">*</span></label>
          <input class="form-input" type="date" id="apt-date" required/>
        </div>
        <div>
          <label class="form-label">Time <span class="text-red-500">*</span></label>
          <input class="form-input" type="time" id="apt-time" required/>
        </div>
        <div>
          <label class="form-label">Duration (min)</label>
          <select class="form-input" id="apt-duration">
            <option value="30">30 min</option><option value="60" selected>1 hr</option>
            <option value="90">1.5 hr</option><option value="120">2 hr</option>
            <option value="180">3 hr</option><option value="240">4 hr</option>
            <option value="360">6 hr</option><option value="480">Full day</option>
          </select>
        </div>
      </div>
      <!-- Technician -->
      <div class="mb-4">
        <label class="form-label">Assign Technician</label>
        <select class="form-input" id="apt-technician">
          <option value="">Unassigned</option>
        </select>
      </div>
      <!-- Notes -->
      <div class="mb-6">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="apt-notes" rows="2" placeholder="Any special instructions or details…"></textarea>
      </div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-appointment')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-save mr-1"></i><span id="apt-submit-label">Book Appointment</span></button>
      </div>
    </form>
  </div>
</div>

<!-- Fleet Upload Modal -->
<div id="modal-fleetUpload" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:760px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-truck text-blue-500 mr-2"></i>Upload Fleet</h3>
        <p class="text-sm text-gray-500 mt-0.5">Import multiple vehicles for a corporate customer via CSV</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-fleetUpload')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Step 1: Select Corporate Customer -->
    <div class="mb-5">
      <label class="form-label">Corporate Customer <span class="text-red-500">*</span></label>
      <select class="form-input" id="fleet-customerId" onchange="onFleetCustomerChange()">
        <option value="">Select corporate customer…</option>
      </select>
    </div>

    <!-- Step 2: Format Info + Download Templates -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <p class="text-sm font-semibold text-blue-800 mb-1.5"><i class="fas fa-info-circle mr-1"></i>File Format</p>
          <p class="text-xs text-blue-700 mb-1">Required columns: <code class="bg-blue-100 px-1 rounded font-mono">registration_number, make, model, year</code></p>
          <p class="text-xs text-blue-700">Optional columns: <code class="bg-blue-100 px-1 rounded font-mono">vin, engine_number, insurer</code></p>
        </div>
        <div class="flex flex-col gap-2 flex-shrink-0">
          <button class="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" onclick="downloadFleetTemplate('csv')">
            <i class="fas fa-file-csv text-green-600"></i>CSV Template
          </button>
          <button class="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" onclick="downloadFleetTemplate('xlsx')">
            <i class="fas fa-file-excel text-green-700"></i>Excel Template
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: File Type Toggle + Drop Zone -->
    <div class="flex gap-2 mb-3" id="fleet-typeTabs">
      <button id="fleet-tab-csv" onclick="setFleetTab('csv')" class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border-2 border-blue-500 bg-blue-500 text-white transition-all">
        <i class="fas fa-file-csv"></i>CSV
      </button>
      <button id="fleet-tab-xlsx" onclick="setFleetTab('xlsx')" class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:border-blue-300 transition-all">
        <i class="fas fa-file-excel text-green-600"></i>Excel (.xlsx / .xls)
      </button>
    </div>
    <div id="fleet-dropzone" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mb-5"
         onclick="document.getElementById('fleet-fileInput').click()"
         ondragover="fleetDragOver(event)" ondragleave="fleetDragLeave(event)" ondrop="fleetDrop(event)">
      <i class="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-3 block"></i>
      <p class="text-sm font-semibold text-gray-600">Drop file here or <span class="text-blue-500 underline">browse</span></p>
      <p class="text-xs text-gray-400 mt-1" id="fleet-dropHint">Supports .csv files</p>
      <input type="file" id="fleet-fileInput" accept=".csv" class="hidden" onchange="fleetFileSelected(event)"/>
    </div>

    <!-- Step 4: Preview Table -->
    <div id="fleet-previewWrap" class="hidden mb-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-gray-700" id="fleet-previewTitle">Preview</p>
        <button class="text-xs text-red-400 hover:text-red-600" onclick="clearFleetFile()"><i class="fas fa-trash mr-1"></i>Clear</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-gray-200">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Reg. Number</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Make</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Model</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Year</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">VIN / Chassis No.</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Engine No.</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Insurer</th>
              <th class="px-3 py-2 text-left text-gray-500 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody id="fleet-previewBody"></tbody>
        </table>
      </div>
      <p class="text-xs text-gray-400 mt-2" id="fleet-previewStats"></p>
    </div>

    <!-- Error Banner -->
    <div id="fleet-errorBanner" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700"></div>

    <!-- Footer Buttons -->
    <div class="flex gap-3 justify-end">
      <button class="btn-secondary" onclick="closeModal('modal-fleetUpload')">Cancel</button>
      <button id="fleet-submitBtn" class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled onclick="submitFleetUpload()">
        <i class="fas fa-upload mr-1"></i><span id="fleet-submitLabel">Import Fleet</span>
      </button>
    </div>
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

<!-- ═══ ADD CATALOGUE PART MODAL ═══ -->
<div id="modal-addCatPart" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900"><i class="fas fa-plus-circle text-blue-600 mr-2"></i>Add New Part</h3>
        <p class="text-sm text-gray-500 mt-1">Add a new part to the catalogue</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-addCatPart')"><i class="fas fa-times"></i></button>
    </div>
    <div class="grid grid-cols-1 gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Category *</label>
          <select class="form-input" id="acp-category">
            <option value="">Select category…</option>
            <option>Air Filter</option>
            <option>AC Filter</option>
            <option>Oil Filter</option>
            <option>Diesel Filter</option>
            <option>Spark Plugs</option>
            <option>Accessory</option>
          </select>
        </div>
        <div>
          <label class="form-label">Description *</label>
          <input class="form-input" type="text" id="acp-description" placeholder="e.g. Air Filter – Toyota Hilux"/>
        </div>
      </div>
      <div>
        <label class="form-label">Compatible Models <span class="text-gray-400 font-normal">(comma-separated)</span></label>
        <input class="form-input" type="text" id="acp-models" placeholder="e.g. HILUX, PRADO, FORTUNER"/>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="form-label">Buying Price (TZS) *</label>
          <input class="form-input" type="number" id="acp-buy" placeholder="0" oninput="acpCalcMargin()"/>
        </div>
        <div>
          <label class="form-label">Selling Price (TZS) *</label>
          <input class="form-input" type="number" id="acp-sell" placeholder="0" oninput="acpCalcMargin()"/>
        </div>
        <div>
          <label class="form-label">Initial Stock (units)</label>
          <input class="form-input" type="number" id="acp-stock" placeholder="0" min="0"/>
        </div>
      </div>
      <!-- Margin preview -->
      <div id="acp-margin-preview" class="hidden rounded-xl p-3 bg-gray-50 border border-gray-100 text-sm flex items-center gap-4">
        <span class="text-gray-500">Margin:</span>
        <span id="acp-margin-amt" class="font-bold text-green-600"></span>
        <span id="acp-margin-pct" class="font-bold text-blue-600"></span>
      </div>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-addCatPart')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitAddCatPart()"><i class="fas fa-plus mr-1"></i>Add Part</button>
    </div>
  </div>
</div>

<!-- ═══ EDIT CATALOGUE PART MODAL ═══ -->
<div id="modal-editCatPart" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900"><i class="fas fa-pen text-blue-600 mr-2"></i>Edit Part</h3>
        <p class="text-sm text-gray-500 mt-1">Update part details and pricing</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-editCatPart')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="ecp-id"/>
    <div class="grid grid-cols-1 gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Category *</label>
          <select class="form-input" id="ecp-category">
            <option>Air Filter</option>
            <option>AC Filter</option>
            <option>Oil Filter</option>
            <option>Diesel Filter</option>
            <option>Spark Plugs</option>
            <option>Accessory</option>
          </select>
        </div>
        <div>
          <label class="form-label">Description *</label>
          <input class="form-input" type="text" id="ecp-description"/>
        </div>
      </div>
      <div>
        <label class="form-label">Compatible Models <span class="text-gray-400 font-normal">(comma-separated)</span></label>
        <input class="form-input" type="text" id="ecp-models"/>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Buying Price (TZS) *</label>
          <input class="form-input" type="number" id="ecp-buy" oninput="ecpCalcMargin()"/>
        </div>
        <div>
          <label class="form-label">Selling Price (TZS) *</label>
          <input class="form-input" type="number" id="ecp-sell" oninput="ecpCalcMargin()"/>
        </div>
      </div>
      <div id="ecp-margin-preview" class="rounded-xl p-3 bg-gray-50 border border-gray-100 text-sm flex items-center gap-4">
        <span class="text-gray-500">Margin:</span>
        <span id="ecp-margin-amt" class="font-bold text-green-600"></span>
        <span id="ecp-margin-pct" class="font-bold text-blue-600"></span>
      </div>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-editCatPart')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitEditCatPart()"><i class="fas fa-save mr-1"></i>Save Changes</button>
    </div>
  </div>
</div>

<!-- ═══ RESTOCK MODAL ═══ -->
<div id="modal-restock" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:400px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900"><i class="fas fa-boxes text-green-600 mr-2"></i>Add Stock</h3>
        <p class="text-sm text-gray-500 mt-1" id="restock-part-name"></p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-restock')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="restock-id"/>
    <div class="mb-2">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-500">Current stock:</span>
        <span class="font-bold text-gray-800" id="restock-current"></span>
      </div>
    </div>
    <div>
      <label class="form-label">Units to Add *</label>
      <input class="form-input text-lg font-bold text-center" type="number" id="restock-qty" min="1" placeholder="0"/>
    </div>
    <div class="flex items-center justify-between mt-3 rounded-xl p-3 bg-green-50 border border-green-100 text-sm hidden" id="restock-preview">
      <span class="text-gray-600">New stock level:</span>
      <span class="font-bold text-green-700 text-lg" id="restock-new-total"></span>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-restock')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitRestock()"><i class="fas fa-plus mr-1"></i>Add Stock</button>
    </div>
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
let allJobCards = [], allCustomers = [], allVehicles = [], allPFIs = [], allInvoices = [], allPackages = [], allUsers = [], allAppointments = [];
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
  Sent:{ bg:'#f0fdf4', text:'#059669', icon:'fa-check-circle' },
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
  if (page === 'appointments') loadAppointments();
  if (page === 'dashboard') loadDashboard();
  if (page === 'jobcards') loadJobCards();
  if (page === 'customers') loadCustomers();
  if (page === 'vehicles') loadVehicles();
  if (page === 'claims') loadClaims();
  if (page === 'invoices') loadInvoices();
  if (page === 'packages') loadPackages();
  if (page === 'analytics') loadAnalytics();
  if (page === 'users') loadUsers();
  if (page === 'oil-services') loadOilServices();
  if (page === 'parts-catalogue') loadPartsCatalogue();
  if (page === 'car-wash') loadCarWash();
  if (page === 'add-ons') loadAddOns();
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
  // Load today's appointments for dashboard widget
  loadDashTodayApts();
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
  const canMakePFI = !j.pfi;
  
  document.getElementById('jobDetailActions').innerHTML = \`
    <button class="btn-secondary text-sm" onclick="showStatusModal('\${j.id}','\${j.status}')"><i class="fas fa-exchange-alt"></i> Update Status</button>
    \${canMakePFI ? \`<button class="btn-secondary text-sm" onclick="showPFIModal('\${j.id}','\${j.category}')"><i class="fas fa-file-invoice"></i> Create PFI</button>\` : ''}
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
// ── Add Part modal: search catalogue or enter manually ──
let _catalogueCache = [];   // full catalogue list loaded once per modal open
let _selectedCatPart = null; // currently highlighted catalogue part

async function showPartsModal(jobId) {
  openModal('modal-statusUpdate');
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-3">Search the parts catalogue or enter a custom part manually</p>

    <!-- Catalogue search -->
    <div class="relative mb-2">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
      <input class="form-input pl-8" id="catSearch" placeholder="Search catalogue by name or compatible model…" autocomplete="off"/>
    </div>
    <!-- Dropdown results -->
    <div id="catResults" class="hidden mb-3 border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-sm"></div>

    <!-- Selected part info banner -->
    <div id="catSelected" class="hidden mb-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-semibold text-blue-900" id="catSelected-name"></p>
          <p class="text-xs text-blue-600 mt-0.5" id="catSelected-meta"></p>
        </div>
        <button class="text-blue-400 hover:text-blue-600 text-xs shrink-0" onclick="_clearCatSelection()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <!-- Margin pill -->
      <div class="flex items-center gap-3 mt-2">
        <span class="text-xs text-gray-500">Buy: <strong id="catSelected-buy" class="text-gray-700"></strong></span>
        <span class="text-xs text-gray-500">Sell: <strong id="catSelected-sell" class="text-gray-700"></strong></span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700" id="catSelected-margin"></span>
        <span class="text-xs px-2 py-0.5 rounded-full" id="catSelected-stock"></span>
      </div>
    </div>

    <!-- Part name (auto-filled from catalogue or manual) -->
    <div class="mb-3">
      <label class="form-label">Part Name</label>
      <input class="form-input" id="part-name" required placeholder="e.g. Front Bumper Assembly"/>
    </div>

    <!-- Qty / Unit Cost / Total -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div>
        <label class="form-label">Qty</label>
        <input class="form-input" type="number" id="part-qty" required min="1" value="1"/>
        <p class="text-xs text-gray-400 mt-1" id="part-stock-hint"></p>
      </div>
      <div>
        <label class="form-label">Unit Cost (TZS)</label>
        <input class="form-input" type="number" id="part-unit" required min="0"/>
      </div>
      <div>
        <label class="form-label">Total</label>
        <input class="form-input" id="part-total" readonly placeholder="Auto"/>
      </div>
    </div>

    <!-- Margin preview bar (only visible when catalogue part selected) -->
    <div id="part-margin-bar" class="hidden mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="text-gray-600 font-medium"><i class="fas fa-chart-line text-green-500 mr-1"></i>Margin on this line</span>
        <span class="font-bold text-green-700" id="part-margin-val"></span>
      </div>
      <div class="w-full bg-green-100 rounded-full h-2">
        <div class="bg-green-500 h-2 rounded-full transition-all" id="part-margin-bar-fill" style="width:0%"></div>
      </div>
      <p class="text-xs text-gray-500 mt-1" id="part-margin-pct"></p>
    </div>

    <div class="flex gap-3">
      <button type="button" class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button type="button" class="btn-primary flex-1" id="part-submit-btn"><i class="fas fa-plus mr-1"></i>Add Part</button>
    </div>
  \`;

  // Load catalogue (cache for this session)
  if (!_catalogueCache.length) {
    try { const r = await axios.get('/api/catalogue/parts'); _catalogueCache = r.data; } catch(e) {}
  }

  // ── recalculate totals & margin bar ──
  const calcTotal = () => {
    const q  = +document.getElementById('part-qty').value  || 0;
    const u  = +document.getElementById('part-unit').value || 0;
    document.getElementById('part-total').value = fmt(q * u);

    if (_selectedCatPart) {
      const revenue  = u * q;
      const cost     = _selectedCatPart.buyingPrice * q;
      const margin   = revenue - cost;
      const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
      const color    = marginPct >= 50 ? 'text-green-700' : marginPct >= 25 ? 'text-amber-600' : 'text-red-600';
      document.getElementById('part-margin-bar').classList.remove('hidden');
      document.getElementById('part-margin-val').textContent = fmt(margin) + ' TZS';
      document.getElementById('part-margin-val').className   = 'font-bold ' + color;
      document.getElementById('part-margin-pct').textContent = marginPct + '% margin (cost basis: ' + fmt(cost) + ' TZS)';
      const fill = document.getElementById('part-margin-bar-fill');
      fill.style.width = Math.min(marginPct, 100) + '%';
      fill.className   = 'h-2 rounded-full transition-all ' + (marginPct >= 50 ? 'bg-green-500' : marginPct >= 25 ? 'bg-amber-400' : 'bg-red-400');
    } else {
      document.getElementById('part-margin-bar').classList.add('hidden');
    }
  };
  document.getElementById('part-qty').addEventListener('input', calcTotal);
  document.getElementById('part-unit').addEventListener('input', calcTotal);

  // ── catalogue search autocomplete ──
  let _searchTimer;
  document.getElementById('catSearch').addEventListener('input', function() {
    clearTimeout(_searchTimer);
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById('catResults').classList.add('hidden'); return; }
    _searchTimer = setTimeout(() => _renderCatResults(q), 200);
  });

  // ── submit ──
  document.getElementById('part-submit-btn').addEventListener('click', async () => {
    const qty  = +document.getElementById('part-qty').value;
    const unit = +document.getElementById('part-unit').value;
    const name = document.getElementById('part-name').value.trim();
    if (!name || !qty || !unit) { showToast('Please fill all fields', 'error'); return; }

    // Stock check for catalogue parts
    if (_selectedCatPart) {
      const avail = _selectedCatPart.stockQuantity ?? 0;
      if (qty > avail) {
        showToast('Only ' + avail + ' units in stock for this part', 'error');
        return;
      }
    }

    const btn = document.getElementById('part-submit-btn');
    btn.disabled = true; btn.textContent = 'Adding…';
    try {
      // 1. Record parts consumption on the job
      await axios.post('/api/jobcards/' + jobId + '/parts', { partName: name, quantity: qty, unitCost: unit, totalCost: qty * unit });
      // 2. Deduct stock from catalogue if a catalogue part was selected
      if (_selectedCatPart) {
        await axios.patch('/api/catalogue/parts/' + _selectedCatPart.id + '/deduct', { quantity: qty });
        // Update the local cache too
        const ci = _catalogueCache.findIndex(p => p.id === _selectedCatPart.id);
        if (ci !== -1) _catalogueCache[ci] = { ..._catalogueCache[ci], stockQuantity: (_catalogueCache[ci].stockQuantity || 0) - qty };
      }
      closeModal('modal-statusUpdate');
      _selectedCatPart = null;
      viewJobDetail(jobId);
      showToast('Part added' + (_selectedCatPart ? '' : '') + ' \u2714');
    } catch(err) {
      const msg = err.response?.data?.error || err.message;
      showToast('Error: ' + msg, 'error');
      btn.disabled = false; btn.textContent = 'Add Part';
    }
  });
}

// ── render catalogue search dropdown ──
function _renderCatResults(q) {
  const ql = q.toLowerCase();
  const results = _catalogueCache.filter(p =>
    p.description.toLowerCase().includes(ql) ||
    p.compatibleModels.toLowerCase().includes(ql) ||
    p.category.toLowerCase().includes(ql)
  ).slice(0, 8);

  const el = document.getElementById('catResults');
  if (!results.length) {
    el.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400 text-center">No catalogue parts match</div>';
    el.classList.remove('hidden');
    return;
  }
  el.innerHTML = results.map(p => {
    const marginPct = Math.round((p.margin / p.sellingPrice) * 100);
    const stockColor = (p.stockQuantity || 0) === 0 ? 'text-red-500' : (p.stockQuantity || 0) <= 5 ? 'text-amber-500' : 'text-green-600';
    return \`
    <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
         onclick="_selectCatPart('\${p.id}')">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate">\${p.description}</p>
          <p class="text-xs text-gray-400 mt-0.5">\${p.compatibleModels.split(',').slice(0,3).join(', ')}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold text-gray-900">\${fmt(p.sellingPrice)}</p>
          <p class="text-xs font-semibold text-green-600">\${marginPct}% margin</p>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-1.5">
        <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">\${p.category}</span>
        <span class="text-xs \${stockColor}"><i class="fas fa-box mr-0.5"></i>\${p.stockQuantity || 0} in stock</span>
      </div>
    </div>\`;
  }).join('');
  el.classList.remove('hidden');
}

// ── select a part from the dropdown ──
function _selectCatPart(partId) {
  const p = _catalogueCache.find(x => x.id === partId);
  if (!p) return;
  _selectedCatPart = p;

  // Fill the form fields
  document.getElementById('part-name').value = p.description;
  document.getElementById('part-unit').value = p.sellingPrice;

  // Hide dropdown, clear search
  document.getElementById('catResults').classList.add('hidden');
  document.getElementById('catSearch').value = '';

  // Show selected banner
  const banner = document.getElementById('catSelected');
  banner.classList.remove('hidden');
  document.getElementById('catSelected-name').textContent = p.description;
  const marginPct = Math.round((p.margin / p.sellingPrice) * 100);
  document.getElementById('catSelected-meta').textContent = p.category + ' \u00b7 ' + p.compatibleModels.split(',').slice(0,2).join(', ');
  document.getElementById('catSelected-buy').textContent  = fmt(p.buyingPrice) + ' TZS';
  document.getElementById('catSelected-sell').textContent = fmt(p.sellingPrice) + ' TZS';
  document.getElementById('catSelected-margin').textContent = '\u2197 ' + fmt(p.margin) + ' TZS (' + marginPct + '%)';

  const stock = p.stockQuantity || 0;
  const stockEl = document.getElementById('catSelected-stock');
  if (stock === 0) {
    stockEl.textContent = '\u26a0 Out of stock';
    stockEl.className = 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold';
  } else if (stock <= 5) {
    stockEl.textContent = '\u26a0 Low: ' + stock + ' left';
    stockEl.className = 'text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold';
  } else {
    stockEl.textContent = '\u2713 ' + stock + ' in stock';
    stockEl.className = 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold';
  }

  // Stock hint below qty
  document.getElementById('part-stock-hint').textContent = stock > 0 ? 'Max: ' + stock + ' units' : 'Out of stock';

  // Trigger total/margin recalculation
  document.getElementById('part-qty').dispatchEvent(new Event('input'));
}

// ── clear catalogue selection (switch to manual mode) ──
function _clearCatSelection() {
  _selectedCatPart = null;
  document.getElementById('catSelected').classList.add('hidden');
  document.getElementById('part-margin-bar').classList.add('hidden');
  document.getElementById('part-name').value = '';
  document.getElementById('part-unit').value = '';
  document.getElementById('part-total').value = '';
  document.getElementById('part-stock-hint').textContent = '';
}

// PFI Modal — works for both Insurance and Private jobs
function showPFIModal(jobId, category) {
  const isInsurance = category === 'Insurance';
  openModal('modal-statusUpdate');
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-1">\${isInsurance ? 'Create a Pro Forma Invoice for insurer approval' : 'Create a Pro Forma Invoice to send to the customer'}</p>
    \${isInsurance ? '' : \`<div class="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><i class="fas fa-user-circle"></i> Private / Individual job – PFI will go directly to the customer</div>\`}
    <div class="grid grid-cols-2 gap-3 mb-3 mt-3">
      <div><label class="form-label">Labour Cost (TZS)</label><input class="form-input" type="number" id="pfi-labour" required min="0"/></div>
      <div><label class="form-label">Parts Cost (TZS)</label><input class="form-input" type="number" id="pfi-parts" required min="0"/></div>
    </div>
    <div class="mb-3"><label class="form-label">Total Estimate</label><input class="form-input" id="pfi-total" readonly placeholder="Auto-calculated"/></div>
    <div class="mb-5"><label class="form-label">Notes</label><textarea class="form-input" id="pfi-notes" rows="2" placeholder="\${isInsurance ? 'Additional notes for insurer\u2026' : 'Additional notes for customer\u2026'}"></textarea></div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button class="btn-primary flex-1" id="pfi-submit"><i class="fas fa-file-invoice mr-1"></i> \${isInsurance ? 'Submit PFI' : 'Save PFI'}</button>
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
    // Insurance: starts as Submitted (goes to insurer). Private: starts as Draft (customer-facing).
    const initialStatus = isInsurance ? 'Submitted' : 'Draft';
    await axios.post('/api/jobcards/' + jobId + '/pfi', { labourCost:l, partsCost:p, totalEstimate:l+p, status:initialStatus, notes:document.getElementById('pfi-notes').value });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    showToast(isInsurance ? 'PFI submitted to insurer' : 'PFI created – ready to send to customer');
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
let activeCustomerTab = 'all';

async function loadCustomers() {
  const { data } = await axios.get('/api/customers');
  allCustomers = data;
  updateCustomerCounts(data);
  renderCustomers(data);
}

function updateCustomerCounts(list) {
  const all = list.length;
  const ind = list.filter(c => c.customerType === 'Individual' || !c.customerType).length;
  const corp = list.filter(c => c.customerType === 'Corporate').length;
  const els = { all, Individual: ind, Corporate: corp };
  Object.entries(els).forEach(([k, v]) => {
    const el = document.getElementById('custCount-' + k);
    if (el) el.textContent = v;
  });
}

function setCustomerTab(type, btn) {
  activeCustomerTab = type;
  document.querySelectorAll('#customerTypeTabs button').forEach(b => {
    b.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all';
    // Fix the count span inside non-active buttons
    const span = b.querySelector('span');
    if (span) { span.className = 'bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full ml-1'; }
  });
  btn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white transition-all';
  const activeSpan = btn.querySelector('span');
  if (activeSpan) { activeSpan.className = 'bg-white/30 text-white text-xs px-2 py-0.5 rounded-full ml-1'; }
  const searchQ = document.getElementById('customerSearchInput') ? document.getElementById('customerSearchInput').value : '';
  filterCustomers(searchQ);
}

function renderCustomers(list) {
  document.getElementById('customersGrid').innerHTML = list.map(c => {
    const isCorp = c.customerType === 'Corporate';
    const initials = isCorp ? '<i class="fas fa-building text-sm"></i>' : c.name.charAt(0).toUpperCase();
    const grad = isCorp ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#3b82f6,#2563eb)';
    const typeBadge = isCorp
      ? \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 ml-1"><i class="fas fa-building text-xs"></i> Corp</span>\`
      : \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-1"><i class="fas fa-user text-xs"></i> Indiv</span>\`;
    return \`
    <div class="card p-5 hover:shadow-lg transition-shadow cursor-pointer" onclick="viewCustomerDetail('\${c.id}')">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style="background:\${grad}">\${initials}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center flex-wrap gap-1 mb-0.5">
            <h3 class="font-bold text-gray-900 text-sm leading-tight">\${c.name}</h3>
            \${typeBadge}
          </div>
          \${isCorp && c.contactPerson ? \`<p class="text-xs text-gray-500"><i class="fas fa-user-tie text-xs mr-1 text-purple-400"></i>\${c.contactPerson}</p>\` : ''}
          <p class="text-xs text-gray-500">\${c.phone}</p>
          \${c.email ? \`<p class="text-xs text-gray-400">\${c.email}</p>\` : ''}
          \${c.taxPin ? \`<p class="text-xs text-gray-400 mt-0.5"><i class="fas fa-receipt text-xs mr-1 text-green-400"></i>\${c.taxPin}</p>\` : ''}
        </div>
      </div>
      \${isCorp && c.companyName && c.companyName !== c.name ? \`<p class="text-xs font-semibold text-purple-600 mb-2 truncate"><i class="fas fa-building text-xs mr-1"></i>\${c.companyName}</p>\` : ''}
      <div class="flex gap-3 border-t border-gray-100 pt-3">
        <div class="text-center flex-1">
          <p class="text-lg font-bold text-blue-600">\${c.vehicleCount}</p>
          <p class="text-xs text-gray-400">Vehicles</p>
        </div>
        <div class="border-l border-gray-100"></div>
        <div class="text-center flex-1">
          <p class="text-lg font-bold text-green-600">\${c.jobCount}</p>
          <p class="text-xs text-gray-400">Jobs</p>
        </div>
        <div class="border-l border-gray-100"></div>
        <div class="text-center flex-1">
          <p class="text-xs text-gray-400">Since</p>
          <p class="text-xs font-semibold text-gray-600">\${fmtDate(c.createdAt)}</p>
        </div>
      </div>
    </div>
  \`;
  }).join('') || '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-users text-4xl mb-3 block"></i>No customers found</div>';
}

function filterCustomers(q) {
  const lq = (q || '').toLowerCase();
  let list = allCustomers;
  if (activeCustomerTab === 'Individual') list = list.filter(c => c.customerType === 'Individual' || !c.customerType);
  if (activeCustomerTab === 'Corporate') list = list.filter(c => c.customerType === 'Corporate');
  if (lq) list = list.filter(c =>
    c.name.toLowerCase().includes(lq) ||
    c.phone.includes(lq) ||
    (c.email||'').toLowerCase().includes(lq) ||
    (c.companyName||'').toLowerCase().includes(lq) ||
    (c.contactPerson||'').toLowerCase().includes(lq)
  );
  renderCustomers(list);
}


async function viewCustomerDetail(id) {
  const { data: c } = await axios.get('/api/customers/' + id);
  openModal('modal-statusUpdate');
  const isCorp = c.customerType === 'Corporate';
  const grad = isCorp ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#3b82f6,#2563eb)';
  const initials = isCorp ? '<i class="fas fa-building"></i>' : c.name.charAt(0).toUpperCase();
  const corpHtml = isCorp ? \`
    <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 text-sm">
      <p class="text-xs text-purple-500 font-semibold uppercase tracking-wide mb-2">Corporate Details</p>
      \${c.companyName ? \`<div class="flex gap-2 mb-1.5"><i class="fas fa-building text-purple-400 w-4 mt-0.5"></i><span class="font-semibold">\${c.companyName}</span></div>\` : ''}
      \${c.contactPerson ? \`<div class="flex gap-2 mb-1.5"><i class="fas fa-user-tie text-purple-400 w-4 mt-0.5"></i><span>Contact: <strong>\${c.contactPerson}</strong></span></div>\` : ''}
      \${c.taxPin ? \`<div class="flex gap-2"><i class="fas fa-receipt text-purple-400 w-4 mt-0.5"></i><span>TIN: <strong>\${c.taxPin}</strong></span></div>\` : ''}
    </div>\` : '';
  const typeBadge = isCorp
    ? '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><i class="fas fa-building text-xs mr-1"></i>Corporate</span>'
    : '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><i class="fas fa-user text-xs mr-1"></i>Individual</span>';
  const vehHtml = c.vehicles?.map(v => \`<div class="flex items-center gap-2 py-2 border-b border-gray-100 text-sm"><i class="fas fa-car text-blue-400"></i><span class="font-medium">\${v.registrationNumber}</span><span class="text-gray-500">\${v.make} \${v.model} \${v.year}</span></div>\`).join('') || '<p class="text-gray-400 text-sm">No vehicles registered</p>';
  document.getElementById('statusUpdateContent').innerHTML = \`
    <div class="flex items-center gap-4 mb-5">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style="background:\${grad}">\${initials}</div>
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-xl font-bold">\${c.name}</h3>
          \${typeBadge}
        </div>
        <p class="text-gray-500 text-sm mt-0.5">\${c.phone} · \${c.email||'—'}</p>
      </div>
    </div>
    \${corpHtml}
    <div class="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-2">
      <div class="flex gap-2"><i class="fas fa-map-marker-alt text-gray-400 w-4 mt-0.5"></i><span>\${c.address||'—'}</span></div>
      \${c.idNumber ? \`<div class="flex gap-2"><i class="fas fa-id-card text-gray-400 w-4 mt-0.5"></i><span>\${c.idNumber}</span></div>\` : ''}
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-blue-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-blue-600">\${c.vehicles?.length||0}</p><p class="text-xs text-gray-500">Vehicles</p></div>
      <div class="bg-green-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-green-600">\${c.jobs?.length||0}</p><p class="text-xs text-gray-500">Job Cards</p></div>
    </div>
    <div class="mb-4">
      <p class="font-semibold text-gray-700 text-sm mb-2">Vehicles</p>
      \${vehHtml}
    </div>
    <button class="btn-secondary w-full" onclick="closeModal('modal-statusUpdate')">Close</button>
  \`;
}


function showNewCustomerModal() {
  selectCustType('Individual');
  document.getElementById('newCustomerForm').reset();
  openModal('modal-newCustomer');
}

function selectCustType(type) {
  document.getElementById('cust-type').value = type;
  const indBtn = document.getElementById('custType-Individual');
  const corpBtn = document.getElementById('custType-Corporate');
  const corpFields = document.getElementById('corporateFields');
  const nameLabel = document.getElementById('cust-name-label');
  if (!indBtn || !corpBtn) return;
  if (type === 'Individual') {
    indBtn.className = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 font-semibold text-sm transition-all';
    corpBtn.className = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm transition-all hover:border-gray-300';
    if (corpFields) corpFields.classList.add('hidden');
    if (nameLabel) nameLabel.textContent = 'Full Name';
  } else {
    indBtn.className = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm transition-all hover:border-gray-300';
    corpBtn.className = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-700 font-semibold text-sm transition-all';
    if (corpFields) corpFields.classList.remove('hidden');
    if (nameLabel) nameLabel.textContent = 'Primary Contact Name';
  }
}

async function submitNewCustomer(e) {
  e.preventDefault();
  const type = document.getElementById('cust-type').value;
  const payload = {
    name: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value,
    email: document.getElementById('cust-email').value,
    address: document.getElementById('cust-address').value,
    idNumber: document.getElementById('cust-id').value,
    customerType: type,
  };
  if (type === 'Corporate') {
    payload.companyName = document.getElementById('cust-company').value;
    payload.contactPerson = document.getElementById('cust-contact').value;
    payload.taxPin = document.getElementById('cust-taxpin').value;
  }
  await axios.post('/api/customers', payload);
  closeModal('modal-newCustomer');
  document.getElementById('newCustomerForm').reset();
  selectCustType('Individual');
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
  const payload = { customerId:document.getElementById('veh-customerId').value, registrationNumber:document.getElementById('veh-reg').value, make:document.getElementById('veh-make').value, model:document.getElementById('veh-model').value, year:+document.getElementById('veh-year').value, vin:document.getElementById('veh-vin').value, engineNumber:document.getElementById('veh-engine').value, insurer:document.getElementById('veh-insurer').value };
  await axios.post('/api/vehicles', payload);
  closeModal('modal-newVehicle');
  document.getElementById('newVehicleForm').reset();
  showToast('Vehicle registered successfully');
  loadVehicles();
}

// ═══ APPOINTMENTS ═══
const APT_STATUS_CFG = {
  'Scheduled':   { bg:'#eff6ff', text:'#1d4ed8', dot:'#3b82f6' },
  'Confirmed':   { bg:'#f0fdf4', text:'#15803d', dot:'#22c55e' },
  'In Progress': { bg:'#fefce8', text:'#a16207', dot:'#eab308' },
  'Completed':   { bg:'#f0fdf4', text:'#166534', dot:'#16a34a' },
  'Cancelled':   { bg:'#fef2f2', text:'#b91c1c', dot:'#ef4444' },
  'No Show':     { bg:'#faf5ff', text:'#7e22ce', dot:'#a855f7' },
};
const APT_STATUSES = Object.keys(APT_STATUS_CFG);
let aptCurrentView = 'list';
let calYear = new Date().getFullYear(), calMonth = new Date().getMonth();

function aptStatusBadge(s) {
  const c = APT_STATUS_CFG[s] || { bg:'#f1f5f9', text:'#64748b', dot:'#94a3b8' };
  return \`<span class="status-pill" style="background:\${c.bg};color:\${c.text}"><span style="width:6px;height:6px;border-radius:50%;background:\${c.dot};display:inline-block;margin-right:5px"></span>\${s}</span>\`;
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return ((h % 12) || 12) + ':' + String(m).padStart(2,'0') + ' ' + ampm;
}
function fmtDuration(mins) {
  if (mins < 60) return mins + ' min';
  const h = Math.floor(mins/60), m = mins%60;
  return h + 'h' + (m ? ' ' + m + 'm' : '');
}

async function loadAppointments() {
  const [aptRes, cuRes, vRes, uRes] = await Promise.all([
    axios.get('/api/appointments'),
    axios.get('/api/customers'),
    axios.get('/api/vehicles'),
    axios.get('/api/users'),
  ]);
  allAppointments = aptRes.data;
  allCustomers    = cuRes.data;
  allVehicles     = vRes.data;
  allUsers        = uRes.data;
  renderAptStats();
  renderAptTable(allAppointments);
  if (aptCurrentView === 'calendar') renderCalendar();
}

function renderAptStats() {
  const counts = {};
  APT_STATUSES.forEach(s => counts[s] = 0);
  allAppointments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
  document.getElementById('apt-statChips').innerHTML = APT_STATUSES.map(s => {
    const c = APT_STATUS_CFG[s];
    return \`<div class="card p-3 text-center cursor-pointer hover:shadow-md transition-all" onclick="quickFilterApt('\${s}')" style="border-top:3px solid \${c.dot}">
      <p class="text-xl font-bold" style="color:\${c.text}">\${counts[s]}</p>
      <p class="text-xs text-gray-500 mt-0.5">\${s}</p>
    </div>\`;
  }).join('');
}

function renderAptTable(list) {
  const today = new Date().toISOString().split('T')[0];
  if (!list.length) {
    document.getElementById('apt-tableBody').innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-calendar-times text-3xl block mb-2"></i>No appointments found</td></tr>';
    return;
  }
  document.getElementById('apt-tableBody').innerHTML = list.map(a => {
    const isToday = a.date === today;
    const isPast  = a.date < today && !['Completed','Cancelled','No Show'].includes(a.status);
    return \`<tr class="table-row border-b border-gray-50 \${isPast ? 'opacity-60' : ''}">
      <td class="px-4 py-3">
        <div class="font-semibold text-gray-800 \${isToday ? 'text-blue-700' : ''}">\${isToday ? '<span class="text-xs bg-blue-100 text-blue-700 rounded px-1 mr-1">Today</span>' : ''}\${a.date}</div>
        <div class="text-xs text-gray-500">\${fmtTime(a.time)}</div>
      </td>
      <td class="px-4 py-3">
        <div class="font-semibold text-gray-800 text-sm">\${a.customerName||'—'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="font-bold text-blue-600 text-sm">\${a.vehicleReg||'—'}</div>
        <div class="text-xs text-gray-500">\${a.vehicleMake||''} \${a.vehicleModel||''}</div>
      </td>
      <td class="px-4 py-3">
        <span class="text-sm font-medium text-gray-700">\${a.serviceType}</span>
        \${a.notes ? \`<p class="text-xs text-gray-400 truncate max-w-[140px]" title="\${a.notes}">\${a.notes}</p>\` : ''}
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">\${a.technicianName||'<span class="text-gray-300">—</span>'}</td>
      <td class="px-4 py-3 text-sm text-gray-500">\${fmtDuration(a.estimatedDuration)}</td>
      <td class="px-4 py-3">\${aptStatusBadge(a.status)}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <button class="text-blue-500 hover:text-blue-700 text-sm" title="Edit" onclick="showEditAppointmentModal('\${a.id}')"><i class="fas fa-edit"></i></button>
          \${!a.jobCardId && !['Completed','Cancelled','No Show'].includes(a.status)
            ? \`<button class="text-green-600 hover:text-green-800 text-sm" title="Convert to Job Card" onclick="convertAptToJob('\${a.id}')"><i class="fas fa-clipboard-list"></i></button>\`
            : a.jobCardId ? \`<span class="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5 font-semibold">Job Card</span>\` : ''
          }
          <button class="text-red-400 hover:text-red-600 text-sm" title="Cancel" onclick="cancelAppointment('\${a.id}')"><i class="fas fa-times"></i></button>
        </div>
      </td>
    </tr>\`;
  }).join('');
}

function filterAppointments() {
  const q      = (document.getElementById('apt-search').value || '').toLowerCase();
  const date   = document.getElementById('apt-dateFilter').value;
  const status = document.getElementById('apt-statusFilter').value;
  let list = allAppointments;
  if (q)      list = list.filter(a => (a.customerName||'').toLowerCase().includes(q) || (a.vehicleReg||'').toLowerCase().includes(q) || a.serviceType.toLowerCase().includes(q));
  if (date)   list = list.filter(a => a.date === date);
  if (status) list = list.filter(a => a.status === status);
  renderAptTable(list);
}

function quickFilterApt(status) {
  document.getElementById('apt-statusFilter').value = status;
  filterAppointments();
}

function clearAptFilters() {
  document.getElementById('apt-search').value = '';
  document.getElementById('apt-dateFilter').value = '';
  document.getElementById('apt-statusFilter').value = '';
  renderAptTable(allAppointments);
}

function setAptView(v) {
  aptCurrentView = v;
  document.getElementById('apt-listView').classList.toggle('hidden', v !== 'list');
  document.getElementById('apt-calendarView').classList.toggle('hidden', v !== 'calendar');
  document.getElementById('apt-view-list').className    = v==='list'     ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white'    : 'px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200';
  document.getElementById('apt-view-calendar').className= v==='calendar' ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white' : 'px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200';
  if (v === 'calendar') renderCalendar();
}

// ── Calendar ──
function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-monthLabel').textContent = MONTHS[calMonth] + ' ' + calYear;
  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const daysInMo  = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr  = new Date().toISOString().split('T')[0];
  // Map date → apt list
  const byDate = {};
  allAppointments.forEach(a => {
    const d = a.date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  });
  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div></div>';
  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = \`\${calYear}-\${String(calMonth+1).padStart(2,'0')}-\${String(d).padStart(2,'0')}\`;
    const apts    = byDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    const dots    = apts.slice(0,3).map(a => {
      const c = APT_STATUS_CFG[a.status] || { dot:'#94a3b8' };
      return \`<span style="width:6px;height:6px;border-radius:50%;background:\${c.dot};display:inline-block"></span>\`;
    }).join('');
    cells += \`<div class="min-h-[64px] rounded-lg p-1.5 cursor-pointer border \${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-100 hover:bg-gray-50'} transition-colors" onclick="showCalDay('\${dateStr}')">
      <p class="text-xs font-bold \${isToday ? 'text-blue-700' : 'text-gray-700'} mb-1">\${d}</p>
      \${apts.length ? \`<div class="flex flex-wrap gap-0.5 mb-1">\${dots}</div><p class="text-xs text-gray-500">\${apts.length} appt\${apts.length>1?'s':''}</p>\` : ''}
    </div>\`;
  }
  document.getElementById('cal-grid').innerHTML = cells;
  document.getElementById('cal-dayPanel').classList.add('hidden');
}

function showCalDay(dateStr) {
  const apts = allAppointments.filter(a => a.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
  const panel = document.getElementById('cal-dayPanel');
  document.getElementById('cal-dayTitle').textContent = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  if (!apts.length) {
    document.getElementById('cal-dayList').innerHTML = '<p class="text-gray-400 text-sm py-3 text-center">No appointments on this day. <button class="text-blue-500 underline" onclick="showNewAppointmentModal()">Book one?</button></p>';
  } else {
    document.getElementById('cal-dayList').innerHTML = apts.map(a => \`
      <div class="flex items-center gap-3 py-2.5 border-b border-gray-100">
        <div class="w-14 text-xs font-bold text-gray-600 flex-shrink-0">\${fmtTime(a.time)}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800">\${a.serviceType} <span class="text-gray-400 font-normal">–</span> <span class="text-blue-600">\${a.vehicleReg||''}</span></p>
          <p class="text-xs text-gray-500">\${a.customerName||''} · \${fmtDuration(a.estimatedDuration)}\${a.technicianName?' · '+a.technicianName:''}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          \${aptStatusBadge(a.status)}
          <button class="text-blue-500 hover:text-blue-700 text-xs" onclick="showEditAppointmentModal('\${a.id}')"><i class="fas fa-edit"></i></button>
        </div>
      </div>
    \`).join('');
  }
  panel.classList.remove('hidden');
}

// ── Modal open / submit ──
async function showNewAppointmentModal() {
  if (!allCustomers.length) { const {data} = await axios.get('/api/customers'); allCustomers = data; }
  if (!allVehicles.length)  { const {data} = await axios.get('/api/vehicles');  allVehicles  = data; }
  if (!allUsers.length)     { const {data} = await axios.get('/api/users');     allUsers     = data; }
  document.getElementById('apt-modal-title').innerHTML = '<i class="fas fa-calendar-plus text-blue-500 mr-2"></i>New Appointment';
  document.getElementById('apt-modal-sub').textContent = 'Book a vehicle service appointment';
  document.getElementById('apt-submit-label').textContent = 'Book Appointment';
  document.getElementById('apt-id').value = '';
  document.getElementById('appointmentForm').reset();
  // Default date = today, time = next full hour
  const now = new Date();
  document.getElementById('apt-date').value = now.toISOString().split('T')[0];
  const nextHour = new Date(now); nextHour.setHours(now.getHours()+1,0,0,0);
  document.getElementById('apt-time').value = nextHour.toTimeString().slice(0,5);
  document.getElementById('apt-status').value = 'Scheduled';
  aptPopulateCustomers();
  aptPopulateTechnicians();
  openModal('modal-appointment');
}

async function showEditAppointmentModal(id) {
  const {data: a} = await axios.get('/api/appointments/' + id);
  if (!allCustomers.length) { const {data} = await axios.get('/api/customers'); allCustomers = data; }
  if (!allVehicles.length)  { const {data} = await axios.get('/api/vehicles');  allVehicles  = data; }
  if (!allUsers.length)     { const {data} = await axios.get('/api/users');     allUsers     = data; }
  document.getElementById('apt-modal-title').innerHTML = '<i class="fas fa-calendar-edit text-blue-500 mr-2"></i>Edit Appointment';
  document.getElementById('apt-modal-sub').textContent = 'Update appointment details';
  document.getElementById('apt-submit-label').textContent = 'Save Changes';
  document.getElementById('apt-id').value = a.id;
  aptPopulateCustomers(a.customerId);
  await aptLoadVehicles(a.vehicleId);
  document.getElementById('apt-serviceType').value = a.serviceType;
  document.getElementById('apt-status').value      = a.status;
  document.getElementById('apt-date').value        = a.date;
  document.getElementById('apt-time').value        = a.time;
  document.getElementById('apt-duration').value    = a.estimatedDuration;
  aptPopulateTechnicians(a.assignedTechnician);
  document.getElementById('apt-notes').value       = a.notes || '';
  openModal('modal-appointment');
}

function aptPopulateCustomers(selectedId) {
  document.getElementById('apt-customerId').innerHTML =
    '<option value="">Select customer…</option>' +
    allCustomers.map(c => \`<option value="\${c.id}" \${c.id===selectedId?'selected':''}>\${c.name}</option>\`).join('');
}

async function aptLoadVehicles(selectedId) {
  const custId = document.getElementById('apt-customerId').value;
  const vehs = custId ? allVehicles.filter(v => v.customerId === custId) : [];
  document.getElementById('apt-vehicleId').innerHTML =
    '<option value="">Select vehicle…</option>' +
    vehs.map(v => \`<option value="\${v.id}" \${v.id===selectedId?'selected':''}>\${v.registrationNumber} – \${v.make} \${v.model}</option>\`).join('');
}

function aptPopulateTechnicians(selectedId) {
  const techs = allUsers.filter(u => u.role === 'Technician' || u.role === 'Manager');
  document.getElementById('apt-technician').innerHTML =
    '<option value="">Unassigned</option>' +
    techs.map(u => \`<option value="\${u.id}" \${u.id===selectedId?'selected':''}>\${u.name}</option>\`).join('');
}

async function submitAppointment(e) {
  e.preventDefault();
  const id = document.getElementById('apt-id').value;
  const payload = {
    customerId:         document.getElementById('apt-customerId').value,
    vehicleId:          document.getElementById('apt-vehicleId').value,
    serviceType:        document.getElementById('apt-serviceType').value,
    status:             document.getElementById('apt-status').value,
    date:               document.getElementById('apt-date').value,
    time:               document.getElementById('apt-time').value,
    estimatedDuration:  +document.getElementById('apt-duration').value,
    assignedTechnician: document.getElementById('apt-technician').value,
    notes:              document.getElementById('apt-notes').value,
  };
  if (id) {
    await axios.put('/api/appointments/' + id, payload);
    showToast('Appointment updated successfully');
  } else {
    await axios.post('/api/appointments', payload);
    showToast('Appointment booked successfully');
  }
  closeModal('modal-appointment');
  loadAppointments();
}

async function cancelAppointment(id) {
  const apt = allAppointments.find(a => a.id === id);
  if (!apt || ['Completed','Cancelled'].includes(apt.status)) return;
  if (!confirm('Cancel this appointment?')) return;
  await axios.patch('/api/appointments/' + id + '/status', { status: 'Cancelled' });
  showToast('Appointment cancelled');
  loadAppointments();
}

async function convertAptToJob(id) {
  if (!confirm('Convert this appointment to a Job Card?')) return;
  const { data } = await axios.post('/api/appointments/' + id + '/convert');
  showToast(\`✅ Job Card \${data.jobCard.jobCardNumber} created!\`);
  loadAppointments();
}

// ── Dashboard today's appointments ──
async function loadDashTodayApts() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await axios.get('/api/appointments?date=' + today);
  const el = document.getElementById('dashTodayApts');
  if (!data.length) {
    el.innerHTML = '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-calendar-check block text-2xl mb-1"></i>No appointments today</p>';
    return;
  }
  el.innerHTML = data.map(a => {
    const c = APT_STATUS_CFG[a.status] || { dot:'#94a3b8', text:'#64748b' };
    return \`<div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <span style="width:8px;height:8px;border-radius:50%;background:\${c.dot};flex-shrink:0;margin-top:2px"></span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">\${a.vehicleReg||'?'} – \${a.serviceType}</p>
        <p class="text-xs text-gray-500">\${fmtTime(a.time)} · \${a.customerName||''}</p>
      </div>
      <span class="text-xs font-semibold flex-shrink-0" style="color:\${c.text}">\${a.status}</span>
    </div>\`;
  }).join('');
}

// ═══ FLEET UPLOAD ═══
let fleetParsedRows = [];

async function showFleetUploadModal() {
  // Load customers, filter corporate only
  if (!allCustomers.length) { const { data } = await axios.get('/api/customers'); allCustomers = data; }
  const corporates = allCustomers.filter(c => c.customerType === 'Corporate');
  const sel = document.getElementById('fleet-customerId');
  sel.innerHTML = '<option value="">Select corporate customer…</option>' +
    corporates.map(c => \`<option value="\${c.id}">\${c.name}\${c.companyName && c.companyName !== c.name ? ' – ' + c.companyName : ''}</option>\`).join('');
  // Reset state
  clearFleetFile();
  document.getElementById('fleet-errorBanner').classList.add('hidden');
  openModal('modal-fleetUpload');
}

function onFleetCustomerChange() {
  updateFleetSubmitBtn();
}

let fleetActiveTab = 'csv';

function setFleetTab(type) {
  fleetActiveTab = type;
  ['csv','xlsx'].forEach(t => {
    const tab = document.getElementById('fleet-tab-' + t);
    if (t === type) {
      tab.className = 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border-2 border-blue-500 bg-blue-500 text-white transition-all';
    } else {
      tab.className = 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:border-blue-300 transition-all';
    }
  });
  clearFleetFile(false);
}

function downloadFleetTemplate(format) {
  const rows = [
    ['registration_number','make','model','year','vin_chassis_number','engine_number','insurer'],
    ['T123 ABC','Toyota','Corolla','2020','JT2BF22K1W0123456','1ZZ-FE123456','Jubilee Insurance'],
    ['T456 DEF','Toyota','Probox','2019','','2NZ-FE789012','AAR Insurance'],
    ['T789 GHI','Nissan','X-Trail','2021','JN1TBNT31Z0456789','','NHIF'],
  ];
  if (format === 'xlsx') {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:22},{wch:12},{wch:12},{wch:6},{wch:22},{wch:18},{wch:22}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fleet');
    XLSX.writeFile(wb, 'fleet_template.xlsx');
  } else {
    const csv = rows.map(r => r.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fleet_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

function fleetDragOver(e) {
  e.preventDefault();
  document.getElementById('fleet-dropzone').classList.add('border-blue-400','bg-blue-50');
}
function fleetDragLeave(e) {
  document.getElementById('fleet-dropzone').classList.remove('border-blue-400','bg-blue-50');
}
function fleetDrop(e) {
  e.preventDefault();
  fleetDragLeave(e);
  const file = e.dataTransfer.files[0];
  if (file) processFleetFile(file);
}
function fleetFileSelected(e) {
  const file = e.target.files[0];
  if (file) processFleetFile(file);
}

function processFleetFile(file) {
  const name = file.name.toLowerCase();
  const isCSV  = name.endsWith('.csv');
  const isXLSX = name.endsWith('.xlsx') || name.endsWith('.xls');
  if (!isCSV && !isXLSX) {
    showFleetError('Please upload a .csv, .xlsx, or .xls file.'); return;
  }
  document.getElementById('fleet-errorBanner').classList.add('hidden');
  const iconClass = isXLSX ? 'fas fa-file-excel text-green-500' : 'fas fa-file-csv text-blue-400';
  const accept    = isXLSX ? '.xlsx,.xls' : '.csv';
  document.getElementById('fleet-dropzone').innerHTML = \`
    <i class="\${iconClass} text-4xl mb-3 block"></i>
    <p class="text-sm font-semibold text-gray-700">\${file.name}</p>
    <p class="text-xs text-gray-400 mt-1">Click to change file</p>
    <input type="file" id="fleet-fileInput" accept="\${accept}" class="hidden" onchange="fleetFileSelected(event)"/>
  \`;
  const reader = new FileReader();
  if (isCSV) {
    reader.onload = (e) => parseFleetCSV(e.target.result);
    reader.readAsText(file);
  } else {
    reader.onload = (e) => parseFleetExcel(e.target.result);
    reader.readAsArrayBuffer(file);
  }
}

function parseFleetCSV(text) {
  document.getElementById('fleet-errorBanner').classList.add('hidden');
  const lines = text.trim().split('\\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) { showFleetError('CSV file is empty or has no data rows.'); return; }

  // Normalise header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\\s+/g,'_').replace(/[^a-z0-9_]/g,'').replace('vin_chassis_number','vin'));
  const required = ['registration_number','make','model','year'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) { showFleetError(\`Missing required columns: \${missing.join(', ')}\`); return; }

  const col = (row, name) => { const idx = headers.indexOf(name); return idx >= 0 ? (row[idx]||'').trim() : ''; };

  fleetParsedRows = [];
  const bodyRows = [];
  let validCount = 0, errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV values simply
    const row = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g,''));
    const reg  = col(row,'registration_number');
    const make = col(row,'make');
    const model= col(row,'model');
    const year = parseInt(col(row,'year'));
    const vin  = col(row,'vin');
    const eng  = col(row,'engine_number');
    const ins  = col(row,'insurer');

    const errors = [];
    if (!reg)  errors.push('Reg. required');
    if (!make) errors.push('Make required');
    if (!model)errors.push('Model required');
    if (!year || year < 1990 || year > 2030) errors.push('Invalid year');

    const isValid = errors.length === 0;
    if (isValid) { validCount++; fleetParsedRows.push({ registrationNumber:reg, make, model, year, vin, engineNumber:eng, insurer:ins }); }
    else errorCount++;

    bodyRows.push(\`
      <tr class="border-b border-gray-100 \${isValid ? '' : 'bg-red-50'}">
        <td class="px-3 py-2 text-gray-400">\${i}</td>
        <td class="px-3 py-2 font-semibold text-blue-600">\${reg||'—'}</td>
        <td class="px-3 py-2">\${make||'—'}</td>
        <td class="px-3 py-2">\${model||'—'}</td>
        <td class="px-3 py-2">\${year||'—'}</td>
        <td class="px-3 py-2 font-mono text-gray-400">\${vin||'—'}</td>
        <td class="px-3 py-2 font-mono text-gray-400">\${eng||'—'}</td>
        <td class="px-3 py-2 text-gray-500">\${ins||'—'}</td>
        <td class="px-3 py-2">\${isValid
          ? '<span class="text-green-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>OK</span>'
          : \`<span class="text-red-500 text-xs" title="\${errors.join(', ')}"><i class="fas fa-exclamation-circle mr-1"></i>\${errors[0]}</span>\`
        }</td>
      </tr>
    \`);
  }

  document.getElementById('fleet-previewBody').innerHTML = bodyRows.join('');
  document.getElementById('fleet-previewTitle').textContent = \`Preview – \${lines.length - 1} rows\`;
  document.getElementById('fleet-previewStats').innerHTML =
    \`<span class="text-green-600 font-semibold">\${validCount} valid</span>\` +
    (errorCount > 0 ? \`, <span class="text-red-500 font-semibold">\${errorCount} with errors</span> (will be skipped)\` : '') +
    '. Only valid rows will be imported.';
  document.getElementById('fleet-previewWrap').classList.remove('hidden');
  updateFleetSubmitBtn();
}

function clearFleetFile(resetTab) {
  fleetParsedRows = [];
  document.getElementById('fleet-previewWrap').classList.add('hidden');
  const isXLSX = fleetActiveTab === 'xlsx';
  const accept  = isXLSX ? '.xlsx,.xls' : '.csv';
  const hint    = isXLSX ? 'Supports .xlsx and .xls files' : 'Supports .csv files';
  document.getElementById('fleet-dropzone').innerHTML = \`
    <i class="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-3 block"></i>
    <p class="text-sm font-semibold text-gray-600">Drop file here or <span class="text-blue-500 underline">browse</span></p>
    <p class="text-xs text-gray-400 mt-1" id="fleet-dropHint">\${hint}</p>
    <input type="file" id="fleet-fileInput" accept="\${accept}" class="hidden" onchange="fleetFileSelected(event)"/>
  \`;
  updateFleetSubmitBtn();
}

function parseFleetExcel(arrayBuffer) {
  document.getElementById('fleet-errorBanner').classList.add('hidden');
  try {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rawRows.length < 2) { showFleetError('Excel file is empty or has no data rows.'); return; }
    const headers = rawRows[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').replace('vin_chassis_number','vin'));
    const required = ['registration_number','make','model','year'];
    const missing  = required.filter(r => !headers.includes(r));
    if (missing.length) { showFleetError('Missing required columns: ' + missing.join(', ')); return; }
    const col = (row, name) => { const idx = headers.indexOf(name); return idx >= 0 ? String(row[idx]||'').trim() : ''; };
    fleetParsedRows = [];
    const bodyRows = [];
    let validCount = 0, errorCount = 0;
    for (let i = 1; i < rawRows.length; i++) {
      const row  = rawRows[i];
      if (row.every(c => String(c).trim() === '')) continue;
      const reg  = col(row,'registration_number');
      const make = col(row,'make');
      const model= col(row,'model');
      const year = parseInt(col(row,'year'));
      const vin  = col(row,'vin');
      const eng  = col(row,'engine_number');
      const ins  = col(row,'insurer');
      const errors = [];
      if (!reg)  errors.push('Reg. required');
      if (!make) errors.push('Make required');
      if (!model)errors.push('Model required');
      if (!year || year < 1990 || year > 2030) errors.push('Invalid year');
      const isValid = errors.length === 0;
      if (isValid) { validCount++; fleetParsedRows.push({ registrationNumber:reg, make, model, year, vin, engineNumber:eng, insurer:ins }); }
      else errorCount++;
      bodyRows.push(\`
        <tr class="border-b border-gray-100 \${isValid ? '' : 'bg-red-50'}">
          <td class="px-3 py-2 text-gray-400">\${i}</td>
          <td class="px-3 py-2 font-semibold text-blue-600">\${reg||'—'}</td>
          <td class="px-3 py-2">\${make||'—'}</td>
          <td class="px-3 py-2">\${model||'—'}</td>
          <td class="px-3 py-2">\${year||'—'}</td>
          <td class="px-3 py-2 font-mono text-gray-400">\${vin||'—'}</td>
          <td class="px-3 py-2 font-mono text-gray-400">\${eng||'—'}</td>
          <td class="px-3 py-2 text-gray-500">\${ins||'—'}</td>
          <td class="px-3 py-2">\${isValid
            ? '<span class="text-green-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>OK</span>'
            : \`<span class="text-red-500 text-xs" title="\${errors.join(', ')}"><i class="fas fa-exclamation-circle mr-1"></i>\${errors[0]}</span>\`
          }</td>
        </tr>
      \`);
    }
    document.getElementById('fleet-previewBody').innerHTML = bodyRows.join('');
    document.getElementById('fleet-previewTitle').textContent = \`Preview – \${rawRows.length - 1} rows\`;
    document.getElementById('fleet-previewStats').innerHTML =
      \`<span class="text-green-600 font-semibold">\${validCount} valid</span>\` +
      (errorCount > 0 ? \`, <span class="text-red-500 font-semibold">\${errorCount} with errors</span> (will be skipped)\` : '') +
      '. Only valid rows will be imported.';
    document.getElementById('fleet-previewWrap').classList.remove('hidden');
    updateFleetSubmitBtn();
  } catch(err) {
    showFleetError('Failed to read Excel file: ' + err.message);
  }
}

function updateFleetSubmitBtn() {
  const hasCustomer = !!document.getElementById('fleet-customerId').value;
  const hasRows = fleetParsedRows.length > 0;
  const btn = document.getElementById('fleet-submitBtn');
  btn.disabled = !(hasCustomer && hasRows);
  document.getElementById('fleet-submitLabel').textContent = hasRows
    ? \`Import \${fleetParsedRows.length} Vehicle\${fleetParsedRows.length !== 1 ? 's' : ''}\`
    : 'Import Fleet';
}

function showFleetError(msg) {
  const el = document.getElementById('fleet-errorBanner');
  el.textContent = '⚠ ' + msg;
  el.classList.remove('hidden');
}

async function submitFleetUpload() {
  const customerId = document.getElementById('fleet-customerId').value;
  if (!customerId || !fleetParsedRows.length) return;
  const btn = document.getElementById('fleet-submitBtn');
  btn.disabled = true;
  document.getElementById('fleet-submitLabel').textContent = 'Importing…';
  try {
    const { data } = await axios.post('/api/vehicles/bulk', { customerId, vehicles: fleetParsedRows });
    closeModal('modal-fleetUpload');
    showToast(\`✅ \${data.imported} vehicle\${data.imported !== 1 ? 's' : ''} imported successfully\${data.skipped > 0 ? ', ' + data.skipped + ' skipped' : ''}\`);
    loadVehicles();
  } catch(err) {
    showFleetError('Import failed: ' + (err.response?.data?.error || err.message));
    btn.disabled = false;
    document.getElementById('fleet-submitLabel').textContent = \`Retry Import\`;
  }
}

// ═══ PFI PDF & SEND ═══

let _currentPFIId = null;
let _currentPFIDetail = null;

// ── Fetch full PFI detail ──
async function fetchPFIDetail(pfiId) {
  const { data } = await axios.get('/api/pfi/' + pfiId + '/detail');
  return data;
}

// ── Build the PDF document using jsPDF ──
function buildPFIDoc(detail) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pfi, job, customer, vehicle, parts } = detail;
  const pageW = 210, margin = 18, contentW = pageW - margin * 2;
  let y = 0;

  // ── Header band ──
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AutoFix GMS', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Garage Management System', margin, 23);
  doc.text('Tel: +255 700 000 000 | info@autofixgms.co.tz', margin, 29);
  doc.text('P.O. Box 12345, Dar es Salaam, Tanzania', margin, 35);
  // PFI label on right
  const isInsuranceJob = job?.category === 'Insurance';
  const pfiTypeLabel = isInsuranceJob ? 'PRO FORMA INVOICE' : 'PRO FORMA INVOICE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(pfiTypeLabel, pageW - margin, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (isInsuranceJob) {
    doc.text('Insurance Claim PFI', pageW - margin, 25, { align: 'right' });
  } else {
    doc.text('Private / Individual Customer', pageW - margin, 25, { align: 'right' });
  }
  doc.text('Ref: PFI-' + pfi.id.toUpperCase(), pageW - margin, 31, { align: 'right' });
  doc.text('Date: ' + new Date(pfi.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - margin, 37, { align: 'right' });
  doc.text('Status: ' + pfi.status, pageW - margin, 43, { align: 'right' });
  y = 52;

  // ── Bill To + Vehicle ──
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentW / 2 - 4, 38, 3, 3, 'F');
  doc.roundedRect(margin + contentW / 2 + 4, y, contentW / 2 - 4, 38, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('BILL TO', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(customer?.name || '—', margin + 4, y + 14);
  doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  if (customer?.phone)   doc.text(customer.phone,   margin + 4, y + 20);
  if (customer?.email)   doc.text(customer.email,   margin + 4, y + 26);
  if (customer?.address) doc.text(customer.address, margin + 4, y + 32);

  const vx = margin + contentW / 2 + 8;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('VEHICLE', vx, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text((vehicle?.registrationNumber || '—') + ' – ' + (vehicle?.make || '') + ' ' + (vehicle?.model || ''), vx, y + 14);
  doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  if (vehicle?.year)         doc.text('Year: ' + vehicle.year,             vx, y + 20);
  if (vehicle?.engineNumber) doc.text('Engine: ' + vehicle.engineNumber,   vx, y + 26);
  if (isInsuranceJob && job?.claimReference)   doc.text('Claim Ref: ' + job.claimReference,  vx, y + 32);
  y += 46;

  // ── Job info ──
  if (job) {
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const jobInfoStr = 'Job Card: ' + (job.jobCardNumber || '—') + '   |   Type: ' + (job.category || '—') + (isInsuranceJob && job.insurer ? '   |   Insurer: ' + job.insurer : '');
    doc.text(jobInfoStr, margin, y);
    y += 6;
    if (job.damageDescription) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
      doc.text('Description: ' + job.damageDescription, margin, y);
      y += 6;
    }
    y += 2;
  }

  // ── Parts table ──
  if (parts && parts.length) {
    doc.setFillColor(30, 64, 175);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PARTS & MATERIALS', margin + 3, y + 5.5);
    y += 8;
    // Column headers
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('#',       margin + 3,              y + 5);
    doc.text('Description',  margin + 10,        y + 5);
    doc.text('Qty',     margin + contentW * 0.65, y + 5);
    doc.text('Unit Cost',margin + contentW * 0.75,y + 5);
    doc.text('Total',   margin + contentW - 3,    y + 5, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    parts.forEach((p, i) => {
      if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, contentW, 7, 'F'); }
      doc.setTextColor(30, 41, 59);
      doc.text(String(i + 1),     margin + 3,              y + 5);
      doc.text(p.partName,         margin + 10,             y + 5);
      doc.text(String(p.quantity), margin + contentW * 0.65,y + 5);
      doc.text(fmt(p.unitCost),    margin + contentW * 0.75,y + 5);
      doc.text(fmt(p.totalCost),   margin + contentW - 3,   y + 5, { align: 'right' });
      y += 7;
    });
    y += 4;
  }

  // ── Cost summary ──
  const sumX = margin + contentW * 0.55, sumW = contentW * 0.45;
  const drawRow = (label, value, bold, highlight) => {
    if (highlight) { doc.setFillColor(239, 246, 255); doc.rect(sumX, y, sumW, 8, 'F'); }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(bold ? 30 : 71, bold ? 41 : 85, bold ? 59 : 105);
    doc.text(label, sumX + 4, y + 5.5);
    doc.text(value, sumX + sumW - 3, y + 5.5, { align: 'right' });
    y += 8;
  };
  y += 2;
  drawRow('Labour Cost',      fmt(pfi.labourCost),    false, false);
  drawRow('Parts / Materials', fmt(pfi.partsCost),    false, false);
  // divider
  doc.setDrawColor(226, 232, 240); doc.line(sumX, y, sumX + sumW, y); y += 3;
  drawRow('TOTAL ESTIMATE',   fmt(pfi.totalEstimate), true,  true);
  y += 4;

  // ── Notes ──
  if (pfi.notes) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('Notes: ' + pfi.notes, margin, y);
    y += 8;
  }

  // ── Footer ──
  const pageH = 297;
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageH - 22, pageW, 22, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('This is a Pro Forma Invoice and does not constitute a tax invoice.', pageW / 2, pageH - 14, { align: 'center' });
  doc.text('AutoFix GMS  |  Tel: +255 700 000 000  |  info@autofixgms.co.tz', pageW / 2, pageH - 8, { align: 'center' });

  return doc;
}

// ── Text preview for the modal ──
function buildPFITextPreview(detail) {
  const { pfi, job, customer, vehicle, parts } = detail;
  const NL = String.fromCharCode(10);
  const line = '\u2500'.repeat(52);
  const dash25 = '\u2500'.repeat(25);
  const isInsuranceJob = job?.category === 'Insurance';
  let t = '';
  t += '       AUTOFIX GMS \u2013 PRO FORMA INVOICE' + NL;
  t += (isInsuranceJob ? '       Insurance Claim PFI' : '       Private / Individual Customer') + NL;
  t += line + NL;
  t += 'Ref:      PFI-' + pfi.id.toUpperCase() + NL;
  t += 'Date:     ' + new Date(pfi.createdAt).toLocaleDateString('en-GB') + NL;
  t += 'Status:   ' + pfi.status + NL;
  t += line + NL;
  t += 'Customer: ' + (customer?.name || '-') + NL;
  t += 'Email:    ' + (customer?.email || '-') + NL;
  t += 'Phone:    ' + (customer?.phone || '-') + NL;
  t += 'Vehicle:  ' + (vehicle?.registrationNumber || '-') + ' ' + (vehicle?.make||'') + ' ' + (vehicle?.model||'') + ' ' + (vehicle?.year||'') + NL;
  if (job) t += 'Job Card: ' + (job.jobCardNumber||'-') + '  (' + job.category + ')' + NL;
  if (isInsuranceJob && job?.insurer) t += 'Insurer:  ' + job.insurer + NL;
  if (isInsuranceJob && job?.claimReference) t += 'Claim:    ' + job.claimReference + NL;
  t += line + NL;
  if (parts?.length) {
    t += 'PARTS & MATERIALS' + NL;
    parts.forEach((p, i) => {
      t += '  ' + (i+1) + '. ' + p.partName + ' x' + p.quantity + '  ' + fmt(p.unitCost) + '  = ' + fmt(p.totalCost) + NL;
    });
    t += line + NL;
  }
  t += '  Labour:         ' + fmt(pfi.labourCost) + NL;
  t += '  Parts:          ' + fmt(pfi.partsCost) + NL;
  t += '  ' + dash25 + NL;
  t += '  TOTAL ESTIMATE: ' + fmt(pfi.totalEstimate) + NL;
  if (pfi.notes) t += NL + 'Notes: ' + pfi.notes + NL;
  t += line + NL;
  t += 'This is a Pro Forma Invoice, not a tax invoice.' + NL;
  return t;
}

// ── Download PDF directly from PFI card ──
async function downloadPFI(pfiId) {
  showToast('Generating PDF…');
  const detail = await fetchPFIDetail(pfiId);
  const doc = buildPFIDoc(detail);
  const filename = \`PFI-\${detail.pfi.id.toUpperCase()}-\${detail.job?.jobCardNumber||'GMS'}.pdf\`;
  doc.save(filename);
  showToast(\`✅ \${filename} downloaded\`);
}

// ── Download from inside the Send modal ──
async function downloadPFIFromModal() {
  if (!_currentPFIDetail) return;
  const doc = buildPFIDoc(_currentPFIDetail);
  const filename = \`PFI-\${_currentPFIDetail.pfi.id.toUpperCase()}.pdf\`;
  doc.save(filename);
  showToast(\`✅ \${filename} downloaded\`);
}

// ── Open Send modal ──
async function showSendPFIModal(pfiId) {
  showToast('Loading PFI details…');
  _currentPFIId = pfiId;
  _currentPFIDetail = await fetchPFIDetail(pfiId);
  const { pfi, job, customer } = _currentPFIDetail;
  const isInsurance = job?.category === 'Insurance';

  // Summary strip
  const catLabel = isInsurance
    ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><i class="fas fa-shield-alt"></i> Insurance</span>'
    : '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-user"></i> Private</span>';
  document.getElementById('sendPFI-subtitle').textContent = (job?.jobCardNumber || 'PFI') + ' – ' + (customer?.name || '');
  document.getElementById('sendPFI-summary').innerHTML = \`
    <div class="flex flex-wrap gap-4 text-sm items-center">
      \${catLabel}
      <div><span class="text-gray-500">Job:</span> <strong>\${job?.jobCardNumber||'—'}</strong></div>
      <div><span class="text-gray-500">Customer:</span> <strong>\${customer?.name||'—'}</strong></div>
      <div><span class="text-gray-500">Vehicle:</span> <strong>\${_currentPFIDetail.vehicle?.registrationNumber||'—'}</strong></div>
      <div><span class="text-gray-500">Total:</span> <strong class="text-blue-700">\${fmt(pfi.totalEstimate)}</strong></div>
      <div><span class="text-gray-500">Status:</span> <strong>\${pfi.status}</strong></div>
    </div>
  \`;

  // Pre-fill email
  document.getElementById('sendPFI-email').value   = customer?.email || '';
  // Pre-fill subject
  document.getElementById('sendPFI-subject').value = \`Pro Forma Invoice – \${job?.jobCardNumber||'PFI-'+pfi.id.toUpperCase()} | AutoFix GMS\`;

  // Pre-fill message — adapt closing line based on job type
  const closingLine = isInsurance
    ? 'Please review and revert with your approval at your earliest convenience.'
    : 'Kindly review the estimate. Please contact us to confirm and schedule the repair.';
  const insuranceExtra = isInsurance && job?.insurer ? ('  Insurer:       ' + job.insurer + String.fromCharCode(10)) : '';
  const claimExtra = isInsurance && job?.claimReference ? ('  Claim Ref:     ' + job.claimReference + String.fromCharCode(10)) : '';

  document.getElementById('sendPFI-message').value =
\`Dear \${customer?.name || 'Valued Customer'},

Please find attached the Pro Forma Invoice (PFI) for the service on your vehicle \${_currentPFIDetail.vehicle?.registrationNumber||''}.

Summary:
  Job Card:       \${job?.jobCardNumber || '—'}
\${insuranceExtra}\${claimExtra}  Labour Cost:    \${fmt(pfi.labourCost)}
  Parts Cost:     \${fmt(pfi.partsCost)}
  Total Estimate: \${fmt(pfi.totalEstimate)}

\${pfi.notes ? 'Notes: ' + pfi.notes + '\\n\\n' : ''}\${closingLine}

For any queries, please contact us at +255 700 000 000 or info@autofixgms.co.tz.

Kind regards,
AutoFix GMS Team\`;

  // Text preview
  document.getElementById('sendPFI-previewBox').textContent = buildPFITextPreview(_currentPFIDetail);
  document.getElementById('sendPFI-btnLabel').textContent = pfi.sentAt ? 'Resend & Record' : 'Send & Record';

  openModal('modal-sendPFI');
}

// ── Open system email client with pre-filled content + PDF hint ──
function copyAndOpenEmail() {
  const email   = document.getElementById('sendPFI-email').value;
  const subject = encodeURIComponent(document.getElementById('sendPFI-subject').value);
  const body    = encodeURIComponent(document.getElementById('sendPFI-message').value + String.fromCharCode(10,10) + '[Please attach the downloaded PDF]');
  // Download the PDF first
  downloadPFIFromModal();
  // Small delay then open mailto
  setTimeout(() => { window.location.href = \`mailto:\${email}?subject=\${subject}&body=\${body}\`; }, 800);
}

// ── Record send in backend ──
async function submitSendPFI() {
  const email = document.getElementById('sendPFI-email').value.trim();
  if (!email) { showToast('Please enter a recipient email', 'error'); return; }
  if (!_currentPFIId) return;
  const btn = document.getElementById('sendPFI-btnLabel');
  btn.textContent = 'Recording…';
  try {
    // 1. Download the PDF automatically
    await downloadPFIFromModal();
    // 2. Record send in backend
    await axios.post('/api/pfi/' + _currentPFIId + '/send', { email });
    closeModal('modal-sendPFI');
    showToast(\`✅ PFI recorded as sent to \${email}. PDF downloaded – please attach and send via email.\`);
    loadClaims();
  } catch(err) {
    showToast('Failed to record send: ' + (err.response?.data?.error || err.message), 'error');
    btn.textContent = 'Retry';
  }
}

// ═══ CLAIMS ═══
async function loadClaims() {
  const [pfiData, jobData] = await Promise.all([axios.get('/api/pfis'), axios.get('/api/jobcards')]);
  allPFIs = pfiData.data; allJobCards = jobData.data;
  _pfiActiveCategory = 'all';
  _pfiActiveStatus   = 'all';
  renderClaims(allPFIs);
}

function renderClaims(pfis) {
  const grid = document.getElementById('claimsGrid');
  if (!pfis.length) { grid.innerHTML = '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-file-invoice text-4xl mb-3 block"></i>No PFIs found</div>'; return; }
  grid.innerHTML = pfis.map(pfi => {
    const job = allJobCards.find(j => j.id === pfi.jobCardId);
    const cfg = PFI_STATUS_CONFIG[pfi.status] || PFI_STATUS_CONFIG['Draft'];
    const isInsurance = job?.category === 'Insurance';
    const catBadge = isInsurance
      ? \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><i class="fas fa-shield-alt"></i> Insurance</span>\`
      : \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-user"></i> Private</span>\`;
    return \`
      <div class="card p-5 flex flex-col">
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="font-bold text-gray-900">\${job?.jobCardNumber||'—'}</p>
            <p class="text-sm text-gray-500 mt-0.5">\${job?.customer?.name||'—'}</p>
          </div>
          <span class="badge" style="background:\${cfg.bg};color:\${cfg.text}"><i class="fas \${cfg.icon} mr-1"></i>\${pfi.status}</span>
        </div>
        <div class="flex items-center gap-2 mb-3">\${catBadge}
          \${job?.vehicle ? \`<span class="text-xs text-gray-400"><i class="fas fa-car mr-1"></i>\${job.vehicle.registrationNumber||''}</span>\` : ''}
        </div>
        \${isInsurance && job?.insurer ? \`<div class="flex items-center gap-2 mb-2 text-sm text-gray-600"><i class="fas fa-shield-alt text-blue-400"></i>\${job.insurer}</div>\` : ''}
        \${isInsurance && job?.claimReference ? \`<p class="text-xs text-gray-400 mb-2"><i class="fas fa-hashtag mr-1"></i>\${job.claimReference}</p>\` : ''}
        <div class="bg-gray-50 rounded-xl p-3 mb-4">
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Labour</span><span class="font-semibold">\${fmt(pfi.labourCost)}</span></div>
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Parts</span><span class="font-semibold">\${fmt(pfi.partsCost)}</span></div>
          <div class="flex justify-between text-sm font-bold border-t pt-2"><span>Total Estimate</span><span class="text-blue-600">\${fmt(pfi.totalEstimate)}</span></div>
        </div>
        \${pfi.notes ? \`<p class="text-xs text-gray-500 mb-3 italic">"\${pfi.notes}"</p>\` : ''}
        \${pfi.sentAt ? \`<p class="text-xs text-green-600 mb-2"><i class="fas fa-check-circle mr-1"></i>Sent to <strong>\${pfi.sentTo||'customer'}</strong> on \${new Date(pfi.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>\` : ''}
        <div class="flex flex-col gap-2 mt-auto">
          \${isInsurance ? \`
          <div class="flex gap-2">
            \${pfi.status === 'Submitted' ? \`
              <button class="btn-primary text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Approved')"><i class="fas fa-check mr-1"></i>Approve</button>
              <button class="btn-danger text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Rejected')"><i class="fas fa-times mr-1"></i>Reject</button>
            \` : ''}
            \${pfi.status === 'Draft' ? \`<button class="btn-primary text-xs w-full" onclick="updatePFIStatus('\${pfi.id}','Submitted')"><i class="fas fa-paper-plane mr-1"></i>Submit to Insurer</button>\` : ''}
          </div>
          \` : \`
          <div class="flex gap-2">
            \${pfi.status === 'Draft' ? \`<button class="btn-primary text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Sent')"><i class="fas fa-paper-plane mr-1"></i>Mark as Sent</button>\` : ''}
            \${pfi.status === 'Sent' ? \`<span class="text-xs text-green-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>Sent to Customer</span>\` : ''}
          </div>
          \`}
          <div class="flex gap-2">
            <button class="btn-secondary text-xs flex-1" onclick="downloadPFI('\${pfi.id}')">
              <i class="fas fa-download mr-1"></i>Download PDF
            </button>
            <button class="btn-secondary text-xs flex-1" onclick="showSendPFIModal('\${pfi.id}')">
              <i class="fas fa-paper-plane mr-1"></i>\${pfi.sentAt ? 'Resend' : 'Send to Customer'}
            </button>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

let _pfiActiveCategory = 'all';
let _pfiActiveStatus   = 'all';

function filterPFICategory(cat, btn) {
  _pfiActiveCategory = cat;
  document.querySelectorAll('#pfi-catTabs button').forEach(b => { b.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'; });
  btn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white';
  _applyPFIFilters();
}

function filterPFIs(status, btn) {
  _pfiActiveStatus = status;
  document.querySelectorAll('#pfi-statusTabs button').forEach(b => { b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'; });
  btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-white';
  _applyPFIFilters();
}

function _applyPFIFilters() {
  let list = allPFIs;
  if (_pfiActiveCategory !== 'all') {
    list = list.filter(p => {
      const job = allJobCards.find(j => j.id === p.jobCardId);
      return job?.category === _pfiActiveCategory;
    });
  }
  if (_pfiActiveStatus !== 'all') {
    list = list.filter(p => p.status === _pfiActiveStatus);
  }
  renderClaims(list);
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

// ═══ OIL SERVICES ═══
let oilData = [];
async function loadOilServices() {
  const { data } = await axios.get('/api/catalogue/oil');
  oilData = data;
  showOilBrand('Toyota', document.querySelector('#oilBrandTabs button'));
}

function showOilBrand(brand, btn) {
  document.querySelectorAll('#oilBrandTabs button').forEach(b => {
    b.className = 'px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200';
  });
  if (btn) btn.className = 'px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow';
  const product = oilData.find(p => p.brand === brand);
  const banner = document.getElementById('oilFleetBanner');
  banner.classList.toggle('hidden', brand !== 'Toyota');
  if (!product) {
    document.getElementById('oilPricingTable').innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-oil-can text-3xl mb-3 block"></i>No pricing data available</div>';
    return;
  }
  const tierColors = { Standard: { bg:'#eff6ff', text:'#2563eb', border:'#bfdbfe' }, Prestige: { bg:'#f5f3ff', text:'#7c3aed', border:'#ddd6fe' }, Premier: { bg:'#fffbeb', text:'#d97706', border:'#fde68a' } };
  document.getElementById('oilPricingTable').innerHTML = \`
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b">
            <th class="text-left px-5 py-4 font-bold text-gray-700">Engine Size</th>
            <th class="text-right px-5 py-4 font-bold" style="color:\${tierColors.Standard.text}">
              <div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:\${tierColors.Standard.text}"></span>Standard</div>
            </th>
            <th class="text-right px-5 py-4 font-bold" style="color:\${tierColors.Prestige.text}">
              <div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:\${tierColors.Prestige.text}"></span>Prestige</div>
            </th>
            <th class="text-right px-5 py-4 font-bold" style="color:\${tierColors.Premier.text}">
              <div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:\${tierColors.Premier.text}"></span>Premier</div>
            </th>
            <th class="text-right px-5 py-4 font-semibold text-gray-500">Std Margin</th>
            <th class="text-right px-5 py-4 font-semibold text-gray-500">Pres Margin</th>
            <th class="text-right px-5 py-4 font-semibold text-gray-500">Prem Margin</th>
          </tr>
        </thead>
        <tbody>
          \${product.tiers.map((t, i) => \`
            <tr class="border-b hover:bg-gray-50 transition-colors \${i % 2 === 0 ? '' : 'bg-gray-50/50'}">
              <td class="px-5 py-3.5 font-semibold text-gray-800">
                <i class="fas fa-tachometer-alt text-gray-400 mr-2 text-xs"></i>\${t.engineSize}
              </td>
              <td class="px-5 py-3.5 text-right">
                <span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:\${tierColors.Standard.bg};color:\${tierColors.Standard.text}">\${fmt(t.standardPrice)}</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:\${tierColors.Prestige.bg};color:\${tierColors.Prestige.text}">\${fmt(t.prestigePrice)}</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:\${tierColors.Premier.bg};color:\${tierColors.Premier.text}">\${fmt(t.premierPrice)}</span>
              </td>
              <td class="px-5 py-3.5 text-right text-green-600 font-medium">\${fmt(t.standardMargin)}</td>
              <td class="px-5 py-3.5 text-right text-green-600 font-medium">\${fmt(t.prestigeMargin)}</td>
              <td class="px-5 py-3.5 text-right text-green-600 font-medium">\${fmt(t.premierMargin)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>
    \${brand === 'Toyota' ? \`
      <div class="p-4 bg-amber-50 border-t border-amber-100">
        <p class="text-xs text-amber-700 font-semibold"><i class="fas fa-info-circle mr-1"></i>Fleet Discount: TZS 5,000/car for 3-5 vehicles | TZS 8,000/car for 5+ vehicles (per service)</p>
      </div>
    \` : ''}
  \`;
}

// ═══ PARTS CATALOGUE ═══
let allParts = [];
async function loadPartsCatalogue() {
  const { data } = await axios.get('/api/catalogue/parts');
  allParts = data;
  renderPartsStats(data);
  renderPartsTable(data);
}

function renderPartsStats(parts) {
  if (!parts.length) return;
  const cats = [...new Set(parts.map(p => p.category))];
  const avgMargin = parts.reduce((s, p) => s + p.margin, 0) / parts.length;
  const maxMargin = Math.max(...parts.map(p => p.margin));
  document.getElementById('partsStats').innerHTML = [
    { label: 'Total Parts', value: parts.length, icon: 'fa-cubes', color: '#2563eb' },
    { label: 'Categories', value: cats.length, icon: 'fa-tags', color: '#7c3aed' },
    { label: 'Avg Margin', value: fmt(Math.round(avgMargin)), icon: 'fa-chart-line', color: '#16a34a' },
    { label: 'Best Margin', value: fmt(maxMargin), icon: 'fa-trophy', color: '#d97706' },
    { label: 'In Stock', value: parts.reduce((s, p) => s + (p.stockQuantity || 0), 0) + ' units', icon: 'fa-box', color: '#0891b2' },
    { label: 'Out of Stock', value: parts.filter(p => (p.stockQuantity || 0) === 0).length, icon: 'fa-exclamation-circle', color: '#dc2626' },
  ].map(s => \`
    <div class="card p-4 border-l-4" style="border-color:\${s.color}">
      <div class="flex items-center gap-3 mb-1">
        <i class="fas \${s.icon} text-sm" style="color:\${s.color}"></i>
        <p class="text-xs text-gray-500 font-semibold uppercase">\${s.label}</p>
      </div>
      <p class="text-xl font-bold text-gray-900">\${s.value}</p>
    </div>
  \`).join('');
}

const CAT_COLORS = {
  'Air Filter':  { bg:'#eff6ff', text:'#2563eb' },
  'AC Filter':   { bg:'#f0fdf4', text:'#16a34a' },
  'Oil Filter':  { bg:'#fffbeb', text:'#d97706' },
  'Diesel Filter':{ bg:'#fff7ed', text:'#ea580c' },
  'Spark Plugs': { bg:'#fdf2f8', text:'#db2777' },
  'Accessory':   { bg:'#f5f3ff', text:'#7c3aed' },
};

function renderPartsTable(parts) {
  const tbody = document.getElementById('partsTable');
  if (!tbody) return;
  if (!parts.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-search text-3xl mb-3 block"></i>No parts found</td></tr>';
    return;
  }
  tbody.innerHTML = parts.map(p => {
    const c = CAT_COLORS[p.category] || { bg:'#f1f5f9', text:'#64748b' };
    const marginPct = Math.round((p.margin / p.sellingPrice) * 100);
    const marginColor = marginPct >= 50 ? '#16a34a' : marginPct >= 30 ? '#d97706' : '#dc2626';
    return \`
      <tr class="table-row border-b border-gray-50">
        <td class="px-4 py-3">
          <span class="badge" style="background:\${c.bg};color:\${c.text}">\${p.category}</span>
        </td>
        <td class="px-4 py-3 font-medium text-gray-800 text-sm">\${p.description}</td>
        <td class="px-4 py-3 text-xs text-gray-500">
          <div class="flex flex-wrap gap-1">
            \${p.compatibleModels.split(',').slice(0,3).map(m => \`<span class="tag bg-gray-100 text-gray-600">\${m.trim()}</span>\`).join('')}
            \${p.compatibleModels.split(',').length > 3 ? \`<span class="tag bg-gray-100 text-gray-400">+\${p.compatibleModels.split(',').length-3} more</span>\` : ''}
          </div>
        </td>
        <td class="px-4 py-3 text-right text-gray-600">\${fmt(p.buyingPrice)}</td>
        <td class="px-4 py-3 text-right font-bold text-gray-900">\${fmt(p.sellingPrice)}</td>
        <td class="px-4 py-3 text-right font-semibold text-green-600">\${fmt(p.margin)}</td>
        <td class="px-4 py-3 text-right">
          <span class="font-bold text-sm" style="color:\${marginColor}">\${marginPct}%</span>
        </td>
        <td class="px-4 py-3 text-right">
          \${(p.stockQuantity || 0) === 0
            ? \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><i class="fas fa-times-circle"></i>Out</span>\`
            : (p.stockQuantity || 0) <= 5
              ? \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-exclamation-triangle"></i>\${p.stockQuantity}</span>\`
              : \`<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><i class="fas fa-check"></i>\${p.stockQuantity}</span>\`
          }
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="showEditCataloguePartModal('\${p.id}')" title="Edit part" class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"><i class="fas fa-pen text-xs"></i></button>
            <button onclick="showRestockModal('\${p.id}')" title="Add stock" class="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"><i class="fas fa-plus text-xs"></i></button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}

let _activeCatTab = '';
function setPartsCategoryTab(cat) {
  _activeCatTab = cat;
  document.querySelectorAll('.parts-cat-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
  });
  filterParts();
}

function filterParts(search) {
  const q = (search !== undefined ? search : (document.getElementById('partsSearch')?.value || '')).toLowerCase();
  const cat = _activeCatTab;
  let filtered = allParts;
  if (cat) filtered = filtered.filter(p => p.category === cat);
  if (q) filtered = filtered.filter(p =>
    p.description.toLowerCase().includes(q) ||
    p.compatibleModels.toLowerCase().includes(q)
  );
  renderPartsStats(filtered);
  renderPartsTable(filtered);
}

// ─── Add Catalogue Part ───────────────────────────────────────────────────────
function showAddCataloguePartModal() {
  document.getElementById('acp-category').value = '';
  document.getElementById('acp-description').value = '';
  document.getElementById('acp-models').value = '';
  document.getElementById('acp-buy').value = '';
  document.getElementById('acp-sell').value = '';
  document.getElementById('acp-stock').value = '0';
  document.getElementById('acp-margin-preview').classList.add('hidden');
  openModal('modal-addCatPart');
}
function acpCalcMargin() {
  const buy = parseFloat(document.getElementById('acp-buy').value) || 0;
  const sell = parseFloat(document.getElementById('acp-sell').value) || 0;
  const margin = sell - buy;
  const pct = sell > 0 ? Math.round((margin / sell) * 100) : 0;
  const el = document.getElementById('acp-margin-preview');
  if (buy > 0 || sell > 0) {
    el.classList.remove('hidden');
    document.getElementById('acp-margin-amt').textContent = 'TZS ' + fmt(margin);
    document.getElementById('acp-margin-pct').textContent = pct + '%';
  } else {
    el.classList.add('hidden');
  }
}
async function submitAddCatPart() {
  const cat = document.getElementById('acp-category').value.trim();
  const desc = document.getElementById('acp-description').value.trim();
  const buy = parseFloat(document.getElementById('acp-buy').value) || 0;
  const sell = parseFloat(document.getElementById('acp-sell').value) || 0;
  const stock = parseInt(document.getElementById('acp-stock').value) || 0;
  const models = document.getElementById('acp-models').value.trim();
  if (!cat) { showToast('Please select a category', 'error'); return; }
  if (!desc) { showToast('Please enter a description', 'error'); return; }
  if (sell <= 0) { showToast('Please enter a selling price', 'error'); return; }
  const { data } = await axios.post('/api/catalogue/parts', {
    category: cat, description: desc, compatibleModels: models,
    buyingPrice: buy, sellingPrice: sell, stockQuantity: stock
  });
  allParts.push(data);
  closeModal('modal-addCatPart');
  filterParts();
  showToast('Part added to catalogue');
}

// ─── Edit Catalogue Part ──────────────────────────────────────────────────────
function showEditCataloguePartModal(id) {
  const p = allParts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('ecp-id').value = p.id;
  document.getElementById('ecp-category').value = p.category;
  document.getElementById('ecp-description').value = p.description;
  document.getElementById('ecp-models').value = p.compatibleModels;
  document.getElementById('ecp-buy').value = p.buyingPrice;
  document.getElementById('ecp-sell').value = p.sellingPrice;
  ecpCalcMargin();
  openModal('modal-editCatPart');
}
function ecpCalcMargin() {
  const buy = parseFloat(document.getElementById('ecp-buy').value) || 0;
  const sell = parseFloat(document.getElementById('ecp-sell').value) || 0;
  const margin = sell - buy;
  const pct = sell > 0 ? Math.round((margin / sell) * 100) : 0;
  document.getElementById('ecp-margin-amt').textContent = 'TZS ' + fmt(margin);
  document.getElementById('ecp-margin-pct').textContent = pct + '%';
}
async function submitEditCatPart() {
  const id = document.getElementById('ecp-id').value;
  const cat = document.getElementById('ecp-category').value.trim();
  const desc = document.getElementById('ecp-description').value.trim();
  const buy = parseFloat(document.getElementById('ecp-buy').value) || 0;
  const sell = parseFloat(document.getElementById('ecp-sell').value) || 0;
  const models = document.getElementById('ecp-models').value.trim();
  if (!desc || sell <= 0) { showToast('Please fill in required fields', 'error'); return; }
  const margin = sell - buy;
  const { data } = await axios.put('/api/catalogue/parts/' + id, {
    category: cat, description: desc, compatibleModels: models,
    buyingPrice: buy, sellingPrice: sell, margin
  });
  const idx = allParts.findIndex(x => x.id === id);
  if (idx !== -1) allParts[idx] = { ...allParts[idx], ...data };
  closeModal('modal-editCatPart');
  filterParts();
  showToast('Part updated successfully');
}

// ─── Restock Modal ────────────────────────────────────────────────────────────
function showRestockModal(id) {
  const p = allParts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('restock-id').value = p.id;
  document.getElementById('restock-part-name').textContent = p.description;
  document.getElementById('restock-current').textContent = (p.stockQuantity || 0) + ' units';
  document.getElementById('restock-qty').value = '';
  document.getElementById('restock-preview').classList.add('hidden');
  document.getElementById('restock-qty').oninput = function() {
    const qty = parseInt(this.value) || 0;
    const prev = document.getElementById('restock-preview');
    if (qty > 0) {
      prev.classList.remove('hidden');
      document.getElementById('restock-new-total').textContent = ((p.stockQuantity || 0) + qty) + ' units';
    } else {
      prev.classList.add('hidden');
    }
  };
  openModal('modal-restock');
}
async function submitRestock() {
  const id = document.getElementById('restock-id').value;
  const qty = parseInt(document.getElementById('restock-qty').value) || 0;
  if (qty <= 0) { showToast('Enter a valid quantity', 'error'); return; }
  const { data } = await axios.patch('/api/catalogue/parts/' + id + '/restock', { quantity: qty });
  const idx = allParts.findIndex(x => x.id === id);
  if (idx !== -1) allParts[idx] = { ...allParts[idx], stockQuantity: data.stockQuantity };
  closeModal('modal-restock');
  filterParts();
  showToast('Stock updated – ' + data.stockQuantity + ' units now in stock');
}

// ═══ CAR WASH ═══
async function loadCarWash() {
  const { data } = await axios.get('/api/catalogue/carwash');
  const groups = { Standard: [], AddOn: [], DeepClean: [], Monthly: [] };
  data.forEach(p => { if (groups[p.type]) groups[p.type].push(p); });
  const groupConfig = [
    { type:'Standard',  title:'Standard Washes',    icon:'fa-car', color:'#2563eb',   desc:'Regular interior and exterior wash services' },
    { type:'AddOn',     title:'Add-On Services',     icon:'fa-plus-circle', color:'#7c3aed', desc:'Optional extras to complement any wash' },
    { type:'DeepClean', title:'Deep Clean Packages', icon:'fa-star', color:'#d97706', desc:'Premium full-service cleaning packages' },
    { type:'Monthly',   title:'Monthly Fleet Plans', icon:'fa-calendar-alt', color:'#16a34a', desc:'Cost-saving monthly subscriptions for fleet customers' },
  ];
  document.getElementById('carWashGrid').innerHTML = groupConfig.map(cfg => \`
    <div class="card p-5">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:\${cfg.color}20">
          <i class="fas \${cfg.icon}" style="color:\${cfg.color}"></i>
        </div>
        <div><h3 class="font-bold text-gray-900">\${cfg.title}</h3><p class="text-xs text-gray-400">\${cfg.desc}</p></div>
      </div>
      <div class="space-y-3">
        \${(groups[cfg.type] || []).map(pkg => \`
          <div class="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
            <div class="flex-1 pr-3">
              <p class="font-semibold text-gray-800 text-sm">\${pkg.name}</p>
              <p class="text-xs text-gray-500 mt-0.5">\${pkg.description}</p>
              \${pkg.includes ? \`<div class="flex flex-wrap gap-1 mt-2">\${pkg.includes.map(i => \`<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">\${i}</span>\`).join('')}</div>\` : ''}
              \${pkg.vehicleCount ? \`<p class="text-xs text-blue-600 font-semibold mt-1"><i class="fas fa-car mr-1"></i>\${pkg.vehicleCount} vehicles</p>\` : ''}
            </div>
            <div class="text-right flex-shrink-0">
              \${pkg.price > 0 ? \`<p class="font-bold text-gray-900 text-sm">\${fmt(pkg.price)}</p><p class="text-xs text-gray-400">\${pkg.vehicleCount ? '/month' : '/visit'}</p>\` : \`<span class="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Quote</span>\`}
            </div>
          </div>
        \`).join('') || \`<p class="text-center text-gray-300 py-4 text-sm">No items</p>\`}
      </div>
    </div>
  \`).join('');
}

// ═══ ADD-ON SERVICES ═══
async function loadAddOns() {
  const { data } = await axios.get('/api/catalogue/addons');
  const catConfig = {
    Diagnostic: { icon:'fa-laptop-medical', color:'#dc2626', bg:'#fee2e2' },
    Inspection: { icon:'fa-search-plus',    color:'#2563eb', bg:'#dbeafe' },
    Tyres:      { icon:'fa-circle-notch',   color:'#7c3aed', bg:'#ede9fe' },
    Alignment:  { icon:'fa-ruler-combined', color:'#16a34a', bg:'#dcfce7' },
  };
  document.getElementById('addOnsGrid').innerHTML = data.map(s => {
    const cfg = catConfig[s.category] || { icon:'fa-wrench', color:'#64748b', bg:'#f1f5f9' };
    return \`
      <div class="card p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:\${cfg.bg}">
            <i class="fas \${cfg.icon} text-xl" style="color:\${cfg.color}"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900 text-lg">\${s.name}</h3>
            <span class="badge mt-1" style="background:\${cfg.bg};color:\${cfg.color}">\${s.category}</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-5 leading-relaxed">\${s.description}</p>
        <div class="flex items-center justify-between border-t pt-4">
          <div>
            <p class="text-2xl font-bold text-gray-900">\${fmt(s.price)}</p>
            <p class="text-xs text-gray-400 mt-0.5">\${s.unit}</p>
          </div>
          <button class="btn-primary text-sm" onclick="addServiceToJob('\${s.name}', \${s.price}, '\${s.unit}')">
            <i class="fas fa-plus"></i> Add to Job
          </button>
        </div>
      </div>
    \`;
  }).join('');
}

function addServiceToJob(name, price, unit) {
  showToast(name + ' (' + fmt(price) + ' ' + unit + ') - Go to a Job Card to add this service', 'info');
}

// ═══ INIT ═══
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
loadDashboard();
</script>
</body>
</html>`;
}

export default app
