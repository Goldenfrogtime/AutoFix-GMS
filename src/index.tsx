import { Hono } from 'hono'
import { cors } from 'hono/cors'
import api from './routes/api'

const app = new Hono()
app.use('/api/*', cors())
app.route('/api', api)

// ─── Main HTML Shell ─────────────────────────────────────────────────────────
// no-store ensures browser always fetches fresh JS (prevents stale-cache errors)
const htmlHandler = (c: any) => {
  c.header('Cache-Control', 'no-store, must-revalidate')
  return c.html(shell())
}
app.get('/', htmlHandler)
app.get('*', htmlHandler)

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
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:12px;backdrop-filter:blur(2px)}
.modal-box{background:#fff;border-radius:20px;max-width:680px;width:100%;max-height:92vh;overflow-y:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
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
.search-input{padding:9px 13px 9px 38px;border:1.5px solid #e2e8f0;border-radius:10px;outline:none;font-size:.9rem;width:100%;transition:border-color .2s,width .2s}
.search-input:focus{border-color:#3b82f6}
.tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:.75rem;font-weight:600}
.parts-cat-tab{padding:6px 16px;border-radius:99px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s}
.parts-cat-tab:hover{border-color:#3b82f6;color:#2563eb;background:#eff6ff}
.parts-cat-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}
/* ── Responsive ── */
@media(max-width:1023px){
  /* Sidebar becomes a fixed full-height overlay on mobile/tablet */
  aside#sidebar{
    position:fixed !important;
    top:0;left:0;
    height:100vh;
    width:256px;
    max-width:82vw;
    -webkit-transform:translateX(-100%);
    transform:translateX(-100%);
    z-index:50;
    /* KEY: make the aside take zero flex-space so <main> fills 100% */
    flex:0 0 0px !important;
    min-width:0 !important;
    overflow:hidden !important;
  }
  aside#sidebar.open{
    transform:translateX(0) !important;
    overflow-y:auto !important;
  }
}
/* Modal box: padding and max-width responsive */
.modal-box{padding:16px}
@media(min-width:640px){.modal-box{padding:24px}}
@media(min-width:768px){.modal-box{padding:28px}}
/* JS-injected max-width values must not exceed viewport */
.modal-overlay .modal-box{max-width:min(var(--mw,680px),calc(100vw - 24px)) !important}
/* Search inputs never expand beyond container */
.search-input{width:100% !important;max-width:100% !important}
.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.btn-primary,.btn-secondary,.btn-danger{white-space:nowrap}
/* Page headings responsive */
@media(max-width:639px){
  h2.text-2xl{font-size:1.2rem}
  .job-cards-filters .form-input,.job-cards-filters .search-input{min-width:0;width:100%}
  /* Appointment stat chips: 3 cols on xs instead of 2 */
  #apt-statChips{grid-template-columns:repeat(3,1fr) !important}
}
/* Customer / oil brand tabs horizontal scroll */
#customerTypeTabs,#oilBrandTabs,#lubBrandTabs,#lubTypeTabs,#jobStatusStrips,#pfi-catTabs,#pfi-statusTabs,#partsCategoryTabs{
  overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-wrap:nowrap !important}
#customerTypeTabs::-webkit-scrollbar,#oilBrandTabs::-webkit-scrollbar,#lubBrandTabs::-webkit-scrollbar,
#lubTypeTabs::-webkit-scrollbar,#jobStatusStrips::-webkit-scrollbar,
#pfi-catTabs::-webkit-scrollbar,#pfi-statusTabs::-webkit-scrollbar,#partsCategoryTabs::-webkit-scrollbar{display:none}
/* Prevent filter tab buttons from shrinking */
#customerTypeTabs button,#oilBrandTabs button,#lubBrandTabs button,#lubTypeTabs button,#jobStatusStrips button,
#pfi-catTabs button,#pfi-statusTabs button,#partsCategoryTabs button{flex-shrink:0}
/* Job detail actions wrap */
#jobDetailActions{flex-wrap:wrap;gap:6px}
/* Parts / Lubricants stats 2 cols on xs */
@media(max-width:639px){#partsStats,#lubStats{grid-template-columns:repeat(2,1fr)}}
/* Status progress stepper: always scrollable */
.status-stepper-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
.status-stepper-scroll::-webkit-scrollbar{height:3px}
.status-stepper-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
/* Oil tiers grid: 1 col on xs, 3 cols sm+ */
.oil-tier-grid{display:grid;grid-template-columns:1fr;gap:8px}
@media(min-width:480px){.oil-tier-grid{grid-template-columns:repeat(3,1fr)}}
/* Car wash grid: always 1 col in modal */
.carwash-inner-grid{display:grid;grid-template-columns:1fr;gap:8px}
@media(min-width:480px){.carwash-inner-grid{grid-template-columns:repeat(2,1fr)}}
/* Service modal tab bar: icon-only on xs, icon+label on sm */
.svc-tab-bar button .svc-tab-label{display:none}
@media(min-width:480px){.svc-tab-bar button .svc-tab-label{display:inline}}
/* ── Customer Search Picker ─────────────────────────────── */
.cust-picker-wrap{position:relative}
.cust-picker-list{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:9999;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:220px;overflow-y:auto;padding:4px 0;margin:0;list-style:none}
.cust-picker-item{padding:9px 13px;cursor:pointer;transition:background .12s}
.cust-picker-item:hover{background:#f0f9ff}
.cust-picker-item-main{display:flex;align-items:center;gap:6px}
.cust-picker-item-name{font-weight:600;font-size:.87rem;color:#1e293b}
.cust-picker-item-sub{font-size:.78rem;color:#94a3b8;margin-top:2px;padding-left:0}
.cust-picker-badge{font-size:.65rem;font-weight:700;padding:1px 6px;border-radius:99px;white-space:nowrap}
.cust-picker-badge--corp{background:#ede9fe;color:#7c3aed}
.cust-picker-badge--indiv{background:#dbeafe;color:#1d4ed8}
.cust-picker-empty{padding:10px 14px;font-size:.85rem;color:#94a3b8;text-align:center}
</style>
</head>
<body>

<!-- ═══ LOGIN SCREEN ═══ -->
<div id="loginScreen" class="fixed inset-0 z-[999] flex items-center justify-center p-4" style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#0891b2 100%)">
  <div style="background:#fff;border-radius:24px;max-width:420px;width:100%;padding:40px 36px;box-shadow:0 32px 80px rgba(0,0,0,.35)">
    <div class="flex flex-col items-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
        <i class="fas fa-car-side text-white text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">AutoFix GMS</h1>
      <p class="text-gray-500 text-sm mt-1">Garage Management System</p>
    </div>
    <div id="loginError" class="hidden mb-4 px-4 py-3 rounded-xl text-sm font-medium text-red-700" style="background:#fee2e2;border:1px solid #fca5a5"></div>
    <form id="loginForm" onsubmit="doLogin(event)">
      <div class="mb-4">
        <label class="form-label">Email Address</label>
        <div class="relative">
          <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input id="loginEmail" type="email" class="form-input pl-9" placeholder="you@autofix.co.tz" required autocomplete="username"/>
        </div>
      </div>
      <div class="mb-6">
        <label class="form-label">Password</label>
        <div class="relative">
          <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input id="loginPassword" type="password" class="form-input pl-9" placeholder="Enter your password" required autocomplete="current-password"/>
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onclick="togglePasswordVisibility()">
            <i class="fas fa-eye" id="pwdEyeIcon"></i>
          </button>
        </div>
      </div>
      <button type="submit" id="loginBtn" class="btn-primary w-full justify-center py-3 text-base">
        <i class="fas fa-sign-in-alt"></i> Sign In
      </button>
    </form>
    <p class="text-center text-xs text-gray-400 mt-6">Secure access · Role-based permissions</p>
    <div class="mt-4 p-3 rounded-xl text-center" style="background:#f8fafc;border:1px solid #e2e8f0">
      <p class="text-xs text-gray-500 font-semibold mb-1"><i class="fas fa-info-circle mr-1 text-blue-400"></i>Default Admin Credentials</p>
      <p class="text-xs text-gray-600">Email: <strong>admin@autofix.co.tz</strong></p>
      <p class="text-xs text-gray-600">Password: <strong>Admin2025!</strong></p>
      <button type="button" onclick="fillDefaultCredentials()" class="mt-2 text-xs px-3 py-1 rounded-lg text-blue-600 font-medium hover:bg-blue-50 border border-blue-200 transition-colors">
        <i class="fas fa-magic mr-1"></i>Auto-fill credentials
      </button>
      <p class="text-xs text-gray-400 mt-1">Change these in Users &amp; Roles after first login</p>
    </div>
  </div>
</div>

<div class="flex h-screen overflow-hidden" id="appShell" style="display:none">

<!-- Sidebar backdrop (mobile) -->
<div id="sidebar-backdrop" onclick="closeSidebar()" class="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" style="display:none"></div>

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
    <a class="nav-item active flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-white" onclick="showPage('dashboard')" data-perm="dashboard.view">
      <i class="fas fa-chart-pie w-5 text-center"></i> Dashboard
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('jobcards')" data-perm="jobcards.view">
      <i class="fas fa-clipboard-list w-5 text-center"></i> Job Cards
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('appointments')" data-perm="appointments.view">
      <i class="fas fa-calendar-check w-5 text-center"></i> Appointments
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Operations</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('customers')" data-perm="customers.view">
      <i class="fas fa-users w-5 text-center"></i> Customers
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('vehicles')" data-perm="vehicles.view">
      <i class="fas fa-car w-5 text-center"></i> Vehicles
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('claims')" data-perm="pfis.view">
      <i class="fas fa-file-invoice w-5 text-center"></i> PFIs
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('invoices')" data-perm="invoices.view">
      <i class="fas fa-file-invoice-dollar w-5 text-center"></i> Invoices
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('expenses')" data-perm="expenses.view">
      <i class="fas fa-receipt w-5 text-center"></i> Expenses
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('vendors')" data-perm="expenses.view">
      <i class="fas fa-store w-5 text-center"></i> Vendors
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('gate-passes')" data-perm="jobcards.view">
      <i class="fas fa-id-badge w-5 text-center"></i>
      <span class="flex-1">Gate Passes</span>
      <span id="gpNavBadge" class="hidden bg-orange-400 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none"></span>
    </a>
    <p class="text-xs text-blue-300 font-semibold uppercase tracking-widest px-3 pt-3 pb-1">Management</p>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('packages')" data-perm="packages.view">
      <i class="fas fa-box-open w-5 text-center"></i> Service Packages
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('oil-services')" data-perm="oil_services.view">
      <i class="fas fa-tint w-5 text-center"></i> Lubricants
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('parts-catalogue')" data-perm="parts.view">
      <i class="fas fa-cubes w-5 text-center"></i> Parts Catalogue
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('car-wash')" data-perm="carwash.view">
      <i class="fas fa-shower w-5 text-center"></i> Car Wash
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('add-ons')" data-perm="addons.view">
      <i class="fas fa-wrench w-5 text-center"></i> Add-on Services
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('analytics')" data-perm="analytics.view">
      <i class="fas fa-chart-bar w-5 text-center"></i> Analytics
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('finance')" data-perm="finance.view">
      <i class="fas fa-coins w-5 text-center"></i> Finance
    </a>
    <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-blue-100" onclick="showPage('users')" data-perm="users.view">
      <i class="fas fa-user-cog w-5 text-center"></i> Users & Roles
    </a>
  </nav>
  <div class="p-3 border-t border-white/10">
    <div class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 rounded-xl transition-colors" onclick="showPage('users')">
      <div class="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-bold" id="sidebarUserAvatar">?</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold truncate" id="sidebarUserName">Loading…</p>
        <p class="text-xs text-blue-200" id="sidebarUserRole">—</p>
      </div>
      <button class="text-blue-300 hover:text-red-300 text-xs" onclick="event.stopPropagation();doLogout()" title="Sign out"><i class="fas fa-sign-out-alt"></i></button>
    </div>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="flex-1 flex flex-col overflow-hidden">
  <!-- Top Bar -->
  <header class="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
    <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <button class="lg:hidden text-gray-500 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100" onclick="toggleSidebar()"><i class="fas fa-bars text-lg"></i></button>
      <div class="relative hidden sm:block flex-1 max-w-md" id="globalSearchWrap">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
        <input class="search-input pr-8" type="text" placeholder="Search jobs, customers, vehicles, parts…" id="globalSearch"
          oninput="handleGlobalSearch(this.value)"
          onfocus="if(this.value.trim()) handleGlobalSearch(this.value)"
          onkeydown="globalSearchKeydown(event)"
          autocomplete="off"/>
        <button id="globalSearchClear" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 hidden" onclick="closeGlobalSearch()" type="button">
          <i class="fas fa-times text-sm"></i>
        </button>
        <!-- Results overlay -->
        <div id="globalSearchPanel" class="hidden absolute left-0 top-full mt-2 w-full min-w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden" style="max-height:520px;overflow-y:auto">
          <div id="globalSearchResults"></div>
        </div>
      </div>
      <!-- Mobile search toggle -->
      <button class="sm:hidden text-gray-500 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100" onclick="toggleMobileSearch()" id="mobileSearchBtn"><i class="fas fa-search"></i></button>
    </div>
    <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
      <!-- Notification Bell -->
      <div class="relative" id="notifBellWrap">
        <button id="notifBell" class="relative text-gray-500 hover:text-gray-700 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" title="Notifications" onclick="toggleNotifDropdown()">
          <i class="fas fa-bell text-lg"></i>
          <span id="notifBadge" class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full hidden items-center justify-center font-bold leading-none">0</span>
        </button>
        <!-- Notification Dropdown -->
        <div id="notifDropdown" class="hidden absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" style="max-height:520px">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div class="flex items-center gap-2">
              <i class="fas fa-bell text-blue-600 text-sm"></i>
              <span class="font-bold text-gray-800 text-sm">Notifications</span>
              <span id="notifDropBadge" class="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full hidden">0 new</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="text-xs text-blue-600 hover:text-blue-700 font-semibold" onclick="markAllRead()">Mark all read</button>
              <button class="text-xs text-gray-500 hover:text-gray-700 font-semibold" onclick="showPage('notifications');closeNotifDropdown()">View all</button>
            </div>
          </div>
          <div id="notifList" class="overflow-y-auto" style="max-height:420px">
            <p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-bell-slash mb-2 block text-2xl"></i>No notifications</p>
          </div>
          <div class="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between">
            <button class="text-xs text-gray-500 hover:text-red-500 font-medium" onclick="clearReadNotifs()"><i class="fas fa-trash-alt mr-1"></i>Clear read</button>
            <button class="text-xs text-blue-600 hover:text-blue-700 font-semibold" onclick="showPage('notifications');closeNotifDropdown()"><i class="fas fa-external-link-alt mr-1"></i>All notifications</button>
          </div>
        </div>
      </div>
      <button class="btn-primary text-sm px-3 sm:px-4" onclick="showNewJobModal()">
        <i class="fas fa-plus"></i><span class="hidden sm:inline"> New Job Card</span><span class="sm:hidden"> New</span>
      </button>
    </div>
  </header>
  <!-- Mobile search bar (shown on toggle) -->
  <div id="mobileSearchBar" class="hidden sm:hidden bg-white border-b border-gray-100 px-3 py-2">
    <div class="relative" id="globalSearchWrapMobile">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
      <input class="search-input pl-9 w-full" type="text" placeholder="Search jobs, vehicles, customers, parts…" id="globalSearchMobile"
        oninput="handleGlobalSearch(this.value, true)"
        onkeydown="globalSearchKeydown(event)"
        autocomplete="off"/>
      <div id="globalSearchPanelMobile" class="hidden absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden" style="max-height:420px;overflow-y:auto">
        <div id="globalSearchResultsMobile"></div>
      </div>
    </div>
  </div>

  <!-- Pages Container -->
  <div class="flex-1 overflow-y-auto p-3 sm:p-6" id="pageContainer">

    <!-- ═══ DASHBOARD ═══ -->
    <div id="page-dashboard" class="page active">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
          <p class="text-gray-500 text-sm mt-1" id="dashWelcome">Welcome back! Here's what's happening today.</p>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-xs text-gray-400">Today</p>
          <p class="text-sm font-semibold text-gray-700" id="todayDate"></p>
        </div>
      </div>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="dashStats"></div>

      <!-- Finance Snapshot Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" id="dashFinanceCards" data-perm="finance.view">
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Collected</div>
          <div class="text-base font-bold text-green-600" id="dfCollected">—</div>
          <div class="text-xs text-green-400 mt-0.5"><i class="fas fa-arrow-up"></i> Paid</div>
        </div>
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Outstanding</div>
          <div class="text-base font-bold text-amber-600" id="dfOutstanding">—</div>
          <div class="text-xs text-amber-400 mt-0.5"><i class="fas fa-clock"></i> Pending</div>
        </div>
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Overdue</div>
          <div class="text-base font-bold text-red-600" id="dfOverdue">—</div>
          <div class="text-xs text-red-400 mt-0.5"><i class="fas fa-exclamation-circle"></i> Past due</div>
        </div>
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Pipeline</div>
          <div class="text-base font-bold text-purple-600" id="dfPipeline">—</div>
          <div class="text-xs text-purple-400 mt-0.5"><i class="fas fa-funnel-dollar"></i> In progress</div>
        </div>
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Expenses</div>
          <div class="text-base font-bold text-red-700" id="dfExpenses">—</div>
          <div class="text-xs text-red-400 mt-0.5"><i class="fas fa-receipt"></i> Total</div>
        </div>
        <div class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onclick="showPage('finance')">
          <div class="text-xs text-gray-500 mb-1">Net Income</div>
          <div class="text-base font-bold" id="dfNetIncome">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="dfMarginPct">Margin: —</div>
        </div>
      </div>
      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm transition-colors" onclick="showAddExpenseModal()">
                <i class="fas fa-receipt"></i> Log an Expense
              </button>
            </div>
          </div>
          <!-- Expense Snapshot -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-gray-800">Expense Snapshot</h3>
              <button class="text-red-600 text-xs font-semibold hover:underline" onclick="showPage('expenses')">View All →</button>
            </div>
            <div id="dashExpenseSnapshot"><p class="text-gray-400 text-sm text-center py-4">Loading…</p></div>
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
      <div class="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5" id="apt-statChips"></div>

      <!-- Filters bar -->
      <div class="card p-4 mb-5">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative flex-1 min-w-[160px]">
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
          <div class="table-scroll">
          <table class="w-full text-sm" style="min-width:640px">
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
        <div class="flex flex-wrap items-center gap-2 job-cards-filters w-full sm:w-auto mt-2 sm:mt-0">
          <div class="relative flex-1 min-w-[150px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search job cards…" id="jobSearch" oninput="filterJobCards(this.value)"/>
          </div>
          <select class="form-input flex-1 min-w-[120px] sm:w-auto" id="jobStatusFilter" onchange="filterJobCards()">
            <option value="">All Statuses</option>
            <option>RECEIVED</option><option>INSPECTION</option><option>PFI_PREPARATION</option>
            <option>AWAITING_INSURER_APPROVAL</option><option>REPAIR_IN_PROGRESS</option>
            <option>WAITING_FOR_PARTS</option><option>QUALITY_CHECK</option>
            <option>COMPLETED</option><option>INVOICED</option><option>RELEASED</option>
          </select>
          <button class="btn-primary flex-shrink-0" onclick="showNewJobModal()"><i class="fas fa-plus"></i> New Job</button>
        </div>
      </div>
      <!-- Kanban-style status strips -->
      <div class="flex gap-2 mb-5 flex-wrap" id="jobStatusStrips"></div>
      <!-- Jobs Table -->
      <div class="card overflow-hidden">
        <div class="table-scroll">
        <table class="w-full text-sm" style="min-width:700px">
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
    </div>

    <!-- ═══ JOB DETAIL ═══ -->
    <div id="page-jobdetail" class="page">
      <div class="flex flex-wrap items-center gap-2 mb-6">
        <button class="btn-secondary text-sm flex-shrink-0" onclick="showPage('jobcards')"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="flex-1 min-w-0">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 truncate" id="jobDetailTitle">Job Card Detail</h2>
          <p class="text-gray-500 text-sm mt-1" id="jobDetailSub"></p>
        </div>
        <div id="jobDetailActions" class="flex flex-wrap gap-2"></div>
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
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div class="relative flex-1 min-w-[150px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search customers…" id="customerSearchInput" oninput="filterCustomers(this.value)"/>
          </div>
          <button class="btn-primary flex-shrink-0" onclick="showNewCustomerModal()"><i class="fas fa-user-plus"></i> Add Customer</button>
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
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="customersGrid"></div>
    </div>

    <!-- ═══ VEHICLES ═══ -->
    <div id="page-vehicles" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Vehicles</h2>
          <p class="text-gray-500 text-sm mt-1">Fleet and vehicle registry</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div class="relative flex-1 min-w-[150px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search vehicles…" oninput="filterVehicles(this.value)"/>
          </div>
          <button class="btn-secondary flex-shrink-0" onclick="showFleetUploadModal()"><i class="fas fa-file-upload"></i><span class="hidden sm:inline"> Upload Fleet</span></button>
          <button class="btn-primary flex-shrink-0" onclick="showNewVehicleModal()"><i class="fas fa-plus"></i><span class="hidden sm:inline"> Add Vehicle</span></button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="table-scroll">
        <table class="w-full text-sm" style="min-width:600px">
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
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="claimsGrid"></div>
    </div>

    <!-- ═══ INVOICES ═══ -->
    <div id="page-invoices" class="page">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
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

      <!-- Summary stat pills -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onclick="invFilterBy('all')">
          <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-file-invoice text-gray-500 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400">All Invoices</p>
            <p class="text-lg font-bold text-gray-700" id="invStatAll">—</p>
          </div>
        </div>
        <div class="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onclick="invFilterBy('Paid')">
          <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-check-circle text-green-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400">Paid</p>
            <p class="text-lg font-bold text-green-600" id="invStatPaid">—</p>
          </div>
        </div>
        <div class="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onclick="invFilterBy('outstanding')">
          <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-clock text-amber-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400">Outstanding</p>
            <p class="text-lg font-bold text-amber-600" id="invStatOutstanding">—</p>
          </div>
        </div>
        <div class="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onclick="invFilterBy('Overdue')">
          <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400">Overdue</p>
            <p class="text-lg font-bold text-red-600" id="invStatOverdue">—</p>
          </div>
        </div>
      </div>

      <!-- Section toggle: Regular Invoices ↔ Fleet Invoices -->
      <div class="flex items-center gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
        <button id="invSection-regular" onclick="invSectionSwitch('regular')"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-blue-700 shadow-sm">
          <i class="fas fa-file-invoice mr-1.5"></i>Regular Invoices
        </button>
        <button id="invSection-fleet" onclick="invSectionSwitch('fleet')"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-gray-700">
          <i class="fas fa-truck mr-1.5"></i>Fleet Invoices
        </button>
      </div>

      <!-- ── REGULAR INVOICES ── -->
      <div id="invPane-regular">
        <!-- Filter tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button id="invTab-all" onclick="invFilterBy('all')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-indigo-500 bg-indigo-500 text-white transition-all">
            All
          </button>
          <button id="invTab-Paid" onclick="invFilterBy('Paid')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-green-400 transition-all">
            Paid
          </button>
          <button id="invTab-outstanding" onclick="invFilterBy('outstanding')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-amber-400 transition-all">
            Outstanding
          </button>
          <button id="invTab-Overdue" onclick="invFilterBy('Overdue')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-red-400 transition-all">
            Overdue
          </button>
          <button id="invTab-Partially Paid" onclick="invFilterBy('Partially Paid')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-orange-400 transition-all">
            Partially Paid
          </button>
          <button id="invTab-Draft" onclick="invFilterBy('Draft')"
            class="inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-all">
            Draft
          </button>
        </div>
        <!-- Table -->
        <div class="card overflow-hidden">
          <div class="table-scroll">
          <table class="w-full text-sm" style="min-width:600px">
            <thead><tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Job Card</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Due Date</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Paid At</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Payment Method</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Amount Paid</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr></thead>
            <tbody id="invoicesTable"></tbody>
          </table>
          </div>
        </div>
      </div>

      <!-- ── FLEET INVOICES ── -->
      <div id="invPane-fleet" class="hidden">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm text-gray-500">Consolidated invoices combining multiple job cards for fleet/corporate customers.</p>
          </div>
          <button onclick="openFleetInvoiceModal()" class="btn-primary flex items-center gap-2">
            <i class="fas fa-plus"></i> New Fleet Invoice
          </button>
        </div>

        <!-- Fleet stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" id="fleetInvStats">
          <div class="card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-truck text-blue-600 text-sm"></i>
            </div>
            <div>
              <p class="text-xs text-gray-400">Total Fleet</p>
              <p class="text-lg font-bold text-blue-700" id="fleetStatTotal">—</p>
            </div>
          </div>
          <div class="card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-check-circle text-green-600 text-sm"></i>
            </div>
            <div>
              <p class="text-xs text-gray-400">Paid</p>
              <p class="text-lg font-bold text-green-600" id="fleetStatPaid">—</p>
            </div>
          </div>
          <div class="card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-clock text-amber-600 text-sm"></i>
            </div>
            <div>
              <p class="text-xs text-gray-400">Outstanding</p>
              <p class="text-lg font-bold text-amber-600" id="fleetStatOutstanding">—</p>
            </div>
          </div>
          <div class="card p-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-layer-group text-indigo-600 text-sm"></i>
            </div>
            <div>
              <p class="text-xs text-gray-400">Total Jobs Billed</p>
              <p class="text-lg font-bold text-indigo-600" id="fleetStatJobs">—</p>
            </div>
          </div>
        </div>

        <!-- Fleet filter tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button id="fiTab-all" onclick="fleetFilterBy('all')"
            class="fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-blue-500 bg-blue-500 text-white transition-all">All</button>
          <button id="fiTab-Issued" onclick="fleetFilterBy('Issued')"
            class="fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-all">Issued</button>
          <button id="fiTab-Paid" onclick="fleetFilterBy('Paid')"
            class="fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-green-400 transition-all">Paid</button>
          <button id="fiTab-Partially Paid" onclick="fleetFilterBy('Partially Paid')"
            class="fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-orange-400 transition-all">Partially Paid</button>
          <button id="fiTab-Overdue" onclick="fleetFilterBy('Overdue')"
            class="fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-red-400 transition-all">Overdue</button>
        </div>

        <!-- Fleet table -->
        <div class="card overflow-hidden">
          <div class="table-scroll">
          <table class="w-full text-sm" style="min-width:700px">
            <thead><tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Fleet Invoice #</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Jobs</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Due Date</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Amount Paid</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr></thead>
            <tbody id="fleetInvoicesTable"></tbody>
          </table>
          </div>
        </div>
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
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="packagesGrid"></div>
    </div>

    <!-- ═══ ANALYTICS ═══ -->
    <div id="page-analytics" class="page">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p class="text-gray-500 text-sm mt-1">Business performance, profitability and turnaround time</p>
        </div>
      </div>
      <!-- Analytics Tabs -->
      <div class="flex gap-2 mb-5 border-b border-gray-200 overflow-x-auto">
        <button id="analyticsTab-overview" class="analytics-tab-btn px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-700 whitespace-nowrap" onclick="switchAnalyticsTab('overview')"><i class="fas fa-chart-bar mr-1.5"></i>Overview</button>
        <button id="analyticsTab-performance" class="analytics-tab-btn px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" onclick="switchAnalyticsTab('performance')"><i class="fas fa-stopwatch mr-1.5"></i>Performance & TAT</button>
      </div>

      <!-- Overview Tab -->
      <div id="analyticsPane-overview">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="analyticsStats"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <!-- Performance & TAT Tab -->
      <div id="analyticsPane-performance" class="hidden">
        <!-- KPI Cards Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5" id="tatKpiCards">
          <div class="card p-4 border-l-4 border-violet-400">
            <p class="text-xs text-gray-500 font-semibold uppercase mb-1">Avg TAT (Completed)</p>
            <p class="text-xl font-bold text-violet-700" id="tatAvgCompleted">—</p>
            <p class="text-xs text-gray-400 mt-0.5">Working hours only</p>
          </div>
          <div class="card p-4 border-l-4 border-blue-400">
            <p class="text-xs text-gray-500 font-semibold uppercase mb-1">Completed Jobs</p>
            <p class="text-xl font-bold text-blue-700" id="tatCompletedCount">—</p>
            <p class="text-xs text-gray-400 mt-0.5" id="tatTotalCount"></p>
          </div>
          <div class="card p-4 border-l-4 border-green-400">
            <p class="text-xs text-gray-500 font-semibold uppercase mb-1">Fastest TAT</p>
            <p class="text-xl font-bold text-green-700" id="tatMin">—</p>
            <p class="text-xs text-gray-400 mt-0.5">Best completion time</p>
          </div>
          <div class="card p-4 border-l-4 border-red-400">
            <p class="text-xs text-gray-500 font-semibold uppercase mb-1">Slowest TAT</p>
            <p class="text-xl font-bold text-red-600" id="tatMax">—</p>
            <p class="text-xs text-gray-400 mt-0.5">Longest completion time</p>
          </div>
        </div>

        <!-- Bottleneck + Avg per Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-800">Avg Time per Status</h3>
              <span class="text-xs text-gray-400">Closed entries only</span>
            </div>
            <div id="tatByStatusChart" class="space-y-2.5"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-gray-800 mb-4">Technician Performance</h3>
            <div id="tatTechLeaderboard"></div>
          </div>
        </div>

        <!-- Bottleneck Alert -->
        <div id="tatBottleneck" class="mb-4 hidden"></div>

        <p class="text-xs text-gray-400 text-center mt-2"><i class="fas fa-info-circle mr-1"></i>Working hours: 08:00–18:00, Mon–Sun · Durations calculated from closed status entries</p>
      </div>
    </div>

    <!-- ═══ FINANCE ═══ -->
    <div id="page-finance" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Finance Overview</h2>
          <p class="text-gray-500 text-sm mt-1">Revenue, expenses and profit & loss — live metrics</p>
        </div>
        <div class="flex gap-2">
          <select id="finPeriod" class="input text-sm py-1.5" onchange="loadFinance()">
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button class="btn-primary text-sm py-1.5" onclick="loadFinance()"><i class="fas fa-sync-alt mr-1"></i>Refresh</button>
        </div>
      </div>

      <!-- KPI Cards Row 1: Invoice metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5" id="finInvCards">
        <div class="card p-4 text-center fin-kpi-card cursor-pointer hover:shadow-md hover:ring-2 hover:ring-gray-200 transition-all" onclick="navToInvoices('all')" title="View all invoices">
          <div class="text-xs text-gray-500 mb-1 font-medium">Total Invoiced</div>
          <div class="text-lg font-bold text-gray-900" id="finTotalInvoiced">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finTotalInvoicedCount"></div>
          <div class="text-xs text-indigo-500 mt-1 font-semibold opacity-0 group-hover:opacity-100"><i class="fas fa-arrow-right text-[10px] mr-0.5"></i>View</div>
        </div>
        <div class="card p-4 text-center fin-kpi-card border-l-4 border-green-400 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-green-100 transition-all" onclick="navToInvoices('Paid')" title="View paid invoices">
          <div class="text-xs text-gray-500 mb-1 font-medium">Collected</div>
          <div class="text-lg font-bold text-green-600" id="finCollected">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finCollectedCount"></div>
        </div>
        <div class="card p-4 text-center fin-kpi-card border-l-4 border-amber-400 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-amber-100 transition-all" onclick="navToInvoices('outstanding')" title="View outstanding invoices">
          <div class="text-xs text-gray-500 mb-1 font-medium">Outstanding</div>
          <div class="text-lg font-bold text-amber-600" id="finOutstanding">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finOutstandingCount"></div>
        </div>
        <div class="card p-4 text-center fin-kpi-card border-l-4 border-red-400 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-red-100 transition-all" onclick="navToInvoices('Overdue')" title="View overdue invoices">
          <div class="text-xs text-gray-500 mb-1 font-medium">Overdue</div>
          <div class="text-lg font-bold text-red-600" id="finOverdue">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finOverdueCount"></div>
        </div>
        <div class="card p-4 text-center fin-kpi-card border-l-4 border-purple-400 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-purple-100 transition-all" onclick="showPage('jobs')" title="View pipeline job cards">
          <div class="text-xs text-gray-500 mb-1 font-medium">Pipeline</div>
          <div class="text-lg font-bold text-purple-600" id="finPipeline">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finPipelineCount"></div>
        </div>
        <div class="card p-4 text-center fin-kpi-card border-l-4 border-blue-400 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-100 transition-all" onclick="showPage('appointments')" title="View bookings">
          <div class="text-xs text-gray-500 mb-1 font-medium">Bookings</div>
          <div class="text-lg font-bold text-blue-600" id="finBookings">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="finBookingsCount"></div>
        </div>
      </div>

      <!-- P&L Summary row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><i class="fas fa-arrow-up text-green-600 text-xs"></i></div>
            <span class="text-sm text-gray-500 font-medium">Gross Income</span>
          </div>
          <div class="text-xl font-bold text-gray-900" id="finGrossIncome">—</div>
          <div class="text-xs text-gray-400 mt-1">From paid invoices</div>
        </div>
        <div class="card p-4 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-red-100 transition-all" onclick="showPage('expenses')" title="View all expenses">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><i class="fas fa-arrow-down text-red-600 text-xs"></i></div>
            <span class="text-sm text-gray-500 font-medium">Total Expenses</span>
          </div>
          <div class="text-xl font-bold text-gray-900" id="finTotalExpenses">—</div>
          <div class="text-xs text-gray-400 mt-1" id="finExpBreakdown">Job + overhead</div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><i class="fas fa-wallet text-blue-600 text-xs"></i></div>
            <span class="text-sm text-gray-500 font-medium">Net Income</span>
          </div>
          <div class="text-xl font-bold" id="finNetIncome">—</div>
          <div class="text-xs text-gray-400 mt-1">After all paid expenses</div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><i class="fas fa-percentage text-indigo-600 text-xs"></i></div>
            <span class="text-sm text-gray-500 font-medium">Gross Margin</span>
          </div>
          <div class="text-xl font-bold" id="finMarginPct">—</div>
          <div class="text-xs text-gray-400 mt-1" id="finAvgJob">Avg job value: —</div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"><i class="fas fa-tag text-green-500 text-xs"></i></div>
            <span class="text-sm text-gray-500 font-medium">Discounts Given</span>
          </div>
          <div class="text-xl font-bold text-green-600" id="finTotalDiscounts">—</div>
          <div class="text-xs text-gray-400 mt-1" id="finDiscountCount">0 invoices</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-chart-area text-blue-500"></i> Revenue vs Expenses Trend</h3>
          <div style="height:240px"><canvas id="finPLChart"></canvas></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-chart-pie text-purple-500"></i> Expense Breakdown by Category</h3>
          <div style="height:240px"><canvas id="finExpPieChart"></canvas></div>
        </div>
      </div>

      <!-- Invoice status breakdown + pipeline funnel -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-file-invoice-dollar text-green-500"></i> Invoice Status Breakdown</h3>
          <div id="finInvStatusBars"></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-funnel-dollar text-purple-500"></i> Revenue Pipeline</h3>
          <div id="finPipelineFunnel" class="space-y-3"></div>
        </div>
      </div>

      <!-- Recent Invoices with inline Mark-Paid -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800 flex items-center gap-2"><i class="fas fa-list-alt text-gray-500"></i> Recent Invoices</h3>
          <div class="flex gap-2 items-center">
            <select id="finInvStatusFilter" class="input text-sm py-1" onchange="renderFinanceInvoices()">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-xs text-gray-500 border-b">
              <th class="pb-2 pr-3">Invoice #</th>
              <th class="pb-2 pr-3">Job Card</th>
              <th class="pb-2 pr-3">Customer</th>
              <th class="pb-2 pr-3 text-right">Amount</th>
              <th class="pb-2 pr-3">Due Date</th>
              <th class="pb-2 pr-3">Paid At</th>
              <th class="pb-2 pr-3">Method</th>
              <th class="pb-2 pr-3">Status</th>
              <th class="pb-2">Actions</th>
            </tr></thead>
            <tbody id="finInvTable"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ USERS ═══ -->
    <div id="page-users" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Users & Roles</h2>
          <p class="text-gray-500 text-sm mt-1">Manage team members, roles and access permissions</p>
        </div>
        <button class="btn-primary" id="addUserBtn" onclick="showNewUserModal()"><i class="fas fa-user-plus"></i> Add User</button>
      </div>

      <!-- Role Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6" id="roleStatsRow"></div>

      <!-- View Toggle -->
      <div class="flex gap-2 mb-4">
        <button id="usersViewTeam" class="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white" onclick="setUsersView('team')"><i class="fas fa-users mr-1"></i>Team</button>
        <button id="usersViewPerms" class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="setUsersView('permissions')"><i class="fas fa-shield-alt mr-1"></i>Permissions Matrix</button>
      </div>

      <!-- Team View -->
      <div id="usersTeamView">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="usersGrid"></div>
      </div>

      <!-- Permissions Matrix View -->
      <div id="usersPermsView" class="hidden">
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-gray-100 bg-gray-50">
            <h3 class="font-bold text-gray-800">Role Permissions Matrix</h3>
            <p class="text-xs text-gray-500 mt-0.5">Overview of what each role can access and do</p>
          </div>
          <div class="table-scroll">
            <table class="w-full text-xs" style="min-width:700px" id="permMatrix"></table>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ OIL SERVICES ═══ -->
    <div id="page-oil-services" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Lubricants Catalogue</h2>
          <p class="text-gray-500 text-sm mt-1">Engine oils, gear oils, fluids &amp; greases — buying price, selling price, margin &amp; stock levels</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <div class="relative min-w-[180px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search lubricants…" id="lubSearch" oninput="filterLubricants(this.value)"/>
          </div>
          <button onclick="downloadLubricantTemplate()" class="btn-secondary flex items-center gap-2" title="Download CSV template">
            <i class="fas fa-file-csv text-green-600"></i> Template
          </button>
          <button onclick="showLubBulkUploadModal()" class="btn-secondary flex items-center gap-2" data-perm="packages.manage">
            <i class="fas fa-file-upload text-blue-600"></i> Bulk Upload
          </button>
          <button onclick="showAddLubricantModal()" class="btn-primary flex items-center gap-2" data-perm="packages.manage">
            <i class="fas fa-plus"></i> Add Lubricant
          </button>
        </div>
      </div>
      <!-- Brand filter tabs -->
      <div class="flex flex-wrap gap-2 mb-3" id="lubBrandTabs">
        <button class="parts-cat-tab active" data-brand="" onclick="setLubBrandTab('',this)">All Brands</button>
        <button class="parts-cat-tab" data-brand="Toyota"   onclick="setLubBrandTab('Toyota',this)">🛢 Toyota</button>
        <button class="parts-cat-tab" data-brand="Total"    onclick="setLubBrandTab('Total',this)">🛢 Total</button>
        <button class="parts-cat-tab" data-brand="Castrol"  onclick="setLubBrandTab('Castrol',this)">🛢 Castrol</button>
        <button class="parts-cat-tab" data-brand="Shell"    onclick="setLubBrandTab('Shell',this)">🛢 Shell</button>
        <button class="parts-cat-tab" data-brand="Mobil"    onclick="setLubBrandTab('Mobil',this)">🛢 Mobil</button>
        <button class="parts-cat-tab" data-brand="Valvoline" onclick="setLubBrandTab('Valvoline',this)">🛢 Valvoline</button>
        <button class="parts-cat-tab" data-brand="Other"    onclick="setLubBrandTab('Other',this)">Other</button>
      </div>
      <!-- Type filter tabs -->
      <div class="flex flex-wrap gap-2 mb-5" id="lubTypeTabs">
        <button class="parts-cat-tab active" data-type="" onclick="setLubTypeTab('',this)">All Types</button>
        <button class="parts-cat-tab" data-type="Engine Oil"            onclick="setLubTypeTab('Engine Oil',this)">Engine Oil</button>
        <button class="parts-cat-tab" data-type="Gear Oil"              onclick="setLubTypeTab('Gear Oil',this)">Gear Oil</button>
        <button class="parts-cat-tab" data-type="Transmission Fluid"    onclick="setLubTypeTab('Transmission Fluid',this)">Transmission Fluid</button>
        <button class="parts-cat-tab" data-type="Brake Fluid"           onclick="setLubTypeTab('Brake Fluid',this)">Brake Fluid</button>
        <button class="parts-cat-tab" data-type="Power Steering Fluid"  onclick="setLubTypeTab('Power Steering Fluid',this)">Power Steering Fluid</button>
        <button class="parts-cat-tab" data-type="Coolant"               onclick="setLubTypeTab('Coolant',this)">Coolant</button>
        <button class="parts-cat-tab" data-type="Grease"                onclick="setLubTypeTab('Grease',this)">Grease</button>
      </div>
      <!-- Stats row -->
      <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5" id="lubStats"></div>
      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="table-scroll">
          <table class="w-full text-sm" style="min-width:1200px">
            <thead><tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Batch #</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Brand</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Serial / Part #</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Viscosity</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Volume</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Buy Price</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Sell Price</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Margin %</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-600">Service Interval</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">In Stock</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr></thead>
            <tbody id="lubTable"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ PARTS CATALOGUE ═══ -->
    <div id="page-parts-catalogue" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Parts & Accessories Catalogue</h2>
          <p class="text-gray-500 text-sm mt-1">Complete Twiga Group parts list with buying price, selling price & margin</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div class="relative flex-1 min-w-[160px]">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input class="search-input w-full" type="text" placeholder="Search parts or models…" id="partsSearch" oninput="filterParts(this.value)"/>
          </div>
          <button onclick="downloadPartTemplate()" class="btn-secondary flex items-center gap-2">
            <i class="fas fa-file-download"></i> Template
          </button>
          <button onclick="openModal('modal-partBulk')" class="btn-secondary flex items-center gap-2">
            <i class="fas fa-file-upload"></i> Bulk Upload
          </button>
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
        <div class="table-scroll">
        <table class="w-full text-sm" style="min-width:1000px">
          <thead><tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Batch #</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Compatible Models</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Serial / Part #</th>
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
    </div>

    <!-- ═══ CAR WASH ═══ -->
    <div id="page-car-wash" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Car Wash Packages</h2>
          <p class="text-gray-500 text-sm mt-1">Standard, deep clean and monthly fleet packages</p>
        </div>
        <button class="btn-primary" onclick="showNewCarWashModal()"><i class="fas fa-plus"></i> New Package</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="carWashGrid"></div>
    </div>

    <!-- ═══ ADD-ON SERVICES ═══ -->
    <div id="page-add-ons" class="page">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Add-on Services</h2>
          <p class="text-gray-500 text-sm mt-1">Diagnostic, inspection, tyre and alignment services</p>
        </div>
        <button class="btn-primary" onclick="showNewAddonModal()" data-perm="addons.manage"><i class="fas fa-plus mr-1"></i>New Service</button>
      </div>
      <!-- Category filter chips -->
      <div class="flex flex-wrap gap-2 mb-5" id="addonCatTabs">
        <button class="parts-cat-tab active" data-cat="" onclick="setAddonCatFilter('',this)">All</button>
        <button class="parts-cat-tab" data-cat="Diagnostic" onclick="setAddonCatFilter('Diagnostic',this)">Diagnostic</button>
        <button class="parts-cat-tab" data-cat="Inspection" onclick="setAddonCatFilter('Inspection',this)">Inspection</button>
        <button class="parts-cat-tab" data-cat="Tyres" onclick="setAddonCatFilter('Tyres',this)">Tyres</button>
        <button class="parts-cat-tab" data-cat="Alignment" onclick="setAddonCatFilter('Alignment',this)">Alignment</button>
        <button class="parts-cat-tab" data-cat="Other" onclick="setAddonCatFilter('Other',this)">Other</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="addOnsGrid"></div>
    </div>

    <!-- ═══ EXPENSES ═══ -->
    <div id="page-expenses" class="page">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Expenses</h2>
          <p class="text-gray-500 text-sm mt-1">Track job costs and overhead spending</p>
        </div>
        <button class="btn-primary text-sm" onclick="showAddExpenseModal()">
          <i class="fas fa-plus mr-1"></i> Add Expense
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="expenseStats"></div>

      <!-- Filter Bar -->
      <div class="card p-4 mb-5">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[140px]">
            <label class="form-label">Category</label>
            <select class="form-input" id="expFilter-category" onchange="applyExpenseFilters()">
              <option value="">All Categories</option>
              <option>Parts & Materials</option>
              <option>Labour</option>
              <option>Subcontractor</option>
              <option>Equipment & Tools</option>
              <option>Utilities</option>
              <option>Rent & Facilities</option>
              <option>Marketing & Admin</option>
              <option>Transport & Delivery</option>
              <option>Miscellaneous</option>
            </select>
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="form-label">Status</label>
            <select class="form-input" id="expFilter-status" onchange="applyExpenseFilters()">
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Paid</option>
              <option>Rejected</option>
            </select>
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="form-label">Scope</label>
            <select class="form-input" id="expFilter-scope" onchange="applyExpenseFilters()">
              <option value="">All Expenses</option>
              <option value="job">Job-Linked Only</option>
              <option value="overhead">Overhead Only</option>
            </select>
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="form-label">From</label>
            <input type="date" class="form-input" id="expFilter-from" onchange="applyExpenseFilters()"/>
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="form-label">To</label>
            <input type="date" class="form-input" id="expFilter-to" onchange="applyExpenseFilters()"/>
          </div>
          <button class="btn-secondary text-sm flex-shrink-0" onclick="clearExpenseFilters()">
            <i class="fas fa-times mr-1"></i>Clear
          </button>
        </div>
      </div>

      <!-- Charts + Category Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-bold text-gray-800 mb-4">Monthly Spend Trend</h3>
          <div style="height:200px"><canvas id="expenseTrendChart"></canvas></div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-gray-800 mb-4">By Category</h3>
          <div style="height:200px"><canvas id="expenseCategoryChart"></canvas></div>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="card p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-800">All Expenses</h3>
          <span class="text-sm text-gray-500" id="expenseCount">0 records</span>
        </div>
        <div class="table-scroll">
          <table class="w-full text-sm" style="min-width:720px">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Job Card</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Vendor</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody id="expensesTable"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ VENDORS ═══ -->
    <div id="page-vendors" class="page">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Vendors</h2>
          <p class="text-gray-500 text-sm mt-1">Registered suppliers of parts, lubricants and services</p>
        </div>
        <button class="btn-primary text-sm" onclick="showVendorModal()">
          <i class="fas fa-plus mr-1"></i> Add Vendor
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5" id="vendorStats"></div>
      <div class="card p-4 mb-5">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[180px]">
            <label class="form-label">Search</label>
            <div class="relative">
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input type="text" id="vendorSearch" class="form-input pl-9" placeholder="Name, phone, TIN, location…" oninput="filterVendors()"/>
            </div>
          </div>
          <div class="min-w-[140px]">
            <label class="form-label">Status</label>
            <select id="vendorFilterStatus" class="form-input" onchange="filterVendors()">
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button class="btn-secondary text-sm" onclick="document.getElementById('vendorSearch').value='';document.getElementById('vendorFilterStatus').value='';filterVendors()">
            <i class="fas fa-times mr-1"></i>Clear
          </button>
        </div>
      </div>
      <div id="vendorsGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
    </div>

    <!-- ═══ GATE PASSES ═══ -->
    <div id="page-gate-passes" class="page">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900"><i class="fas fa-id-badge text-blue-600 mr-2"></i>Gate Passes</h2>
          <p class="text-gray-500 text-sm mt-1">Vehicle entry & exit control — track every vehicle on the premises</p>
        </div>
        <button class="btn-secondary text-sm" onclick="loadGatePasses()"><i class="fas fa-sync-alt mr-1"></i>Refresh</button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" id="gpStats"></div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-5 border-b border-gray-200 pb-0">
        <button id="gpTab-all"          class="gp-tab px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 -mb-px"       onclick="setGPTab('all')">All</button>
        <button id="gpTab-Active"       class="gp-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 -mb-px"    onclick="setGPTab('Active')">Active <span id="gpTabCnt-Active" class="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full"></span></button>
        <button id="gpTab-Pending Exit" class="gp-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 -mb-px"    onclick="setGPTab('Pending Exit')">Pending Exit <span id="gpTabCnt-Pending Exit" class="ml-1 bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full"></span></button>
        <button id="gpTab-Cleared"      class="gp-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 -mb-px"    onclick="setGPTab('Cleared')">Cleared <span id="gpTabCnt-Cleared" class="ml-1 bg-green-100 text-green-700 text-xs px-1.5 rounded-full"></span></button>
        <button id="gpTab-Voided"       class="gp-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 -mb-px"    onclick="setGPTab('Voided')">Voided</button>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pass #</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job Card</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entry Time</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exit Time</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="gpTableBody" class="divide-y divide-gray-100"></tbody>
          </table>
        </div>
        <div id="gpEmpty" class="hidden py-16 text-center text-gray-400">
          <i class="fas fa-id-badge text-5xl mb-3 opacity-30"></i>
          <p class="font-semibold">No gate passes found</p>
          <p class="text-sm mt-1">Gate passes are created automatically when a job card is opened</p>
        </div>
      </div>
    </div>

    <!-- ═══ NOTIFICATIONS ═══ -->
    <div id="page-notifications" class="page">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h2>
          <p class="text-gray-500 text-sm mt-1">Real-time alerts for job updates, appointments, stock and more</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary text-sm" onclick="markAllRead();loadNotificationsPage()"><i class="fas fa-check-double mr-1"></i>Mark all read</button>
          <button class="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50" onclick="clearReadNotifs();loadNotificationsPage()"><i class="fas fa-trash-alt mr-1"></i>Clear read</button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" id="notifStats"></div>

      <!-- Filters -->
      <div class="card p-4 mb-5">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[120px]">
            <label class="form-label">Type</label>
            <select class="form-input" id="notifFilter-type" onchange="loadNotificationsPage()">
              <option value="">All Types</option>
              <option value="job_created">Job Created</option>
              <option value="job_status">Job Status</option>
              <option value="job_completed">Job Completed</option>
              <option value="pfi_created">PFI Created</option>
              <option value="pfi_sent">PFI Sent</option>
              <option value="pfi_approved">PFI Approved</option>
              <option value="pfi_rejected">PFI Rejected</option>
              <option value="invoice_created">Invoice Created</option>
              <option value="invoice_paid">Invoice Paid</option>
              <option value="appointment_created">Appointment Booked</option>
              <option value="appointment_reminder">Appointment Reminder</option>
              <option value="appointment_cancelled">Appointment Cancelled</option>
              <option value="expense_created">Expense Created</option>
              <option value="expense_approved">Expense Approved</option>
              <option value="low_stock">Low Stock</option>
              <option value="parts_added">Parts Added</option>
              <option value="service_added">Service Added</option>
            </select>
          </div>
          <div class="flex-1 min-w-[120px]">
            <label class="form-label">Status</label>
            <select class="form-input" id="notifFilter-read" onchange="loadNotificationsPage()">
              <option value="">All</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
          </div>
          <div class="flex-1 min-w-[120px]">
            <label class="form-label">Priority</label>
            <select class="form-input" id="notifFilter-priority" onchange="loadNotificationsPage()">
              <option value="">All Priorities</option>
              <option value="error">Critical</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
            </select>
          </div>
          <button class="btn-secondary text-sm" onclick="resetNotifFilters()"><i class="fas fa-times mr-1"></i>Reset</button>
        </div>
      </div>

      <!-- Notification List -->
      <div class="card p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span class="text-sm font-semibold text-gray-700" id="notifPageCount">0 notifications</span>
        </div>
        <div id="notifPageList" class="divide-y divide-gray-50">
          <p class="text-center text-gray-400 text-sm py-12"><i class="fas fa-bell-slash text-3xl mb-3 block"></i>No notifications yet</p>
        </div>
      </div>
    </div>

  </div>
</main>
</div><!-- end appShell -->

<!-- New Job Card Modal -->
<div id="modal-newJob" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">New Job Card</h3><p class="text-sm text-gray-500">Create a new repair or service job</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newJob')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newJobForm" onsubmit="submitNewJob(event)">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Customer <span class="text-red-500">*</span></label>
          <div class="relative" id="jobCustPickerWrap">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><i class="fas fa-search text-xs"></i></span>
            <input type="text" id="job-customer-search" class="form-input pl-8 pr-8" placeholder="Search by name or phone…" autocomplete="off"
              oninput="jobCustSearch(this.value)" onfocus="jobCustSearch(this.value)" onblur="setTimeout(()=>jobCustHideList(),180)"/>
            <button type="button" id="job-customer-clear" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 hidden" onclick="jobCustClear()">
              <i class="fas fa-times-circle"></i>
            </button>
            <input type="hidden" id="job-customerId"/>
            <ul id="job-customer-list" class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto hidden"></ul>
          </div>
        </div>
        <div><label class="form-label">Vehicle <span class="text-red-500">*</span></label><select class="form-input" id="job-vehicleId" required><option value="">Select vehicle…</option></select></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Job Category</label><select class="form-input" id="job-category" onchange="toggleInsuranceFields()" required><option>Insurance</option><option>Private</option></select></div>
        <div><label class="form-label">Assigned Technician</label><select class="form-input" id="job-technician" required><option value="">Select…</option></select></div>
      </div>
      <div id="insuranceFields">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="form-label">Claim Reference #</label><input class="form-input" id="job-claimRef" placeholder="e.g. CLM-JUB-12345"/></div>
          <div><label class="form-label">Insurer Name</label><input class="form-input" id="job-insurer" placeholder="e.g. Jubilee Insurance"/></div>
        </div>
        <div class="mb-4"><label class="form-label">Assessor Name</label><input class="form-input" id="job-assessor" placeholder="e.g. Thomas Mlay"/></div>
      </div>
      <div class="mb-4"><label class="form-label">Damage / Service Description</label><textarea class="form-input" id="job-damage" rows="3" required placeholder="Describe the damage or service required…"></textarea></div>

      <!-- Vehicle Intake Readings -->
      <div class="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p class="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3"><i class="fas fa-tachometer-alt mr-1.5"></i>Vehicle Intake Readings</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Current Mileage (km) <span class="text-red-500">*</span></label>
            <div class="relative">
              <input class="form-input pr-10" type="number" id="job-mileage" placeholder="e.g. 75000" min="0" required oninput="this.classList.remove('border-red-400','bg-red-50');document.getElementById('job-mileage-error').classList.add('hidden')"/>
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">km</span>
            </div>
            <p id="job-mileage-error" class="hidden text-xs text-red-500 mt-1"><i class="fas fa-exclamation-circle mr-1"></i>Mileage is required</p>
          </div>
          <div>
            <label class="form-label">Fuel Level <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-5 gap-1.5 mt-1" id="fuelLevelBtns">
              <button type="button" data-fuel="Empty" onclick="selectFuelLevel('Empty')"
                class="fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-red-400 hover:bg-red-50 transition-all">E</button>
              <button type="button" data-fuel="1/4" onclick="selectFuelLevel('1/4')"
                class="fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-orange-400 hover:bg-orange-50 transition-all">¼</button>
              <button type="button" data-fuel="1/2" onclick="selectFuelLevel('1/2')"
                class="fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-amber-400 hover:bg-amber-50 transition-all">½</button>
              <button type="button" data-fuel="3/4" onclick="selectFuelLevel('3/4')"
                class="fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-green-400 hover:bg-green-50 transition-all">¾</button>
              <button type="button" data-fuel="Full" onclick="selectFuelLevel('Full')"
                class="fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-green-600 hover:bg-green-50 transition-all">F</button>
            </div>
            <input type="hidden" id="job-fuelLevel"/>
            <p id="job-fuel-error" class="hidden text-xs text-red-500 mt-1"><i class="fas fa-exclamation-circle mr-1"></i>Fuel level is required</p>
          </div>
        </div>
      </div>

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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="form-label">Company Name</label><input class="form-input" id="cust-company" placeholder="Acme Ltd"/></div>
          <div><label class="form-label">Contact Person</label><input class="form-input" id="cust-contact" placeholder="Jane Doe"/></div>
        </div>
        <div class="mb-4"><label class="form-label">TIN Number</label><input class="form-input" id="cust-taxpin" placeholder="TIN-123456789"/></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label" id="cust-name-label">Full Name</label><input class="form-input" id="cust-name" required placeholder="John Doe"/></div>
        <div><label class="form-label">Phone Number</label><input class="form-input" id="cust-phone" required placeholder="+255 7XX XXX XXX"/></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label"><i class="fab fa-whatsapp text-green-500 mr-1"></i>WhatsApp Number <span class="text-gray-400 font-normal text-xs">(optional)</span></label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm"><i class="fab fa-whatsapp"></i></span>
            <input class="form-input pl-8" id="cust-whatsapp" placeholder="+255 7XX XXX XXX (if different)"/>
          </div>
        </div>
        <div><label class="form-label">Email Address</label><input class="form-input" type="email" id="cust-email" placeholder="john@example.com"/></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">ID Number <span class="text-gray-400 font-normal text-xs">(optional)</span></label><input class="form-input" id="cust-id" placeholder="TZ123456789"/></div>
        <div><label class="form-label">Address</label><input class="form-input" id="cust-address" placeholder="Street, City"/></div>
      </div>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Owner (Customer) <span class="text-red-500">*</span></label>
          <!-- Searchable customer picker -->
          <div class="cust-picker-wrap" id="vehCustPickerWrap">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"><i class="fas fa-search"></i></span>
              <input type="text" class="form-input pl-8" id="veh-cust-search" autocomplete="off"
                placeholder="Search customer name…"
                oninput="custPickerFilter('veh')"
                onfocus="custPickerOpen('veh')"
                onblur="custPickerBlur('veh')"/>
            </div>
            <ul id="veh-cust-list" class="cust-picker-list hidden"></ul>
            <input type="hidden" id="veh-customerId" required/>
          </div>
        </div>
        <div><label class="form-label">Registration Number</label><input class="form-input" id="veh-reg" required placeholder="T123 ABC"/></div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div><label class="form-label">Make</label><input class="form-input" id="veh-make" required placeholder="Toyota"/></div>
        <div><label class="form-label">Model</label><input class="form-input" id="veh-model" required placeholder="Corolla"/></div>
        <div><label class="form-label">Year</label><input class="form-input" type="number" id="veh-year" required min="1990" max="2030" placeholder="2022"/></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

<!-- ═══ MODAL: Vehicle Detail / Edit ═══ -->
<div id="modal-vehicleDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:700px">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-car text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900" id="vd-reg-title">—</h3>
          <p class="text-sm text-gray-500 mt-0.5" id="vd-make-model-title">—</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- View / Edit toggle -->
        <button id="vd-edit-btn" onclick="vdEnableEdit()" class="btn-secondary text-sm flex items-center gap-1.5"><i class="fas fa-pen text-xs"></i> Edit</button>
        <button id="vd-save-btn" onclick="vdSave()" class="btn-primary text-sm hidden flex items-center gap-1.5"><i class="fas fa-save text-xs"></i> Save</button>
        <button id="vd-cancel-btn" onclick="vdCancelEdit()" class="btn-secondary text-sm hidden">Cancel</button>
        <button onclick="closeModal('modal-vehicleDetail')" class="text-gray-400 hover:text-gray-600 text-xl ml-1"><i class="fas fa-times"></i></button>
      </div>
    </div>

    <input type="hidden" id="vd-id"/>

    <!-- Fields grid — view mode shows text, edit mode shows inputs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5" id="vd-fields">
      <!-- Owner -->
      <div>
        <label class="form-label">Owner</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default" id="vd-view-owner">—</p>
        <select class="form-input vd-edit-field hidden" id="vd-edit-owner"></select>
      </div>
      <!-- Reg Number -->
      <div>
        <label class="form-label">Registration Number</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default font-bold text-blue-700" id="vd-view-reg">—</p>
        <input class="form-input vd-edit-field hidden" id="vd-edit-reg" placeholder="T123 ABC"/>
      </div>
      <!-- Make -->
      <div>
        <label class="form-label">Make</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default" id="vd-view-make">—</p>
        <input class="form-input vd-edit-field hidden" id="vd-edit-make" placeholder="Toyota"/>
      </div>
      <!-- Model -->
      <div>
        <label class="form-label">Model</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default" id="vd-view-model">—</p>
        <input class="form-input vd-edit-field hidden" id="vd-edit-model" placeholder="Corolla"/>
      </div>
      <!-- Year -->
      <div>
        <label class="form-label">Year</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default" id="vd-view-year">—</p>
        <input class="form-input vd-edit-field hidden" type="number" id="vd-edit-year" min="1980" max="2030"/>
      </div>
      <!-- Insurer -->
      <div>
        <label class="form-label">Insurance Company</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default" id="vd-view-insurer">—</p>
        <input class="form-input vd-edit-field hidden" id="vd-edit-insurer" placeholder="e.g. Jubilee Insurance"/>
      </div>
      <!-- VIN -->
      <div>
        <label class="form-label">VIN / Chassis Number</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default font-mono text-xs" id="vd-view-vin">—</p>
        <input class="form-input vd-edit-field hidden font-mono" id="vd-edit-vin" placeholder="17-character VIN"/>
      </div>
      <!-- Engine -->
      <div>
        <label class="form-label">Engine Number</label>
        <p class="vd-view-text form-input bg-gray-50 cursor-default font-mono text-xs" id="vd-view-engine">—</p>
        <input class="form-input vd-edit-field hidden font-mono" id="vd-edit-engine" placeholder="Engine number"/>
      </div>
    </div>

    <!-- Job History -->
    <div class="border-t pt-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-bold text-gray-700 flex items-center gap-2"><i class="fas fa-clipboard-list text-blue-500"></i> Service History</h4>
        <span class="text-xs text-gray-400" id="vd-job-count">—</span>
      </div>
      <div id="vd-job-list" class="space-y-2 max-h-52 overflow-y-auto">
        <p class="text-sm text-gray-400 text-center py-4">Loading…</p>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="flex items-center justify-between border-t pt-4 mt-4">
      <button onclick="vdDeleteVehicle()" class="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors" id="vd-delete-btn">
        <i class="fas fa-trash text-xs"></i> Delete Vehicle
      </button>
      <button onclick="vdViewAllJobs()" class="btn-secondary text-sm flex items-center gap-1.5">
        <i class="fas fa-clipboard-list text-xs"></i> View All Jobs
      </button>
    </div>
  </div>
</div>

<!-- Pay Invoice Modal -->
<div id="modal-payInvoice" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:520px">
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-money-bill-wave text-white"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">Record Payment</h3>
          <p class="text-sm text-gray-500 mt-0.5" id="pi-subtitle">Invoice payment</p>
        </div>
      </div>
      <button onclick="closeModal('modal-payInvoice')" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
    </div>

    <input type="hidden" id="pi-inv-id"/>

    <!-- Invoice summary strip -->
    <div class="bg-gray-50 rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center" id="pi-summary">
      <div><p class="text-xs text-gray-400 mb-0.5">Invoice Total</p><p class="text-base font-bold text-gray-800" id="pi-total">—</p></div>
      <div><p class="text-xs text-gray-400 mb-0.5">Already Paid</p><p class="text-base font-bold text-amber-600" id="pi-already-paid">—</p></div>
      <div><p class="text-xs text-gray-400 mb-0.5">Balance Due</p><p class="text-base font-bold text-red-600" id="pi-balance">—</p></div>
    </div>

    <!-- Payment method -->
    <div class="mb-4">
      <label class="form-label">Payment Method <span class="text-red-500">*</span></label>
      <div class="grid grid-cols-4 gap-2" id="pi-method-btns">
        <button type="button" onclick="piSelectMethod('Mobile Money')"
          class="pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-sm font-semibold text-gray-600"
          data-method="Mobile Money">
          <i class="fas fa-mobile-alt text-xl text-gray-400"></i>Mobile Money
        </button>
        <button type="button" onclick="piSelectMethod('Bank')"
          class="pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all text-sm font-semibold text-gray-600"
          data-method="Bank">
          <i class="fas fa-university text-xl text-gray-400"></i>Bank
        </button>
        <button type="button" onclick="piSelectMethod('Lipa Number')"
          class="pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all text-sm font-semibold text-gray-600"
          data-method="Lipa Number">
          <i class="fas fa-hashtag text-xl text-gray-400"></i>Lipa Number
        </button>
        <button type="button" onclick="piSelectMethod('Cash')"
          class="pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all text-sm font-semibold text-gray-600"
          data-method="Cash">
          <i class="fas fa-money-bill-wave text-xl text-gray-400"></i>Cash
        </button>
      </div>
      <input type="hidden" id="pi-method"/>
    </div>

    <!-- Amount -->
    <div class="mb-4">
      <label class="form-label">Amount Received (TZS) <span class="text-red-500">*</span></label>
      <input class="form-input font-bold text-lg" type="number" id="pi-amount" placeholder="0" oninput="piUpdateBalance()"/>
      <div class="flex gap-2 mt-2">
        <button type="button" onclick="piSetFull()" class="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors">Full amount</button>
        <button type="button" onclick="piSetHalf()" class="text-xs px-3 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition-colors">50%</button>
      </div>
    </div>

    <!-- Reference -->
    <div class="mb-5">
      <label class="form-label">Payment Reference <span class="text-gray-400 font-normal text-xs">(optional — M-Pesa code, bank ref, etc.)</span></label>
      <input class="form-input" type="text" id="pi-reference" placeholder="e.g. QK7XH2A3BZ"/>
    </div>

    <!-- Balance preview after this payment -->
    <div class="rounded-xl p-3 mb-5 text-sm hidden" id="pi-remaining-box">
      <div class="flex justify-between items-center">
        <span id="pi-remaining-label" class="font-semibold"></span>
        <span id="pi-remaining-val" class="font-bold text-lg"></span>
      </div>
    </div>

    <!-- Payments history (if any previous partial payments) -->
    <div id="pi-history-box" class="hidden mb-4">
      <p class="form-label mb-2">Previous Payments</p>
      <div id="pi-history-list" class="space-y-1 text-xs max-h-32 overflow-y-auto"></div>
    </div>

    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-payInvoice')">Cancel</button>
      <button class="btn-primary flex-1" id="pi-submit" onclick="submitPayInvoice()">
        <i class="fas fa-check mr-1.5"></i> Record Payment
      </button>
    </div>
  </div>
</div>

<!-- Invoice Detail Modal -->
<div id="modal-invoiceDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:640px">
    <div class="flex items-start justify-between mb-5">
      <div>
        <h3 class="text-lg font-bold text-gray-900" id="invd-number">Invoice</h3>
        <p class="text-sm text-gray-400 mt-0.5" id="invd-subtitle"></p>
      </div>
      <button onclick="closeModal('modal-invoiceDetail')" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
    </div>

    <!-- Status bar -->
    <div class="flex items-center gap-3 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <span id="invd-status-badge" class="badge text-sm px-3 py-1"></span>
      <div class="flex-1">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>Payment progress</span>
          <span id="invd-progress-label"></span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div id="invd-progress-bar" class="h-2 rounded-full transition-all" style="width:0%"></div>
        </div>
      </div>
    </div>

    <!-- Key details grid -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
      <div>
        <p class="text-xs text-gray-400 mb-0.5">Job Card</p>
        <p class="font-semibold text-gray-700" id="invd-jobcard">—</p>
      </div>
      <div>
        <p class="text-xs text-gray-400 mb-0.5">Customer</p>
        <p class="font-semibold text-gray-700" id="invd-customer">—</p>
      </div>
      <div>
        <p class="text-xs text-gray-400 mb-0.5">Issued Date</p>
        <p class="font-semibold text-gray-700" id="invd-issued">—</p>
      </div>
      <div>
        <p class="text-xs text-gray-400 mb-0.5">Due Date</p>
        <p class="font-semibold text-gray-700" id="invd-due">—</p>
      </div>
      <div id="invd-claim-row">
        <p class="text-xs text-gray-400 mb-0.5">Claim Reference</p>
        <p class="font-semibold text-gray-700" id="invd-claim">—</p>
      </div>
      <div id="invd-pfi-row">
        <p class="text-xs text-gray-400 mb-0.5">PFI Reference</p>
        <p class="font-semibold text-gray-700" id="invd-pfi">—</p>
      </div>
    </div>

    <!-- Cost breakdown -->
    <div class="bg-gray-50 rounded-xl border border-gray-100 mb-5 overflow-hidden">
      <div class="px-4 py-2 border-b border-gray-100">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Breakdown</p>
      </div>
      <div class="px-4 py-3 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Labour</span>
          <span class="font-medium text-gray-700" id="invd-labour">—</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Parts &amp; Materials</span>
          <span class="font-medium text-gray-700" id="invd-parts">—</span>
        </div>
        <div class="flex justify-between text-green-600" id="invd-discount-row" style="display:none">
          <span class="flex items-center gap-1"><i class="fas fa-tag text-xs"></i>Discount <span class="text-xs text-green-500 font-normal" id="invd-discount-reason"></span></span>
          <span class="font-semibold" id="invd-discount">—</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Tax / VAT</span>
          <span class="font-medium text-gray-700" id="invd-tax">—</span>
        </div>
        <div class="flex justify-between border-t border-gray-200 pt-2 mt-1">
          <span class="font-bold text-gray-800">Total</span>
          <span class="font-bold text-green-600 text-base" id="invd-total">—</span>
        </div>
      </div>
    </div>

    <!-- Payment history -->
    <div id="invd-payment-section" class="mb-5">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment History</p>
      <div id="invd-payment-list" class="space-y-2"></div>
    </div>

    <!-- Footer actions -->
    <div class="flex gap-2 justify-between items-center">
      <button class="btn-secondary text-sm flex items-center gap-1.5" onclick="_invdDownload()" id="invd-download-btn">
        <i class="fas fa-download text-indigo-500"></i>Download PDF
      </button>
      <div class="flex gap-2">
        <button class="btn-secondary" onclick="closeModal('modal-invoiceDetail')">Close</button>
        <button id="invd-pay-btn" class="btn-primary hidden" onclick="_invdPay()">
          <i class="fas fa-money-bill-wave mr-1.5"></i>Record Payment
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Edit Payment Modal -->
<div id="modal-editPayment" class="modal-overlay hidden" style="z-index:1100">
  <div class="modal-box" style="--mw:460px">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-lg font-bold text-gray-900">Edit Payment</h3>
      <button onclick="closeModal('modal-editPayment')" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
    </div>

    <!-- Warning banner -->
    <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-5 text-sm text-amber-700">
      <i class="fas fa-exclamation-triangle mt-0.5 flex-shrink-0"></i>
      <span>Only edit this payment if it bounced, was entered incorrectly, or has not reflected. This will recalculate the invoice balance.</span>
    </div>

    <!-- Amount -->
    <div class="mb-4">
      <label class="form-label">Amount (TZS) <span class="text-red-500">*</span></label>
      <input class="form-input font-bold text-lg" type="number" id="ep-amount" placeholder="0"/>
    </div>

    <!-- Method -->
    <div class="mb-4">
      <label class="form-label">Payment Method <span class="text-red-500">*</span></label>
      <div class="grid grid-cols-4 gap-2" id="ep-method-btns">
        <button type="button" onclick="epSelectMethod('Mobile Money')"
          class="ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-xs font-semibold text-gray-600"
          data-method="Mobile Money"><i class="fas fa-mobile-alt text-lg text-gray-400"></i>Mobile Money</button>
        <button type="button" onclick="epSelectMethod('Bank')"
          class="ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all text-xs font-semibold text-gray-600"
          data-method="Bank"><i class="fas fa-university text-lg text-gray-400"></i>Bank</button>
        <button type="button" onclick="epSelectMethod('Lipa Number')"
          class="ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all text-xs font-semibold text-gray-600"
          data-method="Lipa Number"><i class="fas fa-hashtag text-lg text-gray-400"></i>Lipa Number</button>
        <button type="button" onclick="epSelectMethod('Cash')"
          class="ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all text-xs font-semibold text-gray-600"
          data-method="Cash"><i class="fas fa-money-bill-wave text-lg text-gray-400"></i>Cash</button>
      </div>
      <input type="hidden" id="ep-method"/>
    </div>

    <!-- Reference -->
    <div class="mb-5">
      <label class="form-label">Reference / Transaction ID <span class="text-gray-400 font-normal">(optional)</span></label>
      <input class="form-input" type="text" id="ep-reference" placeholder="e.g. MPESA123, Bank Ref…"/>
    </div>

    <!-- Date -->
    <div class="mb-5">
      <label class="form-label">Payment Date &amp; Time</label>
      <input class="form-input" type="datetime-local" id="ep-date"/>
    </div>

    <div class="flex gap-2">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-editPayment')">Cancel</button>
      <button class="btn-primary flex-1" id="ep-submit" onclick="submitEditPayment()">
        <i class="fas fa-save mr-1.5"></i>Save Changes
      </button>
    </div>
  </div>
</div>

<!-- Send PFI Modal -->
<div id="modal-sendPFI" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:640px">
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

    <div class="flex flex-wrap gap-2 justify-end">
      <button class="btn-secondary" onclick="closeModal('modal-sendPFI')">Cancel</button>
      <button class="btn-secondary flex-shrink-0" onclick="copyAndOpenEmail()"><i class="fas fa-external-link-alt mr-1"></i><span class="hidden sm:inline">Copy &amp; Open Email Client</span><span class="sm:hidden">Open Email</span></button>
      <button class="btn-primary flex-shrink-0" onclick="submitSendPFI()"><i class="fas fa-paper-plane mr-1"></i><span id="sendPFI-btnLabel">Send &amp; Record</span></button>
    </div>
  </div>
</div>

<!-- New / Edit Appointment Modal -->
<div id="modal-appointment" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:620px">
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Customer <span class="text-red-500">*</span></label>
          <!-- Searchable customer picker -->
          <div class="cust-picker-wrap" id="aptCustPickerWrap">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"><i class="fas fa-search"></i></span>
              <input type="text" class="form-input pl-8" id="apt-cust-search" autocomplete="off"
                placeholder="Search customer name…"
                oninput="custPickerFilter('apt')"
                onfocus="custPickerOpen('apt')"
                onblur="custPickerBlur('apt')"/>
            </div>
            <ul id="apt-cust-list" class="cust-picker-list hidden"></ul>
            <input type="hidden" id="apt-customerId" required/>
          </div>
        </div>
        <div>
          <label class="form-label">Vehicle <span class="text-red-500">*</span></label>
          <select class="form-input" id="apt-vehicleId" required>
            <option value="">Select vehicle…</option>
          </select>
        </div>
      </div>
      <!-- Service + Status -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
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
  <div class="modal-box" style="--mw:760px">
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

<!-- New / Edit Package Modal -->
<div id="modal-newPackage" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:660px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900" id="pkg-modal-title">New Service Package</h3>
        <p class="text-sm text-gray-500 mt-1" id="pkg-modal-sub">Create a new service bundle</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newPackage')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="pkg-edit-id"/>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div><label class="form-label">Package Name *</label><input class="form-input" id="pkg-name" required placeholder="e.g. Major Service" oninput="pkgRecalc()"/></div>
      <div><label class="form-label">Labour Cost (TZS) *</label><input class="form-input" type="number" id="pkg-labour" required min="0" oninput="pkgRecalc()"/></div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div><label class="form-label">Estimated Hours *</label><input class="form-input" type="number" id="pkg-hours" required min="0.5" step="0.5"/></div>
      <div><label class="form-label">Selling Price (TZS) <span class="text-gray-400 font-normal text-xs">optional override</span></label><input class="form-input" type="number" id="pkg-sellPrice" min="0" placeholder="Auto = Labour + Parts" oninput="pkgRecalc()"/></div>
    </div>
    <div class="mb-4"><label class="form-label">Description</label><textarea class="form-input" id="pkg-desc" rows="2" placeholder="Brief description of this service package…"></textarea></div>

    <!-- Included Items Section -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="form-label mb-0">Included Parts &amp; Services</label>
        <button type="button" onclick="pkgAddItemRow()" class="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-plus"></i> Add Item</button>
      </div>
      <!-- Item picker search (shown when adding) -->
      <div id="pkg-item-picker" class="hidden mb-3">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input class="form-input pl-9 text-sm" type="text" id="pkg-item-search" placeholder="Search lubricants, parts, car wash, add-on services…" oninput="pkgSearchItems(this.value)" autocomplete="off"/>
        </div>
        <div id="pkg-item-results" class="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-52 overflow-y-auto hidden"></div>
        <button type="button" onclick="pkgCloseItemPicker()" class="mt-1 text-xs text-gray-400 hover:text-gray-600">✕ Cancel search</button>
      </div>
      <div id="pkg-parts-list" class="space-y-2"></div>
      <p id="pkg-no-items" class="text-xs text-gray-400 italic mt-1 hidden">No items added yet — click "Add Item" to pick from catalogue</p>
    </div>

    <!-- Margin Summary Bar -->
    <div id="pkg-margin-bar" class="hidden mb-4 p-3 rounded-xl border border-gray-100 bg-gray-50">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div>
          <p class="text-gray-500 font-semibold uppercase mb-0.5">Labour</p>
          <p class="font-bold text-gray-800" id="pkg-mb-labour">—</p>
        </div>
        <div>
          <p class="text-gray-500 font-semibold uppercase mb-0.5">Parts Cost</p>
          <p class="font-bold text-gray-800" id="pkg-mb-parts">—</p>
        </div>
        <div>
          <p class="text-gray-500 font-semibold uppercase mb-0.5">Sell Price</p>
          <p class="font-bold text-blue-700" id="pkg-mb-sell">—</p>
        </div>
        <div>
          <p class="text-gray-500 font-semibold uppercase mb-0.5">Margin</p>
          <p class="font-bold" id="pkg-mb-margin">—</p>
        </div>
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <button type="button" class="btn-secondary" onclick="closeModal('modal-newPackage')">Cancel</button>
      <button type="button" class="btn-primary" id="pkg-save-btn" onclick="submitPackageModal()"><i class="fas fa-save mr-1"></i><span id="pkg-save-label">Save Package</span></button>
    </div>
  </div>
</div>

<!-- New / Edit Car Wash Package Modal -->
<div id="modal-newCarWash" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-gray-900" id="cw-modal-title">New Car Wash Package</h3>
        <p class="text-sm text-gray-500 mt-1" id="cw-modal-sub">Add a package to the car wash menu</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newCarWash')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="cw-edit-id"/>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="form-label">Package Name *</label>
        <input class="form-input" id="cw-name" placeholder="e.g. Interior & Exterior"/>
      </div>
      <div>
        <label class="form-label">Type *</label>
        <select class="form-input" id="cw-type">
          <option value="Standard">Standard Wash</option>
          <option value="AddOn">Add-On Service</option>
          <option value="DeepClean">Deep Clean</option>
          <option value="Monthly">Monthly Fleet Plan</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="form-label">Price (TZS) <span class="text-gray-400 font-normal">0 = Quote</span></label>
        <input class="form-input" type="number" id="cw-price" min="0" placeholder="0"/>
      </div>
      <div id="cw-vehicle-count-wrap">
        <label class="form-label">Vehicle Count <span class="text-gray-400 font-normal">(Monthly only)</span></label>
        <input class="form-input" type="number" id="cw-vehicles" min="1" placeholder="e.g. 5"/>
      </div>
    </div>
    <div class="mb-4">
      <label class="form-label">Description</label>
      <textarea class="form-input" id="cw-desc" rows="2" placeholder="Brief description…"></textarea>
    </div>
    <div class="mb-5">
      <label class="form-label">What's Included <span class="text-gray-400 font-normal">(comma-separated)</span></label>
      <input class="form-input" id="cw-includes" placeholder="e.g. Exterior wash, Interior vacuum, Dashboard wipe"/>
    </div>
    <div class="flex gap-3 justify-end">
      <button type="button" class="btn-secondary" onclick="closeModal('modal-newCarWash')">Cancel</button>
      <button type="button" class="btn-primary" onclick="submitCarWashModal()"><i class="fas fa-save"></i> <span id="cw-save-label">Save Package</span></button>
    </div>
  </div>
</div>

<!-- New User Modal -->
<div id="modal-newUser" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Add Team Member</h3><p class="text-sm text-gray-500 mt-0.5">Create a new user account with role-based access</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-newUser')"><i class="fas fa-times"></i></button>
    </div>
    <form id="newUserForm" onsubmit="submitNewUser(event)">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Full Name *</label><input class="form-input" id="usr-name" placeholder="e.g. John Mwangi" required/></div>
        <div><label class="form-label">Email Address *</label><input class="form-input" type="email" id="usr-email" placeholder="john@autofix.co.tz" required/></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Phone Number</label><input class="form-input" id="usr-phone" placeholder="+255 7xx xxx xxx"/></div>
        <div><label class="form-label">Role *</label>
          <select class="form-input" id="usr-role" required onchange="updateRolePreview(this.value)">
            <option value="">Select role…</option>
            <option>Owner</option><option>Manager</option><option>Front Desk</option><option>Technician</option><option>Accountant</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Password *</label>
          <div class="relative">
            <input class="form-input pr-10" type="password" id="usr-password" placeholder="Set a login password" required/>
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onclick="toggleFieldPassword('usr-password','usr-pwdIcon')"><i class="fas fa-eye" id="usr-pwdIcon"></i></button>
          </div>
        </div>
        <div>
          <label class="form-label">Confirm Password *</label>
          <input class="form-input" type="password" id="usr-password2" placeholder="Repeat password" required/>
        </div>
      </div>
      <!-- Role preview -->
      <div id="rolePreview" class="hidden mb-4 p-3 rounded-xl border border-blue-100" style="background:#eff6ff">
        <p class="text-xs font-bold text-blue-700 mb-1"><i class="fas fa-shield-alt mr-1"></i>Access level for selected role:</p>
        <p id="rolePreviewText" class="text-xs text-blue-600"></p>
      </div>
      <div class="flex gap-3 justify-end">
        <button type="button" class="btn-secondary" onclick="closeModal('modal-newUser')">Cancel</button>
        <button type="submit" class="btn-primary"><i class="fas fa-user-plus"></i> Add User</button>
      </div>
    </form>
  </div>
</div>

<!-- Edit User Modal -->
<div id="modal-editUser" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Edit Team Member</h3><p class="text-sm text-gray-500 mt-0.5">Update user details, role and access</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-editUser')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="edit-usr-id"/>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div><label class="form-label">Full Name *</label><input class="form-input" id="edit-usr-name" required/></div>
      <div><label class="form-label">Email Address *</label><input class="form-input" type="email" id="edit-usr-email" required/></div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div><label class="form-label">Phone Number</label><input class="form-input" id="edit-usr-phone"/></div>
      <div><label class="form-label">Role *</label>
        <select class="form-input" id="edit-usr-role" required>
          <option>Owner</option><option>Manager</option><option>Front Desk</option><option>Technician</option><option>Accountant</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="form-label">New Password <span class="text-gray-400 font-normal">(leave blank to keep current)</span></label>
        <div class="relative">
          <input class="form-input pr-10" type="password" id="edit-usr-password" placeholder="Enter new password"/>
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onclick="toggleFieldPassword('edit-usr-password','edit-pwdIcon')"><i class="fas fa-eye" id="edit-pwdIcon"></i></button>
        </div>
      </div>
      <div><label class="form-label">Status</label>
        <select class="form-input" id="edit-usr-active">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
    <div class="flex gap-3 justify-end">
      <button type="button" class="btn-danger" id="edit-usr-deleteBtn" onclick="deleteUser()"><i class="fas fa-trash-alt"></i> Remove</button>
      <button type="button" class="btn-secondary ml-auto" onclick="closeModal('modal-editUser')">Cancel</button>
      <button type="button" class="btn-primary" onclick="submitEditUser()"><i class="fas fa-save"></i> Save Changes</button>
    </div>
  </div>
</div>

<!-- Status Update Modal -->
<div id="modal-statusUpdate" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:440px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900">Update Job Status</h3></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-statusUpdate')"><i class="fas fa-times"></i></button>
    </div>
    <div id="statusUpdateContent"></div>
  </div>
</div>

<!-- Reopen Job Card Modal -->
<div id="modal-reopenJob" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:460px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-folder-open text-amber-500 mr-2"></i>Reopen Job Card</h3>
        <p class="text-sm text-gray-500 mt-1">This will move the job back to <strong>Repair In Progress</strong></p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-reopenJob')"><i class="fas fa-times"></i></button>
    </div>
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-3">
      <i class="fas fa-exclamation-triangle text-amber-500 mt-0.5 flex-shrink-0"></i>
      <div class="text-sm text-amber-800">
        <p class="font-semibold mb-1">Reopening this job card will:</p>
        <ul class="list-disc list-inside space-y-0.5 text-amber-700">
          <li>Reset status to <strong>Repair In Progress</strong></li>
          <li>Allow adding new services, parts and updating details</li>
          <li>Keep all existing invoices, PFIs and history intact</li>
          <li>Log the reopen event in the activity timeline</li>
        </ul>
      </div>
    </div>
    <div class="mb-5">
      <label class="form-label mb-1">Reason for Reopening <span class="text-red-500">*</span></label>
      <textarea id="reopenReasonInput" class="input-field w-full" rows="3"
        placeholder="e.g. Customer reported brake noise after release — needs further inspection…"></textarea>
      <p class="text-xs text-gray-400 mt-1" id="reopenReasonError" style="display:none;color:#dc2626">Please provide a reason before reopening.</p>
    </div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-reopenJob')">Cancel</button>
      <button class="flex-1 font-semibold rounded-xl px-4 py-2.5 text-sm transition-all bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2" id="reopenJobBtn" onclick="confirmReopenJob()">
        <i class="fas fa-folder-open"></i> Reopen Job Card
      </button>
    </div>
  </div>
</div>

<!-- ═══ Digital Service Card Modal ═══ -->
<div id="modal-serviceCard" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:680px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-id-card text-green-500 mr-2"></i>Digital Service Card</h3>
        <p class="text-sm text-gray-500 mt-1" id="svcCard-subtitle">Generating service card…</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-serviceCard')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Mileage Out input (optional) -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
      <i class="fas fa-tachometer-alt text-blue-500 flex-shrink-0"></i>
      <div class="flex-1">
        <label class="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mileage Out (km)</label>
        <p class="text-xs text-blue-500 mt-0.5">Optional — odometer reading at vehicle handover</p>
      </div>
      <input type="number" id="svcCard-mileageOut" class="form-input w-32 text-sm" placeholder="e.g. 85200" min="0"/>
    </div>

    <!-- Card Preview -->
    <div id="svcCard-preview" class="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-5">
      <!-- Header band -->
      <div class="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between">
        <div class="text-white">
          <p class="font-bold text-lg tracking-wide">AutoFix GMS</p>
          <p class="text-blue-200 text-xs">Garage Management System</p>
        </div>
        <div class="text-right text-white">
          <p class="text-xs text-blue-200 uppercase tracking-wide">Service Card</p>
          <p class="font-bold text-sm" id="svcCard-jobNum">—</p>
          <p class="text-xs text-blue-200" id="svcCard-date">—</p>
        </div>
      </div>

      <!-- Body -->
      <div class="bg-white px-6 py-4 grid grid-cols-2 gap-4 text-sm">
        <!-- Left col -->
        <div class="space-y-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"><i class="fas fa-user mr-1"></i>Customer</p>
            <p class="font-bold text-gray-900" id="svcCard-custName">—</p>
            <p class="text-gray-500 text-xs" id="svcCard-custPhone">—</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"><i class="fas fa-car mr-1"></i>Vehicle</p>
            <p class="font-bold text-gray-900" id="svcCard-vehReg">—</p>
            <p class="text-gray-500 text-xs" id="svcCard-vehInfo">—</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"><i class="fas fa-user-hard-hat mr-1"></i>Technician</p>
            <p class="font-semibold text-gray-700" id="svcCard-tech">—</p>
          </div>
        </div>
        <!-- Right col: mileage + next service -->
        <div class="space-y-3">
          <div class="bg-gray-50 rounded-xl p-3 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500"><i class="fas fa-road mr-1 text-blue-400"></i>Mileage In</span>
              <span class="font-bold text-gray-800 text-xs" id="svcCard-mileageIn">—</span>
            </div>
            <div class="flex justify-between items-center" id="svcCard-mileageOutRow" style="display:none!important">
              <span class="text-xs text-gray-500"><i class="fas fa-flag-checkered mr-1 text-gray-400"></i>Mileage Out</span>
              <span class="font-bold text-gray-800 text-xs" id="svcCard-mileageOutVal">—</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500"><i class="fas fa-gas-pump mr-1 text-amber-400"></i>Fuel Level</span>
              <span class="font-semibold text-xs" id="svcCard-fuel">—</span>
            </div>
          </div>
          <!-- Next service highlight -->
          <div class="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center" id="svcCard-nextSvcBox">
            <p class="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1"><i class="fas fa-bell mr-1"></i>Next Service Due</p>
            <p class="text-2xl font-bold text-green-700" id="svcCard-nextSvcKm">—</p>
            <p class="text-xs text-green-500 mt-0.5" id="svcCard-nextSvcLub">—</p>
          </div>
        </div>
      </div>

      <!-- Services & Parts done -->
      <div class="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Services & Parts Performed</p>
        <div id="svcCard-workDone" class="space-y-1 text-xs text-gray-700"></div>
      </div>

      <!-- Footer note -->
      <div class="bg-blue-700 px-6 py-3 text-center">
        <p class="text-blue-100 text-xs">Thank you for choosing AutoFix GMS · Tel: +255 700 000 000 · info@autofixgms.co.tz</p>
      </div>
    </div>

    <!-- Delivery options -->
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Share / Deliver</p>
    <div class="grid grid-cols-3 gap-3 mb-5">
      <button onclick="downloadServiceCardPDF()" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all">
        <i class="fas fa-file-pdf text-xl"></i>
        <span class="text-xs font-semibold">Download PDF</span>
      </button>
      <button onclick="shareServiceCardWhatsApp()" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 transition-all">
        <i class="fab fa-whatsapp text-xl"></i>
        <span class="text-xs font-semibold">WhatsApp</span>
      </button>
      <button onclick="shareServiceCardEmail()" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-all">
        <i class="fas fa-envelope text-xl"></i>
        <span class="text-xs font-semibold">Email</span>
      </button>
    </div>

    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-serviceCard')">Close</button>
      <button class="btn-primary flex-1" onclick="issueServiceCard()"><i class="fas fa-paper-plane mr-1"></i>Issue & Record</button>
    </div>
  </div>
</div>

<!-- ═══ APPROVE EXIT GATE PASS MODAL ═══ -->
<div id="modal-approveGP" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:560px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-sign-out-alt text-green-600 mr-2"></i>Approve Exit Gate Pass</h3>
        <p class="text-sm text-gray-500 mt-1">Review vehicle details and sign to clear exit</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-approveGP')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Gate Pass Info Card -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-5">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Pass Number</p><p class="font-bold text-gray-900 mt-0.5" id="agp-passNum">—</p></div>
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Job Card</p><p class="font-bold text-gray-900 mt-0.5" id="agp-jobCard">—</p></div>
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Vehicle Reg</p><p class="font-bold text-blue-700 mt-0.5 text-base" id="agp-reg">—</p></div>
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Vehicle</p><p class="font-semibold text-gray-800 mt-0.5" id="agp-vehicle">—</p></div>
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Customer</p><p class="font-semibold text-gray-800 mt-0.5" id="agp-customer">—</p></div>
        <div><p class="text-gray-400 text-xs font-semibold uppercase">Entry Time</p><p class="font-semibold text-gray-800 mt-0.5" id="agp-entry">—</p></div>
      </div>
    </div>

    <!-- Approved By -->
    <div class="mb-4">
      <label class="form-label">Approved By <span class="text-red-500">*</span></label>
      <input type="text" id="agp-approvedBy" class="form-input" placeholder="Enter authorising officer name" />
    </div>

    <!-- Notes -->
    <div class="mb-4">
      <label class="form-label">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
      <textarea id="agp-notes" class="form-input resize-none" rows="2" placeholder="Any exit remarks..."></textarea>
    </div>

    <!-- Digital Signature Canvas -->
    <div class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <label class="form-label mb-0">Digital Signature <span class="text-red-500">*</span></label>
        <button type="button" class="text-xs text-red-500 hover:text-red-700 font-semibold" onclick="clearGPSignature()"><i class="fas fa-eraser mr-1"></i>Clear</button>
      </div>
      <div class="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:border-blue-400 transition-colors" style="height:140px">
        <canvas id="gpSignatureCanvas" style="width:100%;height:140px;touch-action:none;cursor:crosshair;display:block"></canvas>
      </div>
      <p class="text-xs text-gray-400 mt-1.5"><i class="fas fa-info-circle mr-1"></i>Draw your signature above using mouse or touchscreen</p>
    </div>

    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-approveGP')">Cancel</button>
      <button class="btn-primary flex-1 bg-green-600 hover:bg-green-700" id="agp-submitBtn" onclick="submitGPApproval()">
        <i class="fas fa-check-circle mr-1.5"></i>Approve Exit & Clear
      </button>
    </div>
  </div>
</div>

<!-- ═══ VOID GATE PASS MODAL ═══ -->
<div id="modal-voidGP" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:440px">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-lg font-bold text-gray-900"><i class="fas fa-ban text-red-500 mr-2"></i>Void Gate Pass</h3>
      <button class="text-gray-400 hover:text-gray-600" onclick="closeModal('modal-voidGP')"><i class="fas fa-times"></i></button>
    </div>
    <p class="text-sm text-gray-600 mb-4">This will permanently mark the gate pass as voided. Please provide a reason.</p>
    <div class="mb-4">
      <label class="form-label">Reason for Voiding</label>
      <textarea id="voidGP-reason" class="form-input resize-none" rows="3" placeholder="e.g. Vehicle left without job card, customer turned away..."></textarea>
    </div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-voidGP')">Cancel</button>
      <button class="btn-danger flex-1" onclick="submitVoidGP()"><i class="fas fa-ban mr-1"></i>Void Pass</button>
    </div>
  </div>
</div>

<!-- ═══ ADD CATALOGUE PART MODAL ═══ -->
<div id="modal-addCatPart" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900"><i class="fas fa-plus-circle text-blue-600 mr-2"></i>Add New Part</h3>
        <p class="text-sm text-gray-500 mt-1">Add a new part to the catalogue</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-addCatPart')"><i class="fas fa-times"></i></button>
    </div>
    <!-- Batch auto-gen notice -->
    <div class="flex items-center gap-2.5 mb-4 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
      <i class="fas fa-barcode text-indigo-400 text-sm"></i>
      <p class="text-xs text-indigo-700"><span class="font-semibold">Batch # is auto-generated</span> by the system when this part is saved.</p>
    </div>
    <div class="grid grid-cols-1 gap-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div>
        <label class="form-label">Serial / Part # <span class="text-gray-400 font-normal">(from supplier)</span></label>
        <input class="form-input" type="text" id="acp-serial" placeholder="e.g. AF-HILUX-2.7-001"/>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="text-xl font-bold text-gray-900"><i class="fas fa-pen text-blue-600 mr-2"></i>Edit Part</h3>
        <p class="text-sm text-gray-500 mt-1">Update part details and pricing</p></div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-editCatPart')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="ecp-id"/>
    <!-- System-generated batch number (read-only) -->
    <div id="ecp-batchRow" class="hidden mb-3 flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <i class="fas fa-barcode text-gray-400 text-sm"></i>
      <div class="flex-1">
        <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Batch Number (system)</p>
        <p class="text-sm font-bold text-gray-700" id="ecp-batchDisplay">—</p>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div>
        <label class="form-label">Serial / Part # <span class="text-gray-400 font-normal">(from supplier)</span></label>
        <input class="form-input" type="text" id="ecp-serial" placeholder="e.g. AF-HILUX-2.7-001"/>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  <div class="modal-box" style="--mw:400px">
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

<!-- ═══ MODAL: Add / Edit Lubricant ═══ -->
<div id="modal-lubricant" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:560px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-tint text-blue-500 mr-2"></i><span id="lubModal-title">Add Lubricant</span></h3>
        <p class="text-sm text-gray-500 mt-1">Set brand, type, viscosity, volume and pricing</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-lubricant')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="lub-id"/>
    <!-- Batch # auto-gen notice (Add mode) -->
    <div id="lub-batchAutoNotice" class="flex items-center gap-2.5 mb-3 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
      <i class="fas fa-barcode text-indigo-400 text-sm"></i>
      <p class="text-xs text-indigo-700"><span class="font-semibold">Batch # is auto-generated</span> by the system when this lubricant is saved.</p>
    </div>
    <!-- System-generated batch number (read-only, shown in edit mode) -->
    <div id="lub-batchRow" class="hidden mb-3 flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <i class="fas fa-barcode text-gray-400 text-sm"></i>
      <div class="flex-1">
        <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Batch Number (system)</p>
        <p class="text-sm font-bold text-gray-700" id="lub-batchDisplay">—</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="form-label">Brand *</label>
        <select class="form-input" id="lub-brand">
          <option value="">Select brand…</option>
          <option>Toyota</option><option>Total</option><option>Castrol</option>
          <option>Shell</option><option>Mobil</option><option>Valvoline</option><option>Other</option>
        </select>
      </div>
      <div>
        <label class="form-label">Type *</label>
        <select class="form-input" id="lub-type" onchange="lubTypeChanged()">
          <option value="">Select type…</option>
          <option>Engine Oil</option><option>Gear Oil</option><option>Transmission Fluid</option>
          <option>Brake Fluid</option><option>Power Steering Fluid</option><option>Coolant</option>
          <option>Grease</option><option>Other</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="form-label">Description *</label>
        <input class="form-input" type="text" id="lub-description" placeholder="e.g. Toyota Genuine Motor Oil 5W-30"/>
      </div>
      <div>
        <label class="form-label">Viscosity / Grade</label>
        <input class="form-input" type="text" id="lub-viscosity" placeholder="e.g. 5W-30, 10W-40, ATF, DOT 4"/>
      </div>
      <div>
        <label class="form-label">Volume / Pack Size</label>
        <input class="form-input" type="text" id="lub-volume" placeholder="e.g. 1L, 4L, 5L, 20L"/>
      </div>
      <div>
        <label class="form-label">Buying Price (TZS) *</label>
        <input class="form-input" type="number" id="lub-buyPrice" placeholder="0" min="0" oninput="lubCalcMargin()"/>
      </div>
      <div>
        <label class="form-label">Selling Price (TZS) *</label>
        <input class="form-input" type="number" id="lub-sellPrice" placeholder="0" min="0" oninput="lubCalcMargin()"/>
      </div>
      <div>
        <label class="form-label">Initial Stock (units)</label>
        <input class="form-input" type="number" id="lub-stock" placeholder="0" min="0"/>
      </div>
      <div>
        <label class="form-label">Serial / Part # <span class="text-gray-400 font-normal">(from supplier)</span></label>
        <input class="form-input" type="text" id="lub-serial" placeholder="e.g. TOY-5W30-4L-001"/>
      </div>
      <div id="lub-intervalRow" class="hidden">
        <label class="form-label">Service Interval (km) <span class="text-gray-400 font-normal">— Engine & Transmission oils</span></label>
        <input class="form-input" type="number" id="lub-interval" placeholder="e.g. 5000, 7500, 10000" min="0"/>
      </div>
      <div class="flex items-end pb-1" id="lub-marginBox">
        <div class="hidden text-sm rounded-xl px-3 py-2 bg-green-50 border border-green-100 w-full" id="lub-marginPreview">
          <span class="text-gray-500">Margin: </span><span class="font-bold text-green-700" id="lub-marginAmt"></span>
          <span class="ml-2 font-bold text-green-600" id="lub-marginPct"></span>
        </div>
      </div>
    </div>
    <div class="flex gap-3 mt-2">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-lubricant')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitLubricant()"><i class="fas fa-save mr-1"></i><span id="lubModal-submitLabel">Add Lubricant</span></button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: Restock Lubricant ═══ -->
<div id="modal-lubRestock" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:400px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-boxes text-green-600 mr-2"></i>Restock Lubricant</h3>
        <p class="text-sm text-gray-500 mt-1" id="lubRestock-name"></p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-lubRestock')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="lubRestock-id"/>
    <div class="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-xl">
      <span class="text-sm text-gray-500">Current stock:</span>
      <span class="font-bold text-gray-800" id="lubRestock-current"></span>
    </div>
    <div>
      <label class="form-label">Units to Add *</label>
      <input class="form-input text-lg font-bold text-center" type="number" id="lubRestock-qty" min="1" placeholder="0" oninput="lubRestockPreview()"/>
    </div>
    <div class="flex items-center justify-between mt-3 rounded-xl p-3 bg-green-50 border border-green-100 text-sm hidden" id="lubRestock-preview">
      <span class="text-gray-600">New stock level:</span>
      <span class="font-bold text-green-700 text-lg" id="lubRestock-newTotal"></span>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-lubRestock')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitLubRestock()"><i class="fas fa-plus mr-1"></i>Add Stock</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: Bulk Upload Lubricants ═══ -->
<div id="modal-lubBulkUpload" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:860px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-file-upload text-blue-500 mr-2"></i>Bulk Upload Lubricants</h3>
        <p class="text-sm text-gray-500 mt-1">Upload a CSV or Excel file to add multiple lubricants at once</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-lubBulkUpload')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Template hint -->
    <div class="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4 text-sm">
      <i class="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
      <div>
        <p class="text-blue-800 font-semibold mb-1">Required columns (CSV / Excel first row must be headers):</p>
        <p class="text-blue-700 font-mono text-xs">brand, description, type, viscosity, volume, buyingPrice, sellingPrice, stock, mileageInterval, partSerialNumber</p>
        <p class="text-blue-600 text-xs mt-1"><em>mileageInterval</em> is optional — only for Engine Oil &amp; Transmission Fluid. <em>partSerialNumber</em> is optional (supplier part number). Batch # is auto-generated.</p>
        <button onclick="downloadLubricantTemplate()" class="mt-2 text-xs text-blue-600 hover:underline font-semibold"><i class="fas fa-download mr-1"></i>Download CSV template</button>
      </div>
    </div>

    <!-- Drop zone -->
    <div id="lubBulk-dropzone"
      class="relative border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mb-4"
      onclick="document.getElementById('lubBulk-fileInput').click()"
      ondragover="event.preventDefault();this.classList.add('border-blue-500','bg-blue-50')"
      ondragleave="this.classList.remove('border-blue-500','bg-blue-50')"
      ondrop="lubBulkHandleDrop(event)">
      <input type="file" id="lubBulk-fileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="lubBulkParseFile(this.files[0])"/>
      <i class="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-3 block"></i>
      <p class="font-semibold text-gray-600">Drag &amp; drop your file here, or <span class="text-blue-600">click to browse</span></p>
      <p class="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls — max 5 MB</p>
    </div>

    <!-- Parse status -->
    <div id="lubBulk-status" class="hidden mb-3"></div>

    <!-- Preview table -->
    <div id="lubBulk-previewWrap" class="hidden">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-gray-700" id="lubBulk-previewLabel"></p>
        <button onclick="lubBulkClearFile()" class="text-xs text-red-500 hover:text-red-700 font-semibold"><i class="fas fa-times mr-1"></i>Clear</button>
      </div>
      <div class="border border-gray-200 rounded-xl overflow-hidden mb-1">
        <div class="overflow-auto max-h-64">
          <table class="w-full text-xs" style="min-width:800px" id="lubBulk-previewTable">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Brand</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Viscosity</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Volume</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Buy Price</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Sell Price</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Stock</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Interval (km)</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Serial / Part #</th>
                <th class="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody id="lubBulk-previewBody"></tbody>
          </table>
        </div>
      </div>
      <div id="lubBulk-errorList" class="hidden mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-h-28 overflow-y-auto"></div>
    </div>

    <div class="flex gap-3 mt-5">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-lubBulkUpload')">Cancel</button>
      <button class="btn-primary flex-1 hidden" id="lubBulk-importBtn" onclick="lubBulkImport()">
        <i class="fas fa-database mr-1.5"></i><span id="lubBulk-importLabel">Import</span>
      </button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: Bulk Upload Parts ═══ -->
<div id="modal-partBulk" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:860px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-file-upload text-green-500 mr-2"></i>Bulk Upload Parts</h3>
        <p class="text-sm text-gray-500 mt-1">Upload a CSV or Excel file to add multiple parts at once</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-partBulk')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Template hint -->
    <div class="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl mb-4 text-sm">
      <i class="fas fa-info-circle text-green-500 mt-0.5 flex-shrink-0"></i>
      <div>
        <p class="text-green-800 font-semibold mb-1">Required columns (CSV / Excel first row must be headers):</p>
        <p class="text-green-700 font-mono text-xs">category, description, compatibleModels, buyingPrice, sellingPrice, stock, partSerialNumber</p>
        <p class="text-green-600 text-xs mt-1"><em>compatibleModels</em> and <em>partSerialNumber</em> are optional. Batch # is auto-generated by the system.</p>
        <p class="text-green-600 text-xs mt-0.5">Valid categories: Air Filter, AC Filter, Oil Filter, Diesel Filter, Spark Plugs, Accessory</p>
        <button onclick="downloadPartTemplate()" class="mt-2 text-xs text-green-600 hover:underline font-semibold"><i class="fas fa-download mr-1"></i>Download CSV template</button>
      </div>
    </div>

    <!-- Drop zone -->
    <div id="partBulk-dropzone"
      class="relative border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all mb-4"
      onclick="document.getElementById('partBulk-fileInput').click()"
      ondragover="event.preventDefault();this.classList.add('border-green-500','bg-green-50')"
      ondragleave="this.classList.remove('border-green-500','bg-green-50')"
      ondrop="partBulkHandleDrop(event)">
      <input type="file" id="partBulk-fileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="partBulkParseFile(this.files[0])"/>
      <i class="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-3 block"></i>
      <p class="font-semibold text-gray-600">Drag &amp; drop your file here, or <span class="text-green-600">click to browse</span></p>
      <p class="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls — max 5 MB</p>
    </div>

    <!-- Parse status -->
    <div id="partBulk-status" class="hidden mb-3"></div>

    <!-- Preview table -->
    <div id="partBulk-previewWrap" class="hidden">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-gray-700" id="partBulk-previewLabel"></p>
        <button onclick="partBulkClearFile()" class="text-xs text-red-500 hover:text-red-700 font-semibold"><i class="fas fa-times mr-1"></i>Clear</button>
      </div>
      <div class="border border-gray-200 rounded-xl overflow-hidden mb-1">
        <div class="overflow-auto max-h-64">
          <table class="w-full text-xs" style="min-width:750px" id="partBulk-previewTable">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Compatible Models</th>
                <th class="px-3 py-2 text-left font-semibold text-gray-600">Serial / Part #</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Buy Price</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Sell Price</th>
                <th class="px-3 py-2 text-right font-semibold text-gray-600">Stock</th>
                <th class="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody id="partBulk-previewBody"></tbody>
          </table>
        </div>
      </div>
      <div id="partBulk-errorList" class="hidden mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-h-28 overflow-y-auto"></div>
    </div>

    <div class="flex gap-3 mt-5">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-partBulk')">Cancel</button>
      <button class="btn-primary flex-1 hidden" id="partBulk-importBtn" onclick="partBulkImport()">
        <i class="fas fa-database mr-1.5"></i><span id="partBulk-importLabel">Import</span>
      </button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: Oil Tier (Add / Edit) ═══ -->
<div id="modal-oilTier" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:600px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-oil-can text-amber-500 mr-2"></i><span id="oilTierModalTitle">Add Engine Size Tier</span></h3>
        <p class="text-sm text-gray-500 mt-1">Set pricing for Standard, Prestige and Premier customer tiers</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-oilTier')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="oilTier-brand"/>
    <input type="hidden" id="oilTier-index"/>
    <div class="mb-4">
      <label class="form-label">Engine Size Label *</label>
      <input class="form-input" type="text" id="oilTier-engineSize" placeholder="e.g. Up to 4L, 4–5L, 6L …"/>
      <p class="text-xs text-gray-400 mt-1">Descriptive label shown in the pricing table</p>
    </div>
    <!-- Price grid -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <!-- Standard -->
      <div>
        <p class="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Standard</p>
        <div class="space-y-2">
          <div>
            <label class="form-label text-xs">Price (TZS)</label>
            <input class="form-input text-sm" type="number" id="oilTier-stdPrice" placeholder="0" oninput="oilTierCalcMargin()"/>
          </div>
          <div>
            <label class="form-label text-xs">Margin (TZS)</label>
            <input class="form-input text-sm bg-gray-50" type="number" id="oilTier-stdMargin" placeholder="auto" oninput="oilTierMarginChanged('std')"/>
          </div>
          <div class="text-xs text-blue-600 font-semibold hidden" id="oilTier-stdPct"></div>
        </div>
      </div>
      <!-- Prestige -->
      <div>
        <p class="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>Prestige</p>
        <div class="space-y-2">
          <div>
            <label class="form-label text-xs">Price (TZS)</label>
            <input class="form-input text-sm" type="number" id="oilTier-presPrice" placeholder="0" oninput="oilTierCalcMargin()"/>
          </div>
          <div>
            <label class="form-label text-xs">Margin (TZS)</label>
            <input class="form-input text-sm bg-gray-50" type="number" id="oilTier-presMargin" placeholder="auto" oninput="oilTierMarginChanged('pres')"/>
          </div>
          <div class="text-xs text-purple-600 font-semibold hidden" id="oilTier-presPct"></div>
        </div>
      </div>
      <!-- Premier -->
      <div>
        <p class="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Premier</p>
        <div class="space-y-2">
          <div>
            <label class="form-label text-xs">Price (TZS)</label>
            <input class="form-input text-sm" type="number" id="oilTier-premPrice" placeholder="0" oninput="oilTierCalcMargin()"/>
          </div>
          <div>
            <label class="form-label text-xs">Margin (TZS)</label>
            <input class="form-input text-sm bg-gray-50" type="number" id="oilTier-premMargin" placeholder="auto" oninput="oilTierMarginChanged('prem')"/>
          </div>
          <div class="text-xs text-amber-600 font-semibold hidden" id="oilTier-premPct"></div>
        </div>
      </div>
    </div>
    <!-- Margin preview strip -->
    <div class="hidden p-3 bg-green-50 border border-green-100 rounded-xl mb-4 text-xs" id="oilTier-marginPreview">
      <p class="font-semibold text-green-700 mb-1"><i class="fas fa-chart-line mr-1"></i>Margin Summary</p>
      <div class="flex gap-4 flex-wrap" id="oilTier-marginDetails"></div>
    </div>
    <div class="flex gap-3 mt-2">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-oilTier')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitOilTier()"><i class="fas fa-save mr-1"></i>Save Tier</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: Oil Fleet Discounts ═══ -->
<div id="modal-oilFleet" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:440px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-truck text-amber-500 mr-2"></i>Fleet Discounts</h3>
        <p class="text-sm text-gray-500 mt-1">Per-vehicle discount for fleet customers — <span id="oilFleet-brandLabel" class="font-semibold text-amber-600"></span></p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-oilFleet')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="oilFleet-brand"/>
    <div class="space-y-4">
      <div>
        <label class="form-label">3–5 Vehicles — Discount per car (TZS)</label>
        <input class="form-input" type="number" id="oilFleet-3to5" placeholder="0" min="0"/>
        <p class="text-xs text-gray-400 mt-1">Amount deducted per vehicle when a fleet has 3–5 vehicles</p>
      </div>
      <div>
        <label class="form-label">5+ Vehicles — Discount per car (TZS)</label>
        <input class="form-input" type="number" id="oilFleet-5plus" placeholder="0" min="0"/>
        <p class="text-xs text-gray-400 mt-1">Amount deducted per vehicle when a fleet has 5 or more vehicles</p>
      </div>
    </div>
    <div class="flex gap-3 mt-6">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-oilFleet')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitOilFleet()"><i class="fas fa-save mr-1"></i>Save Discounts</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: New / Edit Add-on Service ═══ -->
<div id="modal-addonService" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:500px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900"><i class="fas fa-tools text-blue-500 mr-2"></i><span id="addonModal-title">New Add-on Service</span></h3>
        <p class="text-sm text-gray-500 mt-1">Define service name, category, description and pricing</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-addonService')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="addon-id"/>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="col-span-2">
        <label class="form-label">Service Name *</label>
        <input class="form-input" type="text" id="addon-name" placeholder="e.g. Full Diagnostic Scan"/>
      </div>
      <div>
        <label class="form-label">Category *</label>
        <select class="form-input" id="addon-category">
          <option value="">Select category…</option>
          <option>Diagnostic</option>
          <option>Inspection</option>
          <option>Tyres</option>
          <option>Alignment</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label class="form-label">Unit *</label>
        <input class="form-input" type="text" id="addon-unit" placeholder="e.g. per service, per wheel"/>
      </div>
      <div class="col-span-2">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="addon-description" rows="2" placeholder="Brief description of what this service includes…"></textarea>
      </div>
      <div>
        <label class="form-label">Price (TZS) *</label>
        <input class="form-input" type="number" id="addon-price" placeholder="0" min="0" oninput="addonPricePreview()"/>
      </div>
      <div class="flex items-end pb-1">
        <div class="text-sm font-semibold text-blue-700 hidden" id="addon-pricePreview"></div>
      </div>
    </div>
    <div class="flex gap-3 mt-2">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-addonService')">Cancel</button>
      <button class="btn-primary flex-1" onclick="submitAddonService()"><i class="fas fa-save mr-1"></i><span id="addonModal-submitLabel">Add Service</span></button>
    </div>
  </div>
</div>

<!-- Toast Notification -->
<div id="toast" class="fixed bottom-6 right-6 z-[9999] pointer-events-none" style="display:none">
  <div id="toastInner" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white min-w-[220px] max-w-xs"
    style="backdrop-filter:none; background:#1e293b; border:1.5px solid rgba(255,255,255,0.10); opacity:0; transform:translateY(12px); transition:opacity 0.22s ease, transform 0.22s ease">
    <i id="toastIcon" class="fas fa-check-circle text-green-400 flex-shrink-0 text-base"></i>
    <span id="toastMsg" class="leading-snug"></span>
  </div>
</div>

<!-- Add / Edit Expense Modal -->
<div id="modal-expense" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:600px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900" id="expModal-title">Add Expense</h3>
        <p class="text-sm text-gray-500" id="expModal-subtitle">Record a new expense entry</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-expense')"><i class="fas fa-times"></i></button>
    </div>
    <form id="expenseForm" onsubmit="submitExpense(event)">
      <!-- Row 1: Date + Category -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Date <span class="text-red-500">*</span></label>
          <input type="date" class="form-input" id="exp-date" required/>
        </div>
        <div>
          <label class="form-label">Category <span class="text-red-500">*</span></label>
          <select class="form-input" id="exp-category" required onchange="expVendorOnCategoryChange()">
            <option value="">Select category…</option>
            <option>Parts & Materials</option>
            <option>Labour</option>
            <option>Subcontractor</option>
            <option>Equipment & Tools</option>
            <option>Utilities</option>
            <option>Rent & Facilities</option>
            <option>Marketing & Admin</option>
            <option>Transport & Delivery</option>
            <option>Miscellaneous</option>
          </select>
        </div>
      </div>
      <!-- Row 2: Description -->
      <div class="mb-4">
        <label class="form-label">Description <span class="text-red-500">*</span></label>
        <input type="text" class="form-input" id="exp-description" required placeholder="e.g. Brake pads for GMS-2025-001"/>
      </div>
      <!-- Row 3: Amount + Status -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Amount (TZS) <span class="text-red-500">*</span></label>
          <input type="number" class="form-input" id="exp-amount" required min="0" placeholder="e.g. 45000"/>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select class="form-input" id="exp-status">
            <option>Pending</option>
            <option>Approved</option>
            <option>Paid</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>
      <!-- Row 4: Vendor + Receipt Ref -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">
            Vendor / Supplier <span id="expVendorRequired" class="text-red-500 hidden">*</span>
            <span class="text-gray-400 font-normal text-xs ml-1" id="expVendorHint">(optional)</span>
          </label>
          <!-- Vendor picker wrapper -->
          <div class="relative" id="expVendorPickerWrap">
            <i class="fas fa-store absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10"></i>
            <input type="text" id="exp-vendor-search" class="form-input pl-9 pr-8"
              placeholder="Search vendors…"
              oninput="expVendorSearch()"
              onfocus="expVendorSearch()"
              onblur="setTimeout(function(){document.getElementById('exp-vendor-list').classList.add('hidden')},200)"
              autocomplete="off"/>
            <button type="button" id="expVendorClear" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 hidden" onclick="expVendorClear()">
              <i class="fas fa-times text-xs"></i>
            </button>
            <ul id="exp-vendor-list" class="cust-picker-list hidden"></ul>
          </div>
          <!-- Hidden fields -->
          <input type="hidden" id="exp-vendorId"/>
          <input type="hidden" id="exp-vendor"/>
          <p class="text-xs text-amber-600 mt-1 hidden" id="expVendorWarning">
            <i class="fas fa-exclamation-triangle mr-1"></i>Select a registered vendor for this category
          </p>
        </div>
        <div>
          <label class="form-label">Receipt / Invoice Ref</label>
          <input type="text" class="form-input" id="exp-receiptRef" placeholder="e.g. RCP-2025-001"/>
        </div>
      </div>
      <!-- Row 5: Link to Job Card -->
      <div class="mb-4">
        <label class="form-label">Link to Job Card <span class="text-gray-400 font-normal">(optional)</span></label>
        <select class="form-input" id="exp-jobCardId">
          <option value="">— Overhead / not job-specific —</option>
        </select>
      </div>
      <!-- Row 6: Payment Method + Notes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label class="form-label">Payment Method</label>
          <div class="relative">
            <i class="fas fa-credit-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
            <select class="form-input pl-9" id="exp-paymentMethod">
              <option value="">-- Select method --</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Lipa Number">Lipa Number</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">Notes</label>
          <input type="text" class="form-input" id="exp-notes" placeholder="Optional notes"/>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" class="btn-secondary flex-1" onclick="closeModal('modal-expense')">Cancel</button>
        <button type="submit" class="btn-primary flex-1" id="expSubmitBtn"><i class="fas fa-save mr-1"></i>Save Expense</button>
      </div>
    </form>
  </div>
</div>

<!-- Expense Detail Modal (view + quick status change) -->
<div id="modal-expenseDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:520px">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-xl font-bold text-gray-900">Expense Detail</h3>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-expenseDetail')"><i class="fas fa-times"></i></button>
    </div>
    <div id="expenseDetailBody"></div>
  </div>
</div>

<!-- ═══ VENDOR ADD/EDIT MODAL ═══ -->
<div id="modal-vendor" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:580px">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-xl font-bold text-gray-900" id="vendorModalTitle">Add Vendor</h3>
        <p class="text-sm text-gray-500" id="vendorModalSub">Register a new supplier</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-vendor')"><i class="fas fa-times"></i></button>
    </div>
    <form id="vendorForm" onsubmit="submitVendor(event)">
      <!-- Name + Phone -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">Vendor Name <span class="text-red-500">*</span></label>
          <input type="text" class="form-input" id="vnd-name" required placeholder="e.g. Auto Parts Hub"/>
        </div>
        <div>
          <label class="form-label">Phone Number <span class="text-red-500">*</span></label>
          <div class="relative">
            <i class="fas fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="tel" class="form-input pl-9" id="vnd-phone" required placeholder="0754 333 444"/>
          </div>
        </div>
      </div>
      <!-- Email -->
      <div class="mb-4">
        <label class="form-label">Email Address</label>
        <div class="relative">
          <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="email" class="form-input pl-9" id="vnd-email" placeholder="vendor@example.com"/>
        </div>
      </div>
      <!-- TIN + VRN -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">TIN Number <span class="text-gray-400 font-normal text-xs">(Tax ID)</span></label>
          <input type="text" class="form-input" id="vnd-tin" placeholder="e.g. 102-345-678"/>
        </div>
        <div>
          <label class="form-label">VRN <span class="text-gray-400 font-normal text-xs">(VAT Reg. – if applicable)</span></label>
          <input type="text" class="form-input" id="vnd-vrn" placeholder="e.g. VRN-102-002"/>
        </div>
      </div>
      <!-- Location -->
      <div class="mb-4">
        <label class="form-label">Location / Address</label>
        <div class="relative">
          <i class="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="text" class="form-input pl-9" id="vnd-location" placeholder="e.g. Kariakoo, Dar es Salaam"/>
        </div>
      </div>
      <!-- Status + Notes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label class="form-label">Status</label>
          <select class="form-input" id="vnd-status">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label class="form-label">Notes <span class="text-gray-400 font-normal text-xs">(optional)</span></label>
          <input type="text" class="form-input" id="vnd-notes" placeholder="Any remarks…"/>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" class="btn-secondary flex-1" onclick="closeModal('modal-vendor')">Cancel</button>
        <button type="submit" class="btn-primary flex-1" id="vendorSubmitBtn"><i class="fas fa-save mr-1"></i>Save Vendor</button>
      </div>
    </form>
  </div>
</div>

<!-- ═══ VENDOR DETAIL MODAL ═══ -->
<div id="modal-vendorDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:680px">
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-store text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900" id="vndDetailName">Vendor</h3>
          <p class="text-sm text-gray-500" id="vndDetailSub">Vendor profile</p>
        </div>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-vendorDetail')"><i class="fas fa-times"></i></button>
    </div>
    <!-- Info grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5" id="vndDetailInfo"></div>
    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3 mb-5" id="vndDetailKpis"></div>
    <!-- Linked expenses -->
    <div>
      <h4 class="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2"><i class="fas fa-receipt text-emerald-500"></i> Purchase History</h4>
      <div class="overflow-x-auto rounded-xl border border-gray-100">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th class="px-3 py-2.5 text-left font-semibold">Date</th>
              <th class="px-3 py-2.5 text-left font-semibold">Description</th>
              <th class="px-3 py-2.5 text-left font-semibold hidden sm:table-cell">Category</th>
              <th class="px-3 py-2.5 text-right font-semibold">Amount</th>
              <th class="px-3 py-2.5 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody id="vndDetailExpenses" class="divide-y divide-gray-50"></tbody>
        </table>
      </div>
    </div>
    <!-- Action buttons -->
    <div class="flex gap-3 mt-5" id="vndDetailActions"></div>
  </div>
</div>

<!-- ═══ TECHNICIAN DETAIL MODAL ═══ -->
<div id="modal-techDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:720px">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" id="techDetailAvatar" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">SA</div>
        <div>
          <h3 class="text-xl font-bold text-gray-900" id="techDetailName">Technician</h3>
          <p class="text-sm text-gray-500" id="techDetailSub">Performance summary</p>
        </div>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="closeModal('modal-techDetail')"><i class="fas fa-times"></i></button>
    </div>

    <!-- KPI strip -->
    <div class="grid grid-cols-3 gap-3 mb-5" id="techDetailKpis">
      <div class="rounded-xl p-3 text-center" style="background:#f5f3ff">
        <div class="text-xl font-bold text-violet-700" id="tdkTotalJobs">—</div>
        <div class="text-xs text-gray-500 mt-0.5">Total Jobs</div>
      </div>
      <div class="rounded-xl p-3 text-center" style="background:#f0fdf4">
        <div class="text-xl font-bold text-green-600" id="tdkCompleted">—</div>
        <div class="text-xs text-gray-500 mt-0.5">Completed</div>
      </div>
      <div class="rounded-xl p-3 text-center" style="background:#eff6ff">
        <div class="text-xl font-bold text-blue-600" id="tdkAvgTAT">—</div>
        <div class="text-xs text-gray-500 mt-0.5">Avg TAT</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-3 flex-wrap">
      <button id="tdTab-all"      class="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white" onclick="techDetailFilter('all')">All Jobs</button>
      <button id="tdTab-active"   class="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="techDetailFilter('active')">Active</button>
      <button id="tdTab-done"     class="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="techDetailFilter('done')">Completed</button>
    </div>

    <!-- Jobs table -->
    <div class="overflow-x-auto rounded-xl border border-gray-100">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th class="px-3 py-2.5 text-left font-semibold">Job Card</th>
            <th class="px-3 py-2.5 text-left font-semibold">Customer</th>
            <th class="px-3 py-2.5 text-left font-semibold hidden sm:table-cell">Vehicle</th>
            <th class="px-3 py-2.5 text-left font-semibold">Status</th>
            <th class="px-3 py-2.5 text-right font-semibold">TAT</th>
            <th class="px-3 py-2.5 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody id="techDetailJobsList" class="divide-y divide-gray-50"></tbody>
      </table>
    </div>
    <p class="text-xs text-gray-400 text-center mt-3"><i class="fas fa-info-circle mr-1"></i>Click a job card row or the <i class="fas fa-external-link-alt text-[10px]"></i> button to open the full job detail.</p>
  </div>
</div>

<!-- ═══ FLEET INVOICE — Create Modal (3-step) ═══ -->
<div id="modal-fleetInvoice" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:680px">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <i class="fas fa-truck text-blue-600 text-sm"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-900">New Fleet Invoice</h3>
        </div>
        <!-- Step indicator -->
        <div class="flex items-center gap-1 mt-2" id="fi-steps">
          <span id="fi-step-dot-1" class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span class="w-6 h-0.5 bg-gray-200" id="fi-step-line-1"></span>
          <span id="fi-step-dot-2" class="w-2 h-2 rounded-full bg-gray-300"></span>
          <span class="w-6 h-0.5 bg-gray-200" id="fi-step-line-2"></span>
          <span id="fi-step-dot-3" class="w-2 h-2 rounded-full bg-gray-300"></span>
          <span class="text-xs text-gray-400 ml-2" id="fi-step-label">Step 1 of 3 — Select Customer</span>
        </div>
      </div>
      <button onclick="closeModal('modal-fleetInvoice')" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
    </div>

    <!-- STEP 1 — Customer picker -->
    <div id="fi-pane-1">
      <p class="text-sm text-gray-500 mb-3">Choose the fleet / corporate customer to bill:</p>
      <input class="form-input mb-3" id="fi-cust-search" placeholder="Search customer name…" oninput="fiFilterCustomers()" autocomplete="off"/>
      <div class="space-y-2 max-h-72 overflow-y-auto" id="fi-cust-list">
        <p class="text-sm text-gray-400 text-center py-6"><i class="fas fa-spinner fa-spin mr-1"></i>Loading customers…</p>
      </div>
      <div class="flex justify-end mt-5">
        <button class="btn-secondary mr-2" onclick="closeModal('modal-fleetInvoice')">Cancel</button>
        <button class="btn-primary" id="fi-next-1" onclick="fiGoStep2()" disabled>Next: Select Jobs <i class="fas fa-arrow-right ml-1.5"></i></button>
      </div>
    </div>

    <!-- STEP 2 — Job selection -->
    <div id="fi-pane-2" class="hidden">
      <div class="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div class="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0" id="fi-cust-avatar">—</div>
        <div>
          <p class="font-semibold text-gray-800" id="fi-cust-name-show">—</p>
          <p class="text-xs text-gray-500" id="fi-cust-phone-show">—</p>
        </div>
        <button class="ml-auto text-xs text-blue-600 hover:underline" onclick="fiGoStep1()"><i class="fas fa-pencil-alt mr-1"></i>Change</button>
      </div>
      <p class="text-sm text-gray-500 mb-3">Select at least <strong>2 job cards</strong> to include. Only <span class="text-blue-600 font-semibold">INVOICED</span> jobs not yet in a fleet invoice are shown.</p>
      <div id="fi-jobs-list" class="space-y-2 max-h-64 overflow-y-auto">
        <p class="text-sm text-gray-400 text-center py-6"><i class="fas fa-spinner fa-spin mr-1"></i>Loading jobs…</p>
      </div>
      <div id="fi-jobs-empty" class="hidden text-center py-8">
        <i class="fas fa-inbox text-3xl text-gray-300 mb-2 block"></i>
        <p class="text-sm text-gray-400">No eligible job cards found for this customer.</p>
        <p class="text-xs text-gray-400 mt-1">Jobs must be in <strong>INVOICED</strong> status and not already in a fleet invoice.</p>
      </div>
      <!-- Selection summary -->
      <div id="fi-sel-summary" class="hidden mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm">
        <span class="font-semibold text-indigo-700" id="fi-sel-count">0 jobs selected</span>
        <span class="text-gray-500 ml-2">· Subtotal: <strong id="fi-sel-subtotal">TZS 0</strong></span>
      </div>
      <div class="flex justify-between mt-5">
        <button class="btn-secondary" onclick="fiGoStep1()"><i class="fas fa-arrow-left mr-1.5"></i>Back</button>
        <button class="btn-primary" id="fi-next-2" onclick="fiGoStep3()" disabled>Review Invoice <i class="fas fa-arrow-right ml-1.5"></i></button>
      </div>
    </div>

    <!-- STEP 3 — Review & confirm -->
    <div id="fi-pane-3" class="hidden">
      <!-- Line items -->
      <div class="mb-4">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Cards Included</p>
        <div id="fi-review-items" class="space-y-2 max-h-48 overflow-y-auto"></div>
      </div>
      <!-- Totals -->
      <div class="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4 space-y-2 text-sm" id="fi-review-totals"></div>
      <!-- Optional discount -->
      <div class="mb-4">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fleet Discount <span class="text-gray-400 font-normal">(optional)</span></p>
        <div class="flex gap-2">
          <select class="form-input flex-1" id="fi-disc-type" onchange="fiCalcTotals()">
            <option value="">No discount</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (TZS)</option>
          </select>
          <input type="number" class="form-input w-32" id="fi-disc-value" placeholder="0" oninput="fiCalcTotals()" min="0"/>
        </div>
        <input type="text" class="form-input mt-2" id="fi-disc-reason" placeholder="Discount reason (optional)"/>
      </div>
      <!-- Due date & notes -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="fi-due-date"/>
        </div>
        <div>
          <label class="form-label">Notes <span class="text-gray-400 font-normal text-xs">(optional)</span></label>
          <input type="text" class="form-input" id="fi-notes" placeholder="e.g. Fleet account #FA-001"/>
        </div>
      </div>
      <div class="flex justify-between mt-5">
        <button class="btn-secondary" onclick="fiGoStep2()"><i class="fas fa-arrow-left mr-1.5"></i>Back</button>
        <button class="btn-primary" id="fi-submit" onclick="fiSubmit()">
          <i class="fas fa-file-invoice mr-1.5"></i> Create Fleet Invoice
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══ FLEET INVOICE — Detail Modal ═══ -->
<div id="modal-fleetDetail" class="modal-overlay hidden">
  <div class="modal-box" style="--mw:740px">
    <div class="flex items-start justify-between mb-5">
      <div>
        <div class="flex items-center gap-2 mb-0.5">
          <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <i class="fas fa-truck text-blue-600 text-xs"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-900" id="fid-number">Fleet Invoice</h3>
        </div>
        <p class="text-sm text-gray-400 ml-9" id="fid-subtitle"></p>
      </div>
      <button onclick="closeModal('modal-fleetDetail')" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
    </div>

    <!-- Status bar -->
    <div class="flex items-center gap-3 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <span id="fid-status-badge" class="badge text-sm px-3 py-1"></span>
      <div class="flex-1">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>Payment progress</span>
          <span id="fid-progress-label"></span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div id="fid-progress-bar" class="h-2 rounded-full transition-all" style="width:0%"></div>
        </div>
      </div>
    </div>

    <!-- Customer & date strip -->
    <div class="grid grid-cols-3 gap-4 mb-5 text-sm">
      <div><p class="text-xs text-gray-400 mb-0.5">Customer</p><p class="font-semibold text-gray-700" id="fid-customer">—</p></div>
      <div><p class="text-xs text-gray-400 mb-0.5">Issued</p><p class="font-semibold text-gray-700" id="fid-issued">—</p></div>
      <div><p class="text-xs text-gray-400 mb-0.5">Due Date</p><p class="font-semibold text-gray-700" id="fid-due">—</p></div>
    </div>

    <!-- Line items (per job card) -->
    <div class="mb-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Cards</p>
      <div id="fid-line-items" class="space-y-2 max-h-52 overflow-y-auto"></div>
    </div>

    <!-- Totals -->
    <div class="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4 space-y-1.5 text-sm" id="fid-totals"></div>

    <!-- Notes -->
    <div id="fid-notes-row" class="hidden mb-4 text-sm">
      <p class="text-xs text-gray-400 mb-0.5">Notes</p>
      <p class="text-gray-600" id="fid-notes-val"></p>
    </div>

    <!-- Payment history -->
    <div id="fid-payment-section" class="hidden mb-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment History</p>
      <div id="fid-payment-list" class="space-y-1.5"></div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-3 pt-2 border-t border-gray-100">
      <button id="fid-pay-btn" onclick="fidPay()" class="btn-primary flex-1">
        <i class="fas fa-money-bill-wave mr-1.5"></i> Record Payment
      </button>
      <button onclick="downloadFleetInvoicePDF(_fidId)" class="btn-secondary flex items-center gap-1.5">
        <i class="fas fa-file-pdf text-red-500"></i> PDF
      </button>
      <button id="fid-delete-btn" onclick="fidDelete()" class="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold border border-red-200">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</div>

<script>
// ═══ GLOBAL STATE ═══
let allJobCards = [], allCustomers = [], allVehicles = [], allPFIs = [], allInvoices = [], allPackages = [], allUsers = [], allAppointments = [];
let _allPartsConsumption = [];
let allExpenses = [];
let _expenseEditId = null;
let _expenseTrendChart = null, _expenseCatChart = null;
let statusChart = null, revenueChart = null, insurerChart = null;

// ─── Auth / RBAC State ───────────────────────────────────────────────────────
var currentUser = null;
var currentPermissions = [];
var authToken = localStorage.getItem('gms_token') || '';
var _sessionExpiredShown = false;
var _notifInterval = null;

function can(perm) {
  return currentPermissions.includes(perm);
}

// Global axios interceptor: catch 401 responses anywhere in the app
// and force the user back to the login screen with a clear message
axios.interceptors.response.use(
  function(response) { return response; },
  function(error) {
    if (error.response && error.response.status === 401 &&
        error.config && !error.config.url.includes('/api/auth/login') &&
        !error.config.url.includes('/api/auth/me') &&
        currentUser !== null && !_sessionExpiredShown) {
      _sessionExpiredShown = true;
      // Clear session state
      localStorage.removeItem('gms_token');
      authToken = '';
      currentUser = null;
      currentPermissions = [];
      delete axios.defaults.headers.common['Authorization'];
      if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; }
      // Hide app, show login with message
      document.getElementById('appShell').style.display = 'none';
      document.getElementById('loginScreen').style.display = '';
      var errEl = document.getElementById('loginError');
      errEl.textContent = 'Your session has expired. Please sign in again.';
      errEl.classList.remove('hidden');
      setTimeout(function() { _sessionExpiredShown = false; }, 3000);
    }
    return Promise.reject(error);
  }
);

function applyNavPermissions() {
  document.querySelectorAll('[data-perm]').forEach(function(el) {
    var perm = el.getAttribute('data-perm');
    el.style.display = can(perm) ? '' : 'none';
  });
  // New Job Card button
  var newJobBtn = document.querySelector('button[onclick="showNewJobModal()"]');
  if (newJobBtn) newJobBtn.style.display = can('jobcards.create') ? '' : 'none';
}

function updateSidebarUser() {
  if (!currentUser) return;
  var initials = currentUser.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
  var av = document.getElementById('sidebarUserAvatar');
  var nm = document.getElementById('sidebarUserName');
  var rl = document.getElementById('sidebarUserRole');
  if (av) av.textContent = initials;
  if (nm) nm.textContent = currentUser.name;
  if (rl) rl.textContent = currentUser.role;
  var dw = document.getElementById('dashWelcome');
  if (dw) dw.textContent = 'Welcome back, ' + currentUser.name.split(' ')[0] + '! Here' + String.fromCharCode(39) + 's what' + String.fromCharCode(39) + 's happening today.';
}

// ─── Login / Logout ──────────────────────────────────────────────────────────
function togglePasswordVisibility() {
  var inp = document.getElementById('loginPassword');
  var icon = document.getElementById('pwdEyeIcon');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

function fillDefaultCredentials() {
  document.getElementById('loginEmail').value = 'admin@autofix.co.tz';
  document.getElementById('loginPassword').value = 'Admin2025!';
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('loginEmail').focus();
}

async function doLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  var errEl = document.getElementById('loginError');
  var btn = document.getElementById('loginBtn');
  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
  try {
    var res = await axios.post('/api/auth/login', { email, password });
    authToken = res.data.token;
    currentUser = res.data.user;
    localStorage.setItem('gms_token', authToken);
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
    // Fetch full permissions
    var meRes = await axios.get('/api/auth/me');
    currentPermissions = meRes.data.permissions;
    // Show app
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    updateSidebarUser();
    applyNavPermissions();
    loadDashboard();
    loadNotifDropdown();
    // Start notification polling
    startNotifPolling();
  } catch(err) {
    var msg;
    if (!err.response) {
      msg = 'Cannot reach the server. Please check your connection and try again.';
    } else if (err.response.status === 401) {
      msg = err.response.data?.error || 'Invalid email or password.';
    } else {
      msg = err.response.data?.error || 'Login failed. Please try again.';
    }
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
}

async function doLogout() {
  if (!confirm('Sign out of GMS?')) return;
  try { await axios.post('/api/auth/logout'); } catch(e) {}
  localStorage.removeItem('gms_token');
  authToken = '';
  currentUser = null;
  currentPermissions = [];
  delete axios.defaults.headers.common['Authorization'];
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = '';
  document.getElementById('loginForm').reset();
  if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; }
}

async function tryAutoLogin() {
  if (!authToken) return false;
  // Show a subtle "Restoring session..." hint on the login button while we check
  var btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring session…'; }
  try {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
    var meRes = await axios.get('/api/auth/me');
    currentUser = meRes.data.user;
    currentPermissions = meRes.data.permissions;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    updateSidebarUser();
    applyNavPermissions();
    return true;
  } catch(e) {
    localStorage.removeItem('gms_token');
    authToken = '';
    delete axios.defaults.headers.common['Authorization'];
    // Only show "session expired" if we actually had a token (not first-ever visit)
    var errEl = document.getElementById('loginError');
    if (errEl) {
      errEl.textContent = 'Previous session expired. Please sign in again.';
      errEl.classList.remove('hidden');
      // Auto-hide after 5 seconds
      setTimeout(function() { errEl.classList.add('hidden'); }, 5000);
    }
    return false;
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'; }
  }
}

function startNotifPolling() {
  if (_notifInterval) clearInterval(_notifInterval);
  _updateGPNavBadge();
  _notifInterval = setInterval(function() {
    axios.get('/api/notifications/summary').then(function(r) {
      var unread = r.data.unreadCount;
      var badge   = document.getElementById('notifBadge');
      var dropBadge = document.getElementById('notifDropBadge');
      if (unread > 0) {
        var label = unread > 99 ? '99+' : String(unread);
        badge.textContent = label; badge.classList.remove('hidden'); badge.classList.add('flex');
        dropBadge.textContent = label + ' new'; dropBadge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden'); badge.classList.remove('flex');
        dropBadge.classList.add('hidden');
      }
    }).catch(function(){});
    _updateGPNavBadge();
  }, 30000);
}

function _updateGPNavBadge() {
  axios.get('/api/gate-passes/summary').then(function(r) {
    var badge = document.getElementById('gpNavBadge');
    if (!badge) return;
    var count = (r.data.active || 0) + (r.data.pendingExit || 0);
    if (count > 0) { badge.textContent = count > 99 ? '99+' : String(count); badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  }).catch(function(){});
}

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
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const date = dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const time = dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:true});
  return date + ', ' + time;
}
var _toastTimer = null;
function showToast(msg, type='success') {
  const t    = document.getElementById('toast');
  const inn  = document.getElementById('toastInner');
  const icon = document.getElementById('toastIcon');
  const m    = document.getElementById('toastMsg');

  // Icon + colour per type
  const cfg = {
    success: { icon: 'fa-check-circle',    color: '#22c55e', bg: '#1e293b' },
    error:   { icon: 'fa-times-circle',    color: '#ef4444', bg: '#1e293b' },
    warning: { icon: 'fa-exclamation-circle', color: '#f59e0b', bg: '#1e293b' },
    info:    { icon: 'fa-info-circle',     color: '#60a5fa', bg: '#1e293b' },
  };
  const c = cfg[type] || cfg.success;

  icon.className = 'fas ' + c.icon + ' flex-shrink-0 text-base';
  icon.style.color = c.color;
  inn.style.background = c.bg;
  m.textContent = msg;

  // Reset any running timer
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }

  // Show with animation
  t.style.display = 'block';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inn.style.opacity   = '1';
      inn.style.transform = 'translateY(0)';
    });
  });

  // Auto-hide after 3.5 s
  _toastTimer = setTimeout(() => {
    inn.style.opacity   = '0';
    inn.style.transform = 'translateY(12px)';
    setTimeout(() => { t.style.display = 'none'; }, 240);
    _toastTimer = null;
  }, 3500);
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  // Reset modal-statusUpdate width back to default after any modal widens it
  if (id === 'modal-statusUpdate') {
    const box = document.querySelector('#modal-statusUpdate .modal-box');
    if (box) { box.style.setProperty('--mw', '440px'); }
  }
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
/** Set modal box max-width safely — never overflows viewport */
function setModalWidth(selector, px) {
  const box = document.querySelector(selector + ' .modal-box');
  if (box) {
    box.style.setProperty('--mw', px + 'px');
    box.style.removeProperty('max-width'); // let CSS rule handle it
  }
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  const isOpen = sb.classList.toggle('open');
  bd.style.display = isOpen ? 'block' : 'none';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').style.display = 'none';
}
function toggleMobileSearch() {
  const bar = document.getElementById('mobileSearchBar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) document.getElementById('globalSearchMobile').focus();
}

function statusBadge(s) {
  const c = STATUS_CONFIG[s] || { bg:'#f1f5f9', text:'#64748b', label:s };
  return '<span class="status-pill" style="background:' + c.bg + ';color:' + c.text + '">' + c.label + '</span>';
}

function showPage(page) {
  // Auto-close sidebar on mobile when navigating
  if (window.innerWidth < 1024) closeSidebar();
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
  if (page === 'finance') loadFinance();
  if (page === 'users') loadUsers();
  if (page === 'oil-services') loadLubricants();
  if (page === 'parts-catalogue') loadPartsCatalogue();
  if (page === 'car-wash') loadCarWash();
  if (page === 'add-ons') loadAddOns();
  if (page === 'expenses') loadExpenses();
  if (page === 'vendors') loadVendors();
  if (page === 'notifications') loadNotificationsPage();
  if (page === 'gate-passes') loadGatePasses();
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
        <div class="flex items-center justify-end gap-1.5 flex-wrap">
          \${statusBadge(j.status)}
          \${j.reopenCount ? '<span class="text-xs font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"><i class="fas fa-folder-open mr-0.5"></i>Reopened</span>' : ''}
          \${j.nextServiceMileage ? '<span class="text-xs font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded" title="Next service due"><i class="fas fa-bell mr-0.5"></i>' + j.nextServiceMileage.toLocaleString() + ' km</span>' : ''}
        </div>
        <p class="text-xs text-gray-400 mt-1"><i class="fas fa-calendar-plus mr-1 opacity-60"></i>\${fmtDateTime(j.createdAt)}</p>
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
  // Load expense snapshot
  _loadDashExpenseSnapshot();
  // Load finance summary cards (async, non-blocking)
  loadFinanceSummaryCards();
}

async function _loadDashExpenseSnapshot() {
  try {
    const { data: s } = await axios.get('/api/expenses/summary');
    const snap = document.getElementById('dashExpenseSnapshot');
    if (!snap) return;
    const cats = Object.entries(s.byCategory || {}).sort((a,b) => b[1]-a[1]).slice(0, 4);
    snap.innerHTML =
      '<div class="space-y-2 mb-3">' +
        '<div class="flex justify-between text-sm">' +
          '<span class="text-gray-500">Total this period</span>' +
          '<span class="font-bold text-gray-900">' + fmt(s.total) + '</span>' +
        '</div>' +
        '<div class="flex justify-between text-sm">' +
          '<span class="text-gray-500">Paid</span>' +
          '<span class="font-semibold text-green-600">' + fmt(s.totalPaid) + '</span>' +
        '</div>' +
        '<div class="flex justify-between text-sm">' +
          '<span class="text-gray-500">Pending / Approved</span>' +
          '<span class="font-semibold text-amber-600">' + fmt(s.totalPending) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="border-t border-gray-100 pt-3">' +
        '<p class="text-xs text-gray-400 font-semibold mb-2">Top Categories</p>' +
        cats.map(function(entry) {
          var cat = entry[0], val = entry[1];
          var color = EXP_CAT_COLORS[cat] || '#94a3b8';
          var pct = s.total > 0 ? Math.round((val/s.total)*100) : 0;
          return '<div class="mb-2">' +
            '<div class="flex justify-between text-xs mb-0.5">' +
              '<span class="text-gray-600 truncate">' + cat + '</span>' +
              '<span class="font-semibold text-gray-700 ml-2">' + pct + '%</span>' +
            '</div>' +
            '<div class="progress-bar">' +
              '<div class="progress-fill" style="width:'+pct+'%;background:'+color+'"></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
  } catch(err) {
    var snap2 = document.getElementById('dashExpenseSnapshot');
    if (snap2) snap2.innerHTML = '<p class="text-gray-400 text-xs text-center py-2">Could not load</p>';
  }
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
        <p class="text-xs text-gray-400"><i class="fas fa-calendar-plus mr-1 opacity-50"></i>\${fmtDateTime(j.createdAt)}</p>
      </td>
      <td class="px-4 py-3">
        <p class="font-semibold text-gray-800 text-sm">\${j.customer?.name||'—'}</p>
        <p class="text-xs text-gray-500"><i class="fas fa-car text-xs mr-1"></i>\${j.vehicle?.registrationNumber||'—'} · \${j.vehicle?.make||''} \${j.vehicle?.model||''}</p>
      </td>
      <td class="px-4 py-3">
        <span class="tag \${j.category==='Insurance'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}">\${j.category}</span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">\${j.insurer||'—'}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          \${statusBadge(j.status)}
          \${j.reopenCount ? '<span class="text-xs font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded whitespace-nowrap"><i class="fas fa-folder-open mr-0.5"></i>Reopened</span>' : ''}
          \${j.nextServiceMileage ? '<span class="text-xs font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded whitespace-nowrap" title="Next service at ' + j.nextServiceMileage.toLocaleString() + ' km"><i class="fas fa-bell mr-0.5"></i>Next Svc: ' + j.nextServiceMileage.toLocaleString() + ' km</span>' : ''}
        </div>
      </td>
      <td class="px-4 py-3 text-xs text-gray-500">\${fmtDate(j.updatedAt)}</td>
      <td class="px-4 py-3">
        <div class="flex gap-2" onclick="event.stopPropagation()">
          <button class="text-blue-500 hover:text-blue-700 text-sm" onclick="viewJobDetail('\${j.id}')" title="View"><i class="fas fa-eye"></i></button>
          \${['RELEASED','COMPLETED','INVOICED'].includes(j.status)
            ? \`<button class="text-amber-500 hover:text-amber-700 text-sm" onclick="showReopenModal('\${j.id}')" title="Reopen Job"><i class="fas fa-folder-open"></i></button>\`
            : \`<button class="text-amber-500 hover:text-amber-700 text-sm" onclick="showStatusModal('\${j.id}','\${j.status}')" title="Update Status"><i class="fas fa-exchange-alt"></i></button>\`}
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
  window._currentJobDetailId = id;
  const { data: j } = await axios.get('/api/jobcards/' + id);
  // Fetch gate pass for this job (best-effort)
  let _gpDetail = null;
  try { const r = await axios.get('/api/gate-passes/by-job/' + id); _gpDetail = r.data; } catch(e) {}
  showPage('jobdetail');
  document.getElementById('jobDetailTitle').textContent = j.jobCardNumber;
  document.getElementById('jobDetailSub').textContent = (j.vehicle?.make||'') + ' ' + (j.vehicle?.model||'') + ' · ' + (j.vehicle?.registrationNumber||'') + ' · ' + (j.customer?.name||'');
  
  const canMakeInvoice = j.status === 'COMPLETED' && !j.invoice;
  const canMakePFI = !j.pfi;
  const canReopen = ['RELEASED', 'COMPLETED', 'INVOICED'].includes(j.status);
  const isReopened = (j.reopenCount || 0) > 0;
  const canServiceCard = !!(j.mileageIn || j.nextServiceMileage);
  
  document.getElementById('jobDetailActions').innerHTML = \`
    \${canReopen
      ? \`<button class="text-sm font-semibold rounded-xl px-3 py-2 transition-all bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 flex items-center gap-1.5" onclick="showReopenModal('\${j.id}')"><i class="fas fa-folder-open"></i> Reopen Job</button>\`
      : \`<button class="btn-secondary text-sm" onclick="showStatusModal('\${j.id}','\${j.status}')"><i class="fas fa-exchange-alt"></i> Update Status</button>\`}
    \${canMakePFI ? \`<button class="btn-secondary text-sm" onclick="showPFIModal('\${j.id}','\${j.category}')"><i class="fas fa-file-invoice"></i> Create PFI</button>\` : ''}
    \${canMakeInvoice ? \`<button class="btn-primary text-sm" onclick="showInvoiceModal('\${j.id}',\${j.pfi?.labourCost||0},\${j.parts?.reduce((s,p)=>s+p.totalCost,0)||0})"><i class="fas fa-receipt"></i> Generate Invoice</button>\` : ''}
    \${canServiceCard ? \`<button class="text-sm font-semibold rounded-xl px-3 py-2 transition-all bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 flex items-center gap-1.5" onclick="showServiceCardModal('\${j.id}')"><i class="fas fa-id-card"></i> Service Card\${j.serviceCardIssuedAt ? ' <i class=\\"fas fa-check-circle text-green-500 ml-0.5\\" title=\\"Issued: '+fmtDate(j.serviceCardIssuedAt)+'\\"></i>' : ''}</button>\` : ''}
  \`;
  
  const totalPartsCost = j.parts ? j.parts.reduce((s, p) => s + p.totalCost, 0) : 0;
  const totalServicesCost = j.services ? j.services.reduce((s, sv) => s + sv.totalCost, 0) : 0;
  const totalLabourFromServices = j.services
    ? j.services.filter(sv => sv.category === 'Service Package').reduce((s, sv) => s + sv.totalCost, 0)
    : 0;
  
  // Helper: icon + colour per service category
  function svcIcon(cat) {
    return cat === 'Service Package' ? 'fa-box-open text-purple-500'
         : cat === 'Oil Service'     ? 'fa-oil-can text-amber-500'
         : cat === 'Car Wash'        ? 'fa-car-wash text-cyan-500'
         : 'fa-plus-circle text-green-500'; // Add-on
  }
  function svcBg(cat) {
    return cat === 'Service Package' ? 'bg-purple-50 border-purple-200'
         : cat === 'Oil Service'     ? 'bg-amber-50 border-amber-200'
         : cat === 'Car Wash'        ? 'bg-cyan-50 border-cyan-200'
         : 'bg-green-50 border-green-200';
  }
  
  document.getElementById('jobDetailContent').innerHTML = \`
    \${isReopened ? \`
    <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <i class="fas fa-folder-open text-amber-500 mt-0.5 flex-shrink-0"></i>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-amber-800">Reopened Job \${j.reopenCount > 1 ? '(' + j.reopenCount + ' times)' : ''}</p>
        <p class="text-xs text-amber-700 mt-0.5">\${j.reopenReason || ''}</p>
        <p class="text-xs text-amber-500 mt-0.5">Last reopened: \${fmtDate(j.reopenedAt)}</p>
      </div>
    </div>\` : ''}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Status Progress -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Repair Progress</h4>
          <div class="status-stepper-scroll">
          <div class="flex items-center gap-1" style="min-width:max-content">
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
        </div>
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4">Job Details</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Category</p><p class="font-semibold">\${j.category}</p></div>
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Technician</p><p class="font-semibold">\${j.technicianName||'—'}</p></div>
            \${j.claimReference ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Claim Ref</p><p class="font-semibold">\${j.claimReference}</p></div>\` : ''}
            \${j.insurer ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Insurer</p><p class="font-semibold">\${j.insurer}</p></div>\` : ''}
            \${j.assessor ? \`<div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Assessor</p><p class="font-semibold">\${j.assessor}</p></div>\` : ''}
            <div><p class="text-gray-400 text-xs font-semibold uppercase mb-1">Created</p><p class="font-semibold">\${fmtDateTime(j.createdAt)}</p></div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-gray-400 text-xs font-semibold uppercase mb-2">Damage / Service Description</p>
            <p class="text-sm text-gray-700">\${j.damageDescription}</p>
          </div>
          \${j.inspectionNotes ? \`<div class="mt-3 pt-3 border-t border-gray-100"><p class="text-gray-400 text-xs font-semibold uppercase mb-2">Inspection Notes</p><p class="text-sm text-gray-700">\${j.inspectionNotes}</p></div>\` : ''}
        </div>
        <!-- Services & Parts -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-gray-800">Services &amp; Parts</h4>
            <button class="btn-secondary text-xs" onclick="showAddServiceModal('\${j.id}')"><i class="fas fa-plus mr-1"></i> Add Service / Part</button>
          </div>

          \${(j.services && j.services.length) || (j.parts && j.parts.length) ? \`

            \${j.services && j.services.length ? \`
              <p class="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wide">Services</p>
              <div class="space-y-2 mb-4">
                \${j.services.map(sv => \`
                  <div class="flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border \${svcBg(sv.category)}">
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                      <i class="fas \${svcIcon(sv.category)} mt-0.5 text-sm flex-shrink-0"></i>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate">\${sv.serviceName}</p>
                        <p class="text-xs text-gray-500 mt-0.5">\${sv.category}\${sv.notes ? ' · ' + sv.notes : ''}\${sv.quantity > 1 ? ' · ×' + sv.quantity : ''}</p>
                        \${sv.batchNumber ? \`<p class="text-xs text-gray-400 mt-0.5"><i class="fas fa-barcode mr-1"></i>Batch: <span class="font-mono font-semibold text-blue-700">\${sv.batchNumber}</span></p>\` : ''}
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="font-semibold text-sm text-gray-800">\${fmt(sv.totalCost)}</p>
                      <button class="text-xs text-red-400 hover:text-red-600 mt-0.5" onclick="removeJobService('\${j.id}','\${sv.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                \`).join('')}
              </div>
            \` : ''}

            \${j.parts && j.parts.length ? \`
              <p class="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wide">Parts Consumed</p>
              <div class="overflow-x-auto mb-3">
                <table class="w-full text-sm" style="min-width:480px">
                  <thead><tr class="text-xs text-gray-400 uppercase border-b bg-gray-50">
                    <th class="text-left pb-2 pt-1 px-2">Part</th>
                    <th class="text-left pb-2 pt-1 px-2">Batch #</th>
                    <th class="text-left pb-2 pt-1 px-2">Part #</th>
                    <th class="text-right pb-2 pt-1 px-1">Qty</th>
                    <th class="text-right pb-2 pt-1 px-1">Unit</th>
                    <th class="text-right pb-2 pt-1 px-2">Total</th>
                  </tr></thead>
                  <tbody>\${j.parts.map(p => \`
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                      <td class="py-2 px-2 font-medium text-gray-700">\${p.partName}</td>
                      <td class="py-2 px-2">\${p.batchNumber ? \`<span class="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">\${p.batchNumber}</span>\` : '<span class="text-gray-300 text-xs">—</span>'}</td>
                      <td class="py-2 px-2">\${p.partSerialNumber ? \`<span class="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">\${p.partSerialNumber}</span>\` : '<span class="text-gray-300 text-xs">—</span>'}</td>
                      <td class="py-2 px-1 text-right text-gray-600">\${p.quantity}</td>
                      <td class="py-2 px-1 text-right text-gray-600">\${fmt(p.unitCost)}</td>
                      <td class="py-2 px-2 text-right font-semibold text-gray-800">\${fmt(p.totalCost)}</td>
                    </tr>
                  \`).join('')}</tbody>
                </table>
              </div>
            \` : ''}

            <div class="border-t border-gray-100 pt-3 mt-1 space-y-1 text-sm">
              \${j.services && j.services.length ? \`<div class="flex justify-between text-gray-500"><span>Services Total</span><span class="font-semibold">\${fmt(totalServicesCost)}</span></div>\` : ''}
              \${j.parts && j.parts.length ? \`<div class="flex justify-between text-gray-500"><span>Parts Total</span><span class="font-semibold">\${fmt(totalPartsCost)}</span></div>\` : ''}
              <div class="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-100">
                <span>Grand Total</span>
                <span class="text-blue-600">\${fmt(totalServicesCost + totalPartsCost)}</span>
              </div>
            </div>

          \` : '<p class="text-gray-400 text-sm text-center py-6"><i class="fas fa-concierge-bell text-2xl mb-2 block"></i>No services or parts added yet</p>'}
        </div>
        <!-- Activity Log -->
        <div class="card p-5">
          <h4 class="font-bold text-gray-800 mb-4"><i class="fas fa-history text-blue-400 mr-2"></i>Activity Log</h4>
          <div class="space-y-0">
            \${j.logs && j.logs.length ? j.logs.map((log, idx) => \`
              <div class="flex gap-3 \${idx < j.logs.length - 1 ? 'pb-4 border-l-2 border-blue-100 ml-[7px] pl-5 -ml-0' : ''}">
                <div class="flex flex-col items-center flex-shrink-0 \${idx < j.logs.length - 1 ? '' : ''}">
                  <div class="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow flex-shrink-0 mt-0.5 z-10"></div>
                </div>
                <div class="flex-1 pb-\${idx < j.logs.length - 1 ? '4' : '0'} -mt-0.5">
                  <p class="text-sm font-semibold text-gray-800">\${log.description}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      <i class="fas fa-user-circle text-blue-300"></i>\${log.userName}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      <i class="fas fa-clock text-blue-300"></i>\${fmtDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            \`).join('') : '<p class="text-gray-400 text-sm text-center py-4"><i class="fas fa-history text-2xl mb-2 block opacity-30"></i>No activity yet</p>'}
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
        <!-- Intake Readings & Next Service -->
        \${(j.mileageIn || j.fuelLevel || j.nextServiceMileage) ? \`
        <div class="card p-5 border-l-4 border-blue-400">
          <h4 class="font-bold text-gray-800 mb-3"><i class="fas fa-tachometer-alt text-blue-500 mr-2"></i>Intake Readings</h4>
          <div class="space-y-2.5 text-sm">
            \${j.mileageIn ? \`
            <div class="flex justify-between items-center">
              <span class="text-gray-500"><i class="fas fa-road mr-1.5 text-blue-400"></i>Mileage In</span>
              <span class="font-bold text-gray-800">\${j.mileageIn.toLocaleString()} km</span>
            </div>\` : ''}
            \${j.fuelLevel ? \`
            <div class="flex justify-between items-center">
              <span class="text-gray-500"><i class="fas fa-gas-pump mr-1.5 text-amber-400"></i>Fuel Level</span>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold \${ {'Empty':'bg-red-100 text-red-700','1/4':'bg-orange-100 text-orange-700','1/2':'bg-amber-100 text-amber-700','3/4':'bg-green-100 text-green-700','Full':'bg-emerald-100 text-emerald-700'}[j.fuelLevel] || 'bg-gray-100 text-gray-600'}">\${j.fuelLevel}</span>
            </div>\` : ''}
            \${j.nextServiceMileage ? \`
            <div class="mt-2 pt-2 border-t border-blue-100">
              <div class="flex justify-between items-start">
                <span class="text-gray-500"><i class="fas fa-calendar-check mr-1.5 text-green-500"></i>Next Service</span>
                <div class="text-right">
                  <p class="font-bold text-green-700">\${j.nextServiceMileage.toLocaleString()} km</p>
                  \${j.nextServiceLubricant ? \`<p class="text-xs text-gray-400 mt-0.5">\${j.nextServiceLubricant}</p>\` : ''}
                </div>
              </div>
            </div>\` : ''}
          </div>
          \${j.serviceCardIssuedAt ? \`
          <div class="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2">
            <i class="fas fa-check-circle text-green-500 text-sm"></i>
            <div class="flex-1">
              <p class="text-xs font-semibold text-green-700">Service Card Issued</p>
              <p class="text-xs text-gray-400">\${fmtDateTime(j.serviceCardIssuedAt)}</p>
            </div>
            <button class="text-xs text-blue-600 hover:underline font-semibold" onclick="showServiceCardModal('\${j.id}')"><i class="fas fa-redo mr-0.5"></i>Reissue</button>
          </div>\` : \`
          <div class="mt-3 pt-3 border-t border-blue-100">
            <button class="w-full text-sm font-semibold rounded-xl px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 flex items-center justify-center gap-2 transition-all" onclick="showServiceCardModal('\${j.id}')">
              <i class="fas fa-id-card"></i> Issue Service Card
            </button>
          </div>\`}
        </div>\` : ''}

        <!-- Gate Pass Card -->
        <div class="card p-5 border-l-4 \${_gpDetail ? (_gpDetail.status==='Cleared'?'border-green-400':_gpDetail.status==='Pending Exit'?'border-orange-400':'border-blue-400') : 'border-blue-400'}" id="gatePassCard-\${j.id}">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-gray-800 text-sm"><i class="fas fa-id-badge text-blue-500 mr-2"></i>Gate Pass</h4>
            \${_gpDetail ? \`<span class="badge text-xs \${_gpDetail.status==='Cleared'?'bg-green-100 text-green-700':_gpDetail.status==='Pending Exit'?'bg-orange-100 text-orange-700':_gpDetail.status==='Voided'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}">\${_gpDetail.status}</span>\` : '<span class="badge bg-gray-100 text-gray-400 text-xs">Not Found</span>'}
          </div>
          \${_gpDetail ? \`
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-400">Pass #</span><span class="font-mono font-bold text-gray-800">\${_gpDetail.passNumber}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Vehicle</span><span class="font-bold text-blue-700">\${_gpDetail.vehicleReg}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Entry</span><span class="font-semibold text-gray-700">\${fmtDateTime(_gpDetail.entryTime)}</span></div>
            \${_gpDetail.exitTime ? \`<div class="flex justify-between"><span class="text-gray-400">Exit</span><span class="font-semibold text-green-700">\${fmtDateTime(_gpDetail.exitTime)}</span></div>\` : ''}
            \${_gpDetail.approvedBy ? \`<div class="flex justify-between"><span class="text-gray-400">Approved By</span><span class="font-semibold text-gray-700">\${_gpDetail.approvedBy}</span></div>\` : ''}
          </div>
          \${_gpDetail.signatureData ? \`
          <div class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Authorising Signature</p>
            <img src="\${_gpDetail.signatureData}" alt="Signature" class="max-h-12 border border-gray-200 rounded-lg bg-white p-1" />
          </div>\` : ''}
          <div class="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            \${_gpDetail.status === 'Pending Exit' ? \`
              <button class="btn-primary flex-1 text-xs py-1.5 bg-green-600 hover:bg-green-700" onclick="openGPApprovalModal('\${_gpDetail.id}')"><i class="fas fa-sign-out-alt mr-1"></i>Approve Exit</button>
            \` : ''}
            <button class="btn-secondary flex-1 text-xs py-1.5" onclick="downloadGatePassPDF('\${_gpDetail.id}')"><i class="fas fa-download mr-1"></i>Download PDF</button>
            \${_gpDetail.status === 'Active' || _gpDetail.status === 'Pending Exit' ? \`
              <button class="btn-secondary text-xs py-1.5 px-2 text-red-600 border-red-200 hover:bg-red-50" onclick="openVoidGPModal('\${_gpDetail.id}')"><i class="fas fa-ban"></i></button>
            \` : ''}
          </div>\` : '<p class="text-xs text-gray-400 text-center py-4">Gate pass not yet generated</p>'}
        </div>

        <!-- Time Tracking -->
        <div class="card p-5 border-l-4 border-violet-400" id="timeTrackCard-\${j.id}">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-gray-800 text-sm"><i class="fas fa-stopwatch text-violet-500 mr-2"></i>Time Tracking</h4>
            <button onclick="refreshTimeTrack('\${j.id}')" class="text-xs text-violet-500 hover:text-violet-700 font-semibold" title="Refresh"><i class="fas fa-sync-alt"></i></button>
          </div>
          <div id="timeTrackContent-\${j.id}">
            <p class="text-xs text-gray-400 text-center py-3"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</p>
          </div>
        </div>

        <!-- PFI -->
        \${j.pfi ? \`
          <div class="card p-5">
            <h4 class="font-bold text-gray-800 mb-4"><i class="fas fa-file-invoice text-blue-500 mr-2"></i>PFI – Pro Forma Invoice</h4>
            \${j.services && j.services.length ? \`
              <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Services</p>
              <div class="space-y-1 mb-3">
                \${j.services.map(sv => \`
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 truncate max-w-[65%]"><i class="fas \${svcIcon(sv.category)} mr-1"></i>\${sv.serviceName} \${sv.quantity > 1 ? '<span class=\\"text-gray-400\\">×' + sv.quantity + '</span>' : ''}</span>
                    <span class="font-semibold text-gray-700">\${fmt(sv.totalCost)}</span>
                  </div>
                \`).join('')}
              </div>
              <div class="border-t border-gray-100 mb-3"></div>
            \` : ''}
            \${j.parts && j.parts.length ? \`
              <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Parts Included</p>
              <div class="space-y-1 mb-3">
                \${j.parts.map(p => \`
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 truncate max-w-[60%]">\${p.partName} <span class="text-gray-400">×\${p.quantity}</span></span>
                    <span class="font-semibold text-gray-700">\${fmt(p.totalCost)}</span>
                  </div>
                \`).join('')}
              </div>
              <div class="border-t border-gray-100 pt-2 mb-3"></div>
            \` : ''}
            \${(function(){
              // Always compute from live services + parts — never from stale PFI snapshot
              const _liveSvcCost  = (j.services||[]).reduce(function(s,sv){return s+sv.totalCost;},0);
              const _livePartCost = (j.parts||[]).reduce(function(s,p){return s+p.totalCost;},0);
              const _liveBillable = _liveSvcCost + _livePartCost;
              const _labour       = j.pfi.labourCost || 0;
              const _subtotal     = _labour + _liveBillable;
              const _disc         = j.pfi.discountAmount || 0;
              const _discReason   = j.pfi.discountReason || '';
              const _total        = Math.max(0, _subtotal - _disc);
              // Use stored tax from PFI — do NOT recalculate; user may have set it to 0
              const _tax        = typeof j.pfi.tax === 'number' ? j.pfi.tax : Math.round(_total * 0.18);
              const _grandTotal = _total + _tax;
              return \`<div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">Labour</span><span class="font-semibold">\${fmt(_labour)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">Services + Parts</span><span class="font-semibold">\${fmt(_liveBillable)}</span></div>
                \${_disc > 0 ? '<div class=\\"flex justify-between text-green-600\\"><span class=\\"flex items-center gap-1\\"><i class=\\"fas fa-tag text-xs\\"></i>Discount'+(_discReason ? ' <span class=\\"text-xs text-green-500\\">('+_discReason+')</span>' : '')+'</span><span class=\\"font-semibold\\">− '+fmt(_disc)+'</span></div>' : ''}
                <div class="flex justify-between border-t pt-1 mt-1 text-gray-500"><span>Total Estimate</span><span class="font-medium">\${fmt(_total)}</span></div>
                <div class="flex justify-between text-orange-600"><span class="flex items-center gap-1"><i class="fas fa-percent text-xs"></i>Tax / VAT\${_tax > 0 ? ' (18%)' : ''}</span><span class="font-semibold">\${fmt(_tax)}</span></div>
                <div class="flex justify-between border-t pt-2 font-bold"><span>Grand Total</span><span class="text-blue-600">\${fmt(_grandTotal)}</span></div>
              </div>\`;
            })()}
            <div class="mt-3 flex items-center justify-between gap-2">
              <span class="badge" style="background:\${PFI_STATUS_CONFIG[j.pfi.status]?.bg};color:\${PFI_STATUS_CONFIG[j.pfi.status]?.text}">\${j.pfi.status}</span>
              <div class="flex items-center gap-2">
                \${!j.invoice ? '<button class=\\"text-xs text-amber-600 hover:underline font-semibold\\" onclick=\\"showEditPFIModal(\\'' + j.pfi.id + '\\')\\" ><i class=\\"fas fa-edit mr-1\\"></i>Edit</button>' : ''}
                <button class="text-xs text-blue-600 hover:underline font-semibold" onclick="showSendPFIModal('\${j.pfi.id}')"><i class="fas fa-paper-plane mr-1"></i>Send / View</button>
              </div>
            </div>
          </div>
        \` : ''}
        <!-- Invoice -->
        \${j.invoice ? \`
          <div class="card p-5 border-2 border-green-200">
            <h4 class="font-bold text-gray-800 mb-4"><i class="fas fa-receipt text-green-500 mr-2"></i>Invoice</h4>
            <p class="text-xs text-gray-400 mb-2">\${j.invoice.invoiceNumber}</p>
            \${(function(){
              // Always compute from live services + parts — never from stale Invoice snapshot
              const _liveSvcCost  = (j.services||[]).reduce(function(s,sv){return s+sv.totalCost;},0);
              const _livePartCost = (j.parts||[]).reduce(function(s,p){return s+p.totalCost;},0);
              const _liveBillable = _liveSvcCost + _livePartCost;
              const _labour       = j.invoice.labourCost || 0;
              const _subtotal     = _labour + _liveBillable;
              const _disc         = j.invoice.discountAmount || 0;
              const _discReason   = j.invoice.discountReason || '';
              const _afterDisc    = Math.max(0, _subtotal - _disc);
              // Use stored tax from Invoice — do NOT recalculate; user may have set it to 0
              const _tax          = typeof j.invoice.tax === 'number' ? j.invoice.tax : Math.round(_afterDisc * 0.18);
              const _total        = _afterDisc + _tax;
              return \`<div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">Labour</span><span>\${fmt(_labour)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">Services + Parts</span><span>\${fmt(_liveBillable)}</span></div>
                \${_disc > 0 ? '<div class=\\"flex justify-between text-green-600\\"><span class=\\"flex items-center gap-1\\"><i class=\\"fas fa-tag text-xs\\"></i>Discount'+(_discReason ? ' <span class=\\"text-xs text-green-500\\">('+_discReason+')</span>' : '')+'</span><span class=\\"font-semibold\\">− '+fmt(_disc)+'</span></div>' : ''}
                <div class="flex justify-between"><span class="text-gray-400">Tax / VAT\${_tax > 0 ? ' (18%)' : ''}</span><span>\${fmt(_tax)}</span></div>
                <div class="flex justify-between border-t pt-2 font-bold text-green-600"><span>Total</span><span>\${fmt(_total)}</span></div>
              </div>\`;
            })()}
            \${j.invoice.dueDate ? \`<p class="text-xs text-gray-400 mt-2">Due: \${j.invoice.dueDate}</p>\` : ''}
            \${j.invoice.paidAt ? \`<p class="text-xs text-green-600 mt-1"><i class="fas fa-check-circle mr-1"></i>Paid: \${fmtDate(j.invoice.paidAt)}</p>\` : ''}
            \${j.invoice.paymentMethod ? \`<p class="text-xs text-gray-500 mt-0.5"><i class="fas fa-credit-card mr-1"></i>\${j.invoice.paymentMethod}\${j.invoice.paymentReference ? ' · ' + j.invoice.paymentReference : ''}</p>\` : ''}
            <div class="mt-2 flex items-center justify-between gap-2">
              <span class="badge \${j.invoice.status==='Paid'?'bg-green-100 text-green-700':j.invoice.status==='Partially Paid'?'bg-amber-100 text-amber-700':j.invoice.status==='Overdue'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}">\${j.invoice.status}</span>
              \${j.invoice.status !== 'Paid' ? \`<button class="btn-primary text-xs py-1 px-3" onclick="markInvoicePaid('\${j.invoice.id}','\${j.id}')"><i class="fas fa-money-bill-wave mr-1"></i>\${j.invoice.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment'}</button>\` : ''}
            </div>
          </div>
          <!-- Job P&L Panel -->
          <div class="card p-5 border-2 border-indigo-100" id="jobPLPanel-\${j.id}">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fas fa-chart-line text-indigo-500 mr-2"></i>Job P&L</h4>
            <p class="text-xs text-gray-400 text-center py-2"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</p>
          </div>
        \` : ''}
        <!-- Expenses Panel (loaded async below) -->
        <div class="card p-5">
          <div id="jobExpenses"><p class="text-xs text-gray-400 text-center py-3"><i class="fas fa-spinner fa-spin mr-1"></i>Loading expenses…</p></div>
        </div>
      </div>
    </div>
  \`;
  // Load job expenses asynchronously into the sidebar panel
  loadJobExpenses(j.id);
  // Load per-job P&L if invoice exists
  if (j.invoice) {
    loadJobPL(j.id);
  }
  // Load time tracking panel
  loadTimeTrack(j.id);
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
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
      // 1. Record parts consumption on the job (include partId so backend can look up buying price)
      await axios.post('/api/jobcards/' + jobId + '/parts', {
        partName: name, quantity: qty, unitCost: unit, totalCost: qty * unit,
        ...(_selectedCatPart ? { partId: _selectedCatPart.id } : {})
      });
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
// Fetches the job's consumed parts to auto-fill and display the breakdown
async function showPFIModal(jobId, category) {
  const isInsurance = category === 'Insurance';

  // Fetch the full job (with parts + services) from the API
  const { data: job } = await axios.get('/api/jobcards/' + jobId);
  const parts    = job.parts    || [];
  const services = job.services || [];
  const totalPartsCost    = parts.reduce((s, p) => s + p.totalCost, 0);
  const totalServicesCost = services.reduce((s, sv) => s + sv.totalCost, 0);
  // Grand total of all billable items (services + parts) goes into partsCost field
  const totalBillable = totalPartsCost + totalServicesCost;

  // ── Services breakdown HTML ──
  let servicesHtml = '';
  if (services.length) {
    const catIcon = cat =>
      cat === 'Service Package' ? 'fa-box-open' :
      cat === 'Oil Service'     ? 'fa-oil-can'  :
      cat === 'Car Wash'        ? 'fa-car'       : 'fa-plus-circle';
    const sRows = services.map(sv =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2">' +
          '<span class="inline-flex items-center gap-1.5">' +
            '<i class="fas ' + catIcon(sv.category) + ' text-xs text-gray-400"></i>' +
            '<span class="font-medium text-gray-700">' + sv.serviceName + '</span>' +
          '</span>' +
          (sv.notes ? '<p class="text-xs text-gray-400 mt-0.5 pl-4">' + sv.notes + '</p>' : '') +
        '</td>' +
        '<td class="px-3 py-2 text-center text-gray-600">' + sv.quantity + '</td>' +
        '<td class="px-3 py-2 text-right text-gray-600">' + fmt(sv.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-gray-800">' + fmt(sv.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    servicesHtml =
      '<div class="mb-3">' +
        '<p class="form-label mb-2">Services <span class="text-gray-400 font-normal text-xs">(from job card)</span></p>' +
        '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-gray-50 border-b border-gray-100">' +
              '<th class="text-left px-3 py-2 font-semibold text-gray-500">Service</th>' +
              '<th class="text-center px-3 py-2 font-semibold text-gray-500">Qty</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Unit</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + sRows + '</tbody>' +
            '<tfoot><tr class="bg-purple-50">' +
              '<td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Services Total:</td>' +
              '<td class="px-3 py-2 text-right font-bold text-purple-700">' + fmt(totalServicesCost) + '</td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  // ── Parts breakdown HTML ──
  let partsHtml = '';
  if (parts.length) {
    const rows = parts.map(p =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2 font-medium text-gray-700">' + p.partName + '</td>' +
        '<td class="px-3 py-2 text-center text-gray-600">' + p.quantity + '</td>' +
        '<td class="px-3 py-2 text-right text-gray-600">' + fmt(p.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-gray-800">' + fmt(p.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    partsHtml =
      '<div class="mb-3">' +
        '<p class="form-label mb-2">Parts Consumed <span class="text-gray-400 font-normal text-xs">(from job card)</span></p>' +
        '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-gray-50 border-b border-gray-100">' +
              '<th class="text-left px-3 py-2 font-semibold text-gray-500">Part</th>' +
              '<th class="text-center px-3 py-2 font-semibold text-gray-500">Qty</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Unit Cost</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr class="bg-blue-50">' +
              '<td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Parts Total:</td>' +
              '<td class="px-3 py-2 text-right font-bold text-blue-700">' + fmt(totalPartsCost) + '</td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  if (!parts.length && !services.length) {
    partsHtml =
      '<div class="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">' +
      '<i class="fas fa-info-circle"></i> No services or parts added yet. You can still enter costs manually below.' +
      '</div>';
  }

  openModal('modal-statusUpdate');
  setModalWidth('#modal-statusUpdate', 640);
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-3">\${isInsurance ? 'Create a Pro Forma Invoice for insurer approval' : 'Create a Pro Forma Invoice to send to the customer'}</p>
    \${isInsurance ? '' : \`<div class="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><i class="fas fa-user-circle"></i> Private / Individual job – PFI will go directly to the customer</div>\`}
    \${servicesHtml}
    \${partsHtml}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
      <div>
        <label class="form-label">Labour Cost (TZS)</label>
        <input class="form-input" type="number" id="pfi-labour" required min="0"/>
      </div>
      <div>
        <label class="form-label">Services + Parts Cost (TZS) <span class="text-gray-400 font-normal text-xs">auto-filled</span></label>
        <input class="form-input" type="number" id="pfi-parts" required min="0" value="\${totalBillable}"/>
      </div>
    </div>

    <!-- Discount Section -->
    <div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-semibold text-green-800"><i class="fas fa-tag mr-1.5 text-green-500"></i>Discount <span class="font-normal text-green-600 text-xs">(optional)</span></label>
        <div class="flex items-center gap-1">
          <button type="button" id="pfi-disc-type-fixed" onclick="pfiSetDiscountType('fixed')"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-green-300 bg-white text-green-700 hover:bg-green-100 transition-all">TZS</button>
          <button type="button" id="pfi-disc-type-pct" onclick="pfiSetDiscountType('percentage')"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-transparent bg-transparent text-green-600 hover:bg-green-100 transition-all">%</button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="relative">
            <span id="pfi-disc-prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">TZS</span>
            <input class="form-input pl-11" type="number" id="pfi-disc-value" min="0" placeholder="0" oninput="pfiCalcTotal()"/>
          </div>
          <p class="text-xs text-green-600 mt-1" id="pfi-disc-preview"></p>
        </div>
        <div>
          <input class="form-input" type="text" id="pfi-disc-reason" placeholder="Reason (e.g. Loyal customer)" maxlength="80"/>
        </div>
      </div>
    </div>

    <!-- Total -->
    <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div class="flex items-center justify-between">
        <div class="space-y-1 text-sm flex-1">
          <div class="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span id="pfi-subtotal-display" class="font-medium text-gray-700"></span>
          </div>
          <div class="flex justify-between text-green-600" id="pfi-disc-line" style="display:none!important">
            <span><i class="fas fa-tag mr-1 text-xs"></i>Discount</span>
            <span id="pfi-disc-amount-display" class="font-semibold">— TZS 0</span>
          </div>
          <div class="flex justify-between text-gray-600 border-t border-blue-200 pt-1 mt-1">
            <span>Total Estimate (before tax)</span>
            <span id="pfi-total-display" class="font-medium text-gray-700"></span>
          </div>
          <div class="flex justify-between text-orange-600">
            <span><i class="fas fa-percent mr-1 text-xs"></i>Tax / VAT (18%)</span>
            <span id="pfi-tax-display" class="font-semibold"></span>
          </div>
          <div class="flex justify-between font-bold text-gray-800 border-t border-blue-200 pt-1 mt-1">
            <span>Grand Total (incl. Tax)</span>
            <span id="pfi-grand-total-display" class="text-blue-700 text-base"></span>
          </div>
        </div>
      </div>
    </div>
    <input type="hidden" id="pfi-total"/>

    <div class="mb-5">
      <label class="form-label">Notes</label>
      <textarea class="form-input" id="pfi-notes" rows="2" placeholder="\${isInsurance ? 'Additional notes for insurer\u2026' : 'Additional notes for customer\u2026'}"></textarea>
    </div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button class="btn-primary flex-1" id="pfi-submit"><i class="fas fa-file-invoice mr-1"></i> \${isInsurance ? 'Submit PFI' : 'Save PFI'}</button>
    </div>
  \`;

  // Initialise discount type state
  window._pfiDiscType = 'fixed';
  pfiSetDiscountType('fixed');

  // Wire up total calculation and trigger with pre-filled billable cost
  pfiCalcTotal();
  document.getElementById('pfi-labour').oninput = pfiCalcTotal;
  document.getElementById('pfi-parts').oninput  = pfiCalcTotal;

  document.getElementById('pfi-submit').onclick = async () => {
    const l = +document.getElementById('pfi-labour').value || 0;
    const p = +document.getElementById('pfi-parts').value || 0;
    const discType  = window._pfiDiscType;
    const discValue = +document.getElementById('pfi-disc-value').value || 0;
    const discReason = document.getElementById('pfi-disc-reason').value.trim();
    const subtotal = l + p;
    let discountAmount = 0;
    if (discType === 'percentage' && discValue > 0) {
      discountAmount = Math.round(subtotal * Math.min(discValue, 100) / 100);
    } else if (discType === 'fixed' && discValue > 0) {
      discountAmount = Math.min(Math.round(discValue), subtotal);
    }
    const totalEstimate = Math.max(0, subtotal - discountAmount);
    const tax           = Math.round(totalEstimate * 0.18);
    const totalAmount   = totalEstimate + tax;
    const initialStatus = isInsurance ? 'Submitted' : 'Draft';
    await axios.post('/api/jobcards/' + jobId + '/pfi', {
      labourCost: l,
      partsCost: p,
      discountType: discValue > 0 ? discType : undefined,
      discountValue: discValue > 0 ? discValue : undefined,
      discountAmount,
      discountReason: discReason || undefined,
      totalEstimate,
      tax,
      totalAmount,
      status: initialStatus,
      notes: document.getElementById('pfi-notes').value
    });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    const discNote = discountAmount > 0 ? ' with discount of ' + fmt(discountAmount) : '';
    showToast(isInsurance ? 'PFI submitted to insurer' + discNote : 'PFI created' + discNote + ' – ready to send to customer');
  };
}

// ── PFI Discount helpers ──────────────────────────────────────────────────────
function pfiSetDiscountType(type) {
  window._pfiDiscType = type;
  const fixedBtn = document.getElementById('pfi-disc-type-fixed');
  const pctBtn   = document.getElementById('pfi-disc-type-pct');
  const prefix   = document.getElementById('pfi-disc-prefix');
  if (!fixedBtn || !pctBtn) return;
  if (type === 'fixed') {
    fixedBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg border border-green-500 bg-green-500 text-white transition-all';
    pctBtn.className   = 'px-2.5 py-1 text-xs font-semibold rounded-lg border border-transparent bg-transparent text-green-600 hover:bg-green-100 transition-all';
    if (prefix) prefix.textContent = 'TZS';
  } else {
    fixedBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg border border-transparent bg-transparent text-green-600 hover:bg-green-100 transition-all';
    pctBtn.className   = 'px-2.5 py-1 text-xs font-semibold rounded-lg border border-green-500 bg-green-500 text-white transition-all';
    if (prefix) prefix.textContent = '%';
  }
  pfiCalcTotal();
}

function pfiCalcTotal() {
  const l = +document.getElementById('pfi-labour')?.value || 0;
  const p = +document.getElementById('pfi-parts')?.value  || 0;
  const subtotal = l + p;
  const discValue = +document.getElementById('pfi-disc-value')?.value || 0;
  const discType  = window._pfiDiscType || 'fixed';

  let discountAmount = 0;
  if (discValue > 0) {
    if (discType === 'percentage') {
      discountAmount = Math.round(subtotal * Math.min(discValue, 100) / 100);
    } else {
      discountAmount = Math.min(Math.round(discValue), subtotal);
    }
  }
  const total = Math.max(0, subtotal - discountAmount);

  // Update display elements
  const tax = Math.round(total * 0.18);
  const grandTotal = total + tax;

  var subEl   = document.getElementById('pfi-subtotal-display');
  var discLine = document.getElementById('pfi-disc-line');
  var discAmt  = document.getElementById('pfi-disc-amount-display');
  var totDisp  = document.getElementById('pfi-total-display');
  var taxDisp  = document.getElementById('pfi-tax-display');
  var grandDisp = document.getElementById('pfi-grand-total-display');
  var preview  = document.getElementById('pfi-disc-preview');
  var hiddenTotal = document.getElementById('pfi-total');

  if (subEl)     subEl.textContent = fmt(subtotal);
  if (totDisp)   totDisp.textContent = fmt(total);
  if (taxDisp)   taxDisp.textContent = fmt(tax);
  if (grandDisp) grandDisp.textContent = fmt(grandTotal);
  if (hiddenTotal) hiddenTotal.value = String(total);

  if (discountAmount > 0) {
    if (discLine)  discLine.style.removeProperty('display');
    if (discAmt)   discAmt.textContent = '− ' + fmt(discountAmount);
    if (preview)   preview.textContent = discType === 'percentage'
      ? 'Saves ' + fmt(discountAmount) + ' (' + discValue + '%)'
      : discValue + '% equivalent';
  } else {
    if (discLine)  discLine.style.setProperty('display','none','important');
    if (discAmt)   discAmt.textContent = '— TZS 0';
    if (preview)   preview.textContent = '';
  }
}

// ── Edit PFI Modal ────────────────────────────────────────────────────────────
// Opens the same form as showPFIModal but pre-fills with existing PFI values
// and PATCHes instead of POSTing on submit.
async function showEditPFIModal(pfiId) {
  // Fetch full PFI detail (pfi + job + parts + services)
  const { data: detail } = await axios.get('/api/pfi/' + pfiId + '/detail');
  const { pfi, job } = detail;
  const parts    = detail.parts    || [];
  const services = detail.services || [];
  const isInsurance = job?.category === 'Insurance';

  const totalPartsCost    = parts.reduce((s, p) => s + p.totalCost, 0);
  const totalServicesCost = services.reduce((s, sv) => s + sv.totalCost, 0);
  const totalBillable     = totalPartsCost + totalServicesCost;

  // ── Services breakdown HTML ──
  let servicesHtml = '';
  if (services.length) {
    const catIcon = cat =>
      cat === 'Service Package' ? 'fa-box-open' :
      cat === 'Oil Service'     ? 'fa-oil-can'  :
      cat === 'Car Wash'        ? 'fa-car'       : 'fa-plus-circle';
    const sRows = services.map(sv =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2">' +
          '<span class="inline-flex items-center gap-1.5">' +
            '<i class="fas ' + catIcon(sv.category) + ' text-xs text-gray-400"></i>' +
            '<span class="font-medium text-gray-700">' + sv.serviceName + '</span>' +
          '</span>' +
          (sv.notes ? '<p class="text-xs text-gray-400 mt-0.5 pl-4">' + sv.notes + '</p>' : '') +
        '</td>' +
        '<td class="px-3 py-2 text-center text-gray-600">' + sv.quantity + '</td>' +
        '<td class="px-3 py-2 text-right text-gray-600">' + fmt(sv.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-gray-800">' + fmt(sv.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    servicesHtml =
      '<div class="mb-3">' +
        '<p class="form-label mb-2">Services <span class="text-gray-400 font-normal text-xs">(from job card)</span></p>' +
        '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-gray-50 border-b border-gray-100">' +
              '<th class="text-left px-3 py-2 font-semibold text-gray-500">Service</th>' +
              '<th class="text-center px-3 py-2 font-semibold text-gray-500">Qty</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Unit</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + sRows + '</tbody>' +
            '<tfoot><tr class="bg-purple-50">' +
              '<td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Services Total:</td>' +
              '<td class="px-3 py-2 text-right font-bold text-purple-700">' + fmt(totalServicesCost) + '</td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  // ── Parts breakdown HTML ──
  let partsHtml = '';
  if (parts.length) {
    const rows = parts.map(p =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2 font-medium text-gray-700">' + p.partName + '</td>' +
        '<td class="px-3 py-2 text-center text-gray-600">' + p.quantity + '</td>' +
        '<td class="px-3 py-2 text-right text-gray-600">' + fmt(p.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-gray-800">' + fmt(p.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    partsHtml =
      '<div class="mb-3">' +
        '<p class="form-label mb-2">Parts Consumed <span class="text-gray-400 font-normal text-xs">(from job card)</span></p>' +
        '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-gray-50 border-b border-gray-100">' +
              '<th class="text-left px-3 py-2 font-semibold text-gray-500">Part</th>' +
              '<th class="text-center px-3 py-2 font-semibold text-gray-500">Qty</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Unit Cost</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr class="bg-blue-50">' +
              '<td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Parts Total:</td>' +
              '<td class="px-3 py-2 text-right font-bold text-blue-700">' + fmt(totalPartsCost) + '</td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  if (!parts.length && !services.length) {
    partsHtml =
      '<div class="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">' +
      '<i class="fas fa-info-circle"></i> No services or parts added yet.' +
      '</div>';
  }

  // Determine existing discount type from stored PFI
  const existingDiscType   = pfi.discountType  || 'fixed';
  const existingDiscValue  = pfi.discountValue  || 0;
  const existingDiscReason = pfi.discountReason || '';
  const existingHasVAT     = (pfi.tax || 0) > 0;

  openModal('modal-statusUpdate');
  setModalWidth('#modal-statusUpdate', 640);
  var _editPrivateBanner = isInsurance ? '' :
    '<div class="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">' +
    '<i class="fas fa-user-circle"></i> Private / Individual job – PFI will go directly to the customer</div>';
  var _editVatBg    = existingHasVAT ? '#f97316' : '#d1d5db';
  var _editVatXform = existingHasVAT ? 'translateX(20px)' : 'translateX(0)';
  var _editNotesPlaceholder = isInsurance ? 'Additional notes for insurer…' : 'Additional notes for customer…';
  document.getElementById('statusUpdateContent').innerHTML =
    '<div class="flex items-center gap-2 mb-3">' +
      '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">' +
        '<i class="fas fa-edit"></i> Editing PFI' +
      '</span>' +
      '<span class="text-xs text-gray-400">' + (job?.jobCardNumber || '') + '</span>' +
    '</div>' +
    _editPrivateBanner +
    servicesHtml +
    partsHtml +
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">' +
      '<div>' +
        '<label class="form-label">Labour Cost (TZS)</label>' +
        '<input class="form-input" type="number" id="pfi-labour" required min="0" value="' + (pfi.labourCost || 0) + '"/>' +
      '</div>' +
      '<div>' +
        '<label class="form-label">Services + Parts Cost (TZS) <span class="text-gray-400 font-normal text-xs">auto-filled</span></label>' +
        '<input class="form-input" type="number" id="pfi-parts" required min="0" value="' + totalBillable + '"/>' +
      '</div>' +
    '</div>' +
    '<div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<label class="text-sm font-semibold text-green-800"><i class="fas fa-tag mr-1.5 text-green-500"></i>Discount <span class="font-normal text-green-600 text-xs">(optional)</span></label>' +
        '<div class="flex items-center gap-1">' +
          '<button type="button" id="pfi-disc-type-fixed" onclick="pfiSetDiscountType(&apos;fixed&apos;)" class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-green-300 bg-white text-green-700 hover:bg-green-100 transition-all">TZS</button>' +
          '<button type="button" id="pfi-disc-type-pct" onclick="pfiSetDiscountType(&apos;percentage&apos;)" class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-transparent bg-transparent text-green-600 hover:bg-green-100 transition-all">%</button>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<div>' +
          '<div class="relative">' +
            '<span id="pfi-disc-prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">TZS</span>' +
            '<input class="form-input pl-11" type="number" id="pfi-disc-value" min="0" placeholder="0" value="' + (existingDiscValue || '') + '" oninput="pfiCalcTotal()"/>' +
          '</div>' +
          '<p class="text-xs text-green-600 mt-1" id="pfi-disc-preview"></p>' +
        '</div>' +
        '<div>' +
          '<input class="form-input" type="text" id="pfi-disc-reason" placeholder="Reason (e.g. Loyal customer)" maxlength="80" value="' + existingDiscReason + '"/>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mb-3 flex items-center justify-between px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">' +
      '<label class="flex items-center gap-2 text-sm font-semibold text-orange-800 cursor-pointer select-none" for="pfi-vat-toggle">' +
        '<i class="fas fa-percent text-orange-500"></i>Apply VAT (18%)' +
        '<span class="text-xs font-normal text-orange-600">(optional)</span>' +
      '</label>' +
      '<button type="button" id="pfi-vat-toggle" role="switch" aria-checked="' + existingHasVAT + '"' +
        ' onclick="pfiToggleVAT()"' +
        ' class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"' +
        ' style="background:' + _editVatBg + '">' +
        '<span class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200" id="pfi-vat-knob" style="transform:' + _editVatXform + '"></span>' +
      '</button>' +
    '</div>' +
    '<div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">' +
      '<div class="space-y-1 text-sm">' +
        '<div class="flex justify-between text-gray-500"><span>Subtotal</span><span id="pfi-subtotal-display" class="font-medium text-gray-700"></span></div>' +
        '<div class="flex justify-between text-green-600" id="pfi-disc-line" style="display:none!important"><span><i class="fas fa-tag mr-1 text-xs"></i>Discount</span><span id="pfi-disc-amount-display" class="font-semibold">— TZS 0</span></div>' +
        '<div class="flex justify-between text-gray-600 border-t border-blue-200 pt-1 mt-1"><span>Total Estimate (before tax)</span><span id="pfi-total-display" class="font-medium text-gray-700"></span></div>' +
        '<div class="flex justify-between text-orange-600" id="pfi-tax-row" style="display:none"><span><i class="fas fa-percent mr-1 text-xs"></i>Tax / VAT (18%)</span><span id="pfi-tax-display" class="font-semibold"></span></div>' +
        '<div class="flex justify-between font-bold text-gray-800 border-t border-blue-200 pt-1 mt-1"><span id="pfi-grand-label">Grand Total</span><span id="pfi-grand-total-display" class="text-blue-700 text-base"></span></div>' +
      '</div>' +
    '</div>' +
    '<input type="hidden" id="pfi-total"/>' +
    '<div class="mb-5">' +
      '<label class="form-label">Notes</label>' +
      '<textarea class="form-input" id="pfi-notes" rows="2" placeholder="' + _editNotesPlaceholder + '">' + (pfi.notes || '') + '</textarea>' +
    '</div>' +
    '<div class="flex gap-3">' +
      '<button class="btn-secondary flex-1" onclick="closeModal(&apos;modal-statusUpdate&apos;)">Cancel</button>' +
      '<button class="btn-primary flex-1" id="pfi-submit"><i class="fas fa-save mr-1"></i> Save Changes</button>' +
    '</div>';

  // Initialise state — pick up existing discount type and VAT setting
  window._pfiDiscType = existingDiscType;
  window._pfiVAT      = existingHasVAT;
  pfiSetDiscountType(existingDiscType);
  // pfiSetDiscountType calls pfiCalcTotal, but we need to ensure VAT row is correct
  pfiCalcTotal();
  document.getElementById('pfi-labour').oninput = pfiCalcTotal;
  document.getElementById('pfi-parts').oninput  = pfiCalcTotal;

  document.getElementById('pfi-submit').onclick = async () => {
    const l = +document.getElementById('pfi-labour').value || 0;
    const p = +document.getElementById('pfi-parts').value  || 0;
    const discType   = window._pfiDiscType;
    const discValue  = +document.getElementById('pfi-disc-value').value || 0;
    const discReason = document.getElementById('pfi-disc-reason').value.trim();
    const subtotal   = l + p;
    let discountAmount = 0;
    if (discType === 'percentage' && discValue > 0) {
      discountAmount = Math.round(subtotal * Math.min(discValue, 100) / 100);
    } else if (discType === 'fixed' && discValue > 0) {
      discountAmount = Math.min(Math.round(discValue), subtotal);
    }
    const totalEstimate = Math.max(0, subtotal - discountAmount);
    const applyVAT      = !!(window._pfiVAT);
    const tax           = applyVAT ? Math.round(totalEstimate * 0.18) : 0;
    const totalAmount   = totalEstimate + tax;

    try {
      await axios.patch('/api/pfi/' + pfiId, {
        labourCost:     l,
        partsCost:      p,
        discountType:   discValue > 0 ? discType : undefined,
        discountValue:  discValue > 0 ? discValue : undefined,
        discountAmount,
        discountReason: discReason || undefined,
        totalEstimate,
        tax,
        totalAmount,
        notes: document.getElementById('pfi-notes').value
      });
      closeModal('modal-statusUpdate');
      // If we're on the job detail page, refresh it
      if (job?.id) viewJobDetail(job.id);
      // If the send modal was open before, refresh it
      if (typeof loadPFIs === 'function') loadPFIs();
      showToast('PFI updated successfully', 'success');
    } catch(err) {
      showToast('Could not save PFI changes', 'error');
    }
  };
}

// Invoice Modal
async function showInvoiceModal(jobId, labourCost, partsCost, pfiDiscount) {
  // Fetch full job to get parts + services
  const { data: job } = await axios.get('/api/jobcards/' + jobId);
  const parts    = job.parts    || [];
  const services = job.services || [];
  const actualPartsCost    = parts.reduce((s, p) => s + p.totalCost, 0);
  const actualServicesCost = services.reduce((s, sv) => s + sv.totalCost, 0);
  // Total billable = services + parts (use passed-in partsCost as fallback if nothing recorded yet)
  const totalBillable = (actualPartsCost + actualServicesCost) || partsCost;
  // Discount carried from PFI (if any)
  const disc = pfiDiscount || {};
  const discountAmount = disc.discountAmount || 0;
  const subtotal = labourCost + totalBillable;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(afterDiscount * 0.18);

  // Build services HTML
  let servicesHtml = '';
  if (services.length) {
    const catIcon = cat =>
      cat === 'Service Package' ? 'fa-box-open' :
      cat === 'Oil Service'     ? 'fa-oil-can'  :
      cat === 'Car Wash'        ? 'fa-car'       : 'fa-plus-circle';
    const rows = services.map(sv =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2"><span class="inline-flex items-center gap-1"><i class="fas ' + catIcon(sv.category) + ' text-xs text-gray-400"></i><span class="font-medium text-gray-700">' + sv.serviceName + '</span></span></td>' +
        '<td class="px-3 py-2 text-center">' + sv.quantity + '</td>' +
        '<td class="px-3 py-2 text-right">' + fmt(sv.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold">' + fmt(sv.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    servicesHtml =
      '<div class="mb-3"><p class="form-label mb-2">Services</p>' +
      '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
      '<table class="w-full text-xs"><thead><tr class="bg-gray-50 border-b">' +
        '<th class="text-left px-3 py-2 text-gray-500">Service</th>' +
        '<th class="text-center px-3 py-2 text-gray-500">Qty</th>' +
        '<th class="text-right px-3 py-2 text-gray-500">Unit</th>' +
        '<th class="text-right px-3 py-2 text-gray-500">Total</th>' +
      '</tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr class="bg-purple-50"><td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Services Total:</td>' +
      '<td class="px-3 py-2 text-right font-bold text-purple-700">' + fmt(actualServicesCost) + '</td></tr></tfoot>' +
      '</table></div></div>';
  }

  // Build parts breakdown HTML (string concat to avoid nested backtick issues)
  let partsHtml = '';
  if (parts.length) {
    const rows = parts.map(p =>
      '<tr class="border-b border-gray-50 last:border-0">' +
        '<td class="px-3 py-2 font-medium text-gray-700">' + p.partName + '</td>' +
        '<td class="px-3 py-2 text-center text-gray-600">' + p.quantity + '</td>' +
        '<td class="px-3 py-2 text-right text-gray-600">' + fmt(p.unitCost) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-gray-800">' + fmt(p.totalCost) + '</td>' +
      '</tr>'
    ).join('');
    partsHtml =
      '<div class="mb-4">' +
        '<p class="form-label mb-2">Parts Consumed</p>' +
        '<div class="border border-gray-200 rounded-xl overflow-hidden">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-gray-50 border-b border-gray-100">' +
              '<th class="text-left px-3 py-2 font-semibold text-gray-500">Part</th>' +
              '<th class="text-center px-3 py-2 font-semibold text-gray-500">Qty</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Unit Cost</th>' +
              '<th class="text-right px-3 py-2 font-semibold text-gray-500">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr class="bg-green-50">' +
              '<td colspan="3" class="px-3 py-2 text-right font-bold text-gray-600 text-xs">Total Parts Cost:</td>' +
              '<td class="px-3 py-2 text-right font-bold text-green-700">' + fmt(actualPartsCost) + '</td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  // Discount row HTML (carried from PFI if present)
  const discountRowHtml = discountAmount > 0
    ? '<div class="mb-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between text-sm">' +
        '<span class="flex items-center gap-1.5 text-green-700 font-semibold"><i class="fas fa-tag text-green-500 text-xs"></i>Discount' +
          (disc.discountReason ? ' <span class="font-normal text-green-600 text-xs">(' + disc.discountReason + ')</span>' : '') +
        '</span>' +
        '<span class="font-bold text-green-700">− ' + fmt(discountAmount) + '</span>' +
      '</div>'
    : '';

  openModal('modal-statusUpdate');
  setModalWidth('#modal-statusUpdate', (services.length || parts.length) ? 620 : 480);
  document.getElementById('statusUpdateContent').innerHTML = \`
    <p class="text-sm text-gray-500 mb-4">Generate final invoice for this job</p>
    \${servicesHtml}
    \${partsHtml}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
      <div><label class="form-label">Labour Cost (TZS)</label><input class="form-input" type="number" id="inv-labour" value="\${labourCost}"/></div>
      <div><label class="form-label">Services + Parts (TZS) <span class="text-gray-400 font-normal text-xs">auto-filled</span></label><input class="form-input" type="number" id="inv-parts" value="\${totalBillable}"/></div>
    </div>
    \${discountRowHtml}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      <div><label class="form-label">Tax (18%) (TZS)</label><input class="form-input" type="number" id="inv-tax" value="\${tax}"/></div>
      <div><label class="form-label">Status</label><select class="form-input" id="inv-status"><option>Issued</option><option>Paid</option></select></div>
    </div>
    <div class="flex gap-3">
      <button class="btn-secondary flex-1" onclick="closeModal('modal-statusUpdate')">Cancel</button>
      <button class="btn-primary flex-1" id="inv-submit"><i class="fas fa-receipt mr-1"></i> Generate Invoice</button>
    </div>
  \`;

  // Auto-recalculate tax based on (labour + parts − discount) * 18%
  const recalcTax = () => {
    const l = +document.getElementById('inv-labour').value || 0;
    const p = +document.getElementById('inv-parts').value || 0;
    document.getElementById('inv-tax').value = Math.round(Math.max(0, l + p - discountAmount) * 0.18);
  };
  document.getElementById('inv-labour').oninput = recalcTax;
  document.getElementById('inv-parts').oninput = recalcTax;

  document.getElementById('inv-submit').onclick = async () => {
    const l = +document.getElementById('inv-labour').value || 0;
    const p = +document.getElementById('inv-parts').value || 0;
    const t = +document.getElementById('inv-tax').value || 0;
    const total = Math.max(0, l + p - discountAmount) + t;
    await axios.post('/api/jobcards/' + jobId + '/invoice', {
      labourCost: l, partsCost: p,
      discountType:   disc.discountType,
      discountValue:  disc.discountValue,
      discountAmount: discountAmount,
      discountReason: disc.discountReason,
      tax: t,
      totalAmount: total,
      status: document.getElementById('inv-status').value
    });
    closeModal('modal-statusUpdate');
    viewJobDetail(jobId);
    showToast('Invoice generated successfully' + (discountAmount > 0 ? ' (discount: ' + fmt(discountAmount) + ')' : ''));
    syncFinance();
  };
}

// ═══════════════════════════════════════════════════════════════════
// ADD SERVICE / PART MODAL  (5 tabs: Packages | Oil | Car Wash | Add-ons | Parts)
// ═══════════════════════════════════════════════════════════════════

let _svcTab = 'packages'; // active tab
let _svcJobId = null;
let _allServicePackagesCache = [];
let _allOilProductsCache = [];
let _allCarWashCache = [];
let _allAddOnsCache = [];
let _allLubricantsForSvc = [];

async function showAddServiceModal(jobId) {
  _svcJobId = jobId;
  _svcTab = 'packages';
  openModal('modal-statusUpdate');
  setModalWidth('#modal-statusUpdate', 680);
  // Load all catalogues in parallel (cache after first load)
  if (!_allServicePackagesCache.length) {
    const [pkgs, oil, cw, ao, lub] = await Promise.all([
      axios.get('/api/packages'),
      axios.get('/api/catalogue/oil'),
      axios.get('/api/catalogue/carwash'),
      axios.get('/api/catalogue/addons'),
      axios.get('/api/catalogue/lubricants'),
    ]);
    _allServicePackagesCache = pkgs.data;
    _allOilProductsCache     = oil.data;
    _allCarWashCache         = cw.data;
    _allAddOnsCache          = ao.data;
    _allLubricantsForSvc     = lub.data;
  }
  _renderAddServiceModal();
}

function _renderAddServiceModal() {
  const tabs = [
    { id: 'packages', label: 'Service Packages', icon: 'fa-box-open',     color: 'purple' },
    { id: 'oil',      label: 'Oil Service',       icon: 'fa-oil-can',      color: 'amber'  },
    { id: 'carwash',  label: 'Car Wash',           icon: 'fa-car',          color: 'cyan'   },
    { id: 'addons',   label: 'Add-ons',            icon: 'fa-plus-circle',  color: 'green'  },
    { id: 'parts',    label: 'Parts',              icon: 'fa-cogs',         color: 'blue'   },
  ];

  const tabBar = tabs.map(t => {
    const active = _svcTab === t.id;
    return '<button data-svc-tab="' + t.id + '" class="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold transition-all ' +
      (active ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200') + '">' +
      '<i class="fas ' + t.icon + ' text-sm"></i><span class="svc-tab-label">' + t.label + '</span></button>';
  }).join('');

  document.getElementById('statusUpdateContent').innerHTML =
    '<p class="text-sm text-gray-500 mb-3">Choose a category to add services or parts to this job card</p>' +
    '<div class="svc-tab-bar flex gap-1.5 mb-4">' + tabBar + '</div>' +
    '<div id="svc-tab-content" class="min-h-[260px]"></div>';

  // Wire up tab buttons via data attribute (avoids quoting issues in onclick)
  document.querySelectorAll('#statusUpdateContent [data-svc-tab]').forEach(btn => {
    btn.addEventListener('click', () => _switchSvcTab(btn.dataset.svcTab));
  });

  _renderSvcTabContent();
}

function _switchSvcTab(tab) {
  _svcTab = tab;
  // update tab bar button styles
  const tabs = ['packages','oil','carwash','addons','parts'];
  const btns = document.querySelectorAll('#statusUpdateContent .svc-tab-bar button');
  btns.forEach((btn, i) => {
    btn.className = 'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold transition-all ' +
      (tabs[i] === tab ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200');
  });
  _renderSvcTabContent();
}

function _renderSvcTabContent() {
  const el = document.getElementById('svc-tab-content');
  if (!el) return;
  if (_svcTab === 'packages')  _renderPackagesTab(el);
  else if (_svcTab === 'oil')  _renderOilTab(el);
  else if (_svcTab === 'carwash') _renderCarWashTab(el);
  else if (_svcTab === 'addons') _renderAddOnsTab(el);
  else if (_svcTab === 'parts') _renderPartsTab(el);
}

// ── Tab: Service Packages ──────────────────────────────────────────
function _renderPackagesTab(el) {
  const pkgs = _allServicePackagesCache;
  let html = '<div class="space-y-3">';
  pkgs.forEach(pkg => {
    const partsTotal = pkg.parts ? pkg.parts.reduce((s, p) => s + p.unitCost * p.quantity, 0) : 0;
    const total = (pkg.labourCost || 0) + partsTotal;
    html += '<div class="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer" data-pkg-id="' + pkg.id + '">' +
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<i class="fas fa-box-open text-purple-500 text-sm"></i>' +
            '<p class="font-semibold text-gray-800 text-sm">' + pkg.packageName + '</p>' +
          '</div>' +
          '<p class="text-xs text-gray-500 mb-2">' + (pkg.description || '') + '</p>' +
          (pkg.parts && pkg.parts.length ? '<div class="flex flex-wrap gap-1">' + pkg.parts.map(p => '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + p.name + ' ×' + p.quantity + '</span>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="text-right flex-shrink-0">' +
          '<p class="font-bold text-gray-900 text-sm">' + fmt(total) + '</p>' +
          '<p class="text-xs text-gray-400">' + (pkg.estimatedHours || 0) + 'h est.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
  // Wire up package clicks via data attribute
  el.querySelectorAll('[data-pkg-id]').forEach(div => {
    div.addEventListener('click', () => _selectPackage(div.dataset.pkgId));
  });
}

async function _selectPackage(pkgId) {
  const pkg = _allServicePackagesCache.find(p => p.id === pkgId);
  if (!pkg) return;
  const partsTotal = pkg.parts ? pkg.parts.reduce((s, p) => s + p.unitCost * p.quantity, 0) : 0;
  const total = (pkg.labourCost || 0) + partsTotal;
  await axios.post('/api/jobcards/' + _svcJobId + '/services', {
    category: 'Service Package', serviceId: pkg.id, serviceName: pkg.packageName,
    description: pkg.description, quantity: 1, unitCost: total, totalCost: total,
    notes: 'Labour: ' + fmt(pkg.labourCost) + (partsTotal ? ' + Parts: ' + fmt(partsTotal) : '')
  });
  closeModal('modal-statusUpdate');
  viewJobDetail(_svcJobId);
  showToast('\u2714 ' + pkg.packageName + ' added to job');
}

// ── Tab: Oil Service (Lubricants Catalogue) ───────────────────────
let _oilSvcTypeFilter = 'Engine Oil';

function _renderOilTab(el) {
  const lubTypes = ['Engine Oil', 'Transmission Fluid', 'Gear Oil', 'Brake Fluid', 'Power Steering Fluid', 'Coolant'];
  const typeBtns = lubTypes.map(t =>
    '<button data-oil-type="' + t + '" class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ' +
    (t === _oilSvcTypeFilter ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200') + '">' + t + '</button>'
  ).join('');

  const filtered = _allLubricantsForSvc.filter(l => l.lubricantType === _oilSvcTypeFilter && l.stockQuantity > 0);
  const allFiltered = _allLubricantsForSvc.filter(l => l.lubricantType === _oilSvcTypeFilter);
  const outOfStock  = _allLubricantsForSvc.filter(l => l.lubricantType === _oilSvcTypeFilter && l.stockQuantity === 0);

  let rows = '';
  filtered.forEach(l => {
    const hasInterval = l.mileageInterval && l.lubricantType !== 'Brake Fluid' && l.lubricantType !== 'Power Steering Fluid' && l.lubricantType !== 'Coolant';
    rows += '<div data-lub-id="' + l.id + '" class="lub-svc-row border border-gray-200 rounded-xl p-3 hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer">' +
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background:#fef3c7;color:#92400e">' + l.brand + '</span>' +
            '<p class="text-sm font-semibold text-gray-800 truncate">' + l.description + '</p>' +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs text-gray-500">' +
            '<span><i class="fas fa-vials mr-1"></i>' + (l.viscosity || '—') + '</span>' +
            '<span><i class="fas fa-box mr-1"></i>' + (l.volume || '—') + '</span>' +
            (hasInterval ? '<span class="text-blue-600 font-semibold"><i class="fas fa-tachometer-alt mr-1"></i>Every ' + l.mileageInterval.toLocaleString() + ' km</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="text-right flex-shrink-0">' +
          '<p class="font-bold text-gray-900 text-sm">' + fmt(l.sellingPrice) + '</p>' +
          '<p class="text-xs text-green-600">In Stock: ' + l.stockQuantity + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  if (outOfStock.length && !filtered.length) {
    rows = '<p class="text-center text-gray-400 text-sm py-6"><i class="fas fa-exclamation-triangle text-amber-400 text-xl mb-2 block"></i>All ' + _oilSvcTypeFilter + ' items are out of stock</p>';
  } else if (!allFiltered.length) {
    rows = '<p class="text-center text-gray-400 text-sm py-6"><i class="fas fa-box-open text-2xl mb-2 block"></i>No ' + _oilSvcTypeFilter + ' items in catalogue</p>';
  }

  el.innerHTML =
    '<div class="flex gap-1.5 flex-wrap mb-3">' + typeBtns + '</div>' +
    '<div class="space-y-2 max-h-64 overflow-y-auto pr-1">' + rows + '</div>';

  // Wire type filter buttons
  el.querySelectorAll('[data-oil-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      _oilSvcTypeFilter = btn.dataset.oilType;
      _renderOilTab(document.getElementById('svc-tab-content'));
    });
  });

  // Wire lubricant row clicks
  el.querySelectorAll('.lub-svc-row').forEach(row => {
    row.addEventListener('click', () => _addLubricantService(row.dataset.lubId));
  });
}

async function _addLubricantService(lubId) {
  const lub = _allLubricantsForSvc.find(l => l.id === lubId);
  if (!lub) return;
  const hasInterval = !!(lub.mileageInterval);
  await axios.post('/api/jobcards/' + _svcJobId + '/services', {
    category: 'Oil Service',
    serviceId: lub.id,
    lubricantId: lub.id,
    serviceName: lub.description,
    description: lub.lubricantType + (lub.viscosity ? ' · ' + lub.viscosity : '') + (lub.volume ? ' · ' + lub.volume : ''),
    quantity: 1,
    unitCost: lub.sellingPrice,
    totalCost: lub.sellingPrice,
    notes: lub.brand + (lub.viscosity ? ' · ' + lub.viscosity : '') + (hasInterval ? ' · ' + lub.mileageInterval.toLocaleString() + ' km interval' : '')
  });
  // Also deduct stock
  try { await axios.patch('/api/catalogue/lubricants/' + lub.id + '/deduct', { quantity: 1 }); } catch(e) {}
  // Invalidate cache so next open reflects updated stock
  _allLubricantsForSvc = [];
  _allServicePackagesCache = [];
  closeModal('modal-statusUpdate');
  viewJobDetail(_svcJobId);
  showToast('\u2714 ' + lub.description + ' added' + (hasInterval ? ' — next service in ' + lub.mileageInterval.toLocaleString() + ' km' : ''));
}

// ── Tab: Car Wash ──────────────────────────────────────────────────
function _renderCarWashTab(el) {
  const typeLabels = { Standard: 'Standard Wash', AddOn: 'Add-On', DeepClean: 'Deep Clean', Monthly: 'Monthly Package' };
  const typeColors = { Standard: 'cyan', AddOn: 'blue', DeepClean: 'indigo', Monthly: 'violet' };
  const groups = {};
  _allCarWashCache.forEach(p => { (groups[p.type] = groups[p.type] || []).push(p); });
  let html = '<div class="space-y-4 max-h-64 overflow-y-auto pr-1">';
  Object.entries(groups).forEach(([type, pkgs]) => {
    const col = typeColors[type] || 'gray';
    html += '<div><p class="text-xs font-semibold text-gray-400 uppercase mb-2">' + (typeLabels[type] || type) + '</p>' +
      '<div class="carwash-inner-grid">';
    pkgs.forEach(p => {
      html += '<div class="border border-gray-200 rounded-xl p-3 hover:border-' + col + '-400 hover:bg-' + col + '-50 transition-colors cursor-pointer" data-carwash-id="' + p.id + '">' +
        '<p class="text-sm font-semibold text-gray-800 mb-1">' + p.name + '</p>' +
        (p.includes ? '<p class="text-xs text-gray-500 mb-2">' + p.includes.join(' · ') + '</p>' : '') +
        (p.vehicleCount ? '<p class="text-xs text-gray-500 mb-2">' + p.vehicleCount + ' vehicles</p>' : '') +
        '<p class="font-bold text-gray-900 text-sm">' + (p.price ? fmt(p.price) : 'POA') + '</p>' +
      '</div>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
  // Wire up car wash clicks via data attribute
  el.querySelectorAll('[data-carwash-id]').forEach(div => {
    div.addEventListener('click', () => _addCarWash(div.dataset.carwashId));
  });
}

async function _addCarWash(pkgId) {
  const pkg = _allCarWashCache.find(p => p.id === pkgId);
  if (!pkg) return;
  const price = pkg.price || 0;
  await axios.post('/api/jobcards/' + _svcJobId + '/services', {
    category: 'Car Wash',
    serviceId: pkg.id, serviceName: pkg.name,
    description: pkg.description, quantity: 1, unitCost: price, totalCost: price,
    notes: pkg.type + (pkg.includes ? ' · ' + pkg.includes.join(', ') : '')
  });
  closeModal('modal-statusUpdate');
  viewJobDetail(_svcJobId);
  showToast('\u2714 ' + pkg.name + ' added');
}

// ── Tab: Add-on Services ───────────────────────────────────────────
function _renderAddOnsTab(el) {
  const catColors = { Diagnostic: 'blue', Inspection: 'green', Tyres: 'amber', Alignment: 'indigo' };
  const catIcons  = { Diagnostic: 'fa-stethoscope', Inspection: 'fa-search', Tyres: 'fa-circle', Alignment: 'fa-crosshairs' };
  const groups = {};
  _allAddOnsCache.forEach(s => { (groups[s.category] = groups[s.category] || []).push(s); });
  let html = '<div class="space-y-4 max-h-64 overflow-y-auto pr-1">';
  Object.entries(groups).forEach(([cat, svcs]) => {
    const col = catColors[cat] || 'gray';
    const ico = catIcons[cat] || 'fa-plus';
    html += '<div><p class="text-xs font-semibold text-gray-400 uppercase mb-2"><i class="fas ' + ico + ' mr-1"></i>' + cat + '</p>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">';
    svcs.forEach(s => {
      const isPerUnit = s.unit !== 'Per Job';
      html += '<div class="border border-gray-200 rounded-xl p-3 hover:border-' + col + '-400 hover:bg-' + col + '-50 transition-colors">' +
        '<div class="flex items-start justify-between gap-2">' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-sm font-semibold text-gray-800">' + s.name + '</p>' +
            '<p class="text-xs text-gray-500 mt-0.5">' + s.description + '</p>' +
          '</div>' +
          '<div class="text-right flex-shrink-0">' +
            '<p class="font-bold text-gray-900 text-sm">' + fmt(s.price) + '</p>' +
            '<p class="text-xs text-gray-400">' + s.unit + '</p>' +
          '</div>' +
        '</div>' +
        (isPerUnit
          ? '<div class="flex items-center gap-2 mt-2">' +
              '<label class="text-xs text-gray-500">Qty:</label>' +
              '<input type="number" min="1" value="1" id="addon-qty-' + s.id + '" class="form-input py-1 text-xs w-16"/>' +
              '<button data-addon-id="' + s.id + '" data-addon-qty="per-unit" class="btn-primary text-xs flex-1 py-1.5">Add</button>' +
            '</div>'
          : '<button data-addon-id="' + s.id + '" data-addon-qty="1" class="btn-primary text-xs w-full mt-2 py-1.5">Add to Job</button>'
        ) +
      '</div>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
  // Wire up add-on buttons via data attributes
  el.querySelectorAll('[data-addon-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.addonId;
      if (btn.dataset.addonQty === 'per-unit') {
        _addAddonWithQty(sid);
      } else {
        _addAddon(sid, 1);
      }
    });
  });
}

async function _addAddonWithQty(svcId) {
  const qtyEl = document.getElementById('addon-qty-' + svcId);
  const qty = qtyEl ? (+qtyEl.value || 1) : 1;
  await _addAddon(svcId, qty);
}

async function _addAddon(svcId, qty) {
  const svc = _allAddOnsCache.find(s => s.id === svcId);
  if (!svc) return;
  const total = svc.price * qty;
  await axios.post('/api/jobcards/' + _svcJobId + '/services', {
    category: 'Add-on',
    serviceId: svc.id, serviceName: svc.name,
    description: svc.description, quantity: qty, unitCost: svc.price, totalCost: total,
    notes: svc.unit + (qty > 1 ? ' ×' + qty : '')
  });
  closeModal('modal-statusUpdate');
  viewJobDetail(_svcJobId);
  showToast('\u2714 ' + svc.name + (qty > 1 ? ' ×' + qty : '') + ' added');
}

// ── Tab: Parts (catalogue search – reuses existing logic) ──────────
function _renderPartsTab(el) {
  el.innerHTML =
    '<p class="text-sm text-gray-500 mb-3">Search the parts catalogue or enter a custom part manually</p>' +
    '<div class="relative mb-2">' +
      '<i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>' +
      '<input class="form-input pl-8" id="catSearch2" placeholder="Search by name or compatible model\u2026" autocomplete="off"/>' +
    '</div>' +
    '<div id="catResults2" class="hidden mb-3 border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-sm"></div>' +
    '<div id="catSelected2" class="hidden mb-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm">' +
      '<div class="flex items-start justify-between gap-2">' +
        '<div><p class="font-semibold text-blue-900 text-sm" id="catSel2-name"></p><p class="text-xs text-blue-600 mt-0.5" id="catSel2-meta"></p></div>' +
        '<button class="text-blue-400 hover:text-blue-600 text-xs" onclick="_clearCatSel2()"><i class="fas fa-times"></i></button>' +
      '</div>' +
    '</div>' +
    '<div class="mb-3"><label class="form-label">Part Name</label>' +
      '<input class="form-input" id="part2-name" required placeholder="e.g. Front Bumper Assembly"/>' +
    '</div>' +
    '<div class="grid grid-cols-3 gap-3 mb-4">' +
      '<div><label class="form-label">Qty</label><input class="form-input" type="number" id="part2-qty" min="1" value="1"/></div>' +
      '<div><label class="form-label">Unit Cost (TZS)</label><input class="form-input" type="number" id="part2-unit" min="0"/></div>' +
      '<div><label class="form-label">Total</label><input class="form-input" id="part2-total" readonly placeholder="Auto"/></div>' +
    '</div>' +
    '<div class="flex gap-3">' +
      '<button class="btn-secondary flex-1" data-close-modal="modal-statusUpdate">Cancel</button>' +
      '<button class="btn-primary flex-1" id="part2-submit"><i class="fas fa-plus mr-1"></i>Add Part</button>' +
    '</div>';

  // Wire up cancel button
  document.querySelector('#svc-tab-content [data-close-modal]')?.addEventListener('click', function() {
    closeModal(this.dataset.closeModal);
  });

  // Wire up calc
  let _sel2 = null;
  const recalc = () => {
    const q = +document.getElementById('part2-qty').value || 0;
    const u = +document.getElementById('part2-unit').value || 0;
    document.getElementById('part2-total').value = fmt(q * u);
  };
  document.getElementById('part2-qty').addEventListener('input', recalc);
  document.getElementById('part2-unit').addEventListener('input', recalc);

  // Catalogue search
  if (!_catalogueCache.length) {
    axios.get('/api/catalogue/parts').then(r => { _catalogueCache = r.data; }).catch(() => {});
  }
  let _timer2;
  document.getElementById('catSearch2').addEventListener('input', function() {
    clearTimeout(_timer2);
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById('catResults2').classList.add('hidden'); return; }
    _timer2 = setTimeout(() => {
      const ql = q.toLowerCase();
      const results = _catalogueCache.filter(p =>
        p.description.toLowerCase().includes(ql) || p.compatibleModels.toLowerCase().includes(ql)
      ).slice(0, 6);
      const el2 = document.getElementById('catResults2');
      if (!results.length) { el2.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400 text-center">No results</div>'; el2.classList.remove('hidden'); return; }
      el2.innerHTML = results.map(p => {
        const stock = p.stockQuantity || 0;
        const sc = stock === 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-500' : 'text-green-600';
        return '<div class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0" data-sel2-id="' + p.id + '">' +
          '<div class="flex items-start justify-between gap-2">' +
            '<div class="flex-1 min-w-0"><p class="text-sm font-semibold truncate">' + p.description + '</p>' +
            '<p class="text-xs text-gray-400">' + p.compatibleModels.split(',').slice(0,3).join(', ') + '</p></div>' +
            '<div class="text-right"><p class="font-bold text-sm">' + fmt(p.sellingPrice) + '</p>' +
            '<p class="text-xs ' + sc + '">' + stock + ' in stock</p></div>' +
          '</div></div>';
      }).join('');
      el2.querySelectorAll('[data-sel2-id]').forEach(div => {
        div.addEventListener('click', () => _sel2Part(div.dataset.sel2Id));
      });
      el2.classList.remove('hidden');
    }, 200);
  });

  window._sel2Part = function(partId) {
    const p = _catalogueCache.find(x => x.id === partId);
    if (!p) return;
    _sel2 = p;
    document.getElementById('part2-name').value = p.description;
    document.getElementById('part2-unit').value = p.sellingPrice;
    document.getElementById('catResults2').classList.add('hidden');
    document.getElementById('catSearch2').value = '';
    const banner = document.getElementById('catSelected2');
    banner.classList.remove('hidden');
    document.getElementById('catSel2-name').textContent = p.description;
    document.getElementById('catSel2-meta').textContent = p.category + ' · ' + p.compatibleModels.split(',').slice(0,2).join(', ');
    document.getElementById('part2-qty').dispatchEvent(new Event('input'));
  };
  window._clearCatSel2 = function() {
    _sel2 = null;
    document.getElementById('catSelected2').classList.add('hidden');
    document.getElementById('part2-name').value = '';
    document.getElementById('part2-unit').value = '';
    document.getElementById('part2-total').value = '';
  };

  document.getElementById('part2-submit').addEventListener('click', async () => {
    const qty  = +document.getElementById('part2-qty').value;
    const unit = +document.getElementById('part2-unit').value;
    const name = document.getElementById('part2-name').value.trim();
    if (!name || !qty || !unit) { showToast('Please fill all fields', 'error'); return; }
    if (_sel2 && qty > (_sel2.stockQuantity || 0)) { showToast('Only ' + (_sel2.stockQuantity || 0) + ' in stock', 'error'); return; }
    const btn = document.getElementById('part2-submit');
    btn.disabled = true; btn.textContent = 'Adding\u2026';
    try {
      await axios.post('/api/jobcards/' + _svcJobId + '/parts', {
        partName: name, quantity: qty, unitCost: unit, totalCost: qty * unit,
        ...(_sel2 ? { partId: _sel2.id } : {})
      });
      if (_sel2) {
        await axios.patch('/api/catalogue/parts/' + _sel2.id + '/deduct', { quantity: qty });
        const ci = _catalogueCache.findIndex(p => p.id === _sel2.id);
        if (ci !== -1) _catalogueCache[ci] = { ..._catalogueCache[ci], stockQuantity: (_catalogueCache[ci].stockQuantity || 0) - qty };
      }
      closeModal('modal-statusUpdate');
      viewJobDetail(_svcJobId);
      showToast('\u2714 Part added');
    } catch(err) {
      showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
      btn.disabled = false; btn.textContent = 'Add Part';
    }
  });
}

// ── Remove a service from a job ────────────────────────────────────
async function removeJobService(jobId, serviceId) {
  if (!confirm('Remove this service from the job?')) return;
  await axios.delete('/api/services/' + serviceId);
  viewJobDetail(jobId);
  showToast('Service removed');
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

// ── Reopen Job Card ──────────────────────────────────────────────────────────
let _reopenJobId = null;

function showReopenModal(jobId) {
  _reopenJobId = jobId;
  document.getElementById('reopenReasonInput').value = '';
  document.getElementById('reopenReasonError').style.display = 'none';
  openModal('modal-reopenJob');
}

// ═══════════════════════════════════════════════════════════════════
// DIGITAL SERVICE CARD
// ═══════════════════════════════════════════════════════════════════
let _svcCardData = null;   // cached detail bundle for current modal session

async function showServiceCardModal(jobId) {
  _svcCardData = null;
  document.getElementById('svcCard-subtitle').textContent = 'Loading job details…';
  openModal('modal-serviceCard');

  const { data } = await axios.get('/api/jobcards/' + jobId + '/service-card');
  _svcCardData = data;
  const { job, customer, vehicle, parts, services } = data;

  // Subtitle
  document.getElementById('svcCard-subtitle').textContent =
    (job.jobCardNumber || '—') + ' · ' + (customer?.name || '—') + ' · ' + (vehicle?.registrationNumber || '—');

  // Header
  document.getElementById('svcCard-jobNum').textContent = job.jobCardNumber || '—';
  document.getElementById('svcCard-date').textContent = fmtDate(job.updatedAt || job.createdAt);

  // Customer
  document.getElementById('svcCard-custName').textContent  = customer?.name  || '—';
  document.getElementById('svcCard-custPhone').textContent = customer?.phone || '—';

  // Vehicle
  document.getElementById('svcCard-vehReg').textContent  = vehicle?.registrationNumber || '—';
  document.getElementById('svcCard-vehInfo').textContent = [vehicle?.make, vehicle?.model, vehicle?.year].filter(Boolean).join(' ');

  // Technician
  document.getElementById('svcCard-tech').textContent = job.assignedTechnician || '—';

  // Mileage & Fuel
  document.getElementById('svcCard-mileageIn').textContent =
    job.mileageIn ? job.mileageIn.toLocaleString() + ' km' : '—';
  const fuelColors = {'Empty':'text-red-600','1/4':'text-orange-600','1/2':'text-amber-600','3/4':'text-green-600','Full':'text-emerald-600'};
  const fuelEl = document.getElementById('svcCard-fuel');
  fuelEl.textContent = job.fuelLevel || '—';
  fuelEl.className = 'font-semibold text-xs ' + (fuelColors[job.fuelLevel] || 'text-gray-600');

  // Pre-fill mileage out if already set
  const moInput = document.getElementById('svcCard-mileageOut');
  moInput.value = job.mileageOut || (job.mileageIn || '');

  // Wire mileage-out input to live-update the preview
  moInput.oninput = () => {
    const val = +moInput.value || 0;
    const row = document.getElementById('svcCard-mileageOutRow');
    const valEl = document.getElementById('svcCard-mileageOutVal');
    if (val > 0) {
      row.style.removeProperty('display');
      valEl.textContent = val.toLocaleString() + ' km';
    } else {
      row.style.setProperty('display','none','important');
    }
  };
  moInput.oninput(); // trigger once with existing value

  // Next service
  const nextBox = document.getElementById('svcCard-nextSvcBox');
  if (job.nextServiceMileage) {
    document.getElementById('svcCard-nextSvcKm').textContent = job.nextServiceMileage.toLocaleString() + ' km';
    document.getElementById('svcCard-nextSvcLub').textContent = job.nextServiceLubricant || 'Next oil service';
    nextBox.style.removeProperty('display');
  } else {
    nextBox.style.setProperty('display','none','important');
  }

  // Work done
  const workItems = [
    ...services.map(sv => '<div class="flex items-center gap-2"><i class="fas fa-wrench text-blue-400 flex-shrink-0"></i><span>' + sv.serviceName + (sv.quantity > 1 ? ' ×' + sv.quantity : '') + '</span></div>'),
    ...parts.map(p  => '<div class="flex items-center gap-2"><i class="fas fa-cog text-gray-400 flex-shrink-0"></i><span>' + p.partName + ' ×' + p.quantity + '</span></div>')
  ];
  document.getElementById('svcCard-workDone').innerHTML =
    workItems.length ? workItems.join('') : '<p class="text-gray-400 italic">No services/parts recorded</p>';
}

function _buildServiceCardText(mileageOut) {
  if (!_svcCardData) return '';
  const { job, customer, vehicle, parts, services } = _svcCardData;
  const NL = String.fromCharCode(10), LINE = '\u2500'.repeat(48);
  let t = '';
  t += '   AUTOFIX GMS — DIGITAL SERVICE CARD' + NL;
  t += LINE + NL;
  t += 'Job Card:   ' + (job.jobCardNumber || '—') + NL;
  t += 'Date:       ' + fmtDate(job.updatedAt || job.createdAt) + NL;
  t += LINE + NL;
  t += 'Customer:   ' + (customer?.name  || '—') + NL;
  t += 'Phone:      ' + (customer?.phone || '—') + NL;
  t += 'Vehicle:    ' + (vehicle?.registrationNumber || '—') + ' ' + [vehicle?.make, vehicle?.model, vehicle?.year].filter(Boolean).join(' ') + NL;
  t += 'Technician: ' + (job.assignedTechnician || '—') + NL;
  t += LINE + NL;
  t += 'Mileage In:  ' + (job.mileageIn ? job.mileageIn.toLocaleString() + ' km' : '—') + NL;
  if (mileageOut > 0) t += 'Mileage Out: ' + mileageOut.toLocaleString() + ' km' + NL;
  t += 'Fuel Level:  ' + (job.fuelLevel || '—') + NL;
  t += LINE + NL;
  if (services.length) {
    t += 'SERVICES PERFORMED:' + NL;
    services.forEach((sv,i) => { t += '  ' + (i+1) + '. ' + sv.serviceName + (sv.quantity>1?' ×'+sv.quantity:'') + NL; });
  }
  if (parts.length) {
    t += 'PARTS REPLACED:' + NL;
    parts.forEach((p,i) => { t += '  ' + (i+1) + '. ' + p.partName + ' ×' + p.quantity + NL; });
  }
  if (job.nextServiceMileage) {
    t += LINE + NL;
    t += '🔔 NEXT SERVICE DUE AT: ' + job.nextServiceMileage.toLocaleString() + ' km' + NL;
    if (job.nextServiceLubricant) t += '   (' + job.nextServiceLubricant + ')' + NL;
  }
  t += LINE + NL;
  t += 'Thank you for choosing AutoFix GMS!' + NL;
  t += 'Tel: +255 700 000 000 | info@autofixgms.co.tz' + NL;
  return t;
}

function downloadServiceCardPDF() {
  if (!_svcCardData) return;
  const { jsPDF } = window.jspdf;
  const { job, customer, vehicle, parts, services } = _svcCardData;
  const mileageOut = +document.getElementById('svcCard-mileageOut').value || 0;

  // A5 landscape
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
  const pageW = 210, pageH = 148, margin = 14, col2X = pageW / 2 + 4;
  let y = 0;

  // ── Header band ──────────────────────────────────────────────────
  doc.setFillColor(29, 78, 216); // blue-700
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.text('AutoFix GMS', margin, 12);
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.setTextColor(186, 214, 255);
  doc.text('Garage Management System', margin, 18);

  // Right side of header
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(186,214,255);
  doc.text('DIGITAL SERVICE CARD', pageW - margin, 10, { align:'right' });
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text(job.jobCardNumber || '—', pageW - margin, 17, { align:'right' });
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(186,214,255);
  doc.text(fmtDate(job.updatedAt || job.createdAt), pageW - margin, 23, { align:'right' });

  y = 38;

  // ── Left column: Customer / Vehicle / Technician ──────────────────
  const drawLabel = (lbl, val, cx, cy) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(148,163,184);
    doc.text(lbl.toUpperCase(), cx, cy);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,41,59);
    doc.text(val || '—', cx, cy + 5);
  };
  const drawSmall = (lbl, val, cx, cy) => {
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,116,139);
    doc.text(lbl + ': ' + (val || '—'), cx, cy);
  };

  drawLabel('Customer', customer?.name || '—', margin, y);
  drawSmall('Phone', customer?.phone || '—', margin, y + 9);
  drawSmall('Email', customer?.email || '—', margin, y + 14);
  y += 22;

  drawLabel('Vehicle', vehicle?.registrationNumber || '—', margin, y);
  drawSmall('', [vehicle?.make, vehicle?.model, vehicle?.year].filter(Boolean).join(' '), margin, y + 9);
  y += 18;

  drawLabel('Technician', job.assignedTechnician || '—', margin, y);
  y += 14;

  // ── Right column: Mileage & Next Service ─────────────────────────
  let ry = 38;
  // Mileage box
  doc.setFillColor(248,250,252); doc.roundedRect(col2X, ry, pageW - col2X - margin, 28, 2, 2, 'F');
  doc.setDrawColor(226,232,240); doc.roundedRect(col2X, ry, pageW - col2X - margin, 28, 2, 2, 'S');
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(148,163,184);
  doc.text('MILEAGE READINGS', col2X + 4, ry + 6);
  drawSmall('In', job.mileageIn ? job.mileageIn.toLocaleString() + ' km' : '—', col2X + 4, ry + 13);
  if (mileageOut > 0) drawSmall('Out', mileageOut.toLocaleString() + ' km', col2X + 4, ry + 19);
  drawSmall('Fuel', job.fuelLevel || '—', col2X + 4, ry + (mileageOut > 0 ? 25 : 19));
  ry += 32;

  // Next service highlight box
  if (job.nextServiceMileage) {
    doc.setFillColor(240, 253, 244); // green-50
    doc.roundedRect(col2X, ry, pageW - col2X - margin, 38, 3, 3, 'F');
    doc.setDrawColor(134, 239, 172); // green-300
    doc.roundedRect(col2X, ry, pageW - col2X - margin, 38, 3, 3, 'S');

    // Bell icon replacement — orange circle
    doc.setFillColor(34,197,94); doc.circle(col2X + (pageW - col2X - margin)/2, ry + 8, 4, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
    doc.text('!', col2X + (pageW - col2X - margin)/2, ry + 10, { align:'center' });

    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(21,128,61);
    doc.text('NEXT SERVICE DUE AT', col2X + (pageW - col2X - margin)/2, ry + 17, { align:'center' });
    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(21,128,61);
    doc.text(job.nextServiceMileage.toLocaleString() + ' km', col2X + (pageW - col2X - margin)/2, ry + 28, { align:'center' });
    if (job.nextServiceLubricant) {
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(22,163,74);
      doc.text(job.nextServiceLubricant, col2X + (pageW - col2X - margin)/2, ry + 34, { align:'center' });
    }
    ry += 42;
  }

  // ── Services & Parts ──────────────────────────────────────────────
  y = Math.max(y, 100);
  doc.setDrawColor(226,232,240); doc.line(margin, y, pageW - margin, y); y += 4;
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(148,163,184);
  doc.text('SERVICES & PARTS PERFORMED', margin, y); y += 5;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(51,65,85);
  const allWork = [
    ...services.map(sv => '• ' + sv.serviceName + (sv.quantity>1?' ×'+sv.quantity:'')),
    ...parts.map(p  => '• ' + p.partName + ' ×' + p.quantity)
  ];
  if (allWork.length === 0) allWork.push('No services/parts recorded');
  // Multi-column if many items
  const half = Math.ceil(allWork.length / 2);
  allWork.slice(0, half).forEach((item, i) => {
    doc.text(item, margin, y + i * 5);
  });
  allWork.slice(half).forEach((item, i) => {
    doc.text(item, pageW / 2, y + i * 5);
  });

  // ── Footer ────────────────────────────────────────────────────────
  doc.setFillColor(29, 78, 216);
  doc.rect(0, pageH - 14, pageW, 14, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(186,214,255);
  doc.text('Thank you for choosing AutoFix GMS  ·  Tel: +255 700 000 000  ·  info@autofixgms.co.tz', pageW/2, pageH - 6, { align:'center' });

  const filename = 'ServiceCard-' + (job.jobCardNumber||'GMS') + '-' + (vehicle?.registrationNumber||'').replace(/\s/g,'')+'.pdf';
  doc.save(filename);
  showToast('✅ ' + filename + ' downloaded');
}

function shareServiceCardWhatsApp() {
  if (!_svcCardData) return;
  const { job, customer, vehicle } = _svcCardData;
  const mileageOut = +document.getElementById('svcCard-mileageOut').value || 0;
  const phone = (customer?.phone || '').replace(/\D/g,'');
  const NL = String.fromCharCode(10);
  const DIV = '\u2500'.repeat(29);

  let msg = '\uD83D\uDD27 *AutoFix GMS \u2014 Service Card*' + NL;
  msg += DIV + NL;
  msg += '*Job Card:*  ' + (job.jobCardNumber || '\u2014') + NL;
  msg += '*Date:*      ' + fmtDate(job.updatedAt || job.createdAt) + NL;
  msg += '*Vehicle:*   ' + (vehicle?.registrationNumber || '\u2014') + ' ' + [vehicle?.make,vehicle?.model,vehicle?.year].filter(Boolean).join(' ') + NL;
  if (job.mileageIn)  msg += '*Mileage In:*  ' + job.mileageIn.toLocaleString() + ' km' + NL;
  if (mileageOut > 0) msg += '*Mileage Out:* ' + mileageOut.toLocaleString() + ' km' + NL;
  if (job.fuelLevel)  msg += '*Fuel Level:* ' + job.fuelLevel + NL;
  if (job.nextServiceMileage) {
    msg += DIV + NL;
    msg += '\uD83D\uDD14 *NEXT SERVICE DUE AT:* ' + job.nextServiceMileage.toLocaleString() + ' km' + NL;
    if (job.nextServiceLubricant) msg += '   _(' + job.nextServiceLubricant + ')_' + NL;
  }
  msg += DIV + NL;
  msg += '_Thank you for choosing AutoFix GMS!_' + NL;
  msg += '_\uD83D\uDCDE +255 700 000 000_';

  const url = 'https://wa.me/' + (phone || '') + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

function shareServiceCardEmail() {
  if (!_svcCardData) return;
  const { job, customer, vehicle } = _svcCardData;
  const mileageOut = +document.getElementById('svcCard-mileageOut').value || 0;
  const email = customer?.email || '';
  const subject = 'Your Service Card — ' + (job.jobCardNumber || 'AutoFix GMS') + ' | ' + (vehicle?.registrationNumber || '');
  const body = _buildServiceCardText(mileageOut);
  window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}

async function issueServiceCard() {
  if (!_svcCardData) return;
  const { job } = _svcCardData;
  const mileageOut = +document.getElementById('svcCard-mileageOut').value || 0;
  try {
    await axios.patch('/api/jobcards/' + job.id + '/service-card', { mileageOut: mileageOut || undefined });
    showToast('✅ Service card issued & recorded for ' + job.jobCardNumber);
    closeModal('modal-serviceCard');
    viewJobDetail(job.id);
  } catch(e) {
    showToast('Error issuing service card', 'error');
  }
}
// ═══════════════════════════════════════════════════════════════════

// ─── Gate Pass Functions ──────────────────────────────────────────────────────
let _currentGPId = null;
let _gpSignaturePad = null;

function _initGPSignatureCanvas() {
  const canvas = document.getElementById('gpSignatureCanvas');
  if (!canvas || canvas._gpInited) return;
  canvas._gpInited = true;
  const ctx = canvas.getContext('2d');
  // Scale canvas to actual display size
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  || 500;
  canvas.height = rect.height || 140;
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  let drawing = false, lastX = 0, lastY = 0;
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return [src.clientX - r.left, src.clientY - r.top];
  }
  canvas.addEventListener('mousedown',  e => { drawing = true; [lastX,lastY] = getPos(e); });
  canvas.addEventListener('mousemove',  e => { if (!drawing) return; const [x,y] = getPos(e); ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); [lastX,lastY]=[x,y]; });
  canvas.addEventListener('mouseup',    () => { drawing = false; });
  canvas.addEventListener('mouseleave', () => { drawing = false; });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; [lastX,lastY] = getPos(e); }, { passive:false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!drawing) return; const [x,y] = getPos(e); ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); [lastX,lastY]=[x,y]; }, { passive:false });
  canvas.addEventListener('touchend',   () => { drawing = false; });
}

function clearGPSignature() {
  const canvas = document.getElementById('gpSignatureCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function _isGPCanvasEmpty() {
  const canvas = document.getElementById('gpSignatureCanvas');
  if (!canvas) return true;
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) return false; }
  return true;
}

async function loadGatePasses() {
  showPage('gate-passes');
  // Load stats
  try {
    const { data: s } = await axios.get('/api/gate-passes/summary');
    document.getElementById('gpStats').innerHTML = \`
      <div class="card p-4 text-center border-t-4 border-blue-500">
        <p class="text-2xl font-bold text-blue-700">\${s.active}</p>
        <p class="text-sm text-gray-500 mt-1">Active (On Premises)</p>
      </div>
      <div class="card p-4 text-center border-t-4 border-orange-400">
        <p class="text-2xl font-bold text-orange-600">\${s.pendingExit}</p>
        <p class="text-sm text-gray-500 mt-1">Pending Exit Approval</p>
      </div>
      <div class="card p-4 text-center border-t-4 border-green-500">
        <p class="text-2xl font-bold text-green-700">\${s.cleared}</p>
        <p class="text-sm text-gray-500 mt-1">Cleared (Exited)</p>
      </div>
      <div class="card p-4 text-center border-t-4 border-gray-400">
        <p class="text-2xl font-bold text-gray-600">\${s.total}</p>
        <p class="text-sm text-gray-500 mt-1">Total All Time</p>
      </div>
    \`;
    // Update tab counts
    document.getElementById('gpTabCnt-Active').textContent      = s.active      || '';
    document.getElementById('gpTabCnt-Pending Exit').textContent = s.pendingExit || '';
    document.getElementById('gpTabCnt-Cleared').textContent      = s.cleared     || '';
    // Update sidebar badge
    const badge = document.getElementById('gpNavBadge');
    if (badge) { if (s.active + s.pendingExit > 0) { badge.textContent = s.active + s.pendingExit; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); } }
  } catch(e) {}
  // Load table
  _renderGPTable(window._gpCurrentTab || 'all');
}

let _gpCurrentTab = 'all';
function setGPTab(tab) {
  window._gpCurrentTab = tab;
  document.querySelectorAll('.gp-tab').forEach(b => {
    b.classList.toggle('border-blue-600', b.id === 'gpTab-' + tab);
    b.classList.toggle('text-blue-600',   b.id === 'gpTab-' + tab);
    b.classList.toggle('border-transparent', b.id !== 'gpTab-' + tab);
    b.classList.toggle('text-gray-500',   b.id !== 'gpTab-' + tab);
  });
  _renderGPTable(tab);
}

async function _renderGPTable(tab) {
  const url = tab === 'all' ? '/api/gate-passes' : '/api/gate-passes?status=' + encodeURIComponent(tab);
  const { data: passes } = await axios.get(url);
  const tbody = document.getElementById('gpTableBody');
  const empty = document.getElementById('gpEmpty');
  if (!passes.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  const statusCls = { Active:'bg-blue-100 text-blue-700', 'Pending Exit':'bg-orange-100 text-orange-700', Cleared:'bg-green-100 text-green-700', Voided:'bg-red-100 text-red-700' };
  tbody.innerHTML = passes.map(gp => \`
    <tr class="table-row">
      <td class="px-4 py-3 font-mono font-bold text-gray-800 text-xs">\${gp.passNumber}</td>
      <td class="px-4 py-3">
        <p class="font-bold text-blue-700">\${gp.vehicleReg}</p>
        <p class="text-xs text-gray-400">\${[gp.vehicleMake,gp.vehicleModel,gp.vehicleYear].filter(Boolean).join(' ')}</p>
      </td>
      <td class="px-4 py-3">
        <p class="font-semibold text-gray-800">\${gp.customerName}</p>
        <p class="text-xs text-gray-400">\${gp.customerPhone||''}</p>
      </td>
      <td class="px-4 py-3 font-semibold text-gray-700 text-xs">\${gp.jobCardNumber||'—'}</td>
      <td class="px-4 py-3 text-xs text-gray-600">\${fmtDateTime(gp.entryTime)}</td>
      <td class="px-4 py-3 text-xs \${gp.exitTime?'text-green-700 font-semibold':'text-gray-400'}">\${gp.exitTime ? fmtDateTime(gp.exitTime) : '—'}</td>
      <td class="px-4 py-3"><span class="badge text-xs \${statusCls[gp.status]||'bg-gray-100 text-gray-500'}">\${gp.status}</span></td>
      <td class="px-4 py-3">
        <div class="flex gap-1.5 flex-wrap">
          \${gp.jobCardNumber ? \`<button class="text-xs text-blue-600 hover:underline font-semibold" onclick="viewJobDetail('\${gp.jobCardId}')"><i class="fas fa-eye mr-0.5"></i>Job</button>\` : ''}
          \${gp.status === 'Pending Exit' ? \`<button class="text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded-lg hover:bg-green-700" onclick="openGPApprovalModal('\${gp.id}')"><i class="fas fa-sign-out-alt mr-0.5"></i>Approve</button>\` : ''}
          <button class="text-xs text-gray-500 hover:text-blue-600 font-semibold" onclick="downloadGatePassPDF('\${gp.id}')"><i class="fas fa-download mr-0.5"></i>PDF</button>
          \${gp.status === 'Active' || gp.status === 'Pending Exit' ? \`<button class="text-xs text-red-500 hover:text-red-700 font-semibold" onclick="openVoidGPModal('\${gp.id}')"><i class="fas fa-ban mr-0.5"></i>Void</button>\` : ''}
        </div>
      </td>
    </tr>
  \`).join('');
}

async function openGPApprovalModal(gpId) {
  _currentGPId = gpId;
  const { data: gp } = await axios.get('/api/gate-passes/' + gpId);
  document.getElementById('agp-passNum').textContent   = gp.passNumber;
  document.getElementById('agp-jobCard').textContent   = gp.jobCardNumber || '—';
  document.getElementById('agp-reg').textContent       = gp.vehicleReg;
  document.getElementById('agp-vehicle').textContent   = [gp.vehicleMake,gp.vehicleModel,gp.vehicleYear].filter(Boolean).join(' ') || '—';
  document.getElementById('agp-customer').textContent  = gp.customerName;
  document.getElementById('agp-entry').textContent     = fmtDateTime(gp.entryTime);
  document.getElementById('agp-approvedBy').value = '';
  document.getElementById('agp-notes').value = '';
  clearGPSignature();
  // Reset canvas init flag so it reinits with correct size
  const canvas = document.getElementById('gpSignatureCanvas');
  if (canvas) canvas._gpInited = false;
  openModal('modal-approveGP');
  setTimeout(_initGPSignatureCanvas, 100);
}

async function submitGPApproval() {
  const approvedBy = document.getElementById('agp-approvedBy').value.trim();
  if (!approvedBy) { showToast('Please enter the authorising officer name', 'error'); document.getElementById('agp-approvedBy').focus(); return; }
  if (_isGPCanvasEmpty()) { showToast('Please draw your signature to approve', 'error'); return; }
  const canvas = document.getElementById('gpSignatureCanvas');
  const signatureData = canvas.toDataURL('image/png');
  const notes = document.getElementById('agp-notes').value.trim();
  try {
    await axios.patch('/api/gate-passes/' + _currentGPId + '/approve', { approvedBy, signatureData, notes });
    closeModal('modal-approveGP');
    showToast('Exit Gate Pass approved — vehicle cleared!', 'success');
    loadGatePasses();
  } catch(e) {
    showToast(e?.response?.data?.error || 'Failed to approve gate pass', 'error');
  }
}

function openVoidGPModal(gpId) {
  _currentGPId = gpId;
  document.getElementById('voidGP-reason').value = '';
  openModal('modal-voidGP');
}

async function submitVoidGP() {
  const reason = document.getElementById('voidGP-reason').value.trim();
  try {
    await axios.patch('/api/gate-passes/' + _currentGPId + '/void', { reason });
    closeModal('modal-voidGP');
    showToast('Gate pass voided', 'info');
    if (document.getElementById('page-gate-passes')?.classList.contains('active')) loadGatePasses();
    else if (window._currentJobDetailId) viewJobDetail(window._currentJobDetailId);
  } catch(e) {
    showToast(e?.response?.data?.error || 'Failed to void gate pass', 'error');
  }
}

function downloadGatePassPDF(gpId) {
  axios.get('/api/gate-passes/' + gpId).then(({ data: gp }) => _buildGatePassPDF(gp));
}

function _buildGatePassPDF(gp) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = 148, pageH = 210, margin = 14;
  let y = 0;

  // ── Header ────────────────────────────────────────────────────────────────
  const hdrColor = gp.status === 'Cleared' ? [22, 163, 74] : gp.status === 'Pending Exit' ? [234, 88, 12] : [29, 78, 216];
  doc.setFillColor(...hdrColor);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('AUTOFIX GMS', margin, 12);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Garage Management System', margin, 18);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('GATE PASS', pageW - margin, 12, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(gp.passNumber, pageW - margin, 18, { align: 'right' });
  y = 40;

  // ── Status Banner ─────────────────────────────────────────────────────────
  const bannerColor = gp.status === 'Cleared' ? [220, 252, 231] : gp.status === 'Pending Exit' ? [255, 237, 213] : [219, 234, 254];
  const bannerText  = gp.status === 'Cleared' ? [21, 128, 61]   : gp.status === 'Pending Exit' ? [194, 65, 12]  : [29, 78, 216];
  doc.setFillColor(...bannerColor);
  doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
  doc.setTextColor(...bannerText);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(gp.status.toUpperCase(), pageW / 2, y + 6.5, { align: 'center' });
  y += 17;

  // ── Vehicle Info ──────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE INFORMATION', margin, y); y += 6;
  doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
  const vehicleRows = [
    ['Registration', gp.vehicleReg],
    ['Make / Model', [gp.vehicleMake, gp.vehicleModel, gp.vehicleYear].filter(Boolean).join(' ') || '—'],
    ['Colour', gp.vehicleColor || '—'],
    ['Job Card', gp.jobCardNumber || '—'],
  ];
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  vehicleRows.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, margin, y);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(String(value), 55, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 4;

  // ── Customer Info ─────────────────────────────────────────────────────────
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text('CUSTOMER INFORMATION', margin, y); y += 6;
  doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
  const custRows = [['Name', gp.customerName], ['Phone', gp.customerPhone || '—']];
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  custRows.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, margin, y);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(String(value), 55, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });
  y += 4;

  // ── Timing ────────────────────────────────────────────────────────────────
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text('ENTRY / EXIT TIMING', margin, y); y += 6;
  doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120); doc.text('Entry Time', margin, y);
  doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(fmtDateTime(gp.entryTime), 55, y); y += 6;
  doc.setFont('helvetica', 'normal');
  if (gp.exitTime) {
    doc.setTextColor(120, 120, 120); doc.text('Exit Time', margin, y);
    doc.setTextColor(22, 163, 74); doc.setFont('helvetica', 'bold'); doc.text(fmtDateTime(gp.exitTime), 55, y); y += 6;
    doc.setFont('helvetica', 'normal');
  }
  if (gp.approvedBy) {
    doc.setTextColor(120, 120, 120); doc.text('Approved By', margin, y);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(gp.approvedBy, 55, y); y += 6;
    doc.setFont('helvetica', 'normal');
    if (gp.approvedAt) {
      doc.setTextColor(120, 120, 120); doc.text('Approved At', margin, y);
      doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(fmtDateTime(gp.approvedAt), 55, y); y += 6;
      doc.setFont('helvetica', 'normal');
    }
  }
  y += 4;

  // ── Signature ─────────────────────────────────────────────────────────────
  if (gp.signatureData) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text('AUTHORISING SIGNATURE', margin, y); y += 6;
    doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
    try {
      doc.addImage(gp.signatureData, 'PNG', margin, y, 60, 20);
    } catch(e) {}
    y += 26;
  } else {
    // Blank signature box
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text('AUTHORISING SIGNATURE', margin, y); y += 6;
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, 80, 22, 2, 2, 'FD'); y += 28;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (gp.notes) {
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100);
    doc.text('Notes: ' + gp.notes, margin, y); y += 6;
  }

  // ── QR Placeholder ────────────────────────────────────────────────────────
  const qrY = pageH - 30;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(pageW - margin - 22, qrY - 4, 22, 22, 2, 2, 'F');
  doc.setFontSize(6); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
  doc.text('QR', pageW - margin - 11, qrY + 8, { align: 'center' });
  doc.text(gp.passNumber, pageW - margin - 11, qrY + 14, { align: 'center' });

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(...hdrColor);
  doc.rect(0, pageH - 10, pageW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('AutoFix GMS  |  www.autofixgms.co.tz  |  +255 700 000 000', pageW / 2, pageH - 4, { align: 'center' });

  doc.save('GatePass-' + gp.passNumber + '.pdf');
}

// ─── End Gate Pass Functions ──────────────────────────────────────────────────

async function confirmReopenJob() {
  const reason = document.getElementById('reopenReasonInput').value.trim();
  if (!reason) {
    document.getElementById('reopenReasonError').style.display = 'block';
    document.getElementById('reopenReasonInput').focus();
    return;
  }
  document.getElementById('reopenReasonError').style.display = 'none';
  const btn = document.getElementById('reopenJobBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Reopening…';
  try {
    await axios.post('/api/jobcards/' + _reopenJobId + '/reopen', { reason });
    closeModal('modal-reopenJob');
    showToast('✔ Job card reopened — status set to Repair In Progress', 'success');
    viewJobDetail(_reopenJobId);
    // Refresh job list in background
    loadJobCards();
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    showToast('Error: ' + msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-folder-open"></i> Reopen Job Card';
  }
}

// New Job Modal
async function showNewJobModal() {
  const [custs, techs] = await Promise.all([axios.get('/api/customers'), axios.get('/api/users')]);
  allCustomers = custs.data; allVehicles = (await axios.get('/api/vehicles')).data;
  // Reset customer picker
  jobCustClear();
  document.getElementById('job-technician').innerHTML = '<option value="">Select…</option>' + techs.data.filter(u => u.role === 'Technician').map(u => \`<option value="\${u.id}">\${u.name}</option>\`).join('');
  // Reset fuel level buttons to unselected state
  document.getElementById('job-fuelLevel').value = '';
  // Clear any previous validation error states
  const _mileageIn = document.getElementById('job-mileage');
  _mileageIn.value = '';
  _mileageIn.classList.remove('border-red-400', 'bg-red-50');
  document.getElementById('job-mileage-error').classList.add('hidden');
  document.getElementById('job-fuel-error').classList.add('hidden');
  document.getElementById('fuelLevelBtns').classList.remove('ring-2', 'ring-red-400', 'rounded-lg');
  const _fuelCols = { 'Empty': 'red', '1/4': 'orange', '1/2': 'amber', '3/4': 'green', 'Full': 'emerald' };
  document.querySelectorAll('#fuelLevelBtns .fuel-btn').forEach(function(btn) {
    const f = btn.getAttribute('data-fuel');
    const col = _fuelCols[f] || 'gray';
    btn.className = 'fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-gray-500 hover:border-' + col + '-400 hover:bg-' + col + '-50 text-xs font-bold transition-all';
  });
  openModal('modal-newJob');
}

// ── Customer picker helpers for New Job modal ─────────────────────────────────
function jobCustSearch(q) {
  const list = document.getElementById('job-customer-list');
  const term = (q || '').toLowerCase().trim();
  const matches = allCustomers.filter(c =>
    c.name.toLowerCase().includes(term) ||
    (c.phone || '').toLowerCase().includes(term) ||
    (c.companyName || '').toLowerCase().includes(term)
  ).slice(0, 10);
  if (!matches.length) { list.innerHTML = '<li class="px-4 py-3 text-sm text-gray-400 italic">No customers found</li>'; list.classList.remove('hidden'); return; }
  list.innerHTML = matches.map(c => {
    const initials = c.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const sub = c.companyName ? c.companyName : (c.phone || '');
    return '<li class="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0" data-cid="' + c.id + '" data-cname="' + escAttr(c.name) + '">' +
      '<div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">' + initials + '</div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 truncate">' + escHtml(c.name) + '</p>' +
      '<p class="text-xs text-gray-400 truncate">' + escHtml(sub) + '</p></div>' +
      '<span class="ml-auto text-xs px-2 py-0.5 rounded-full ' + (c.customerType === 'Corporate' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500') + '">' + (c.customerType || 'Individual') + '</span>' +
      '</li>';
  }).join('');
  // attach click handlers
  list.querySelectorAll('li[data-cid]').forEach(function(li) {
    li.addEventListener('mousedown', function(e) {
      e.preventDefault();
      jobCustSelect(li.dataset.cid, li.dataset.cname);
    });
  });
  list.classList.remove('hidden');
}

function jobCustSelect(id, name) {
  document.getElementById('job-customerId').value = id;
  document.getElementById('job-customer-search').value = name;
  document.getElementById('job-customer-clear').classList.remove('hidden');
  document.getElementById('job-customer-list').classList.add('hidden');
  // load vehicles for this customer
  loadCustomerVehicles(id);
}

function jobCustClear() {
  document.getElementById('job-customerId').value = '';
  document.getElementById('job-customer-search').value = '';
  document.getElementById('job-customer-clear').classList.add('hidden');
  document.getElementById('job-customer-list').classList.add('hidden');
  document.getElementById('job-vehicleId').innerHTML = '<option value="">Select vehicle…</option>';
}

function jobCustHideList() {
  document.getElementById('job-customer-list').classList.add('hidden');
}
// ─────────────────────────────────────────────────────────────────────────────

function loadCustomerVehicles(custId) {
  custId = custId || document.getElementById('job-customerId').value;
  if (!custId) { document.getElementById('job-vehicleId').innerHTML = '<option value="">Select vehicle…</option>'; return; }
  const cvs = allVehicles.filter(v => v.customerId === custId);
  document.getElementById('job-vehicleId').innerHTML = '<option value="">Select vehicle…</option>' + cvs.map(v => \`<option value="\${v.id}">\${v.registrationNumber} – \${v.make} \${v.model}</option>\`).join('');
}

function toggleInsuranceFields() {
  const cat = document.getElementById('job-category').value;
  document.getElementById('insuranceFields').style.display = cat === 'Insurance' ? 'block' : 'none';
}

function selectFuelLevel(level) {
  document.getElementById('job-fuelLevel').value = level;
  // Clear fuel error state as soon as a level is selected
  document.getElementById('job-fuel-error').classList.add('hidden');
  document.getElementById('fuelLevelBtns').classList.remove('ring-2', 'ring-red-400', 'rounded-lg');
  const fuelColors = { 'Empty': 'red', '1/4': 'orange', '1/2': 'amber', '3/4': 'green', 'Full': 'emerald' };
  document.querySelectorAll('#fuelLevelBtns .fuel-btn').forEach(function(btn) {
    const f = btn.getAttribute('data-fuel');
    const col = fuelColors[f] || 'gray';
    if (f === level) {
      btn.className = 'fuel-btn py-1.5 rounded-lg border-2 border-' + col + '-500 bg-' + col + '-50 text-' + col + '-700 text-xs font-bold transition-all';
    } else {
      btn.className = 'fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-gray-500 hover:border-' + col + '-400 hover:bg-' + col + '-50 text-xs font-bold transition-all';
    }
  });
}

async function submitNewJob(e) {
  e.preventDefault();
  // Validate customer picker (hidden input — not covered by HTML5 required)
  if (!document.getElementById('job-customerId').value) {
    document.getElementById('job-customer-search').focus();
    document.getElementById('job-customer-search').classList.add('border-red-400');
    showToast('Please select a customer', 'error');
    return;
  }
  document.getElementById('job-customer-search').classList.remove('border-red-400');

  // ── Validate Vehicle Intake Readings (both required) ──────────────────────
  const mileageVal = document.getElementById('job-mileage').value.trim();
  const fuelVal    = document.getElementById('job-fuelLevel').value;
  let intakeValid  = true;

  const mileageInput = document.getElementById('job-mileage');
  const mileageErr   = document.getElementById('job-mileage-error');
  if (!mileageVal) {
    mileageInput.classList.add('border-red-400', 'bg-red-50');
    mileageErr.classList.remove('hidden');
    intakeValid = false;
  } else {
    mileageInput.classList.remove('border-red-400', 'bg-red-50');
    mileageErr.classList.add('hidden');
  }

  const fuelErr      = document.getElementById('job-fuel-error');
  const fuelBtnGroup = document.getElementById('fuelLevelBtns');
  if (!fuelVal) {
    fuelBtnGroup.classList.add('ring-2', 'ring-red-400', 'rounded-lg');
    fuelErr.classList.remove('hidden');
    intakeValid = false;
  } else {
    fuelBtnGroup.classList.remove('ring-2', 'ring-red-400', 'rounded-lg');
    fuelErr.classList.add('hidden');
  }

  if (!intakeValid) {
    showToast('Please fill in mileage and fuel level', 'error');
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const cat = document.getElementById('job-category').value;
  const payload = {
    customerId: document.getElementById('job-customerId').value,
    vehicleId: document.getElementById('job-vehicleId').value,
    assignedTechnician: document.getElementById('job-technician').value,
    category: cat,
    damageDescription: document.getElementById('job-damage').value,
    inspectionNotes: document.getElementById('job-notes').value,
    mileageIn: parseInt(mileageVal),
    fuelLevel: fuelVal,
    ...(cat === 'Insurance' ? {
      claimReference: document.getElementById('job-claimRef').value,
      insurer: document.getElementById('job-insurer').value,
      assessor: document.getElementById('job-assessor').value,
    } : {})
  };
  const { data } = await axios.post('/api/jobcards', payload);
  closeModal('modal-newJob');
  document.getElementById('newJobForm').reset();
  jobCustClear(); // reset customer picker hidden state
  // Reset fuel level buttons
  const _fuelCols2 = { 'Empty': 'red', '1/4': 'orange', '1/2': 'amber', '3/4': 'green', 'Full': 'emerald' };
  document.querySelectorAll('#fuelLevelBtns .fuel-btn').forEach(function(btn) {
    const f = btn.getAttribute('data-fuel');
    const col = _fuelCols2[f] || 'gray';
    btn.className = 'fuel-btn py-1.5 rounded-lg border-2 border-gray-200 text-gray-500 hover:border-' + col + '-400 hover:bg-' + col + '-50 text-xs font-bold transition-all';
  });
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
          <p class="text-xs text-gray-500"><i class="fas fa-phone text-xs mr-1 text-gray-400"></i>\${c.phone}</p>
          \${c.whatsapp ? \`<p class="text-xs text-green-600"><i class="fab fa-whatsapp text-xs mr-1"></i>\${c.whatsapp}</p>\` : ''}
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
    (c.whatsapp||'').includes(lq) ||
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
        \${c.whatsapp ? \`<p class="text-green-600 text-xs mt-0.5 font-medium"><i class="fab fa-whatsapp mr-1"></i>\${c.whatsapp}</p>\` : ''}
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
  const whatsappVal = document.getElementById('cust-whatsapp').value.trim();
  const payload = {
    name: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value,
    whatsapp: whatsappVal || undefined,
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

// ═══════════════════════════════════════════════════════════
// SHARED CUSTOMER SEARCH PICKER
// Usage: namespace is 'veh' or 'apt'. Each namespace needs:
//   #{ns}-cust-search  (text input)
//   #{ns}-cust-list    (ul dropdown)
//   #{ns}-customerId   (hidden input — stores selected id)
// ═══════════════════════════════════════════════════════════
var _custPickerBlurTimer = {};

function custPickerReset(ns) {
  var inp  = document.getElementById(ns + '-cust-search');
  var list = document.getElementById(ns + '-cust-list');
  var hid  = document.getElementById(ns + '-customerId');
  if (inp)  inp.value  = '';
  if (hid)  hid.value  = '';
  if (list) { list.innerHTML = ''; list.classList.add('hidden'); }
}

function custPickerOpen(ns) {
  // On focus: show all customers if nothing typed yet
  custPickerFilter(ns);
}

function custPickerFilter(ns) {
  var inp  = document.getElementById(ns + '-cust-search');
  var list = document.getElementById(ns + '-cust-list');
  var hid  = document.getElementById(ns + '-customerId');
  if (!inp || !list) return;
  var q = inp.value.trim().toLowerCase();
  // Clear selected id when user edits text
  if (hid) hid.value = '';
  var matches = allCustomers.filter(function(c) {
    return !q ||
      c.name.toLowerCase().includes(q) ||
      (c.companyName||'').toLowerCase().includes(q) ||
      (c.phone||'').includes(q) ||
      (c.whatsapp||'').includes(q);
  }).slice(0, 8); // cap at 8 results for performance
  if (!matches.length) {
    list.innerHTML = '<li class="cust-picker-empty">No customers found</li>';
  } else {
    // Use data-cid attribute — avoids any quote-escaping inside HTML attributes
    list.innerHTML = matches.map(function(c) {
      var isCorp = c.customerType === 'Corporate';
      var badge  = isCorp
        ? '<span class="cust-picker-badge cust-picker-badge--corp"><i class="fas fa-building"></i> Corp</span>'
        : '<span class="cust-picker-badge cust-picker-badge--indiv"><i class="fas fa-user"></i> Indiv</span>';
      var sub = isCorp && c.companyName ? c.companyName : (c.phone || '');
      return '<li class="cust-picker-item" data-cid="' + c.id + '">' +
        '<div class="cust-picker-item-main">' +
          '<span class="cust-picker-item-name">' + c.name + '</span>' + badge +
        '</div>' +
        (sub ? '<div class="cust-picker-item-sub">' + sub + '</div>' : '') +
      '</li>';
    }).join('');
    // Attach mousedown via JS — no inline handler strings needed
    list.querySelectorAll('.cust-picker-item').forEach(function(li) {
      li.addEventListener('mousedown', function(e) {
        e.preventDefault();
        custPickerSelect(ns, li.getAttribute('data-cid'));
      });
    });
  }
  list.classList.remove('hidden');
}

function custPickerSelect(ns, custId) {
  var c    = allCustomers.find(function(x) { return x.id === custId; });
  var inp  = document.getElementById(ns + '-cust-search');
  var list = document.getElementById(ns + '-cust-list');
  var hid  = document.getElementById(ns + '-customerId');
  if (!c) return;
  var label = c.name + (c.customerType === 'Corporate' && c.companyName ? ' · ' + c.companyName : '');
  if (inp)  inp.value  = label;
  if (hid)  hid.value  = c.id;
  if (list) { list.innerHTML = ''; list.classList.add('hidden'); }
  // For appointment picker: load vehicles when customer is chosen
  if (ns === 'apt') aptLoadVehicles();
}

function custPickerBlur(ns) {
  // Delay close so onmousedown on list item fires first
  _custPickerBlurTimer[ns] = setTimeout(function() {
    var list = document.getElementById(ns + '-cust-list');
    var inp  = document.getElementById(ns + '-cust-search');
    var hid  = document.getElementById(ns + '-customerId');
    if (list) { list.innerHTML = ''; list.classList.add('hidden'); }
    // If nothing was selected, clear the text too
    if (hid && !hid.value && inp) inp.value = '';
  }, 180);
}

// ═══ VEHICLES ═══
async function loadVehicles() {
  const { data } = await axios.get('/api/vehicles');
  allVehicles = data;
  renderVehicles(data);
}

function renderVehicles(list) {
  const tbody = document.getElementById('vehiclesTable');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-400"><i class="fas fa-car text-3xl mb-3 block"></i>No vehicles found</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function(v) {
    return '<tr class="table-row border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors veh-row" data-id="' + v.id + '">' +
      '<td class="px-4 py-3"><span class="font-bold text-blue-600 text-sm hover:underline">' + v.registrationNumber + '</span></td>' +
      '<td class="px-4 py-3"><span class="font-semibold text-gray-800">' + v.make + '</span><span class="text-gray-500"> ' + v.model + '</span></td>' +
      '<td class="px-4 py-3 text-gray-600">' + v.year + '</td>' +
      '<td class="px-4 py-3 text-sm text-gray-700">' + (v.customerName || '—') + '</td>' +
      '<td class="px-4 py-3 text-sm text-gray-600">' + (v.insurer ? v.insurer.trim() : '—') + '</td>' +
      '<td class="px-4 py-3 font-mono text-xs text-gray-400">' + (v.vin || '—') + '</td>' +
      '<td class="px-4 py-3 veh-actions" onclick="event.stopPropagation()">' +
        '<div class="flex items-center gap-1">' +
          '<button class="veh-detail-btn w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" data-id="' + v.id + '" title="View / Edit"><i class="fas fa-eye text-xs"></i></button>' +
          '<button class="veh-edit-btn w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors" data-id="' + v.id + '" title="Edit"><i class="fas fa-pen text-xs"></i></button>' +
          '<button class="veh-del-btn w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors" data-id="' + v.id + '" title="Delete"><i class="fas fa-trash text-xs"></i></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  // Row click → open detail
  tbody.querySelectorAll('.veh-row').forEach(function(row) {
    row.addEventListener('click', function() { openVehicleDetail(row.getAttribute('data-id')); });
  });
  // View button
  tbody.querySelectorAll('.veh-detail-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openVehicleDetail(btn.getAttribute('data-id')); });
  });
  // Edit button → open detail in edit mode immediately
  tbody.querySelectorAll('.veh-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openVehicleDetail(btn.getAttribute('data-id'), true); });
  });
  // Delete button
  tbody.querySelectorAll('.veh-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteVehicleById(btn.getAttribute('data-id')); });
  });
}

function filterVehicles(q) {
  const lq = q.toLowerCase();
  renderVehicles(allVehicles.filter(function(v) {
    return v.registrationNumber.toLowerCase().includes(lq) ||
      v.make.toLowerCase().includes(lq) ||
      v.model.toLowerCase().includes(lq) ||
      (v.customerName || '').toLowerCase().includes(lq);
  }));
}

// ── Vehicle Detail Modal ──────────────────────────────────────────────────────
let _vdVehicle = null;

async function openVehicleDetail(id, editMode) {
  const v = allVehicles.find(function(x) { return x.id === id; });
  if (!v) return;
  _vdVehicle = v;

  // Ensure customers loaded
  if (!allCustomers.length) { const { data } = await axios.get('/api/customers'); allCustomers = data; }

  // Populate header
  document.getElementById('vd-reg-title').textContent = v.registrationNumber;
  document.getElementById('vd-make-model-title').textContent = v.make + ' ' + v.model + ' · ' + v.year;
  document.getElementById('vd-id').value = v.id;

  // Populate view fields
  document.getElementById('vd-view-owner').textContent   = v.customerName || '—';
  document.getElementById('vd-view-reg').textContent     = v.registrationNumber;
  document.getElementById('vd-view-make').textContent    = v.make;
  document.getElementById('vd-view-model').textContent   = v.model;
  document.getElementById('vd-view-year').textContent    = v.year;
  document.getElementById('vd-view-insurer').textContent = v.insurer ? v.insurer.trim() : '—';
  document.getElementById('vd-view-vin').textContent     = v.vin || '—';
  document.getElementById('vd-view-engine').textContent  = v.engineNumber || '—';

  // Populate edit fields
  document.getElementById('vd-edit-owner').innerHTML = allCustomers.map(function(c) {
    return '<option value="' + c.id + '"' + (c.id === v.customerId ? ' selected' : '') + '>' + c.name + '</option>';
  }).join('');
  document.getElementById('vd-edit-reg').value     = v.registrationNumber;
  document.getElementById('vd-edit-make').value    = v.make;
  document.getElementById('vd-edit-model').value   = v.model;
  document.getElementById('vd-edit-year').value    = v.year;
  document.getElementById('vd-edit-insurer').value = v.insurer ? v.insurer.trim() : '';
  document.getElementById('vd-edit-vin').value     = v.vin || '';
  document.getElementById('vd-edit-engine').value  = v.engineNumber || '';

  // Set view vs edit mode
  vdSetEditMode(!!editMode);

  // Load job history
  vdLoadJobHistory(v.id);

  openModal('modal-vehicleDetail');
}

function vdSetEditMode(edit) {
  document.querySelectorAll('.vd-view-text').forEach(function(el) { el.classList.toggle('hidden', edit); });
  document.querySelectorAll('.vd-edit-field').forEach(function(el) { el.classList.toggle('hidden', !edit); });
  document.getElementById('vd-edit-btn').classList.toggle('hidden', edit);
  document.getElementById('vd-save-btn').classList.toggle('hidden', !edit);
  document.getElementById('vd-cancel-btn').classList.toggle('hidden', !edit);
}

function vdEnableEdit() { vdSetEditMode(true); }

function vdCancelEdit() { vdSetEditMode(false); }

async function vdSave() {
  const id = document.getElementById('vd-id').value;
  const customerId = document.getElementById('vd-edit-owner').value;
  const reg  = document.getElementById('vd-edit-reg').value.trim().toUpperCase();
  const make = document.getElementById('vd-edit-make').value.trim().toUpperCase();
  const model= document.getElementById('vd-edit-model').value.trim().toUpperCase();
  const year = parseInt(document.getElementById('vd-edit-year').value) || 0;
  const insurer = document.getElementById('vd-edit-insurer').value.trim();
  const vin  = document.getElementById('vd-edit-vin').value.trim();
  const engineNumber = document.getElementById('vd-edit-engine').value.trim();

  if (!reg)  { showToast('Registration number is required', 'error'); return; }
  if (!make) { showToast('Make is required', 'error'); return; }
  if (!model){ showToast('Model is required', 'error'); return; }
  if (!year) { showToast('Year is required', 'error'); return; }

  try {
    const { data } = await axios.put('/api/vehicles/' + id, { customerId, registrationNumber: reg, make, model, year, insurer, vin, engineNumber });
    showToast('Vehicle updated successfully');
    // Update local cache
    const idx = allVehicles.findIndex(function(x) { return x.id === id; });
    if (idx !== -1) {
      const owner = allCustomers.find(function(c) { return c.id === customerId; });
      allVehicles[idx] = { ...allVehicles[idx], ...data, customerName: owner ? owner.name : allVehicles[idx].customerName };
    }
    _vdVehicle = allVehicles[idx];
    // Update header + view fields
    document.getElementById('vd-reg-title').textContent = reg;
    document.getElementById('vd-make-model-title').textContent = make + ' ' + model + ' · ' + year;
    document.getElementById('vd-view-owner').textContent   = allCustomers.find(function(c){ return c.id===customerId; })?.name || '—';
    document.getElementById('vd-view-reg').textContent     = reg;
    document.getElementById('vd-view-make').textContent    = make;
    document.getElementById('vd-view-model').textContent   = model;
    document.getElementById('vd-view-year').textContent    = year;
    document.getElementById('vd-view-insurer').textContent = insurer || '—';
    document.getElementById('vd-view-vin').textContent     = vin || '—';
    document.getElementById('vd-view-engine').textContent  = engineNumber || '—';
    vdSetEditMode(false);
    renderVehicles(allVehicles);
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to update vehicle', 'error');
  }
}

async function vdLoadJobHistory(vehicleId) {
  const listEl = document.getElementById('vd-job-list');
  const countEl = document.getElementById('vd-job-count');
  listEl.innerHTML = '<p class="text-sm text-gray-400 text-center py-3"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</p>';
  try {
    const { data: jobs } = await axios.get('/api/jobcards');
    const vJobs = jobs.filter(function(j) { return j.vehicleId === vehicleId; });
    countEl.textContent = vJobs.length + ' job' + (vJobs.length !== 1 ? 's' : '');
    if (!vJobs.length) {
      listEl.innerHTML = '<p class="text-sm text-gray-400 text-center py-4 italic">No service history yet</p>';
      return;
    }
    const STATUS_COLORS = {
      'Open': '#2563eb', 'In Progress': '#d97706', 'Completed': '#16a34a',
      'Waiting Parts': '#7c3aed', 'Pending Approval': '#0891b2', 'Closed': '#64748b'
    };
    listEl.innerHTML = vJobs.sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); }).map(function(j) {
      const sc = STATUS_COLORS[j.status] || '#64748b';
      return '<div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors vd-job-item" data-jid="' + j.id + '">' +
        '<div class="w-2 h-2 rounded-full flex-shrink-0" style="background:' + sc + '"></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-semibold text-blue-600">' + j.jobCardNumber + '</p>' +
          '<p class="text-xs text-gray-500 truncate">' + (j.serviceType || '—') + ' · ' + (j.createdAt ? j.createdAt.substring(0,10) : '') + '</p>' +
        '</div>' +
        '<span class="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style="background:' + sc + '20;color:' + sc + '">' + j.status + '</span>' +
      '</div>';
    }).join('');
    // Wire job item clicks → open job card detail
    listEl.querySelectorAll('.vd-job-item').forEach(function(el) {
      el.addEventListener('click', function() {
        closeModal('modal-vehicleDetail');
        showPage('jobcards');
        setTimeout(function() { viewJobDetail(el.getAttribute('data-jid')); }, 300);
      });
    });
  } catch(e) {
    listEl.innerHTML = '<p class="text-sm text-red-400 text-center py-3">Could not load job history</p>';
  }
}

function vdViewAllJobs() {
  if (!_vdVehicle) return;
  closeModal('modal-vehicleDetail');
  showPage('jobcards');
  // Filter job cards by this vehicle's reg number after navigation
  setTimeout(function() {
    const searchEl = document.getElementById('jobSearch');
    if (searchEl) { searchEl.value = _vdVehicle.registrationNumber; filterJobCards(_vdVehicle.registrationNumber); }
  }, 300);
}

async function vdDeleteVehicle() {
  if (!_vdVehicle) return;
  if (!confirm('Delete vehicle ' + _vdVehicle.registrationNumber + '? This cannot be undone.')) return;
  try {
    await axios.delete('/api/vehicles/' + _vdVehicle.id);
    showToast(_vdVehicle.registrationNumber + ' deleted');
    closeModal('modal-vehicleDetail');
    allVehicles = allVehicles.filter(function(x) { return x.id !== _vdVehicle.id; });
    renderVehicles(allVehicles);
    _vdVehicle = null;
  } catch(err) {
    showToast('Failed to delete vehicle', 'error');
  }
}

async function deleteVehicleById(id) {
  const v = allVehicles.find(function(x) { return x.id === id; });
  if (!v) return;
  if (!confirm('Delete vehicle ' + v.registrationNumber + '? This cannot be undone.')) return;
  try {
    await axios.delete('/api/vehicles/' + id);
    showToast(v.registrationNumber + ' deleted');
    allVehicles = allVehicles.filter(function(x) { return x.id !== id; });
    renderVehicles(allVehicles);
  } catch(err) {
    showToast('Failed to delete vehicle', 'error');
  }
}

async function showNewVehicleModal() {
  if (!allCustomers.length) { const { data } = await axios.get('/api/customers'); allCustomers = data; }
  // Reset the customer picker
  custPickerReset('veh');
  document.getElementById('newVehicleForm').reset();
  openModal('modal-newVehicle');
}

async function submitNewVehicle(e) {
  e.preventDefault();
  const custId = document.getElementById('veh-customerId').value;
  if (!custId) { showToast('Please select a customer first', 'error'); return; }
  const payload = { customerId: custId, registrationNumber:document.getElementById('veh-reg').value, make:document.getElementById('veh-make').value, model:document.getElementById('veh-model').value, year:+document.getElementById('veh-year').value, vin:document.getElementById('veh-vin').value, engineNumber:document.getElementById('veh-engine').value, insurer:document.getElementById('veh-insurer').value };
  await axios.post('/api/vehicles', payload);
  closeModal('modal-newVehicle');
  document.getElementById('newVehicleForm').reset();
  custPickerReset('veh');
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
  aptPopulateCustomers();   // resets picker, no pre-selection for new appointments
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
  // Use picker: reset then pre-fill if editing
  custPickerReset('apt');
  if (selectedId) {
    const c = allCustomers.find(x => x.id === selectedId);
    if (c) {
      document.getElementById('apt-cust-search').value = c.name + (c.customerType === 'Corporate' && c.companyName ? ' · ' + c.companyName : '');
      document.getElementById('apt-customerId').value  = c.id;
    }
  }
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
  const custId = document.getElementById('apt-customerId').value;
  if (!custId) { showToast('Please select a customer first', 'error'); return; }
  const payload = {
    customerId:         custId,
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
  custPickerReset('apt');
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

  // ── Services table ──
  const services = detail.services || [];
  if (services.length) {
    doc.setFillColor(88, 28, 135);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('SERVICES', margin + 3, y + 5.5);
    y += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('#',           margin + 3,               y + 5);
    doc.text('Service',     margin + 10,              y + 5);
    doc.text('Category',    margin + contentW * 0.55, y + 5);
    doc.text('Qty',         margin + contentW * 0.72, y + 5);
    doc.text('Total',       margin + contentW - 3,    y + 5, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    services.forEach((sv, i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 245, 255); doc.rect(margin, y, contentW, 7, 'F'); }
      doc.setTextColor(30, 41, 59);
      doc.text(String(i + 1),     margin + 3,               y + 5);
      const nameStr = sv.serviceName.length > 30 ? sv.serviceName.substring(0, 28) + '…' : sv.serviceName;
      doc.text(nameStr,           margin + 10,              y + 5);
      doc.text(sv.category,       margin + contentW * 0.55, y + 5);
      doc.text(String(sv.quantity),margin + contentW * 0.72,y + 5);
      doc.text(fmt(sv.totalCost), margin + contentW - 3,    y + 5, { align: 'right' });
      y += 7;
    });
    y += 4;
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
  drawRow('Labour Cost',        fmt(pfi.labourCost),    false, false);
  drawRow('Parts / Materials',  fmt(pfi.partsCost),    false, false);
  if ((pfi.discountAmount || 0) > 0) {
    // divider before discount
    doc.setDrawColor(226, 232, 240); doc.line(sumX, y, sumX + sumW, y); y += 3;
    // green discount row
    doc.setFillColor(240, 253, 244); doc.rect(sumX, y, sumW, 8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(22, 163, 74);
    const discLabel = pfi.discountReason ? 'Discount (' + pfi.discountReason + ')' : 'Discount';
    doc.text(discLabel, sumX + 4, y + 5.5);
    doc.text('- ' + fmt(pfi.discountAmount), sumX + sumW - 3, y + 5.5, { align: 'right' });
    y += 8;
  }
  // divider
  doc.setDrawColor(226, 232, 240); doc.line(sumX, y, sumX + sumW, y); y += 3;
  drawRow('Total Estimate',     fmt(pfi.totalEstimate), false, false);
  // orange tax row
  doc.setFillColor(255, 247, 237); doc.rect(sumX, y, sumW, 8, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(194, 120, 3);
  const taxAmt = pfi.tax != null ? pfi.tax : Math.round(pfi.totalEstimate * 0.18);
  const grandTotal = pfi.totalAmount != null ? pfi.totalAmount : pfi.totalEstimate + taxAmt;
  doc.text('Tax / VAT (18%)', sumX + 4, y + 5.5);
  doc.text(fmt(taxAmt), sumX + sumW - 3, y + 5.5, { align: 'right' });
  y += 8;
  // divider
  doc.setDrawColor(226, 232, 240); doc.line(sumX, y, sumX + sumW, y); y += 3;
  drawRow('GRAND TOTAL',        fmt(grandTotal),        true,  true);
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
  const services = detail.services || [];
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
  if (services.length) {
    t += 'SERVICES' + NL;
    services.forEach((sv, i) => {
      t += '  ' + (i+1) + '. ' + sv.serviceName + (sv.quantity > 1 ? ' x' + sv.quantity : '') + '  [' + sv.category + ']  = ' + fmt(sv.totalCost) + NL;
      if (sv.notes) t += '     ' + sv.notes + NL;
    });
    t += line + NL;
  }
  if (parts?.length) {
    t += 'PARTS & MATERIALS' + NL;
    parts.forEach((p, i) => {
      t += '  ' + (i+1) + '. ' + p.partName + ' x' + p.quantity + '  ' + fmt(p.unitCost) + '  = ' + fmt(p.totalCost) + NL;
    });
    t += line + NL;
  }
  t += '  Labour:         ' + fmt(pfi.labourCost) + NL;
  t += '  Services+Parts: ' + fmt(pfi.partsCost) + NL;
  if ((pfi.discountAmount || 0) > 0) {
    const discNote = pfi.discountReason ? ' (' + pfi.discountReason + ')' : '';
    t += '  Discount' + discNote + ': -' + fmt(pfi.discountAmount) + NL;
  }
  t += '  ' + dash25 + NL;
  const _taxAmt2     = pfi.tax != null ? pfi.tax : Math.round(pfi.totalEstimate * 0.18);
  const _grandTotal2 = pfi.totalAmount != null ? pfi.totalAmount : pfi.totalEstimate + _taxAmt2;
  t += '  Total Estimate: ' + fmt(pfi.totalEstimate) + NL;
  t += '  Tax/VAT' + (_taxAmt2 > 0 ? ' (18%)' : '') + ':  ' + fmt(_taxAmt2) + NL;
  t += '  ' + dash25 + NL;
  t += '  GRAND TOTAL:    ' + fmt(_grandTotal2) + NL;
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
  const { pfi, job, customer, parts } = _currentPFIDetail;
  const services = _currentPFIDetail.services || [];
  const isInsurance = job?.category === 'Insurance';

  // Services breakdown HTML for summary
  let servicesBreakdownHtml = '';
  if (services.length) {
    const catIcon = cat =>
      cat === 'Service Package' ? 'fa-box-open' :
      cat === 'Oil Service'     ? 'fa-oil-can'  :
      cat === 'Car Wash'        ? 'fa-car'       : 'fa-plus-circle';
    const rows = services.map(sv =>
      '<div class="flex justify-between text-xs">' +
        '<span class="text-purple-800"><i class="fas ' + catIcon(sv.category) + ' mr-1 text-purple-400"></i>' + sv.serviceName +
        (sv.quantity > 1 ? ' <span class="text-purple-400">\xd7' + sv.quantity + '</span>' : '') + '</span>' +
        '<span class="font-semibold text-purple-900">' + fmt(sv.totalCost) + '</span>' +
      '</div>'
    ).join('');
    servicesBreakdownHtml =
      '<div class="mt-3 border-t border-blue-200 pt-3">' +
        '<p class="text-xs font-semibold text-purple-700 uppercase mb-2">Services</p>' +
        '<div class="space-y-1">' + rows + '</div>' +
      '</div>';
  }

  // Parts breakdown HTML for summary (use string concat to avoid nested backtick issues)
  let partsBreakdownHtml = '';
  if (parts && parts.length) {
    const rows = parts.map(p =>
      '<div class="flex justify-between text-xs">' +
        '<span class="text-blue-800">' + p.partName + ' <span class="text-blue-500">\xd7' + p.quantity + '</span></span>' +
        '<span class="font-semibold text-blue-900">' + fmt(p.totalCost) + '</span>' +
      '</div>'
    ).join('');
    partsBreakdownHtml =
      '<div class="mt-3 border-t border-blue-200 pt-3">' +
        '<p class="text-xs font-semibold text-blue-700 uppercase mb-2">Parts Consumed</p>' +
        '<div class="space-y-1">' + rows + '</div>' +
      '</div>';
  }

  // Summary strip
  const catLabel = isInsurance
    ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><i class="fas fa-shield-alt"></i> Insurance</span>'
    : '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-user"></i> Private</span>';
  document.getElementById('sendPFI-subtitle').textContent = (job?.jobCardNumber || 'PFI') + ' – ' + (customer?.name || '');
  document.getElementById('sendPFI-summary').innerHTML = \`
    <div class="flex flex-wrap gap-4 text-sm items-center mb-2">
      \${catLabel}
      <div><span class="text-gray-500">Job:</span> <strong>\${job?.jobCardNumber||'—'}</strong></div>
      <div><span class="text-gray-500">Customer:</span> <strong>\${customer?.name||'—'}</strong></div>
      <div><span class="text-gray-500">Vehicle:</span> <strong>\${_currentPFIDetail.vehicle?.registrationNumber||'—'}</strong></div>
      <div><span class="text-gray-500">Labour:</span> <strong>\${fmt(pfi.labourCost)}</strong></div>
      <div><span class="text-gray-500">Services+Parts:</span> <strong>\${fmt(pfi.partsCost)}</strong></div>
      <div><span class="text-gray-500">Total Estimate:</span> <strong>\${fmt(pfi.totalEstimate)}</strong></div>
      <div><span class="text-gray-500">Tax / VAT\${(pfi.tax||0) > 0 ? ' (18%)' : ''}:</span> <strong class="text-orange-600">\${fmt(pfi.tax||0)}</strong></div>
      <div><span class="text-gray-500">Grand Total:</span> <strong class="text-blue-700">\${fmt(pfi.totalAmount||(pfi.totalEstimate+(pfi.tax||0)))}</strong></div>
    </div>
    \${servicesBreakdownHtml}
    \${partsBreakdownHtml}
  \`;

  // Pre-fill email
  document.getElementById('sendPFI-email').value   = customer?.email || '';
  // Pre-fill subject
  document.getElementById('sendPFI-subject').value = \`Pro Forma Invoice – \${job?.jobCardNumber||'PFI-'+pfi.id.toUpperCase()} | AutoFix GMS\`;

  // Build services lines for email body
  const servicesLines = services.length
    ? services.map(sv => '    ' + sv.serviceName + (sv.quantity > 1 ? ' ×' + sv.quantity : '') + '  [' + sv.category + ']  = ' + fmt(sv.totalCost)).join(String.fromCharCode(10))
    : '';

  // Build parts lines for email body
  const partsLines = parts && parts.length
    ? parts.map(p => '    ' + p.partName + ' ×' + p.quantity + '  @ ' + fmt(p.unitCost) + '  = ' + fmt(p.totalCost)).join(String.fromCharCode(10))
    : '';

  const itemsSection = (servicesLines || partsLines)
    ? (servicesLines ? 'Services:' + String.fromCharCode(10) + servicesLines + String.fromCharCode(10) : '') +
      (partsLines ? (servicesLines ? String.fromCharCode(10) : '') + 'Parts Consumed:' + String.fromCharCode(10) + partsLines + String.fromCharCode(10) : '')
    : '    (none)' + String.fromCharCode(10);

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
\${insuranceExtra}\${claimExtra}
\${itemsSection}
  Labour Cost:    \${fmt(pfi.labourCost)}
  Services+Parts: \${fmt(pfi.partsCost)}
  Total Estimate: \${fmt(pfi.totalEstimate)}
  Tax/VAT\${(pfi.tax||0) > 0 ? ' (18%)' : ''}:  \${fmt(pfi.tax||0)}
  Grand Total:    \${fmt(pfi.totalAmount||(pfi.totalEstimate+(pfi.tax||0)))}

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
  const [pfiData, jobData, partsData] = await Promise.all([
    axios.get('/api/pfis'),
    axios.get('/api/jobcards'),
    axios.get('/api/parts/all')
  ]);
  allPFIs = pfiData.data;
  allJobCards = jobData.data;
  _allPartsConsumption = partsData.data;
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

    // Parts consumed for this job
    const jobParts = _allPartsConsumption.filter(p => p.jobCardId === pfi.jobCardId);
    const partsBreakdownHtml = jobParts.length
      ? \`<div class="mb-3">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1.5">Parts Consumed</p>
          <div class="space-y-1">
            \${jobParts.map(p => \`
              <div class="text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 truncate max-w-[65%]">\${p.partName} <span class="text-gray-400">×\${p.quantity}</span></span>
                  <span class="font-semibold text-gray-700">\${fmt(p.totalCost)}</span>
                </div>
                \${(p.batchNumber || p.partSerialNumber) ? \`<div class="flex items-center gap-2 mt-0.5">
                  \${p.batchNumber ? \`<span class="font-mono text-blue-600 bg-blue-50 px-1 rounded text-xs"><i class="fas fa-barcode mr-0.5"></i>\${p.batchNumber}</span>\` : ''}
                  \${p.partSerialNumber ? \`<span class="font-mono text-gray-500 bg-gray-100 px-1 rounded text-xs">#\${p.partSerialNumber}</span>\` : ''}
                </div>\` : ''}
              </div>\`).join('')}
          </div>
          <div class="border-t border-gray-100 mt-2"></div>
        </div>\`
      : '';

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
          \${partsBreakdownHtml}
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Labour</span><span class="font-semibold">\${fmt(pfi.labourCost)}</span></div>
          <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Parts Total</span><span class="font-semibold">\${fmt(pfi.partsCost)}</span></div>
          \${(pfi.discountAmount||0) > 0 ? \`<div class="flex justify-between text-sm mb-1 text-green-600"><span class="flex items-center gap-1"><i class="fas fa-tag text-xs"></i>Discount\${pfi.discountReason ? ' <span class="text-xs">('+pfi.discountReason+')</span>' : ''}</span><span class="font-semibold">− \${fmt(pfi.discountAmount)}</span></div>\` : ''}
          <div class="flex justify-between text-sm border-t pt-1 mt-1 text-gray-500"><span>Total Estimate</span><span class="font-medium">\${fmt(pfi.totalEstimate)}</span></div>
          <div class="flex justify-between text-sm text-orange-600"><span class="flex items-center gap-1"><i class="fas fa-percent text-xs"></i>Tax / VAT\${(pfi.tax||0) > 0 ? ' (18%)' : ''}</span><span class="font-semibold">\${fmt(pfi.tax||0)}</span></div>
          <div class="flex justify-between text-sm font-bold border-t pt-2"><span>Grand Total</span><span class="text-blue-600">\${fmt(pfi.totalAmount||(pfi.totalEstimate+(pfi.tax||0)))}</span></div>
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
            \${pfi.status === 'Approved' && !_pfiHasInvoice(pfi.jobCardId) ? \`<button class="btn-primary text-xs w-full" style="background:#16a34a" onclick="generateInvoiceFromPFI('\${pfi.id}')"><i class="fas fa-receipt mr-1"></i>Generate Invoice</button>\` : ''}
            \${_pfiHasInvoice(pfi.jobCardId) ? \`<span class="text-xs text-green-600 font-semibold w-full text-center"><i class="fas fa-check-circle mr-1"></i>Invoice Generated</span>\` : ''}
          </div>
          \` : \`
          <div class="flex gap-2">
            \${pfi.status === 'Draft' ? \`<button class="btn-primary text-xs flex-1" onclick="updatePFIStatus('\${pfi.id}','Sent')"><i class="fas fa-paper-plane mr-1"></i>Mark as Sent</button>\` : ''}
            \${(pfi.status === 'Sent') && !_pfiHasInvoice(pfi.jobCardId) ? \`<button class="btn-primary text-xs flex-1" style="background:#16a34a" onclick="generateInvoiceFromPFI('\${pfi.id}')"><i class="fas fa-receipt mr-1"></i>Generate Invoice</button>\` : ''}
            \${pfi.status === 'Sent' && _pfiHasInvoice(pfi.jobCardId) ? \`<span class="text-xs text-green-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>Invoice Generated</span>\` : ''}
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
          \${!_pfiHasInvoice(pfi.jobCardId) ? \`
          <button class="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5" onclick="closeModal('modal-sendPFI');showEditPFIModal('\${pfi.id}')">
            <i class="fas fa-edit"></i> Edit PFI
          </button>\` : ''}
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

// ─── PFI → Invoice helpers ────────────────────────────────────────────────────
function _pfiHasInvoice(jobCardId) {
  return allInvoices.some(function(i) { return i.jobCardId === jobCardId; });
}

async function generateInvoiceFromPFI(pfiId) {
  const pfi = allPFIs.find(function(p) { return p.id === pfiId; });
  if (!pfi) return;
  if (_pfiHasInvoice(pfi.jobCardId)) { showToast('Invoice already exists for this job', 'info'); return; }
  // Open the existing invoice modal pre-filled with PFI values (including discount)
  await showInvoiceModal(pfi.jobCardId, pfi.labourCost, pfi.partsCost, {
    discountType:   pfi.discountType,
    discountValue:  pfi.discountValue,
    discountAmount: pfi.discountAmount || 0,
    discountReason: pfi.discountReason,
  });
}

// ─── Pay Invoice Modal ────────────────────────────────────────────────────────
var _piJobId = null;   // optional job id to refresh after payment

async function showPayInvoiceModal(invId, jobId) {
  _piJobId = jobId || null;
  // Fetch fresh invoice data
  const { data: invList } = await axios.get('/api/invoices');
  allInvoices = invList;
  const inv = invList.find(function(i) { return i.id === invId; });
  if (!inv) return;

  // Populate hidden field
  document.getElementById('pi-inv-id').value = invId;

  // Subtitle
  document.getElementById('pi-subtitle').textContent = inv.invoiceNumber + ' · ' + (inv.customerName || '');

  // Summary strip
  const alreadyPaid = inv.amountPaid || 0;
  const balance = inv.totalAmount - alreadyPaid;
  document.getElementById('pi-total').textContent = fmt(inv.totalAmount);
  document.getElementById('pi-already-paid').textContent = alreadyPaid > 0 ? fmt(alreadyPaid) : 'TZS 0';
  document.getElementById('pi-balance').textContent = fmt(balance);

  // Reset method selection
  document.getElementById('pi-method').value = '';
  document.querySelectorAll('.pi-method-btn').forEach(function(b) {
    b.className = 'pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-sm font-semibold text-gray-600';
    var icon = b.querySelector('i');
    if (icon) icon.className = icon.className.replace(/text-\w+-500/, 'text-gray-400');
  });

  // Pre-fill amount = outstanding balance
  document.getElementById('pi-amount').value = balance > 0 ? balance : inv.totalAmount;
  document.getElementById('pi-reference').value = '';

  // Remaining box
  piUpdateBalance();

  // Payment history
  const historyBox = document.getElementById('pi-history-box');
  const historyList = document.getElementById('pi-history-list');
  if (inv.payments && inv.payments.length) {
    historyBox.classList.remove('hidden');
    const methodIcon = function(m) { return m === 'Mobile Money' ? 'fa-mobile-alt' : m === 'Bank' ? 'fa-university' : m === 'Cash' ? 'fa-money-bill-wave' : 'fa-hashtag'; };
    historyList.innerHTML = inv.payments.map(function(p) {
      return '<div class="flex items-center justify-between py-1 border-b border-gray-50">' +
        '<span class="text-gray-500"><i class="fas ' + methodIcon(p.method) + ' mr-1"></i>' + p.method + (p.reference ? ' · ' + p.reference : '') + '</span>' +
        '<span class="font-semibold text-gray-700">' + fmt(p.amount) + '</span>' +
        '<span class="text-gray-400">' + (p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '') + '</span>' +
      '</div>';
    }).join('');
  } else {
    historyBox.classList.add('hidden');
  }

  openModal('modal-payInvoice');
}

function piSelectMethod(method) {
  document.getElementById('pi-method').value = method;
  var colors = { 'Mobile Money': 'green', 'Bank': 'blue', 'Lipa Number': 'purple', 'Cash': 'orange' };
  var iconColors = { 'Mobile Money': 'text-green-600', 'Bank': 'text-blue-600', 'Lipa Number': 'text-purple-600', 'Cash': 'text-orange-600' };
  document.querySelectorAll('.pi-method-btn').forEach(function(b) {
    var m = b.getAttribute('data-method');
    var c = colors[m] || 'gray';
    if (m === method) {
      b.className = 'pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-' + c + '-500 bg-' + c + '-50 text-' + c + '-700 transition-all text-sm font-semibold';
      var icon = b.querySelector('i');
      if (icon) { icon.className = icon.className.replace(/text-\w+-\d+/, ''); icon.classList.add(iconColors[m] || 'text-gray-600'); }
    } else {
      b.className = 'pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-' + c + '-400 transition-all text-sm font-semibold text-gray-600';
      var icon = b.querySelector('i');
      if (icon) { icon.className = icon.className.replace(/text-\w+-\d+/, 'text-gray-400'); }
    }
  });
}

function piUpdateBalance() {
  const invId = document.getElementById('pi-inv-id').value;
  const inv = allInvoices.find(function(i) { return i.id === invId; });
  if (!inv) return;
  const entered = parseFloat(document.getElementById('pi-amount').value) || 0;
  const alreadyPaid = inv.amountPaid || 0;
  const totalAfter = alreadyPaid + entered;
  const remaining = inv.totalAmount - totalAfter;
  const box = document.getElementById('pi-remaining-box');
  const lbl = document.getElementById('pi-remaining-label');
  const val = document.getElementById('pi-remaining-val');
  if (entered > 0) {
    box.classList.remove('hidden');
    if (remaining <= 0) {
      box.className = 'rounded-xl p-3 mb-5 text-sm bg-green-50 border border-green-200';
      lbl.textContent = '✓ Fully paid — invoice will be marked Paid';
      lbl.className = 'font-semibold text-green-700';
      val.textContent = '';
    } else {
      box.className = 'rounded-xl p-3 mb-5 text-sm bg-amber-50 border border-amber-200';
      lbl.textContent = 'Balance remaining:';
      lbl.className = 'font-semibold text-amber-700';
      val.className = 'font-bold text-lg text-amber-700';
      val.textContent = fmt(remaining);
    }
  } else {
    box.classList.add('hidden');
  }
}

function piSetFull() {
  const invId = document.getElementById('pi-inv-id').value;
  const inv = allInvoices.find(function(i) { return i.id === invId; });
  if (!inv) return;
  document.getElementById('pi-amount').value = inv.totalAmount - (inv.amountPaid || 0);
  piUpdateBalance();
}

function piSetHalf() {
  const invId = document.getElementById('pi-inv-id').value;
  const inv = allInvoices.find(function(i) { return i.id === invId; });
  if (!inv) return;
  document.getElementById('pi-amount').value = Math.round(inv.totalAmount / 2);
  piUpdateBalance();
}

async function submitPayInvoice() {
  const invId = document.getElementById('pi-inv-id').value;
  const method = document.getElementById('pi-method').value;
  const amount = parseFloat(document.getElementById('pi-amount').value) || 0;
  const reference = document.getElementById('pi-reference').value.trim();

  if (!method) { showToast('Please select a payment method', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter the amount received', 'error'); return; }

  const btn = document.getElementById('pi-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Processing…';

  try {
    await axios.patch('/api/invoices/' + invId + '/status', {
      paymentMethod: method,
      paymentReference: reference || undefined,
      amountPaid: amount,
      paidAt: new Date().toISOString(),
    });

    const inv = allInvoices.find(function(i) { return i.id === invId; });
    const total = inv ? inv.totalAmount : 0;
    const alreadyPaid = inv ? (inv.amountPaid || 0) : 0;
    const isFullyPaid = (alreadyPaid + amount) >= total;

    closeModal('modal-payInvoice');
    showToast(isFullyPaid ? 'Invoice fully paid via ' + method + '!' : 'Partial payment of ' + fmt(amount) + ' recorded', 'success');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Record Payment';

    // Sync all finance-related views (non-blocking — don't let UI refresh mask success)
    try { syncFinance(); } catch(_) {}
    if (_piJobId) { try { viewJobDetail(_piJobId); } catch(_) {} }
  } catch(e) {
    console.error('submitPayInvoice error:', e);
    showToast('Could not record payment: ' + (e?.response?.data?.error || e?.message || 'Unknown error'), 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Record Payment';
  }
}

// ═══ INVOICES ═══
var _invCurrentFilter = 'all';

// Navigate to Invoices page and immediately apply a status filter
function navToInvoices(filter) {
  _invCurrentFilter = filter;   // set filter BEFORE showPage triggers loadInvoices
  showPage('invoices');
}

async function loadInvoices() {
  const { data } = await axios.get('/api/invoices');
  allInvoices = data;
  const total = data.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0)
              + data.filter(i => i.status === 'Partially Paid').reduce((s, i) => s + (i.amountPaid || 0), 0);
  document.getElementById('totalRevDisplay').textContent = fmt(total);

  // Populate stat pills
  const allCount     = data.length;
  const paidCount    = data.filter(i => i.status === 'Paid').length;
  const overdueCount = data.filter(i => i.status === 'Overdue').length;
  const outstandingCount = data.filter(i => i.status === 'Issued' || i.status === 'Draft' || i.status === 'Partially Paid').length;

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('invStatAll',         allCount);
  el('invStatPaid',        paidCount);
  el('invStatOverdue',     overdueCount);
  el('invStatOutstanding', outstandingCount);

  // Render with current filter AND sync tab button styles
  invFilterBy(_invCurrentFilter);

  // Auto-refresh finance summary cards
  loadFinanceSummaryCards();
}

function invFilterBy(filter) {
  _invCurrentFilter = filter;
  // Update tab button styles
  document.querySelectorAll('.inv-tab-btn').forEach(function(b) {
    const tabId = b.id.replace('invTab-', '');
    const isActive = tabId === filter;
    const colorMap = {
      'all': 'indigo', 'Paid': 'green', 'outstanding': 'amber',
      'Overdue': 'red', 'Partially Paid': 'orange', 'Draft': 'gray'
    };
    const c = colorMap[tabId] || 'indigo';
    if (isActive) {
      b.className = \`inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-\${c}-500 bg-\${c}-500 text-white transition-all\`;
    } else {
      b.className = \`inv-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-\${c}-400 transition-all\`;
    }
  });
  _renderInvoicesTable(allInvoices, filter);
}

function _renderInvoicesTable(data, filter) {
  const methodIcon = (m) => m === 'Mobile Money' ? 'fa-mobile-alt' : m === 'Bank' ? 'fa-university' : m === 'Lipa Number' ? 'fa-hashtag' : m === 'Cash' ? 'fa-money-bill-wave' : '';
  const methodColor = (m) => m === 'Mobile Money' ? 'text-green-600' : m === 'Bank' ? 'text-blue-600' : m === 'Lipa Number' ? 'text-purple-600' : m === 'Cash' ? 'text-orange-600' : 'text-gray-500';

  // Filter rows
  let filtered = data;
  if (filter === 'outstanding') {
    filtered = data.filter(i => i.status === 'Issued' || i.status === 'Draft' || i.status === 'Partially Paid');
  } else if (filter !== 'all') {
    filtered = data.filter(i => i.status === filter);
  }

  // Sort: Overdue first, then by issuedAt desc
  filtered = [...filtered].sort((a, b) => {
    const ov = (s) => s === 'Overdue' ? 0 : s === 'Issued' || s === 'Partially Paid' ? 1 : 2;
    if (ov(a.status) !== ov(b.status)) return ov(a.status) - ov(b.status);
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });

  const tbody = document.getElementById('invoicesTable');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(inv => {
    const statusClass = inv.status === 'Paid' ? 'bg-green-100 text-green-700'
      : inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700'
      : inv.status === 'Overdue' ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';
    const canPay = inv.status !== 'Paid';
    const methodHtml = inv.paymentMethod
      ? \`<span class="inline-flex items-center gap-1 text-xs font-semibold \${methodColor(inv.paymentMethod)}"><i class="fas \${methodIcon(inv.paymentMethod)}"></i>\${inv.paymentMethod}</span>\`
      : '<span class="text-gray-300 text-xs">—</span>';
    const amountPaidHtml = inv.amountPaid
      ? \`<span class="font-semibold \${inv.status === 'Paid' ? 'text-green-600' : 'text-amber-600'}">\${fmt(inv.amountPaid)}</span>\`
      : '<span class="text-gray-300 text-xs">—</span>';
    const rowHighlight = inv.status === 'Overdue' ? 'bg-red-50/40' : inv.status === 'Partially Paid' ? 'bg-amber-50/30' : '';
    return \`
    <tr class="table-row border-b border-gray-50 \${rowHighlight} cursor-pointer" onclick="showInvoiceDetail('\${inv.id}', event)">
      <td class="px-4 py-3 font-bold text-blue-600 text-sm">\${inv.invoiceNumber}</td>
      <td class="px-4 py-3 text-sm font-medium text-gray-700">\${inv.jobCardNumber||'—'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">\${inv.customerName||'—'}</td>
      <td class="px-4 py-3 font-bold text-gray-800">
        \${fmt(inv.totalAmount)}
        \${(inv.discountAmount||0)>0 ? \`<span class="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700"><i class="fas fa-tag"></i> −\${fmt(inv.discountAmount)}</span>\` : ''}
      </td>
      <td class="px-4 py-3 text-xs text-gray-400">\${inv.dueDate||'—'}</td>
      <td class="px-4 py-3 text-xs text-gray-400">\${inv.paidAt ? fmtDate(inv.paidAt) : '—'}</td>
      <td class="px-4 py-3">\${methodHtml}</td>
      <td class="px-4 py-3">\${amountPaidHtml}</td>
      <td class="px-4 py-3"><span class="badge \${statusClass}">\${inv.status}</span></td>
      <td class="px-4 py-3" onclick="event.stopPropagation()">
        <div class="flex items-center gap-1.5">
          \${canPay ? \`<button class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap" onclick="showPayInvoiceModal('\${inv.id}')"><i class="fas fa-money-bill-wave mr-1"></i>\${inv.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment'}</button>\` : ''}
          <button class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap" onclick="downloadInvoice('\${inv.id}')" title="Download PDF"><i class="fas fa-download mr-1"></i>PDF</button>
        </div>
      </td>
    </tr>\`;
  }).join('') || \`<tr><td colspan="10" class="text-center py-12 text-gray-400"><i class="fas fa-file-invoice text-3xl mb-3 block"></i>No \${filter === 'all' ? '' : filter + ' '}invoices</td></tr>\`;
}

// ─── Invoice Detail Modal ───────────────────────────────────────────────────
var _invDetailId = null;

function showInvoiceDetail(invId, event) {
  // Don't open if a button inside the row was clicked
  if (event && event.target.closest('button')) return;
  const inv = allInvoices.find(i => i.id === invId);
  if (!inv) return;
  _invDetailId = invId;

  const fmt2 = (n) => 'TZS ' + Number(n||0).toLocaleString();
  const fmtDt = (s) => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const fmtTs = (s) => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  // Header
  document.getElementById('invd-number').textContent = inv.invoiceNumber;
  document.getElementById('invd-subtitle').textContent = (inv.customerName || '') + (inv.jobCardNumber ? ' · ' + inv.jobCardNumber : '');

  // Status badge
  const badge = document.getElementById('invd-status-badge');
  badge.textContent = inv.status;
  badge.className = 'badge text-sm px-3 py-1 '
    + (inv.status === 'Paid' ? 'bg-green-100 text-green-700'
    : inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700'
    : inv.status === 'Overdue' ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600');

  // Progress bar
  const total    = inv.totalAmount || 0;
  const paid     = inv.amountPaid  || 0;
  const pct      = total > 0 ? Math.min(100, Math.round(paid / total * 100)) : (inv.status === 'Paid' ? 100 : 0);
  const barColor = inv.status === 'Paid' ? 'bg-green-500'
                 : inv.status === 'Overdue' ? 'bg-red-500'
                 : inv.status === 'Partially Paid' ? 'bg-amber-500'
                 : 'bg-gray-300';
  document.getElementById('invd-progress-bar').style.width = pct + '%';
  document.getElementById('invd-progress-bar').className = 'h-2 rounded-full transition-all ' + barColor;
  document.getElementById('invd-progress-label').textContent = fmt2(paid) + ' / ' + fmt2(total);

  // Details grid
  document.getElementById('invd-jobcard').textContent  = inv.jobCardNumber  || '—';
  document.getElementById('invd-customer').textContent = inv.customerName   || '—';
  document.getElementById('invd-issued').textContent   = fmtDt(inv.issuedAt);
  document.getElementById('invd-due').textContent      = inv.dueDate ? inv.dueDate : '—';

  const claimRow = document.getElementById('invd-claim-row');
  const pfiRow   = document.getElementById('invd-pfi-row');
  if (inv.claimReference) {
    document.getElementById('invd-claim').textContent = inv.claimReference;
    claimRow.classList.remove('hidden');
  } else { claimRow.classList.add('hidden'); }
  if (inv.pfiReference) {
    document.getElementById('invd-pfi').textContent = inv.pfiReference;
    pfiRow.classList.remove('hidden');
  } else { pfiRow.classList.add('hidden'); }

  // Cost breakdown
  document.getElementById('invd-labour').textContent = fmt2(inv.labourCost);
  document.getElementById('invd-parts').textContent  = fmt2(inv.partsCost);
  document.getElementById('invd-tax').textContent    = fmt2(inv.tax);
  document.getElementById('invd-total').textContent  = fmt2(inv.totalAmount);

  // Discount row
  const discRow    = document.getElementById('invd-discount-row');
  const discSpan   = document.getElementById('invd-discount');
  const discReason = document.getElementById('invd-discount-reason');
  if (discRow && discSpan) {
    if ((inv.discountAmount || 0) > 0) {
      discSpan.textContent   = '− ' + fmt2(inv.discountAmount);
      if (discReason) discReason.textContent = inv.discountReason ? '(' + inv.discountReason + ')' : '';
      discRow.style.removeProperty('display');
    } else {
      discRow.style.display = 'none';
    }
  }

  // Payment history
  const methodIcon  = (m) => m === 'Mobile Money' ? 'fa-mobile-alt' : m === 'Bank' ? 'fa-university' : m === 'Lipa Number' ? 'fa-hashtag' : m === 'Cash' ? 'fa-money-bill-wave' : 'fa-credit-card';
  const methodColor = (m) => m === 'Mobile Money' ? 'text-green-600' : m === 'Bank' ? 'text-blue-600' : m === 'Lipa Number' ? 'text-purple-600' : m === 'Cash' ? 'text-orange-600' : 'text-gray-500';
  const paySection  = document.getElementById('invd-payment-section');
  const payList     = document.getElementById('invd-payment-list');

  const payments = inv.payments || [];
  if (payments.length) {
    paySection.classList.remove('hidden');
    payList.innerHTML = payments.map(p => \`
      <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <i class="fas \${methodIcon(p.method)} \${methodColor(p.method)} text-sm flex-shrink-0"></i>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-sm font-bold text-gray-800">\${fmt2(p.amount)}</span>
              <span class="text-xs text-gray-400">via \${p.method}</span>
              \${p.reference ? \`<span class="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">\${p.reference}</span>\` : ''}
            </div>
            <span class="text-xs text-gray-400">\${fmtTs(p.paidAt)}</span>
          </div>
        </div>
        \${p.id ? \`
        <div class="flex items-center gap-1 flex-shrink-0">
          <button onclick="openEditPayment('\${inv.id}', '\${p.id}')"
            class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit payment">
            <i class="fas fa-pencil-alt text-xs"></i>
          </button>
          <button onclick="confirmRemovePayment('\${inv.id}', '\${p.id}', \${p.amount})"
            class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove payment">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
        \` : ''}
      </div>
    \`).join('');
    // Balance row
    if (inv.status !== 'Paid') {
      const balance = total - paid;
      payList.innerHTML += \`
        <div class="flex justify-between items-center px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
          <span class="font-semibold text-amber-700">Balance remaining</span>
          <span class="font-bold text-amber-700">\${fmt2(balance)}</span>
        </div>
      \`;
    }
  } else if (inv.status === 'Paid' && inv.paidAt) {
    paySection.classList.remove('hidden');
    payList.innerHTML = \`
      <div class="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 border border-green-100">
        <div class="flex items-center gap-2">
          <i class="fas fa-check-circle text-green-600 text-sm"></i>
          <span class="text-sm font-semibold text-gray-700">\${fmt2(total)}</span>
          \${inv.paymentMethod ? \`<span class="text-xs text-gray-400">via \${inv.paymentMethod}</span>\` : ''}
        </div>
        <span class="text-xs text-gray-400">\${fmtTs(inv.paidAt)}</span>
      </div>
    \`;
  } else {
    paySection.classList.add('hidden');
  }

  // Pay button
  const payBtn = document.getElementById('invd-pay-btn');
  if (inv.status !== 'Paid') {
    payBtn.classList.remove('hidden');
    payBtn.innerHTML = \`<i class="fas fa-money-bill-wave mr-1.5"></i>\${inv.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment'}\`;
  } else {
    payBtn.classList.add('hidden');
  }

  openModal('modal-invoiceDetail');
}

function _invdPay() {
  closeModal('modal-invoiceDetail');
  if (_invDetailId) showPayInvoiceModal(_invDetailId);
}

function _invdDownload() {
  if (_invDetailId) downloadInvoice(_invDetailId);
}

// ─── Invoice PDF Download ──────────────────────────────────────────────────────

async function downloadInvoice(invId) {
  const inv = allInvoices.find(i => i.id === invId);
  if (!inv) return;
  showToast('Generating PDF…');
  try {
    // Fetch full job detail (services + parts + customer + vehicle)
    const { data: job } = await axios.get('/api/jobcards/' + inv.jobCardId);
    const doc = buildInvoiceDoc(inv, job);
    const filename = inv.invoiceNumber.split('/').join('-') + '-' + (job.customer?.name || 'Customer').split(' ').join('_') + '.pdf';
    doc.save(filename);
    showToast('✅ ' + filename + ' downloaded');
  } catch(e) {
    showToast('Failed to generate PDF', 'error');
  }
}

function buildInvoiceDoc(inv, job) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const customer = job?.customer  || {};
  const vehicle  = job?.vehicle   || {};
  const services = job?.services  || [];
  const parts    = job?.parts     || [];

  const pageW = 210, margin = 18, contentW = pageW - margin * 2;
  let y = 0;

  // ── Status colours ─────────────────────────────────────────────────────────
  const statusColors = {
    'Paid':           [22,  163, 74],
    'Partially Paid': [217, 119, 6],
    'Overdue':        [220, 38,  38],
    'Issued':         [37,  99,  235],
    'Draft':          [100, 116, 139],
    'Outstanding':    [37,  99,  235],
  };
  const sc = statusColors[inv.status] || [100, 116, 139];

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AutoFix GMS', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Garage Management System', margin, 23);
  doc.text('Tel: +255 700 000 000  |  info@autofixgms.co.tz', margin, 29);
  doc.text('P.O. Box 12345, Dar es Salaam, Tanzania', margin, 35);

  // INVOICE label top-right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('INVOICE', pageW - margin, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(inv.invoiceNumber, pageW - margin, 26, { align: 'right' });
  doc.text('Issued: ' + (inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'), pageW - margin, 32, { align: 'right' });
  if (inv.dueDate) doc.text('Due: ' + inv.dueDate, pageW - margin, 38, { align: 'right' });
  y = 52;

  // ── Status badge strip ──────────────────────────────────────────────────────
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const statusLabel = inv.status.toUpperCase();
  const amtPaid = inv.amountPaid || 0;
  const balance = Math.max(0, (inv.totalAmount || 0) - amtPaid);
  let statusRight = '';
  if (inv.status === 'Paid') {
    statusRight = 'Paid in full – ' + fmt(inv.totalAmount);
  } else if (inv.status === 'Partially Paid') {
    statusRight = 'Paid: ' + fmt(amtPaid) + '  |  Balance: ' + fmt(balance);
  } else if (inv.status === 'Overdue') {
    statusRight = 'OVERDUE – ' + fmt(inv.totalAmount) + ' outstanding';
  } else {
    statusRight = 'Amount Due: ' + fmt(inv.totalAmount);
  }
  doc.text(statusLabel, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(statusRight, pageW - margin - 4, y + 6, { align: 'right' });
  y += 16;

  // ── Bill To + Vehicle info ───────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentW / 2 - 4, 38, 3, 3, 'F');
  doc.roundedRect(margin + contentW / 2 + 4, y, contentW / 2 - 4, 38, 3, 3, 'F');

  // Bill To
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('BILL TO', margin + 4, y + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
  doc.text(customer.name || '—', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  if (customer.phone)   doc.text(customer.phone,   margin + 4, y + 20);
  if (customer.email)   doc.text(customer.email,   margin + 4, y + 26);
  if (customer.address) doc.text(customer.address, margin + 4, y + 32);

  // Vehicle info
  const vx = margin + contentW / 2 + 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('VEHICLE', vx, y + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
  doc.text((vehicle.registrationNumber || '—'), vx, y + 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  if (vehicle.make || vehicle.model) doc.text((vehicle.make || '') + ' ' + (vehicle.model || ''), vx, y + 20);
  if (vehicle.year)                  doc.text('Year: ' + vehicle.year, vx, y + 26);
  if (job?.jobCardNumber)            doc.text('Job Card: ' + job.jobCardNumber, vx, y + 32);
  y += 46;

  // ── Services table ──────────────────────────────────────────────────────────
  if (services.length) {
    doc.setFillColor(88, 28, 135);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('SERVICES', margin + 3, y + 5.5);
    y += 8;
    // Column headers
    doc.setFillColor(248, 245, 255);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('#',        margin + 3,               y + 5);
    doc.text('Service',  margin + 10,              y + 5);
    doc.text('Category', margin + contentW * 0.55, y + 5);
    doc.text('Qty',      margin + contentW * 0.75, y + 5);
    doc.text('Total',    margin + contentW - 3,    y + 5, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    services.forEach((sv, i) => {
      if (i % 2 === 0) { doc.setFillColor(252, 250, 255); doc.rect(margin, y, contentW, 7, 'F'); }
      doc.setTextColor(30, 41, 59);
      doc.text(String(i + 1), margin + 3, y + 5);
      const nm = sv.serviceName.length > 32 ? sv.serviceName.substring(0, 30) + '…' : sv.serviceName;
      doc.text(nm,            margin + 10,              y + 5);
      doc.text(sv.category,   margin + contentW * 0.55, y + 5);
      doc.text(String(sv.quantity), margin + contentW * 0.75, y + 5);
      doc.text(fmt(sv.totalCost), margin + contentW - 3, y + 5, { align: 'right' });
      y += 7;
    });
    // Services subtotal
    const svcTotal = services.reduce((s, sv) => s + sv.totalCost, 0);
    doc.setFillColor(245, 240, 255);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(88, 28, 135);
    doc.text('Services Total', margin + contentW * 0.55, y + 5);
    doc.text(fmt(svcTotal), margin + contentW - 3, y + 5, { align: 'right' });
    y += 11;
  }

  // ── Parts & Materials table ─────────────────────────────────────────────────
  if (parts.length) {
    doc.setFillColor(30, 64, 175);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PARTS & MATERIALS', margin + 3, y + 5.5);
    y += 8;
    // Column headers
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('#',           margin + 3,               y + 5);
    doc.text('Part / Description', margin + 10,       y + 5);
    doc.text('Qty',         margin + contentW * 0.65, y + 5);
    doc.text('Unit Cost',   margin + contentW * 0.76, y + 5);
    doc.text('Total',       margin + contentW - 3,    y + 5, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    parts.forEach((p, i) => {
      // Calculate row height: extra line if batch or serial number exists
      const hasMeta = !!(p.batchNumber || p.partSerialNumber);
      const rowH = hasMeta ? 11 : 7;
      if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, contentW, rowH, 'F'); }
      doc.setTextColor(30, 41, 59);
      doc.text(String(i + 1),      margin + 3,               y + 5);
      const nm = (p.partName || '').length > 35 ? (p.partName || '').substring(0, 33) + '…' : (p.partName || '');
      doc.text(nm,                  margin + 10,              y + 5);
      doc.text(String(p.quantity),  margin + contentW * 0.65, y + 5);
      doc.text(fmt(p.unitCost),     margin + contentW * 0.76, y + 5);
      doc.text(fmt(p.totalCost),    margin + contentW - 3,    y + 5, { align: 'right' });
      // Batch # and Part # sub-line
      if (hasMeta) {
        doc.setFontSize(7); doc.setTextColor(100, 116, 139);
        let metaStr = '';
        if (p.batchNumber)      metaStr += 'Batch: ' + p.batchNumber;
        if (p.partSerialNumber) metaStr += (metaStr ? '  |  ' : '') + 'Part #: ' + p.partSerialNumber;
        doc.text(metaStr, margin + 10, y + 9.5);
        doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      }
      y += rowH;
    });
    // Parts subtotal
    const partsTotal = parts.reduce((s, p) => s + p.totalCost, 0);
    doc.setFillColor(239, 246, 255);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(30, 64, 175);
    doc.text('Parts Total', margin + contentW * 0.65, y + 5);
    doc.text(fmt(partsTotal), margin + contentW - 3, y + 5, { align: 'right' });
    y += 11;
  }

  // ── Cost Summary ────────────────────────────────────────────────────────────
  y += 2;
  const sumX = margin + contentW * 0.52, sumW = contentW * 0.48;
  const drawSumRow = (label, value, bold, bgRgb) => {
    if (bgRgb) { doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]); doc.roundedRect(sumX, y, sumW, 8, 1, 1, 'F'); }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(bold ? 30 : 71, bold ? 41 : 85, bold ? 59 : 105);
    doc.text(label, sumX + 4, y + 5.5);
    doc.text(value, sumX + sumW - 3, y + 5.5, { align: 'right' });
    y += 8;
  };
  const labour    = inv.labourCost  || 0;
  const svcParts  = inv.partsCost   || 0;
  const disc      = inv.discountAmount || 0;
  const tax       = inv.tax         || 0;
  const total     = inv.totalAmount || 0;

  drawSumRow('Labour',            fmt(labour),   false, null);
  drawSumRow('Services + Parts',  fmt(svcParts), false, null);
  if (disc > 0) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(sumX, y, sumW, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(21, 128, 61);
    doc.text('Discount' + (inv.discountReason ? ' (' + inv.discountReason + ')' : ''), sumX + 4, y + 5.5);
    doc.text('− ' + fmt(disc), sumX + sumW - 3, y + 5.5, { align: 'right' });
    y += 8;
  }
  drawSumRow('Tax / VAT (18%)',   fmt(tax),      false, null);
  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(sumX, y, sumX + sumW, y);
  y += 3;
  drawSumRow('TOTAL',             fmt(total),    true,  [sc[0], sc[1], sc[2]]);
  // Overlay white text for the total row (coloured background)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TOTAL',   sumX + 4,         y - 2.5);
  doc.text(fmt(total), sumX + sumW - 3, y - 2.5, { align: 'right' });
  y += 4;

  // ── Payment History ─────────────────────────────────────────────────────────
  const payments = inv.payments || [];
  if (payments.length || (inv.status === 'Paid' && inv.paidAt)) {
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    doc.text('PAYMENT HISTORY', margin, y + 5);
    y += 9;
    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('Date',   margin + 3,               y + 5);
    doc.text('Method', margin + contentW * 0.28,  y + 5);
    doc.text('Reference', margin + contentW * 0.52, y + 5);
    doc.text('Amount',    margin + contentW - 3,    y + 5, { align: 'right' });
    y += 7;

    const payRows = payments.length ? payments : [{
      paidAt: inv.paidAt, method: inv.paymentMethod || '—',
      reference: inv.paymentReference, amount: total
    }];
    payRows.forEach((p, i) => {
      if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, contentW, 7, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      const dt = p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      doc.text(dt,              margin + 3,               y + 5);
      doc.text(p.method || '—', margin + contentW * 0.28, y + 5);
      doc.text(p.reference || '—', margin + contentW * 0.52, y + 5);
      doc.text(fmt(p.amount),   margin + contentW - 3,    y + 5, { align: 'right' });
      y += 7;
    });

    // Balance row (if not fully paid)
    if (inv.status !== 'Paid' && balance > 0) {
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(146, 64, 14);
      doc.text('Balance Remaining', margin + 3, y + 5.5);
      doc.text(fmt(balance), margin + contentW - 3, y + 5.5, { align: 'right' });
      y += 8;
    }
    y += 4;
  }

  // ── Paid / Overdue watermark diagonal across centre ──────────────────────────
  if (inv.status === 'Paid') {
    doc.setTextColor(200, 240, 210);  // very light green — no GState needed
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(72);
    doc.text('PAID', pageW / 2, 200, { align: 'center', angle: 45 });
    doc.setTextColor(30, 41, 59);     // restore normal text colour
  } else if (inv.status === 'Overdue') {
    doc.setTextColor(255, 200, 200);  // very light red
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(72);
    doc.text('OVERDUE', pageW / 2, 200, { align: 'center', angle: 45 });
    doc.setTextColor(30, 41, 59);     // restore
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageH = 297;
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageH - 24, pageW, 24, 'F');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('This is an official tax invoice. Please retain for your records.', pageW / 2, pageH - 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('AutoFix GMS  |  Tel: +255 700 000 000  |  info@autofixgms.co.tz  |  P.O. Box 12345, Dar es Salaam', pageW / 2, pageH - 10, { align: 'center' });
  doc.text('Generated: ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), pageW / 2, pageH - 4, { align: 'center' });

  return doc;
}

// ─── Edit Payment ─────────────────────────────────────────────────────────────
var _epInvId = null;
var _epPayId = null;

function openEditPayment(invId, payId) {
  const inv = allInvoices.find(i => i.id === invId);
  if (!inv) return;
  const payment = (inv.payments || []).find(p => p.id === payId);
  if (!payment) return;

  _epInvId = invId;
  _epPayId = payId;

  // Pre-fill form
  document.getElementById('ep-amount').value    = payment.amount;
  document.getElementById('ep-reference').value = payment.reference || '';

  // Format datetime-local (needs YYYY-MM-DDTHH:MM)
  const dt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const localDt = dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate())
    + 'T' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
  document.getElementById('ep-date').value = localDt;

  // Reset + select method
  document.getElementById('ep-method').value = '';
  document.querySelectorAll('.ep-method-btn').forEach(function(b) {
    const m = b.getAttribute('data-method');
    const colorMap = { 'Mobile Money':'green', 'Bank':'blue', 'Lipa Number':'purple', 'Cash':'orange' };
    const c = colorMap[m] || 'gray';
    b.className = \`ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-\${c}-400 transition-all text-xs font-semibold text-gray-600\`;
    b.querySelector('i').className = b.querySelector('i').className.replace(/text-\w+-\d+/, 'text-gray-400');
  });
  if (payment.method) epSelectMethod(payment.method);

  openModal('modal-editPayment');
}

function epSelectMethod(method) {
  document.getElementById('ep-method').value = method;
  const colorMap  = { 'Mobile Money':'green', 'Bank':'blue', 'Lipa Number':'purple', 'Cash':'orange' };
  const iconMap   = { 'Mobile Money':'text-green-600', 'Bank':'text-blue-600', 'Lipa Number':'text-purple-600', 'Cash':'text-orange-600' };
  document.querySelectorAll('.ep-method-btn').forEach(function(b) {
    const m = b.getAttribute('data-method');
    const c = colorMap[m] || 'gray';
    if (m === method) {
      b.className = \`ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-\${c}-500 bg-\${c}-50 text-\${c}-700 transition-all text-xs font-semibold\`;
      const icon = b.querySelector('i');
      if (icon) { icon.className = icon.className.replace(/text-\w+-\d+/, ''); icon.classList.add(iconMap[m] || 'text-gray-600'); }
    } else {
      b.className = \`ep-method-btn flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 hover:border-\${c}-400 transition-all text-xs font-semibold text-gray-600\`;
      const icon = b.querySelector('i');
      if (icon) { icon.className = icon.className.replace(/text-\w+-\d+/, 'text-gray-400'); }
    }
  });
}

async function submitEditPayment() {
  const amount    = parseFloat(document.getElementById('ep-amount').value);
  const method    = document.getElementById('ep-method').value;
  const reference = document.getElementById('ep-reference').value.trim();
  const dateVal   = document.getElementById('ep-date').value;

  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
  if (!method) { showToast('Please select a payment method', 'error'); return; }

  const btn = document.getElementById('ep-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Saving…';

  try {
    await axios.patch(\`/api/invoices/\${_epInvId}/payments/\${_epPayId}\`, {
      amount,
      method,
      reference: reference || undefined,
      paidAt: dateVal ? new Date(dateVal).toISOString() : undefined,
    });
    closeModal('modal-editPayment');
    showToast('Payment updated successfully', 'success');
    await syncFinance();
    // Reopen invoice detail with fresh data
    showInvoiceDetail(_epInvId, null);
  } catch(e) {
    showToast('Could not update payment', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save mr-1.5"></i>Save Changes';
  }
}

function confirmRemovePayment(invId, payId, amount) {
  const fmtAmt = 'TZS ' + Number(amount).toLocaleString();
  if (!confirm(\`Remove this payment of \${fmtAmt}?\n\nThis will reverse the payment and recalculate the invoice balance. Use this only for bounced or incorrect payments.\`)) return;
  removePayment(invId, payId);
}

async function removePayment(invId, payId) {
  try {
    await axios.delete(\`/api/invoices/\${invId}/payments/\${payId}\`);
    showToast('Payment removed. Invoice balance updated.', 'warning');
    await syncFinance();
    // Reopen invoice detail with refreshed data
    showInvoiceDetail(invId, null);
  } catch(e) {
    showToast('Could not remove payment', 'error');
  }
}

// ═══ PACKAGES ═══
async function loadPackages() {
  const { data } = await axios.get('/api/packages');
  allPackages = data;
  const grid = document.getElementById('packagesGrid');
  grid.innerHTML = data.map(function(pkg) {
    const partsCost = (pkg.parts || []).reduce(function(s, p) { return s + (p.quantity * p.unitCost); }, 0);
    const sellPrice = pkg.sellingPrice > 0 ? pkg.sellingPrice : (pkg.labourCost + partsCost);
    const totalCost = pkg.labourCost + partsCost;
    const margin    = sellPrice - totalCost;
    const marginPct = sellPrice > 0 ? Math.round((margin / sellPrice) * 100) : 0;
    const marginColor = marginPct >= 30 ? '#16a34a' : marginPct >= 15 ? '#d97706' : '#dc2626';
    return '<div class="card p-5 flex flex-col">' +
      '<div class="flex items-start gap-3 mb-3">' +
        '<div class="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-box-open text-white"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<h3 class="font-bold text-gray-900">' + pkg.packageName + '</h3>' +
          '<p class="text-xs text-gray-400">' + pkg.estimatedHours + 'h estimated</p>' +
        '</div>' +
        '<div class="flex gap-1 flex-shrink-0">' +
          '<button class="pkg-edit-btn w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" data-id="' + pkg.id + '" title="Edit"><i class="fas fa-pen text-xs"></i></button>' +
          '<button class="pkg-del-btn w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors" data-id="' + pkg.id + '" title="Delete"><i class="fas fa-trash text-xs"></i></button>' +
        '</div>' +
      '</div>' +
      (pkg.description ? '<p class="text-xs text-gray-500 mb-3">' + pkg.description + '</p>' : '') +
      (pkg.parts && pkg.parts.length ? (
        '<div class="bg-gray-50 rounded-xl p-3 mb-3">' +
          '<p class="text-xs font-semibold text-gray-400 uppercase mb-1.5">Included Items</p>' +
          pkg.parts.map(function(p) {
            return '<div class="flex justify-between items-center text-xs py-0.5">' +
              '<span class="text-gray-700 truncate mr-2">' + p.name + (p.quantity > 1 ? ' &times; ' + p.quantity : '') + '</span>' +
              '<span class="text-gray-500 flex-shrink-0">' + fmt(p.unitCost) + '</span>' +
            '</div>';
          }).join('') +
        '</div>'
      ) : '') +
      '<div class="border-t pt-3 mt-auto grid grid-cols-2 gap-2">' +
        '<div class="text-center">' +
          '<p class="text-xs text-gray-400 mb-0.5">Labour</p>' +
          '<p class="text-sm font-bold text-gray-700">' + fmt(pkg.labourCost) + '</p>' +
        '</div>' +
        '<div class="text-center">' +
          '<p class="text-xs text-gray-400 mb-0.5">Parts Cost</p>' +
          '<p class="text-sm font-bold text-gray-700">' + fmt(partsCost) + '</p>' +
        '</div>' +
        '<div class="text-center col-span-2 mt-1 pt-1 border-t border-dashed border-gray-100">' +
          '<p class="text-xs text-gray-400 mb-0.5">Sell Price &rarr; Margin</p>' +
          '<p class="text-sm font-bold text-blue-600">' + fmt(sellPrice) + '</p>' +
          '<p class="text-xs font-bold mt-0.5" style="color:' + marginColor + '">' + fmt(margin) + ' (' + marginPct + '%)</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  // Wire action buttons via event listeners (avoids onclick quote-escaping issues)
  grid.querySelectorAll('.pkg-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { showEditPackageModal(btn.getAttribute('data-id')); });
  });
  grid.querySelectorAll('.pkg-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const pkg = allPackages.find(function(p) { return p.id === btn.getAttribute('data-id'); });
      if (pkg) deletePackage(pkg.id, pkg.packageName);
    });
  });
}

// ─── Package Catalogue Cache ──────────────────────────────────────────────────
let _pkgCatalogueCache = null;

async function _loadPkgCatalogue() {
  if (_pkgCatalogueCache) return _pkgCatalogueCache;
  const [lubs, parts, wash, addons] = await Promise.all([
    axios.get('/api/catalogue/lubricants'),
    axios.get('/api/catalogue/parts'),
    axios.get('/api/catalogue/carwash'),
    axios.get('/api/catalogue/addons'),
  ]);
  const items = [];
  (lubs.data || []).forEach(function(l) {
    items.push({
      source: 'Lubricant', sourceColor: '#2563eb',
      id: l.id, name: l.description,
      unitCost: l.sellingPrice, buyingCost: l.buyingPrice,
      stock: l.stockQuantity, stockLabel: l.stockQuantity + ' units',
      meta: l.brand + ' · ' + l.lubricantType + (l.viscosity && l.viscosity !== 'N/A' ? ' · ' + l.viscosity : '') + ' · ' + l.volume,
    });
  });
  (parts.data || []).forEach(function(p) {
    items.push({
      source: 'Part', sourceColor: '#7c3aed',
      id: p.id, name: p.description,
      unitCost: p.sellingPrice, buyingCost: p.buyingPrice,
      stock: p.stockQuantity, stockLabel: p.stockQuantity + ' units',
      meta: p.category + (p.compatibleModels ? ' · ' + p.compatibleModels.split(',').slice(0,2).join(', ') : ''),
    });
  });
  (wash.data || []).forEach(function(w) {
    items.push({
      source: 'Car Wash', sourceColor: '#0891b2',
      id: w.id, name: w.name,
      unitCost: w.price || 0, buyingCost: 0,
      stock: null, stockLabel: 'Service',
      meta: w.type + (w.description ? ' · ' + w.description.substring(0, 50) : ''),
    });
  });
  (addons.data || []).forEach(function(a) {
    items.push({
      source: 'Add-on', sourceColor: '#d97706',
      id: a.id, name: a.name,
      unitCost: a.price, buyingCost: 0,
      stock: null, stockLabel: a.unit || 'Per Job',
      meta: a.category + (a.description ? ' · ' + a.description.substring(0, 50) : ''),
    });
  });
  _pkgCatalogueCache = items;
  return items;
}

// ─── Package Modal helpers ────────────────────────────────────────────────────
let _pkgItems = []; // each: { id, name, source, quantity, unitCost, buyingCost, stock }
let _pkgItemSearchTimer = null;

function pkgRecalc() {
  const labour   = parseFloat(document.getElementById('pkg-labour').value) || 0;
  const override = parseFloat(document.getElementById('pkg-sellPrice').value) || 0;
  const partsCost = _pkgItems.reduce(function(s, it) {
    return s + (it ? it.quantity * it.unitCost : 0);
  }, 0);
  const sellPrice = override > 0 ? override : (labour + partsCost);
  const totalCost = labour + partsCost;
  const margin    = sellPrice - totalCost;
  const marginPct = sellPrice > 0 ? Math.round((margin / sellPrice) * 100) : 0;
  const bar = document.getElementById('pkg-margin-bar');
  if (labour > 0 || partsCost > 0) {
    bar.classList.remove('hidden');
    document.getElementById('pkg-mb-labour').textContent = 'TZS ' + fmt(labour);
    document.getElementById('pkg-mb-parts').textContent  = 'TZS ' + fmt(partsCost);
    document.getElementById('pkg-mb-sell').textContent   = 'TZS ' + fmt(sellPrice);
    const mEl = document.getElementById('pkg-mb-margin');
    const mColor = marginPct >= 30 ? '#16a34a' : marginPct >= 15 ? '#d97706' : '#dc2626';
    mEl.textContent = 'TZS ' + fmt(margin) + ' (' + marginPct + '%)';
    mEl.style.color = mColor;
  } else {
    bar.classList.add('hidden');
  }
}

function pkgAddItemRow(item, qty, unitCost) {
  // item = catalogue object or undefined (manual)
  const idx = _pkgItems.length;
  const it = item
    ? { id: item.id, name: item.name, source: item.source, quantity: qty || 1, unitCost: unitCost !== undefined ? unitCost : item.unitCost, buyingCost: item.buyingCost, stock: item.stock }
    : { id: '', name: '', source: 'Manual', quantity: qty || 1, unitCost: unitCost || 0, buyingCost: 0, stock: null };
  _pkgItems.push(it);

  const list = document.getElementById('pkg-parts-list');
  document.getElementById('pkg-no-items').classList.add('hidden');
  const row = document.createElement('div');
  row.className = 'pkg-part-row flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2';
  row.dataset.idx = String(idx);

  // Source badge
  const badge = document.createElement('span');
  badge.className = 'text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0';
  if (it.source !== 'Manual') {
    badge.style.background = _pkgSrcBg(it.source);
    badge.style.color = _pkgSrcColor(it.source);
    badge.textContent = it.source;
  } else {
    badge.className += ' bg-gray-100 text-gray-500';
    badge.textContent = 'Custom';
  }

  // Name label
  const nameEl = document.createElement('span');
  nameEl.className = 'text-sm font-medium text-gray-700 flex-1 truncate';
  nameEl.title = it.name;
  nameEl.textContent = it.name;

  // Stock info
  const stockEl = document.createElement('span');
  stockEl.className = 'text-xs flex-shrink-0';
  if (it.stock !== null) {
    if (it.stock === 0) { stockEl.className += ' text-red-500 font-semibold'; stockEl.textContent = 'Out of stock'; }
    else if (it.stock <= 5) { stockEl.className += ' text-amber-600'; stockEl.textContent = '⚠ ' + it.stock + ' left'; }
    else { stockEl.className += ' text-green-600'; stockEl.textContent = '✓ ' + it.stock; }
  }

  // Qty input
  const qtyWrap = document.createElement('div');
  qtyWrap.className = 'flex items-center gap-1 flex-shrink-0';
  const qtyLabel = document.createElement('label');
  qtyLabel.className = 'text-xs text-gray-400'; qtyLabel.textContent = 'Qty';
  const qtyInput = document.createElement('input');
  qtyInput.className = 'form-input w-14 text-sm text-center py-1';
  qtyInput.type = 'number'; qtyInput.min = '1'; qtyInput.value = String(it.quantity);
  qtyInput.addEventListener('input', function() { pkgUpdateItem(idx, 'quantity', +this.value); });
  qtyWrap.appendChild(qtyLabel); qtyWrap.appendChild(qtyInput);

  // Price input
  const priceWrap = document.createElement('div');
  priceWrap.className = 'flex items-center gap-1 flex-shrink-0';
  const priceLabel = document.createElement('label');
  priceLabel.className = 'text-xs text-gray-400'; priceLabel.textContent = 'Price';
  const priceInput = document.createElement('input');
  priceInput.className = 'form-input w-24 text-sm text-right py-1';
  priceInput.type = 'number'; priceInput.min = '0'; priceInput.value = String(it.unitCost);
  priceInput.addEventListener('input', function() { pkgUpdateItem(idx, 'unitCost', +this.value); });
  priceWrap.appendChild(priceLabel); priceWrap.appendChild(priceInput);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0';
  removeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
  removeBtn.addEventListener('click', function() { pkgRemoveItem(idx, removeBtn); });

  row.appendChild(badge);
  row.appendChild(nameEl);
  if (it.stock !== null) row.appendChild(stockEl);
  row.appendChild(qtyWrap);
  row.appendChild(priceWrap);
  row.appendChild(removeBtn);

  list.appendChild(row);
  pkgCloseItemPicker();
  pkgRecalc();
}

function _pkgSrcColor(src) {
  return { Lubricant:'#2563eb', Part:'#7c3aed', 'Car Wash':'#0891b2', 'Add-on':'#d97706' }[src] || '#64748b';
}
function _pkgSrcBg(src) {
  return { Lubricant:'#eff6ff', Part:'#f5f3ff', 'Car Wash':'#ecfeff', 'Add-on':'#fffbeb' }[src] || '#f8fafc';
}

function pkgUpdateItem(idx, field, val) {
  if (_pkgItems[idx]) { _pkgItems[idx][field] = val; pkgRecalc(); }
}
function pkgRemoveItem(idx, btn) {
  btn.closest('.pkg-part-row').remove();
  _pkgItems[idx] = null;
  if (!document.querySelectorAll('.pkg-part-row').length) {
    document.getElementById('pkg-no-items').classList.remove('hidden');
  }
  pkgRecalc();
}

// ── Item Picker ───────────────────────────────────────────────────────────────
function pkgAddItemRow_open() { pkgAddItemRow(); }

async function pkgAddItemRow() {
  // Show the picker UI
  pkgCloseItemPicker(); // reset first
  const picker = document.getElementById('pkg-item-picker');
  picker.classList.remove('hidden');
  document.getElementById('pkg-item-search').value = '';
  document.getElementById('pkg-item-results').classList.add('hidden');
  document.getElementById('pkg-item-search').focus();
  await _loadPkgCatalogue(); // pre-warm cache
}

function pkgCloseItemPicker() {
  const picker = document.getElementById('pkg-item-picker');
  if (picker) { picker.classList.add('hidden'); }
  const results = document.getElementById('pkg-item-results');
  if (results) { results.classList.add('hidden'); results.innerHTML = ''; }
}

function pkgSearchItems(q) {
  clearTimeout(_pkgItemSearchTimer);
  _pkgItemSearchTimer = setTimeout(async function() {
    const items = await _loadPkgCatalogue();
    const lq = q.toLowerCase().trim();
    const filtered = lq
      ? items.filter(function(it) {
          return it.name.toLowerCase().includes(lq) || it.source.toLowerCase().includes(lq) || it.meta.toLowerCase().includes(lq);
        })
      : items.slice(0, 50); // show first 50 when empty
    const results = document.getElementById('pkg-item-results');
    if (!filtered.length) {
      results.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400">No results for "' + q + '"</div>';
      results.classList.remove('hidden');
      return;
    }
    results.innerHTML = filtered.map(function(it, i) {
      const stockBadge = it.stock === null
        ? '<span class="text-xs text-gray-400">' + it.stockLabel + '</span>'
        : it.stock === 0
          ? '<span class="text-xs font-semibold text-red-500">Out of stock</span>'
          : it.stock <= 5
            ? '<span class="text-xs font-semibold text-amber-600">⚠ ' + it.stock + ' left</span>'
            : '<span class="text-xs text-green-600">✓ ' + it.stock + ' in stock</span>';
      return '<div class="pkg-item-result flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0" data-idx="' + i + '">' +
        '<span class="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 w-16 text-center" style="background:' + _pkgSrcBg(it.source) + ';color:' + _pkgSrcColor(it.source) + '">' + it.source + '</span>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-medium text-gray-800 truncate">' + it.name + '</p>' +
          '<p class="text-xs text-gray-400 truncate">' + it.meta + '</p>' +
        '</div>' +
        '<div class="text-right flex-shrink-0">' +
          '<p class="text-sm font-bold text-gray-900">TZS ' + fmt(it.unitCost) + '</p>' +
          stockBadge +
        '</div>' +
      '</div>';
    }).join('');
    results.classList.remove('hidden');
    // Wire click events
    const catalogueItems = filtered;
    results.querySelectorAll('.pkg-item-result').forEach(function(el, i) {
      el.addEventListener('click', function() {
        pkgAddItemRow(catalogueItems[i]);
      });
    });
  }, 200);
}

// ── Legacy compat: pkgAddPartRow used by showEditPackageModal ─────────────────
function pkgAddPartRow(name, qty, cost) {
  pkgAddItemRow({ id:'', name: name || '', source:'Manual', unitCost: cost || 0, buyingCost: 0, stock: null, meta:'' }, qty || 1, cost || 0);
}

function showNewPackageModal() {
  document.getElementById('pkg-modal-title').textContent = 'New Service Package';
  document.getElementById('pkg-modal-sub').textContent = 'Create a new service bundle';
  document.getElementById('pkg-save-label').textContent = 'Save Package';
  document.getElementById('pkg-edit-id').value = '';
  document.getElementById('pkg-name').value = '';
  document.getElementById('pkg-labour').value = '';
  document.getElementById('pkg-hours').value = '';
  document.getElementById('pkg-desc').value = '';
  document.getElementById('pkg-sellPrice').value = '';
  document.getElementById('pkg-parts-list').innerHTML = '';
  document.getElementById('pkg-no-items').classList.remove('hidden');
  document.getElementById('pkg-margin-bar').classList.add('hidden');
  pkgCloseItemPicker();
  _pkgItems = [];
  openModal('modal-newPackage');
}

function showEditPackageModal(id) {
  const pkg = allPackages.find(function(p) { return p.id === id; });
  if (!pkg) return;
  document.getElementById('pkg-modal-title').textContent = 'Edit Service Package';
  document.getElementById('pkg-modal-sub').textContent = 'Update package details';
  document.getElementById('pkg-save-label').textContent = 'Save Changes';
  document.getElementById('pkg-edit-id').value = pkg.id;
  document.getElementById('pkg-name').value = pkg.packageName;
  document.getElementById('pkg-labour').value = pkg.labourCost;
  document.getElementById('pkg-hours').value = pkg.estimatedHours;
  document.getElementById('pkg-desc').value = pkg.description || '';
  document.getElementById('pkg-sellPrice').value = pkg.sellingPrice > 0 ? pkg.sellingPrice : '';
  document.getElementById('pkg-parts-list').innerHTML = '';
  document.getElementById('pkg-no-items').classList.toggle('hidden', !!(pkg.parts && pkg.parts.length));
  pkgCloseItemPicker();
  _pkgItems = [];
  (pkg.parts || []).forEach(function(p) { pkgAddPartRow(p.name, p.quantity, p.unitCost); });
  pkgRecalc();
  openModal('modal-newPackage');
}

async function submitPackageModal() {
  const name   = document.getElementById('pkg-name').value.trim();
  const labour = parseFloat(document.getElementById('pkg-labour').value) || 0;
  const hours  = parseFloat(document.getElementById('pkg-hours').value) || 1;
  const desc   = document.getElementById('pkg-desc').value.trim();
  const sellP  = parseFloat(document.getElementById('pkg-sellPrice').value) || 0;
  const editId = document.getElementById('pkg-edit-id').value;
  if (!name)   { showToast('Package name is required', 'error'); return; }
  if (labour <= 0) { showToast('Please enter a labour cost', 'error'); return; }
  const parts = _pkgItems.filter(function(p) { return p && p.name; }).map(function(p) {
    return { name: p.name, quantity: p.quantity, unitCost: p.unitCost };
  });
  const payload = { packageName: name, description: desc, labourCost: labour, estimatedHours: hours, parts, sellingPrice: sellP };
  try {
    if (editId) {
      const { data } = await axios.put('/api/packages/' + editId, payload);
      const idx = allPackages.findIndex(function(p) { return p.id === editId; });
      if (idx !== -1) allPackages[idx] = data;
      showToast('Package updated successfully');
    } else {
      await axios.post('/api/packages', payload);
      showToast('Service package created');
    }
    closeModal('modal-newPackage');
    loadPackages();
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to save package', 'error');
  }
}

// Keep old submitNewPackage for backward-compat
async function submitNewPackage(e) { e && e.preventDefault(); await submitPackageModal(); }

async function deletePackage(id, name) {
  if (!confirm('Delete package "' + name + '"? This cannot be undone.')) return;
  await axios.delete('/api/packages/' + id);
  showToast('Package deleted');
  loadPackages();
}

// ─── Car Wash Modal helpers ───────────────────────────────────────────────────
let allCarWash = [];

function showNewCarWashModal() {
  document.getElementById('cw-modal-title').textContent = 'New Car Wash Package';
  document.getElementById('cw-modal-sub').textContent = 'Add a package to the car wash menu';
  document.getElementById('cw-save-label').textContent = 'Save Package';
  document.getElementById('cw-edit-id').value = '';
  document.getElementById('cw-name').value = '';
  document.getElementById('cw-type').value = 'Standard';
  document.getElementById('cw-price').value = '';
  document.getElementById('cw-vehicles').value = '';
  document.getElementById('cw-desc').value = '';
  document.getElementById('cw-includes').value = '';
  openModal('modal-newCarWash');
}

function showEditCarWashModal(id) {
  const pkg = allCarWash.find(p => p.id === id);
  if (!pkg) return;
  document.getElementById('cw-modal-title').textContent = 'Edit Car Wash Package';
  document.getElementById('cw-modal-sub').textContent = 'Update package details';
  document.getElementById('cw-save-label').textContent = 'Save Changes';
  document.getElementById('cw-edit-id').value = pkg.id;
  document.getElementById('cw-name').value = pkg.name;
  document.getElementById('cw-type').value = pkg.type;
  document.getElementById('cw-price').value = pkg.price || '';
  document.getElementById('cw-vehicles').value = pkg.vehicleCount || '';
  document.getElementById('cw-desc').value = pkg.description || '';
  document.getElementById('cw-includes').value = (pkg.includes || []).join(', ');
  openModal('modal-newCarWash');
}

async function submitCarWashModal() {
  const name = document.getElementById('cw-name').value.trim();
  const type = document.getElementById('cw-type').value;
  const price = +document.getElementById('cw-price').value || 0;
  const vehicles = +document.getElementById('cw-vehicles').value || undefined;
  const desc = document.getElementById('cw-desc').value.trim();
  const includesRaw = document.getElementById('cw-includes').value.trim();
  const includes = includesRaw ? includesRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined;
  const editId = document.getElementById('cw-edit-id').value;
  if (!name) { showToast('Package name is required', 'error'); return; }
  const payload = { name, type, price, description: desc, ...(includes?.length ? { includes } : {}), ...(vehicles ? { vehicleCount: vehicles } : {}) };
  if (editId) {
    const { data } = await axios.put('/api/catalogue/carwash/' + editId, payload);
    const idx = allCarWash.findIndex(p => p.id === editId);
    if (idx !== -1) allCarWash[idx] = data;
    renderCarWashGrid(allCarWash);
    showToast('Package updated successfully');
  } else {
    const { data } = await axios.post('/api/catalogue/carwash', payload);
    allCarWash.push(data);
    renderCarWashGrid(allCarWash);
    showToast('Car wash package created');
  }
  closeModal('modal-newCarWash');
}

async function deleteCarWash(id, name) {
  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
  await axios.delete('/api/catalogue/carwash/' + id);
  allCarWash = allCarWash.filter(p => p.id !== id);
  renderCarWashGrid(allCarWash);
  showToast('Package deleted');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══ FLEET INVOICES ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

var allFleetInvoices = [];
var _fiSelectedCustomer = null;   // { id, name, phone }
var _fiSelectedJobs = [];         // array of eligible job objects that are checked
var _fiEligibleJobs = [];         // full eligible list for current customer
var _fidId = null;                // currently open detail modal fleet invoice id
var _fiCurrentFilter = 'all';

// ── Section switcher (Regular ↔ Fleet) ───────────────────────────────────────
function invSectionSwitch(section) {
  var isFleet = section === 'fleet';
  document.getElementById('invPane-regular').classList.toggle('hidden', isFleet);
  document.getElementById('invPane-fleet').classList.toggle('hidden', !isFleet);
  var reg = document.getElementById('invSection-regular');
  var flt = document.getElementById('invSection-fleet');
  if (isFleet) {
    reg.className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-gray-700';
    flt.className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-blue-700 shadow-sm';
    loadFleetInvoices();
  } else {
    reg.className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-blue-700 shadow-sm';
    flt.className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-gray-700';
  }
}

// ── Load & render fleet invoices ──────────────────────────────────────────────
async function loadFleetInvoices() {
  try {
    const { data } = await axios.get('/api/fleet-invoices');
    allFleetInvoices = data;
    renderFleetTable(allFleetInvoices, _fiCurrentFilter);
    // Update stats
    const total       = data.length;
    const paid        = data.filter(f => f.status === 'Paid').length;
    const outstanding = data.filter(f => f.status !== 'Paid').length;
    const totalJobs   = data.reduce((s, f) => s + (f.lineItems?.length || 0), 0);
    const el = (id, v) => { var e = document.getElementById(id); if (e) e.textContent = v; };
    el('fleetStatTotal', total);
    el('fleetStatPaid', paid);
    el('fleetStatOutstanding', outstanding);
    el('fleetStatJobs', totalJobs);
  } catch(e) {
    showToast('Could not load fleet invoices', 'error');
  }
}

function fleetFilterBy(filter) {
  _fiCurrentFilter = filter;
  document.querySelectorAll('.fi-tab-btn').forEach(function(b) {
    var tabId = b.id.replace('fiTab-', '');
    var isActive = tabId === filter;
    var colorMap = { all:'blue', Issued:'gray', Paid:'green', 'Partially Paid':'orange', Overdue:'red' };
    var c = colorMap[tabId] || 'blue';
    b.className = isActive
      ? 'fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-' + c + '-500 bg-' + c + '-500 text-white transition-all'
      : 'fi-tab-btn px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-' + c + '-400 transition-all';
  });
  renderFleetTable(allFleetInvoices, filter);
}

function renderFleetTable(data, filter) {
  var filtered = filter === 'all' ? data : data.filter(function(f) { return f.status === filter; });
  filtered = filtered.slice().sort(function(a, b) { return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(); });
  var tbody = document.getElementById('fleetInvoicesTable');
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-truck text-3xl mb-3 block"></i>No fleet invoices' + (filter !== 'all' ? ' with status ' + filter : '') + '</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(fi) {
    var statusClass = fi.status === 'Paid' ? 'bg-green-100 text-green-700'
      : fi.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700'
      : fi.status === 'Overdue' ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';
    var canPay = fi.status !== 'Paid';
    var paid = fi.amountPaid || 0;
    var fid = fi.id;
    return '<tr class="table-row border-b border-gray-50 cursor-pointer hover:bg-blue-50/30 transition-colors" data-fi-id="' + fid + '" onclick="showFleetDetail(this.dataset.fiId, event)">' +
      '<td class="px-4 py-3 font-bold text-blue-600 text-sm">' + fi.fleetInvoiceNumber + '</td>' +
      '<td class="px-4 py-3 text-sm font-medium text-gray-700">' + (fi.customerName || '—') + '</td>' +
      '<td class="px-4 py-3 text-sm text-gray-600"><span class="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold"><i class="fas fa-layer-group"></i>' + (fi.lineItems?.length || 0) + ' jobs</span></td>' +
      '<td class="px-4 py-3 font-bold text-gray-800">' + fmt(fi.totalAmount) + '</td>' +
      '<td class="px-4 py-3 text-xs text-gray-400">' + (fi.dueDate || '—') + '</td>' +
      '<td class="px-4 py-3">' + (paid > 0 ? '<span class="font-semibold ' + (fi.status === 'Paid' ? 'text-green-600' : 'text-amber-600') + '">' + fmt(paid) + '</span>' : '<span class="text-gray-300 text-xs">—</span>') + '</td>' +
      '<td class="px-4 py-3"><span class="badge ' + statusClass + '">' + fi.status + '</span></td>' +
      '<td class="px-4 py-3" onclick="event.stopPropagation()">' +
        '<div class="flex items-center gap-1.5" data-fi-id="' + fid + '">' +
          (canPay ? '<button class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors" data-fi-id="' + fid + '" onclick="showFleetPayModal(this.dataset.fiId)"><i class="fas fa-money-bill-wave mr-1"></i>' + (fi.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment') + '</button>' : '') +
          '<button class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" data-fi-id="' + fid + '" onclick="downloadFleetInvoicePDF(this.dataset.fiId)"><i class="fas fa-file-pdf mr-1"></i>PDF</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ── Fleet Invoice Detail Modal ────────────────────────────────────────────────
function showFleetDetail(id, event) {
  if (event && event.target.closest('button')) return;
  var fi = allFleetInvoices.find(function(f) { return f.id === id; });
  if (!fi) return;
  _fidId = id;

  var fmt2 = function(n) { return 'TZS ' + Number(n || 0).toLocaleString(); };
  var fmtDt = function(s) { return s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'; };
  var fmtTs = function(s) { return s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; };

  document.getElementById('fid-number').textContent   = fi.fleetInvoiceNumber;
  document.getElementById('fid-subtitle').textContent = fi.customerName + (fi.lineItems?.length ? ' · ' + fi.lineItems.length + ' job cards' : '');
  document.getElementById('fid-customer').textContent = fi.customerName;
  document.getElementById('fid-issued').textContent   = fmtDt(fi.issuedAt);
  document.getElementById('fid-due').textContent      = fi.dueDate || '—';

  // Status badge + progress bar
  var total = fi.totalAmount || 0;
  var paid  = fi.amountPaid  || 0;
  var pct   = total > 0 ? Math.min(100, Math.round(paid / total * 100)) : (fi.status === 'Paid' ? 100 : 0);
  var badge = document.getElementById('fid-status-badge');
  badge.textContent = fi.status;
  badge.className = 'badge text-sm px-3 py-1 ' + (fi.status === 'Paid' ? 'bg-green-100 text-green-700' : fi.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700' : fi.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600');
  var bar = document.getElementById('fid-progress-bar');
  bar.style.width = pct + '%';
  bar.className = 'h-2 rounded-full transition-all ' + (fi.status === 'Paid' ? 'bg-green-500' : fi.status === 'Overdue' ? 'bg-red-500' : fi.status === 'Partially Paid' ? 'bg-amber-500' : 'bg-gray-300');
  document.getElementById('fid-progress-label').textContent = fmt2(paid) + ' / ' + fmt2(total);

  // Line items
  document.getElementById('fid-line-items').innerHTML = (fi.lineItems || []).map(function(li) {
    return '<div class="bg-white border border-gray-100 rounded-xl p-3">' +
      '<div class="flex items-center justify-between mb-1">' +
        '<span class="font-semibold text-gray-700 text-sm"><i class="fas fa-id-card text-blue-400 mr-1.5"></i>' + li.jobCardNumber + '</span>' +
        '<span class="font-bold text-gray-800 text-sm">' + fmt2(li.subtotal) + '</span>' +
      '</div>' +
      '<p class="text-xs text-gray-400 mb-2">' + (li.description || '') + '</p>' +
      '<div class="grid grid-cols-3 gap-2 text-xs text-gray-500">' +
        '<span><i class="fas fa-wrench mr-0.5 text-gray-300"></i>Labour: ' + fmt2(li.labourCost) + '</span>' +
        '<span><i class="fas fa-cogs mr-0.5 text-gray-300"></i>Services: ' + fmt2(li.servicesCost) + '</span>' +
        '<span><i class="fas fa-box mr-0.5 text-gray-300"></i>Parts: ' + fmt2(li.partsCost) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  // Totals
  var discHtml = (fi.discountAmount || 0) > 0
    ? '<div class="flex justify-between text-green-600"><span class="flex items-center gap-1"><i class="fas fa-tag text-xs"></i>Discount' + (fi.discountReason ? ' <span class="text-xs text-green-500">(' + fi.discountReason + ')</span>' : '') + '</span><span class="font-semibold">− ' + fmt2(fi.discountAmount) + '</span></div>' : '';
  document.getElementById('fid-totals').innerHTML =
    '<div class="flex justify-between text-gray-500"><span>Subtotal</span><span>' + fmt2(fi.subtotal) + '</span></div>' +
    discHtml +
    '<div class="flex justify-between text-gray-500"><span>Tax / VAT (18%)</span><span>' + fmt2(fi.tax) + '</span></div>' +
    '<div class="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-800"><span>Total</span><span class="text-green-600">' + fmt2(fi.totalAmount) + '</span></div>';

  // Notes
  var notesRow = document.getElementById('fid-notes-row');
  if (fi.notes) {
    document.getElementById('fid-notes-val').textContent = fi.notes;
    notesRow.classList.remove('hidden');
  } else {
    notesRow.classList.add('hidden');
  }

  // Payment history
  var paySection = document.getElementById('fid-payment-section');
  var payList    = document.getElementById('fid-payment-list');
  var payments   = fi.payments || [];
  var methodIcon = function(m) { return m === 'Mobile Money' ? 'fa-mobile-alt' : m === 'Bank' ? 'fa-university' : m === 'Lipa Number' ? 'fa-hashtag' : m === 'Cash' ? 'fa-money-bill-wave' : 'fa-credit-card'; };
  var methodColor = function(m) { return m === 'Mobile Money' ? 'text-green-600' : m === 'Bank' ? 'text-blue-600' : m === 'Lipa Number' ? 'text-purple-600' : m === 'Cash' ? 'text-orange-600' : 'text-gray-500'; };
  if (payments.length) {
    paySection.classList.remove('hidden');
    payList.innerHTML = payments.map(function(p) {
      return '<div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">' +
        '<div class="flex items-center gap-2"><i class="fas ' + methodIcon(p.method) + ' ' + methodColor(p.method) + ' text-sm"></i>' +
        '<div><div class="text-sm font-bold text-gray-800">' + fmt2(p.amount) + ' <span class="text-xs text-gray-400 font-normal">via ' + p.method + (p.reference ? ' · ' + p.reference : '') + '</span></div>' +
        '<div class="text-xs text-gray-400">' + fmtTs(p.paidAt) + '</div></div></div>' +
        '</div>';
    }).join('');
    if (fi.status !== 'Paid') {
      payList.innerHTML += '<div class="flex justify-between items-center px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm"><span class="font-semibold text-amber-700">Balance remaining</span><span class="font-bold text-amber-700">' + fmt2(total - paid) + '</span></div>';
    }
  } else {
    paySection.classList.add('hidden');
  }

  // Pay button
  var payBtn = document.getElementById('fid-pay-btn');
  if (fi.status !== 'Paid') {
    payBtn.classList.remove('hidden');
    payBtn.innerHTML = '<i class="fas fa-money-bill-wave mr-1.5"></i>' + (fi.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment');
  } else {
    payBtn.classList.add('hidden');
  }

  // Delete button only when not Paid
  document.getElementById('fid-delete-btn').style.display = fi.status === 'Paid' ? 'none' : '';

  openModal('modal-fleetDetail');
}

function fidPay() {
  closeModal('modal-fleetDetail');
  if (_fidId) showFleetPayModal(_fidId);
}

async function fidDelete() {
  var fi = allFleetInvoices.find(function(f) { return f.id === _fidId; });
  if (!fi || !confirm('Delete ' + fi.fleetInvoiceNumber + '? This cannot be undone.')) return;
  try {
    await axios.delete('/api/fleet-invoices/' + _fidId);
    allFleetInvoices = allFleetInvoices.filter(function(f) { return f.id !== _fidId; });
    closeModal('modal-fleetDetail');
    renderFleetTable(allFleetInvoices, _fiCurrentFilter);
    loadFleetInvoices(); // refresh stats
    showToast('Fleet invoice deleted', 'success');
  } catch(e) {
    showToast('Could not delete: ' + (e?.response?.data?.error || e.message), 'error');
  }
}

// ── Fleet Pay Modal (reuses the payInvoice modal with fleet mode) ─────────────
var _fiPayId = null;

async function showFleetPayModal(fiId) {
  _fiPayId = fiId;
  var fi = allFleetInvoices.find(function(f) { return f.id === fiId; });
  if (!fi) return;

  // Reuse the existing payInvoice modal DOM — just swap its target
  document.getElementById('pi-inv-id').value = '';           // clear regular inv field
  document.getElementById('pi-subtitle').textContent = fi.fleetInvoiceNumber + ' · ' + fi.customerName;

  var alreadyPaid = fi.amountPaid || 0;
  var balance     = fi.totalAmount - alreadyPaid;
  document.getElementById('pi-total').textContent       = fmt(fi.totalAmount);
  document.getElementById('pi-already-paid').textContent = alreadyPaid > 0 ? fmt(alreadyPaid) : 'TZS 0';
  document.getElementById('pi-balance').textContent     = fmt(balance);
  document.getElementById('pi-method').value = '';
  document.querySelectorAll('.pi-method-btn').forEach(function(b) {
    b.className = 'pi-method-btn flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-sm font-semibold text-gray-600';
    var icon = b.querySelector('i'); if (icon) icon.className = icon.className.replace(/text-\w+-500/, 'text-gray-400');
  });
  document.getElementById('pi-amount').value    = balance > 0 ? balance : fi.totalAmount;
  document.getElementById('pi-reference').value = '';

  // Payment history
  var historyBox  = document.getElementById('pi-history-box');
  var historyList = document.getElementById('pi-history-list');
  var payments    = fi.payments || [];
  if (payments.length) {
    historyBox.classList.remove('hidden');
    var mIcon = function(m) { return m === 'Mobile Money' ? 'fa-mobile-alt' : m === 'Bank' ? 'fa-university' : m === 'Cash' ? 'fa-money-bill-wave' : 'fa-hashtag'; };
    historyList.innerHTML = payments.map(function(p) {
      return '<div class="flex items-center justify-between py-1 border-b border-gray-50">' +
        '<span class="text-gray-500"><i class="fas ' + mIcon(p.method) + ' mr-1"></i>' + p.method + (p.reference ? ' · ' + p.reference : '') + '</span>' +
        '<span class="font-semibold text-gray-700">' + fmt(p.amount) + '</span>' +
        '<span class="text-gray-400">' + (p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB', {day:'numeric',month:'short'}) : '') + '</span>' +
        '</div>';
    }).join('');
  } else {
    historyBox.classList.add('hidden');
  }

  // Mark the modal as fleet-mode so submitPayInvoice routes correctly
  document.getElementById('pi-inv-id').setAttribute('data-fleet', fiId);
  piUpdateBalance();
  openModal('modal-payInvoice');
}

// ── Override submitPayInvoice to handle fleet-mode ────────────────────────────
// We store the fleet invoice id in data-fleet attribute on pi-inv-id.
// The original submitPayInvoice checks pi-inv-id.value (regular invoice id).
// We patch it here to handle both cases.
var _origSubmitPayInvoice = null;
document.addEventListener('DOMContentLoaded', function() {
  // Nothing needed — we replace inline below
});

async function submitPayInvoice() {
  var fiId    = document.getElementById('pi-inv-id').getAttribute('data-fleet') || '';
  var invId   = document.getElementById('pi-inv-id').value;
  var method  = document.getElementById('pi-method').value;
  var amount  = parseFloat(document.getElementById('pi-amount').value) || 0;
  var reference = document.getElementById('pi-reference').value.trim();

  if (!method) { showToast('Please select a payment method', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter the amount received', 'error'); return; }

  var btn = document.getElementById('pi-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Processing…';

  try {
    if (fiId) {
      // ── Fleet invoice payment ──────────────────────────────────────────────
      var resp = await axios.patch('/api/fleet-invoices/' + fiId + '/status', {
        paymentMethod: method,
        paymentReference: reference || undefined,
        amountPaid: amount,
        paidAt: new Date().toISOString(),
      });
      var fi   = resp.data;
      var total = fi.totalAmount || 0;
      var prevPaid = (allFleetInvoices.find(function(f) { return f.id === fiId; })?.amountPaid || 0);
      var isFullyPaid = (prevPaid + amount) >= total;

      // Update in-memory list
      var idx = allFleetInvoices.findIndex(function(f) { return f.id === fiId; });
      if (idx !== -1) allFleetInvoices[idx] = fi;

      closeModal('modal-payInvoice');
      document.getElementById('pi-inv-id').removeAttribute('data-fleet');
      showToast(isFullyPaid ? 'Fleet invoice fully paid via ' + method + '!' : 'Partial payment of ' + fmt(amount) + ' recorded', 'success');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Record Payment';

      renderFleetTable(allFleetInvoices, _fiCurrentFilter);
      try { loadFleetInvoices(); } catch(_) {}

    } else {
      // ── Regular invoice payment (original logic) ───────────────────────────
      await axios.patch('/api/invoices/' + invId + '/status', {
        paymentMethod: method,
        paymentReference: reference || undefined,
        amountPaid: amount,
        paidAt: new Date().toISOString(),
      });
      var inv = allInvoices.find(function(i) { return i.id === invId; });
      var total2 = inv ? inv.totalAmount : 0;
      var alreadyPaid2 = inv ? (inv.amountPaid || 0) : 0;
      var isFullyPaid2 = (alreadyPaid2 + amount) >= total2;

      closeModal('modal-payInvoice');
      showToast(isFullyPaid2 ? 'Invoice fully paid via ' + method + '!' : 'Partial payment of ' + fmt(amount) + ' recorded', 'success');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Record Payment';

      try { syncFinance(); } catch(_) {}
      if (_piJobId) { try { viewJobDetail(_piJobId); } catch(_) {} }
    }
  } catch(e) {
    console.error('submitPayInvoice error:', e);
    showToast('Could not record payment: ' + (e?.response?.data?.error || e?.message || 'Unknown error'), 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Record Payment';
  }
}

// ── Fleet Invoice Creation Modal (3 steps) ────────────────────────────────────
function openFleetInvoiceModal() {
  _fiSelectedCustomer = null;
  _fiSelectedJobs     = [];
  _fiEligibleJobs     = [];
  fiGoStep1();
  openModal('modal-fleetInvoice');
}

function fiSetStepUI(step) {
  [1,2,3].forEach(function(n) {
    var dot = document.getElementById('fi-step-dot-' + n);
    if (!dot) return;
    dot.className = n <= step ? 'w-2 h-2 rounded-full bg-blue-500' : 'w-2 h-2 rounded-full bg-gray-300';
    if (n < 3) {
      var line = document.getElementById('fi-step-line-' + n);
      if (line) line.className = n < step ? 'w-6 h-0.5 bg-blue-400' : 'w-6 h-0.5 bg-gray-200';
    }
  });
  var labels = ['', 'Step 1 of 3 — Select Customer', 'Step 2 of 3 — Select Job Cards', 'Step 3 of 3 — Review & Confirm'];
  var lbl = document.getElementById('fi-step-label');
  if (lbl) lbl.textContent = labels[step] || '';
}

function fiShowPane(n) {
  [1,2,3].forEach(function(i) {
    var p = document.getElementById('fi-pane-' + i);
    if (p) p.classList.toggle('hidden', i !== n);
  });
  fiSetStepUI(n);
}

// STEP 1: customer picker
function fiGoStep1() {
  fiShowPane(1);
  document.getElementById('fi-cust-search').value = '';
  fiRenderCustomers(allCustomers);
}

function fiRenderCustomers(list) {
  var el = document.getElementById('fi-cust-list');
  if (!list || !list.length) {
    el.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">No customers found.</p>';
    return;
  }
  el.innerHTML = list.map(function(c) {
    var isSelected = _fiSelectedCustomer && _fiSelectedCustomer.id === c.id;
    return '<div class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ' +
      (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50') +
      '" data-cust-id="' + c.id + '" onclick="fiSelectCustomer(this.dataset.custId)">' +
      '<div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">' + (c.name || '?')[0].toUpperCase() + '</div>' +
      '<div class="flex-1 min-w-0"><p class="font-semibold text-gray-800 text-sm truncate">' + c.name + '</p><p class="text-xs text-gray-400">' + (c.phone || '—') + '</p></div>' +
      (isSelected ? '<i class="fas fa-check-circle text-blue-500"></i>' : '') +
      '</div>';
  }).join('');
}

function fiFilterCustomers() {
  var q = (document.getElementById('fi-cust-search').value || '').toLowerCase();
  var filtered = q ? allCustomers.filter(function(c) { return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q); }) : allCustomers;
  fiRenderCustomers(filtered);
}

function fiSelectCustomer(custId) {
  var c = allCustomers.find(function(x) { return x.id === custId; });
  if (!c) return;
  _fiSelectedCustomer = c;
  fiRenderCustomers(allCustomers);
  document.getElementById('fi-next-1').disabled = false;
}

// STEP 2: job selection
async function fiGoStep2() {
  if (!_fiSelectedCustomer) return;
  fiShowPane(2);
  document.getElementById('fi-cust-avatar').textContent = _fiSelectedCustomer.name[0].toUpperCase();
  document.getElementById('fi-cust-name-show').textContent  = _fiSelectedCustomer.name;
  document.getElementById('fi-cust-phone-show').textContent = _fiSelectedCustomer.phone || '—';
  document.getElementById('fi-jobs-list').innerHTML = '<p class="text-sm text-gray-400 text-center py-6"><i class="fas fa-spinner fa-spin mr-1"></i>Loading eligible jobs…</p>';
  document.getElementById('fi-jobs-empty').classList.add('hidden');
  document.getElementById('fi-next-2').disabled = true;

  try {
    var { data } = await axios.get('/api/fleet-invoices/eligible-jobs/' + _fiSelectedCustomer.id);
    _fiEligibleJobs = data;
    _fiSelectedJobs = [];
    fiRenderJobs();
  } catch(e) {
    showToast('Could not load eligible jobs', 'error');
  }
}

function fiRenderJobs() {
  var el    = document.getElementById('fi-jobs-list');
  var empty = document.getElementById('fi-jobs-empty');
  if (!_fiEligibleJobs.length) {
    el.innerHTML = '';
    el.classList.add('hidden');
    empty.classList.remove('hidden');
    fiUpdateJobSummary();
    return;
  }
  el.classList.remove('hidden');
  empty.classList.add('hidden');
  el.innerHTML = _fiEligibleJobs.map(function(j) {
    var checked = _fiSelectedJobs.some(function(s) { return s.jobCardId === j.jobCardId; });
    return '<label class="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ' +
      (checked ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200') +
      '" data-job-id="' + j.jobCardId + '" onclick="fiToggleJob(this.dataset.jobId)">' +
      '<div class="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 ' + (checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300') + '">' +
        (checked ? '<i class="fas fa-check text-white text-xs"></i>' : '') +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center justify-between">' +
          '<span class="font-semibold text-gray-800 text-sm">' + j.jobCardNumber + '</span>' +
          '<span class="font-bold text-gray-700 text-sm">' + fmt(j.subtotal) + '</span>' +
        '</div>' +
        '<p class="text-xs text-gray-400 mt-0.5 truncate">' + (j.vehicleMake || '') + ' ' + (j.vehicleModel || '') + ' · ' + (j.vehicleReg || '') + '</p>' +
        '<p class="text-xs text-gray-500 mt-0.5 truncate">' + (j.description || '') + '</p>' +
        '<div class="flex items-center gap-3 mt-1 text-xs text-gray-400">' +
          '<span><i class="fas fa-wrench mr-0.5"></i>Labour: ' + fmt(j.labourCost) + '</span>' +
          '<span><i class="fas fa-cogs mr-0.5"></i>Svcs: ' + fmt(j.servicesCost) + '</span>' +
          '<span><i class="fas fa-box mr-0.5"></i>Parts: ' + fmt(j.partsCost) + '</span>' +
        '</div>' +
      '</div>' +
    '</label>';
  }).join('');
  fiUpdateJobSummary();
}

function fiToggleJob(jobCardId) {
  var job  = _fiEligibleJobs.find(function(j) { return j.jobCardId === jobCardId; });
  var idx  = _fiSelectedJobs.findIndex(function(s) { return s.jobCardId === jobCardId; });
  if (idx === -1) { if (job) _fiSelectedJobs.push(job); }
  else            { _fiSelectedJobs.splice(idx, 1); }
  fiRenderJobs();
}

function fiUpdateJobSummary() {
  var count   = _fiSelectedJobs.length;
  var subtotal = _fiSelectedJobs.reduce(function(s, j) { return s + (j.subtotal || 0); }, 0);
  var summary = document.getElementById('fi-sel-summary');
  var btn     = document.getElementById('fi-next-2');
  if (count >= 2) {
    summary.classList.remove('hidden');
    document.getElementById('fi-sel-count').textContent    = count + ' job' + (count !== 1 ? 's' : '') + ' selected';
    document.getElementById('fi-sel-subtotal').textContent = fmt(subtotal);
    btn.disabled = false;
  } else {
    summary.classList.toggle('hidden', count === 0);
    if (count === 1) {
      summary.classList.remove('hidden');
      document.getElementById('fi-sel-count').textContent    = '1 job selected (need at least 2)';
      document.getElementById('fi-sel-subtotal').textContent = fmt(subtotal);
    }
    btn.disabled = true;
  }
}

// STEP 3: review
function fiGoStep3() {
  if (_fiSelectedJobs.length < 2) return;
  fiShowPane(3);

  // Render line-item cards
  document.getElementById('fi-review-items').innerHTML = _fiSelectedJobs.map(function(j) {
    return '<div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">' +
      '<div><p class="font-semibold text-gray-800 text-sm">' + j.jobCardNumber + '</p>' +
      '<p class="text-xs text-gray-400">' + (j.vehicleMake || '') + ' ' + (j.vehicleModel || '') + ' ' + (j.vehicleReg || '') + '</p></div>' +
      '<span class="font-bold text-gray-700">' + fmt(j.subtotal) + '</span>' +
      '</div>';
  }).join('');

  // Set default due date (30 days from today)
  var d = new Date(); d.setDate(d.getDate() + 30);
  document.getElementById('fi-due-date').value = d.toISOString().slice(0,10);

  // Reset discount
  document.getElementById('fi-disc-type').value  = '';
  document.getElementById('fi-disc-value').value = '';
  document.getElementById('fi-disc-reason').value = '';
  document.getElementById('fi-notes').value = '';

  fiCalcTotals();
}

function fiCalcTotals() {
  var subtotal = _fiSelectedJobs.reduce(function(s, j) { return s + (j.subtotal || 0); }, 0);
  var discType  = document.getElementById('fi-disc-type').value;
  var discValue = parseFloat(document.getElementById('fi-disc-value').value) || 0;
  var discAmt   = 0;
  if (discType === 'percentage') discAmt = Math.round(subtotal * Math.min(discValue, 100) / 100);
  else if (discType === 'fixed') discAmt = Math.min(Math.round(discValue), subtotal);
  var afterDisc = Math.max(0, subtotal - discAmt);
  var tax       = Math.round(afterDisc * 0.18);
  var total     = afterDisc + tax;

  var discLine = discAmt > 0
    ? '<div class="flex justify-between text-green-600"><span><i class="fas fa-tag text-xs mr-1"></i>Discount</span><span class="font-semibold">− ' + fmt(discAmt) + '</span></div>'
    : '';
  document.getElementById('fi-review-totals').innerHTML =
    '<div class="flex justify-between text-gray-600"><span>Subtotal (' + _fiSelectedJobs.length + ' jobs)</span><span>' + fmt(subtotal) + '</span></div>' +
    discLine +
    '<div class="flex justify-between text-gray-600"><span>Tax / VAT (18%)</span><span>' + fmt(tax) + '</span></div>' +
    '<div class="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2"><span>Grand Total</span><span class="text-green-600 text-base">' + fmt(total) + '</span></div>';
}

async function fiSubmit() {
  var btn = document.getElementById('fi-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Creating…';

  try {
    var discType  = document.getElementById('fi-disc-type').value || undefined;
    var discValue = parseFloat(document.getElementById('fi-disc-value').value) || undefined;
    var payload = {
      customerId:    _fiSelectedCustomer.id,
      jobCardIds:    _fiSelectedJobs.map(function(j) { return j.jobCardId; }),
      discountType:  discType,
      discountValue: discValue,
      discountReason: document.getElementById('fi-disc-reason').value.trim() || undefined,
      dueDate:       document.getElementById('fi-due-date').value || undefined,
      notes:         document.getElementById('fi-notes').value.trim() || undefined,
    };
    var { data: newFI } = await axios.post('/api/fleet-invoices', payload);
    allFleetInvoices.push(newFI);
    closeModal('modal-fleetInvoice');
    renderFleetTable(allFleetInvoices, _fiCurrentFilter);
    loadFleetInvoices();
    showToast(newFI.fleetInvoiceNumber + ' created successfully!', 'success');
    // Auto-open the detail modal
    setTimeout(function() { showFleetDetail(newFI.id, null); }, 300);
  } catch(e) {
    showToast('Could not create fleet invoice: ' + (e?.response?.data?.error || e?.message || 'Unknown'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-invoice mr-1.5"></i> Create Fleet Invoice';
  }
}

// ── Fleet Invoice PDF ─────────────────────────────────────────────────────────
async function downloadFleetInvoicePDF(fiId) {
  var fi = allFleetInvoices.find(function(f) { return f.id === fiId; });
  if (!fi) { showToast('Fleet invoice not found', 'error'); return; }

  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    showToast('PDF library not loaded yet — try again in a moment', 'error'); return;
  }
  var jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  var doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  var pw = 210, ph = 297;
  var ml = 15, mr = 15, mt = 15;
  var cw = pw - ml - mr;
  var y = mt;
  var fmt2 = function(n) { return 'TZS ' + Number(n || 0).toLocaleString(); };
  var fmtDt = function(s) { return s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'; };

  // ── Header band ──────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175); // blue-800
  doc.rect(0, 0, pw, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AUTOFIX GMS', ml, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fleet Consolidated Invoice', ml, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(fi.fleetInvoiceNumber, pw - mr, 12, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Issued: ' + fmtDt(fi.issuedAt) + (fi.dueDate ? '   Due: ' + fi.dueDate : ''), pw - mr, 19, { align: 'right' });
  y = 36;

  // ── Customer block ───────────────────────────────────────────────────────────
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILLED TO', ml, y);
  y += 5;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(fi.customerName, ml, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (fi.customerPhone) { doc.text('Phone: ' + fi.customerPhone, ml, y); y += 4; }
  if (fi.customerEmail) { doc.text('Email: ' + fi.customerEmail, ml, y); y += 4; }
  y += 4;

  // ── Separator ────────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.line(ml, y, pw - mr, y); y += 5;

  // ── Line items (one section per job card) ─────────────────────────────────
  var lineItems = fi.lineItems || [];
  for (var i = 0; i < lineItems.length; i++) {
    var li = lineItems[i];
    if (y > ph - 50) { doc.addPage(); y = mt; }

    // Job card header
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(ml, y, cw, 8, 1, 1, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(li.jobCardNumber, ml + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    var descTrunc = (li.description || '').substring(0, 60);
    doc.text(descTrunc, ml + 35, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(fmt2(li.subtotal), pw - mr, y + 5.5, { align: 'right' });
    y += 10;

    // Services
    if (li.services && li.services.length) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('Services', ml + 4, y); y += 4;
      li.services.forEach(function(sv) {
        if (y > ph - 30) { doc.addPage(); y = mt; }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        doc.text('• ' + (sv.name || '').substring(0,40), ml + 6, y);
        doc.text('x' + sv.qty, ml + 120, y);
        doc.text(fmt2(sv.total), pw - mr, y, { align: 'right' });
        y += 4.5;
      });
    }
    // Parts
    if (li.parts && li.parts.length) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('Parts', ml + 4, y); y += 4;
      li.parts.forEach(function(p) {
        if (y > ph - 30) { doc.addPage(); y = mt; }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        doc.text('• ' + (p.name || '').substring(0,40), ml + 6, y);
        doc.text('x' + p.qty, ml + 120, y);
        doc.text(fmt2(p.total), pw - mr, y, { align: 'right' });
        y += 4.5;
      });
    }
    // Labour
    if (li.labourCost > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.text('• Labour', ml + 6, y);
      doc.text(fmt2(li.labourCost), pw - mr, y, { align: 'right' });
      y += 4.5;
    }
    doc.setDrawColor(230, 230, 230);
    doc.line(ml, y, pw - mr, y); y += 4;
  }

  // ── Totals block ─────────────────────────────────────────────────────────────
  if (y > ph - 40) { doc.addPage(); y = mt; }
  y += 2;
  var totalsX = pw - mr - 60;
  var drawTotalRow = function(label, val, bold, color) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor.apply(doc, color || [60, 60, 60]);
    doc.setFontSize(9);
    doc.text(label, totalsX, y);
    doc.text(val, pw - mr, y, { align: 'right' });
    y += 5.5;
  };
  drawTotalRow('Subtotal', fmt2(fi.subtotal));
  if ((fi.discountAmount || 0) > 0) drawTotalRow('Discount' + (fi.discountReason ? ' (' + fi.discountReason + ')' : ''), '− ' + fmt2(fi.discountAmount), false, [22, 163, 74]);
  drawTotalRow('Tax / VAT (18%)', fmt2(fi.tax));
  doc.setDrawColor(30, 64, 175);
  doc.line(totalsX, y, pw - mr, y); y += 2;
  drawTotalRow('TOTAL', fmt2(fi.totalAmount), true, [30, 64, 175]);

  // Status
  var statusColor = fi.status === 'Paid' ? [22,163,74] : fi.status === 'Overdue' ? [220,38,38] : [30,64,175];
  doc.setFillColor.apply(doc, statusColor);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  var statusW = 22, statusH = 7;
  doc.roundedRect(pw - mr - statusW, y + 1, statusW, statusH, 1.5, 1.5, 'F');
  doc.text(fi.status.toUpperCase(), pw - mr - statusW / 2, y + 5.8, { align: 'center' });
  y += 12;

  // Notes
  if (fi.notes) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Notes: ' + fi.notes, ml, y);
    y += 6;
  }

  // Footer
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Generated by AutoFix GMS · ' + new Date().toLocaleString('en-GB'), ml, ph - 8);
  doc.text('Page 1', pw - mr, ph - 8, { align: 'right' });

  doc.save(fi.fleetInvoiceNumber + '.pdf');
  showToast(fi.fleetInvoiceNumber + ' PDF downloaded!', 'success');
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

// ── Analytics Tabs ────────────────────────────────────────────────────────────
function switchAnalyticsTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.analytics-tab-btn').forEach(function(btn) {
    btn.classList.remove('border-blue-600','text-blue-700');
    btn.classList.add('border-transparent','text-gray-500');
  });
  var activeBtn = document.getElementById('analyticsTab-' + tab);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent','text-gray-500');
    activeBtn.classList.add('border-blue-600','text-blue-700');
  }
  // Show/hide panes
  ['overview','performance'].forEach(function(p) {
    var el = document.getElementById('analyticsPane-' + p);
    if (el) el.classList.toggle('hidden', p !== tab);
  });
  // Load TAT data when switching to performance tab
  if (tab === 'performance') loadTATAnalytics();
}

async function loadTATAnalytics() {
  try {
    var { data } = await axios.get('/api/analytics/tat');

    // KPI Cards
    var avg = document.getElementById('tatAvgCompleted');
    var cnt = document.getElementById('tatCompletedCount');
    var tot = document.getElementById('tatTotalCount');
    var mn  = document.getElementById('tatMin');
    var mx  = document.getElementById('tatMax');
    if (avg) avg.textContent = data.avgCompletedTATFormatted || '—';
    if (cnt) cnt.textContent = data.completedJobs || 0;
    if (tot) tot.textContent = 'of ' + (data.totalJobs || 0) + ' total jobs';
    if (mn)  mn.textContent  = data.minCompletedTATFormatted || '—';
    if (mx)  mx.textContent  = data.maxCompletedTATFormatted || '—';

    // Bottleneck alert
    var bottleneckEl = document.getElementById('tatBottleneck');
    if (bottleneckEl) {
      if (data.bottleneck && data.bottleneck.avgMins > 0) {
        bottleneckEl.className = 'mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3';
        bottleneckEl.innerHTML =
          '<i class="fas fa-exclamation-triangle text-amber-500 mt-0.5 flex-shrink-0"></i>' +
          '<div>' +
            '<p class="text-sm font-semibold text-amber-800">Bottleneck Detected: ' + data.bottleneck.label + '</p>' +
            '<p class="text-xs text-amber-700 mt-0.5">Average time spent at this stage: <strong>' + data.bottleneck.avgFormatted + '</strong> — consider investigating delays here.</p>' +
          '</div>';
      } else {
        bottleneckEl.classList.add('hidden');
      }
    }

    // Per-status horizontal bar chart
    var statusChartEl = document.getElementById('tatByStatusChart');
    if (statusChartEl && data.avgByStatus) {
      var maxAvgMins = Math.max(...data.avgByStatus.map(function(s){ return s.avgMins; }), 1);
      var STATUS_BG_TAT = {
        RECEIVED:'#dbeafe', INSPECTION:'#e0e7ff', PFI_PREPARATION:'#fef3c7',
        AWAITING_INSURER_APPROVAL:'#fee2e2', REPAIR_IN_PROGRESS:'#d1fae5',
        WAITING_FOR_PARTS:'#ffedd5', QUALITY_CHECK:'#f0fdf4',
        COMPLETED:'#dcfce7', INVOICED:'#f5f3ff', RELEASED:'#f1f5f9'
      };
      var STATUS_TEXT_TAT = {
        RECEIVED:'#1d4ed8', INSPECTION:'#4338ca', PFI_PREPARATION:'#d97706',
        AWAITING_INSURER_APPROVAL:'#dc2626', REPAIR_IN_PROGRESS:'#059669',
        WAITING_FOR_PARTS:'#ea580c', QUALITY_CHECK:'#16a34a',
        COMPLETED:'#15803d', INVOICED:'#7c3aed', RELEASED:'#475569'
      };
      statusChartEl.innerHTML = data.avgByStatus
        .filter(function(s){ return s.sampleCount > 0; })
        .map(function(s) {
          var pct = Math.max(4, Math.round((s.avgMins / maxAvgMins) * 100));
          var bg = STATUS_BG_TAT[s.status] || '#f1f5f9';
          var tc = STATUS_TEXT_TAT[s.status] || '#64748b';
          return '<div class="mb-2">' +
            '<div class="flex items-center justify-between text-xs mb-1">' +
              '<span class="font-medium text-gray-700">' + s.label + '</span>' +
              '<div class="flex items-center gap-2">' +
                '<span class="text-gray-400 text-[11px]">n=' + s.sampleCount + '</span>' +
                '<span class="font-semibold text-gray-800">' + s.avgFormatted + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="h-3 bg-gray-100 rounded-full overflow-hidden">' +
              '<div class="h-3 rounded-full transition-all" style="width:' + pct + '%;background:' + tc + ';opacity:0.7"></div>' +
            '</div>' +
          '</div>';
        }).join('') || '<p class="text-sm text-gray-400 text-center py-6">No completed status entries yet.<br><span class="text-xs">Data populates once job cards move through statuses.</span></p>';
    }

    // Technician leaderboard
    var techEl = document.getElementById('tatTechLeaderboard');
    if (techEl && data.techLeaderboard) {
      // Store leaderboard data for the detail modal
      window._techLeaderboardData = data.techLeaderboard;
      if (data.techLeaderboard.length === 0) {
        techEl.innerHTML = '<p class="text-sm text-gray-400 text-center py-6">No technician data yet.</p>';
      } else {
        techEl.innerHTML = '<div class="space-y-2">' +
          data.techLeaderboard.map(function(t, i) {
            var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + '.';
            var completionRate = t.jobCount > 0 ? Math.round((t.completedCount / t.jobCount) * 100) : 0;
            var initials = t.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
            var colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
            var color = colors[i % colors.length];
            return '<div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-violet-50 hover:border-violet-200 hover:shadow-sm transition-all group" ' +
              'onclick="showTechDetail(' + i + ')" title="View ' + t.name.replace(/'/g,'') + ' job details">' +
              '<span class="text-base w-7 text-center flex-shrink-0">' + medal + '</span>' +
              '<div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:' + color + '">' + initials + '</div>' +
              '<div class="flex-1 min-w-0">' +
                '<p class="text-sm font-semibold text-gray-800 truncate group-hover:text-violet-700">' + t.name + '</p>' +
                '<div class="flex items-center gap-2 mt-0.5">' +
                  '<span class="text-xs text-gray-400">' + t.jobCount + ' job' + (t.jobCount !== 1 ? 's' : '') + '</span>' +
                  '<span class="text-xs text-green-600 font-semibold">' + t.completedCount + ' done</span>' +
                  '<span class="text-xs text-gray-300">·</span>' +
                  '<span class="text-xs text-gray-500">' + completionRate + '% rate</span>' +
                '</div>' +
              '</div>' +
              '<div class="text-right flex-shrink-0">' +
                '<p class="text-sm font-bold text-violet-700">' + t.avgTATFormatted + '</p>' +
                '<p class="text-[10px] text-gray-400">avg TAT</p>' +
              '</div>' +
              '<i class="fas fa-chevron-right text-gray-300 group-hover:text-violet-400 text-xs flex-shrink-0 ml-1"></i>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }
  } catch(e) {
    console.error('TAT analytics error', e);
    ['tatKpiCards','tatByStatusChart','tatTechLeaderboard'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Unable to load data</p>';
    });
  }
}

// ─── Technician Detail Modal ──────────────────────────────────────────────────
var _techDetailIndex = null;
var _techDetailFilter = 'all';

function showTechDetail(idx) {
  var data = window._techLeaderboardData;
  if (!data || !data[idx]) return;
  var t = data[idx];
  _techDetailIndex = idx;
  _techDetailFilter = 'all';

  // Avatar + header
  var initials = t.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
  var colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  var color = colors[idx % colors.length];
  document.getElementById('techDetailAvatar').textContent = initials;
  document.getElementById('techDetailAvatar').style.background = 'linear-gradient(135deg,' + color + ',' + color + 'cc)';
  document.getElementById('techDetailName').textContent = t.name;
  var completionRate = t.jobCount > 0 ? Math.round((t.completedCount / t.jobCount) * 100) : 0;
  document.getElementById('techDetailSub').textContent = completionRate + '% completion rate · ' + t.jobCount + ' job' + (t.jobCount !== 1 ? 's' : '') + ' assigned';

  // KPIs
  document.getElementById('tdkTotalJobs').textContent = t.jobCount;
  document.getElementById('tdkCompleted').textContent = t.completedCount;
  document.getElementById('tdkAvgTAT').textContent = t.avgTATFormatted;

  // Render jobs list
  _renderTechJobsList(t.jobs, 'all');
  openModal('modal-techDetail');
}

function techDetailFilter(filter) {
  _techDetailFilter = filter;
  // Update tab styles
  ['all','active','done'].forEach(function(f) {
    var btn = document.getElementById('tdTab-' + f);
    if (btn) {
      btn.className = 'px-3 py-1 rounded-lg text-xs font-semibold ' +
        (f === filter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200');
    }
  });
  var data = window._techLeaderboardData;
  if (!data || _techDetailIndex === null) return;
  _renderTechJobsList(data[_techDetailIndex].jobs, filter);
}

function _renderTechJobsList(jobs, filter) {
  var tbody = document.getElementById('techDetailJobsList');
  if (!tbody) return;

  var filtered = jobs.filter(function(j) {
    if (filter === 'active') return j.status !== 'COMPLETED' && j.status !== 'INVOICED' && j.status !== 'RELEASED';
    if (filter === 'done')   return j.status === 'COMPLETED' || j.status === 'INVOICED' || j.status === 'RELEASED';
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-sm text-gray-400 py-8">No jobs in this category</td></tr>';
    return;
  }

  // Sort: active first, then by createdAt desc
  filtered.sort(function(a, b) {
    var aDone = (a.status === 'COMPLETED' || a.status === 'INVOICED' || a.status === 'RELEASED') ? 1 : 0;
    var bDone = (b.status === 'COMPLETED' || b.status === 'INVOICED' || b.status === 'RELEASED') ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  tbody.innerHTML = filtered.map(function(j) {
    var sc = STATUS_CONFIG[j.status] || { bg:'#f3f4f6', text:'#6b7280', label: j.status };
    var catIcon = {
      'Insurance': 'fa-shield-alt',
      'Private': 'fa-user',
      'Fleet': 'fa-truck',
      'Walk-in': 'fa-walking'
    }[j.category] || 'fa-car';
    var isDone = j.status === 'COMPLETED' || j.status === 'INVOICED' || j.status === 'RELEASED';
    return '<tr class="hover:bg-violet-50 cursor-pointer transition-colors group td-job-row" data-jid="' + j.id + '">' +
      '<td class="px-3 py-2.5">' +
        '<div class="flex items-center gap-1.5">' +
          '<i class="fas ' + catIcon + ' text-gray-300 text-[10px]"></i>' +
          '<span class="font-semibold text-blue-600 text-sm group-hover:underline">' + j.jobCardNumber + '</span>' +
        '</div>' +
        '<div class="text-[10px] text-gray-400 mt-0.5">' + fmtDate(j.createdAt) + '</div>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-sm text-gray-700 max-w-[120px] truncate">' + j.customerName + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-gray-500 hidden sm:table-cell max-w-[140px] truncate">' + j.vehicleInfo + '</td>' +
      '<td class="px-3 py-2.5">' +
        '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style="background:' + sc.bg + ';color:' + sc.text + '">' +
          sc.label +
        '</span>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-right text-xs ' + (isDone ? 'text-violet-700 font-bold' : 'text-gray-400') + '">' + (isDone ? j.tatFormatted : '—') + '</td>' +
      '<td class="px-3 py-2.5 text-center">' +
        '<button class="text-violet-400 hover:text-violet-600 transition-colors td-open-btn" data-jid="' + j.id + '" title="Open Job Card">' +
          '<i class="fas fa-external-link-alt text-xs pointer-events-none"></i>' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  // Delegate click events via data-jid (avoids inline string-escaping issues)
  tbody.querySelectorAll('.td-job-row').forEach(function(row) {
    row.addEventListener('click', function() { techDetailOpenJob(this.dataset.jid); });
  });
  tbody.querySelectorAll('.td-open-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); techDetailOpenJob(this.dataset.jid); });
  });
}

function techDetailOpenJob(jobId) {
  closeModal('modal-techDetail');
  // viewJobDetail fetches from API directly — no need to wait for allJobCards
  viewJobDetail(jobId);
}



// Role descriptions for preview
var ROLE_DESCRIPTIONS = {
  Owner: 'Full access to all modules, settings and user management',
  Manager: 'All operations + analytics; cannot delete users or manage settings',
  'Front Desk': 'Job cards, appointments, customers, vehicles, PFIs, invoices view',
  Technician: 'View job cards, update job status, view parts and services',
  Accountant: 'Invoices, expenses, analytics; cannot create job cards or modify customers',
};

var PERMISSION_GROUPS = [
  { label: 'Dashboard',     perms: ['dashboard.view'] },
  { label: 'Job Cards',     perms: ['jobcards.view','jobcards.create','jobcards.edit','jobcards.delete','jobcards.change_status','jobcards.assign_technician'] },
  { label: 'Appointments',  perms: ['appointments.view','appointments.create','appointments.edit','appointments.delete','appointments.convert'] },
  { label: 'Customers',     perms: ['customers.view','customers.create','customers.edit','customers.delete'] },
  { label: 'Vehicles',      perms: ['vehicles.view','vehicles.create','vehicles.edit'] },
  { label: 'PFIs',          perms: ['pfis.view','pfis.create','pfis.approve','pfis.send'] },
  { label: 'Invoices',      perms: ['invoices.view','invoices.create','invoices.mark_paid'] },
  { label: 'Expenses',      perms: ['expenses.view','expenses.create','expenses.approve','expenses.delete'] },
  { label: 'Catalogue',     perms: ['packages.view','packages.manage','oil_services.view','parts.view','parts.manage','parts.restock','carwash.view','carwash.manage','addons.view','addons.manage'] },
  { label: 'Analytics',     perms: ['analytics.view'] },
  { label: 'Users & Roles', perms: ['users.view','users.create','users.edit','users.delete','users.manage_roles'] },
  { label: 'Settings',      perms: ['settings.view','settings.manage'] },
];

var _allPermissions = null;  // fetched from /api/auth/permissions

function setUsersView(v) {
  document.getElementById('usersTeamView').classList.toggle('hidden', v !== 'team');
  document.getElementById('usersPermsView').classList.toggle('hidden', v !== 'permissions');
  document.getElementById('usersViewTeam').className = 'px-4 py-2 rounded-lg text-sm font-semibold ' + (v==='team' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200');
  document.getElementById('usersViewPerms').className = 'px-4 py-2 rounded-lg text-sm font-semibold ' + (v==='permissions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200');
  if (v === 'permissions' && _allPermissions) renderPermissionsMatrix(_allPermissions);
}

async function loadUsers() {
  const { data } = await axios.get('/api/users');
  allUsers = data;

  // Role stats
  var roles = ['Owner','Manager','Front Desk','Technician','Accountant'];
  var roleCounts = {};
  roles.forEach(function(r){ roleCounts[r] = data.filter(function(u){ return u.role===r; }).length; });
  document.getElementById('roleStatsRow').innerHTML = roles.map(function(r) {
    var rc = ROLE_CONFIG[r] || { bg:'#f1f5f9', text:'#64748b', icon:'fa-user' };
    return '<div class="card p-3 flex flex-col items-center text-center">' +
      '<div class="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style="background:'+rc.bg+'">' +
        '<i class="fas '+rc.icon+' text-sm" style="color:'+rc.text+'"></i>' +
      '</div>' +
      '<p class="text-xl font-bold text-gray-900">'+roleCounts[r]+'</p>' +
      '<p class="text-xs font-semibold mt-0.5" style="color:'+rc.text+'">'+r+'</p>' +
    '</div>';
  }).join('');

  // Guard: only users.manage_roles can see add button
  var addBtn = document.getElementById('addUserBtn');
  if (addBtn) addBtn.style.display = can('users.create') ? '' : 'none';

  // User cards
  document.getElementById('usersGrid').innerHTML = data.map(function(u) {
    var rc = ROLE_CONFIG[u.role] || { bg:'#f1f5f9', text:'#64748b', icon:'fa-user' };
    var initials = u.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
    var isSelf = currentUser && u.id === currentUser.id;
    var canEdit = can('users.edit');
    return '<div class="card p-5 hover:shadow-md transition-shadow">' +
      '<div class="flex items-start gap-3 mb-4">' +
        '<div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style="background:linear-gradient(135deg,'+rc.text+','+rc.text+'aa)">'+initials+'</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<h3 class="font-bold text-gray-900 truncate">'+escHtml(u.name)+'</h3>' +
            (isSelf ? '<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">You</span>' : '') +
          '</div>' +
          '<p class="text-sm text-gray-500 truncate">'+escHtml(u.email)+'</p>' +
          (u.phone ? '<p class="text-xs text-gray-400 mt-0.5">'+escHtml(u.phone)+'</p>' : '') +
        '</div>' +
        '<span class="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 '+(u.active ? 'bg-green-400' : 'bg-gray-300')+'" title="'+(u.active?'Active':'Inactive')+'"></span>' +
      '</div>' +
      '<div class="flex items-center justify-between gap-2">' +
        '<span class="badge" style="background:'+rc.bg+';color:'+rc.text+'"><i class="fas '+rc.icon+' mr-1"></i>'+escHtml(u.role)+'</span>' +
        (canEdit ? '<button class="btn-secondary text-xs py-1 px-2" onclick="openEditUser(&quot;'+u.id+'&quot;)"><i class="fas fa-edit mr-1"></i>Edit</button>' : '') +
      '</div>' +
      (u.lastLogin ? '<p class="text-xs text-gray-400 mt-2"><i class="fas fa-clock mr-1"></i>Last login: '+fmtDate(u.lastLogin)+'</p>' : '') +
    '</div>';
  }).join('') || '<div class="col-span-3 text-center py-12 text-gray-400"><i class="fas fa-users text-4xl mb-3 block"></i><p class="font-semibold">No team members yet</p><p class="text-sm mt-1">Add your first team member to get started</p></div>';

  // Fetch permission map for matrix
  if (!_allPermissions) {
    try {
      var pmRes = await axios.get('/api/auth/permissions');
      _allPermissions = pmRes.data;
    } catch(e) {}
  }
}

function updateRolePreview(role) {
  var preview = document.getElementById('rolePreview');
  var text = document.getElementById('rolePreviewText');
  if (!role || !ROLE_DESCRIPTIONS[role]) { preview.classList.add('hidden'); return; }
  text.textContent = ROLE_DESCRIPTIONS[role];
  preview.classList.remove('hidden');
}

function toggleFieldPassword(inputId, iconId) {
  var inp = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  if (!inp || !icon) return;
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

function showNewUserModal() {
  if (!can('users.create')) { showToast('Permission denied','error'); return; }
  openModal('modal-newUser');
}

async function submitNewUser(e) {
  e.preventDefault();
  var pwd = document.getElementById('usr-password').value;
  var pwd2 = document.getElementById('usr-password2').value;
  if (pwd !== pwd2) { showToast('Passwords do not match','error'); return; }
  const payload = {
    name: document.getElementById('usr-name').value,
    email: document.getElementById('usr-email').value,
    phone: document.getElementById('usr-phone').value,
    role: document.getElementById('usr-role').value,
    password: pwd,
    active: true
  };
  try {
    await axios.post('/api/users', payload);
    closeModal('modal-newUser');
    document.getElementById('newUserForm').reset();
    document.getElementById('rolePreview').classList.add('hidden');
    showToast('Team member added successfully');
    loadUsers();
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to add user', 'error');
  }
}

function openEditUser(id) {
  if (!can('users.edit')) { showToast('Permission denied','error'); return; }
  var u = allUsers.find(function(x){ return x.id === id; });
  if (!u) return;
  document.getElementById('edit-usr-id').value = u.id;
  document.getElementById('edit-usr-name').value = u.name;
  document.getElementById('edit-usr-email').value = u.email;
  document.getElementById('edit-usr-phone').value = u.phone || '';
  document.getElementById('edit-usr-role').value = u.role;
  document.getElementById('edit-usr-active').value = String(u.active);
  document.getElementById('edit-usr-password').value = '';
  // Hide delete button for self or if no delete permission
  var delBtn = document.getElementById('edit-usr-deleteBtn');
  var isSelf = currentUser && u.id === currentUser.id;
  delBtn.style.display = (can('users.delete') && !isSelf) ? '' : 'none';
  openModal('modal-editUser');
}

async function submitEditUser() {
  var id = document.getElementById('edit-usr-id').value;
  var payload = {
    name: document.getElementById('edit-usr-name').value,
    email: document.getElementById('edit-usr-email').value,
    phone: document.getElementById('edit-usr-phone').value,
    role: document.getElementById('edit-usr-role').value,
    active: document.getElementById('edit-usr-active').value === 'true',
  };
  var newPwd = document.getElementById('edit-usr-password').value;
  if (newPwd) payload.password = newPwd;
  try {
    var res = await axios.put('/api/users/' + id, payload);
    // If editing self, update currentUser info
    if (currentUser && id === currentUser.id) {
      currentUser = res.data;
      updateSidebarUser();
    }
    closeModal('modal-editUser');
    showToast('User updated');
    loadUsers();
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to update user', 'error');
  }
}

async function deleteUser() {
  var id = document.getElementById('edit-usr-id').value;
  var name = document.getElementById('edit-usr-name').value;
  if (!confirm('Remove ' + name + ' from the system? This cannot be undone.')) return;
  try {
    await axios.delete('/api/users/' + id);
    closeModal('modal-editUser');
    showToast(name + ' has been removed');
    loadUsers();
  } catch(err) {
    showToast('Failed to delete user','error');
  }
}

function renderPermissionsMatrix(permsMap) {
  var roles = ['Owner','Manager','Front Desk','Technician','Accountant'];
  var html = '<thead><tr><th class="text-left px-4 py-3 font-bold text-gray-700 bg-gray-50 sticky left-0 z-10">Permission</th>' +
    roles.map(function(r) {
      var rc = ROLE_CONFIG[r] || { bg:'#f1f5f9', text:'#64748b' };
      return '<th class="px-4 py-3 text-center font-bold" style="background:'+rc.bg+';color:'+rc.text+'">'+r+'</th>';
    }).join('') + '</tr></thead><tbody>';
  PERMISSION_GROUPS.forEach(function(grp) {
    html += '<tr><td colspan="6" class="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide">'+grp.label+'</td></tr>';
    grp.perms.forEach(function(perm) {
      var label = perm.split('.')[1].replace(/_/g,' ');
      html += '<tr class="border-b hover:bg-gray-50"><td class="px-4 py-2 text-xs text-gray-700 sticky left-0 bg-white">'+label+'</td>' +
        roles.map(function(r) {
          var has = permsMap[r] && permsMap[r].includes(perm);
          return '<td class="px-4 py-2 text-center">' +
            (has ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-gray-200"></i>') +
          '</td>';
        }).join('') + '</tr>';
    });
  });
  html += '</tbody>';
  document.getElementById('permMatrix').innerHTML = html;
}

// ═══ GLOBAL SEARCH ═══
// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ══════════════════════════════════════════════════════════════════════════════

let _gsDebounce = null;
let _gsActiveIdx = -1;
let _gsResults = []; // flat list of result items for keyboard nav

function handleGlobalSearch(q, isMobile) {
  clearTimeout(_gsDebounce);
  const panel   = document.getElementById(isMobile ? 'globalSearchPanelMobile' : 'globalSearchPanel');
  const clearBtn = document.getElementById('globalSearchClear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !q.trim());
  if (!q.trim()) { panel.classList.add('hidden'); _gsResults = []; return; }
  _gsDebounce = setTimeout(function() { _runGlobalSearch(q.trim(), isMobile); }, 180);
}

function _runGlobalSearch(q, isMobile) {
  const term = q.toLowerCase();
  const panel   = document.getElementById(isMobile ? 'globalSearchPanelMobile'   : 'globalSearchPanel');
  const resultsEl = document.getElementById(isMobile ? 'globalSearchResultsMobile' : 'globalSearchResults');
  _gsResults = [];
  _gsActiveIdx = -1;

  const sections = [];

  // ── 1. Job Cards ───────────────────────────────────────────────────────────
  const jobMatches = allJobCards.filter(j =>
    j.jobCardNumber.toLowerCase().includes(term) ||
    (j.damageDescription || '').toLowerCase().includes(term) ||
    (j.insurer || '').toLowerCase().includes(term) ||
    (j.claimReference || '').toLowerCase().includes(term) ||
    (j.assignedTechnician || '').toLowerCase().includes(term)
  ).slice(0, 5);
  if (jobMatches.length) {
    const items = jobMatches.map(j => {
      const cust = allCustomers.find(c => c.id === j.customerId);
      const veh  = allVehicles.find(v => v.id === j.vehicleId);
      const statusCfg = STATUS_CONFIG[j.status] || { label: j.status, color: 'bg-gray-100 text-gray-600' };
      return {
        type: 'job', id: j.id,
        primary: j.jobCardNumber,
        secondary: (veh ? veh.registrationNumber + ' · ' : '') + (cust ? cust.name : ''),
        meta: statusCfg.label,
        metaClass: statusCfg.color,
        icon: 'fa-clipboard-list', iconBg: 'bg-blue-100 text-blue-600',
        action: function() { viewJobDetail(j.id); }
      };
    });
    sections.push({ title: 'Job Cards', icon: 'fa-clipboard-list', items });
  }

  // ── 2. Customers ───────────────────────────────────────────────────────────
  const custMatches = allCustomers.filter(c =>
    c.name.toLowerCase().includes(term) ||
    (c.phone || '').toLowerCase().includes(term) ||
    (c.email || '').toLowerCase().includes(term) ||
    (c.companyName || '').toLowerCase().includes(term) ||
    (c.taxPin || '').toLowerCase().includes(term) ||
    (c.idNumber || '').toLowerCase().includes(term)
  ).slice(0, 5);
  if (custMatches.length) {
    const items = custMatches.map(c => ({
      type: 'customer', id: c.id,
      primary: c.name,
      secondary: (c.companyName ? c.companyName + ' · ' : '') + (c.phone || c.email || ''),
      meta: c.customerType || 'Individual',
      metaClass: c.customerType === 'Corporate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
      icon: 'fa-user', iconBg: 'bg-indigo-100 text-indigo-600',
      action: function() { showPage('customers'); setTimeout(function(){ viewCustomerDetail(c.id); }, 300); }
    }));
    sections.push({ title: 'Customers', icon: 'fa-users', items });
  }

  // ── 3. Vehicles ────────────────────────────────────────────────────────────
  const vehMatches = allVehicles.filter(v =>
    v.registrationNumber.toLowerCase().includes(term) ||
    v.make.toLowerCase().includes(term) ||
    v.model.toLowerCase().includes(term) ||
    (v.vin || '').toLowerCase().includes(term) ||
    (v.engineNumber || '').toLowerCase().includes(term) ||
    (v.insurer || '').toLowerCase().includes(term)
  ).slice(0, 5);
  if (vehMatches.length) {
    const items = vehMatches.map(v => {
      const owner = allCustomers.find(c => c.id === v.customerId);
      return {
        type: 'vehicle', id: v.id,
        primary: v.registrationNumber + ' – ' + v.make + ' ' + v.model,
        secondary: (owner ? owner.name + ' · ' : '') + (v.insurer || '') + (v.year ? ' · ' + v.year : ''),
        meta: v.year ? String(v.year) : '',
        metaClass: 'bg-green-100 text-green-700',
        icon: 'fa-car', iconBg: 'bg-green-100 text-green-600',
        action: function() { showPage('vehicles'); setTimeout(function(){ openVehicleDetail(v.id); }, 300); }
      };
    });
    sections.push({ title: 'Vehicles', icon: 'fa-car', items });
  }

  // ── 4. Vendors ─────────────────────────────────────────────────────────────
  const vndMatches = allVendors.filter(v =>
    v.name.toLowerCase().includes(term) ||
    (v.phone || '').toLowerCase().includes(term) ||
    (v.email || '').toLowerCase().includes(term) ||
    (v.tin || '').toLowerCase().includes(term) ||
    (v.vrn || '').toLowerCase().includes(term) ||
    (v.location || '').toLowerCase().includes(term)
  ).slice(0, 4);
  if (vndMatches.length) {
    const items = vndMatches.map(v => ({
      type: 'vendor', id: v.id,
      primary: v.name,
      secondary: (v.location || '') + (v.tin ? ' · TIN: ' + v.tin : ''),
      meta: v.status,
      metaClass: v.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
      icon: 'fa-store', iconBg: 'bg-orange-100 text-orange-600',
      action: function() { showPage('vendors'); setTimeout(function(){ viewVendorDetail(v.id); }, 300); }
    }));
    sections.push({ title: 'Vendors', icon: 'fa-store', items });
  }

  // ── 5. Lubricants ──────────────────────────────────────────────────────────
  const lubMatches = allLubricants.filter(l =>
    l.description.toLowerCase().includes(term) ||
    l.brand.toLowerCase().includes(term) ||
    (l.viscosity || '').toLowerCase().includes(term) ||
    (l.lubricantType || '').toLowerCase().includes(term)
  ).slice(0, 4);
  if (lubMatches.length) {
    const items = lubMatches.map(l => ({
      type: 'lubricant', id: l.id,
      primary: l.description,
      secondary: l.brand + ' · ' + (l.viscosity || '') + ' · ' + (l.volume || '') + '  — TZS ' + fmt(l.sellingPrice),
      meta: l.lubricantType || 'Lubricant',
      metaClass: 'bg-yellow-100 text-yellow-700',
      icon: 'fa-oil-can', iconBg: 'bg-yellow-100 text-yellow-700',
      action: function() { showPage('oil-services'); }
    }));
    sections.push({ title: 'Lubricants', icon: 'fa-oil-can', items });
  }

  // ── 6. Parts Catalogue ─────────────────────────────────────────────────────
  const partsMatches = allParts.filter(p =>
    p.description.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term) ||
    (p.compatibleModels || '').toLowerCase().includes(term)
  ).slice(0, 4);
  if (partsMatches.length) {
    const items = partsMatches.map(p => ({
      type: 'part', id: p.id,
      primary: p.description,
      secondary: p.category + (p.compatibleModels ? ' · ' + p.compatibleModels.slice(0, 60) + (p.compatibleModels.length > 60 ? '…' : '') : '') + '  — TZS ' + fmt(p.sellingPrice),
      meta: p.category,
      metaClass: 'bg-purple-100 text-purple-700',
      icon: 'fa-cog', iconBg: 'bg-purple-100 text-purple-600',
      action: function() { showPage('parts-catalogue'); }
    }));
    sections.push({ title: 'Parts Catalogue', icon: 'fa-cog', items });
  }

  // ── 7. Expenses ────────────────────────────────────────────────────────────
  const expMatches = allExpenses.filter(e =>
    (e.description || '').toLowerCase().includes(term) ||
    (e.vendor || '').toLowerCase().includes(term) ||
    (e.category || '').toLowerCase().includes(term) ||
    (e.receiptRef || '').toLowerCase().includes(term)
  ).slice(0, 4);
  if (expMatches.length) {
    const items = expMatches.map(e => ({
      type: 'expense', id: e.id,
      primary: e.description,
      secondary: e.category + (e.vendor ? ' · ' + e.vendor : '') + '  — TZS ' + fmt(e.amount),
      meta: e.status,
      metaClass: e.status === 'Paid' ? 'bg-green-100 text-green-700' : e.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700',
      icon: 'fa-receipt', iconBg: 'bg-rose-100 text-rose-600',
      action: function() { showPage('expenses'); }
    }));
    sections.push({ title: 'Expenses', icon: 'fa-receipt', items });
  }

  // ── 8. Invoices ────────────────────────────────────────────────────────────
  const invMatches = allInvoices.filter(i =>
    (i.invoiceNumber || '').toLowerCase().includes(term) ||
    (i.claimReference || '').toLowerCase().includes(term)
  ).slice(0, 3);
  if (invMatches.length) {
    const items = invMatches.map(i => {
      const jc = allJobCards.find(j => j.id === i.jobCardId);
      return {
        type: 'invoice', id: i.id,
        primary: i.invoiceNumber,
        secondary: (jc ? jc.jobCardNumber + ' · ' : '') + 'TZS ' + fmt(i.totalAmount),
        meta: i.status,
        metaClass: i.status === 'Paid' ? 'bg-green-100 text-green-700' : i.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700',
        icon: 'fa-file-invoice', iconBg: 'bg-teal-100 text-teal-600',
        action: function() { showPage('invoices'); }
      };
    });
    sections.push({ title: 'Invoices', icon: 'fa-file-invoice', items });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!sections.length) {
    resultsEl.innerHTML =
      '<div class="flex flex-col items-center justify-center py-10 text-gray-400">' +
      '<i class="fas fa-search text-3xl mb-3 opacity-30"></i>' +
      '<p class="text-sm font-medium">No results for <span class="font-bold text-gray-600">"' + escHtml(q) + '"</span></p>' +
      '<p class="text-xs mt-1 text-gray-300">Try a different term</p></div>';
    panel.classList.remove('hidden');
    return;
  }

  // Build flat result list for keyboard nav
  sections.forEach(function(sec) { sec.items.forEach(function(item) { _gsResults.push(item); }); });

  let html = '';
  // Search summary bar
  html += '<div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">' +
    '<i class="fas fa-search text-gray-400 text-xs"></i>' +
    '<span class="text-xs text-gray-500 flex-1">Results for <strong class="text-gray-700">' + escHtml(q) + '</strong></span>' +
    '<span class="text-xs text-gray-400">' + _gsResults.length + ' match' + (_gsResults.length !== 1 ? 'es' : '') + '</span>' +
    '</div>';

  let flatIdx = 0;
  sections.forEach(function(sec) {
    html += '<div class="px-3 pt-3 pb-1"><p class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">' +
      '<i class="fas ' + sec.icon + '"></i>' + sec.title + '</p></div>';
    sec.items.forEach(function(item) {
      const idx = flatIdx++;
      html += '<div class="gs-result flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" ' +
        'data-gs-idx="' + idx + '">' +
        '<div class="w-8 h-8 rounded-lg ' + item.iconBg + ' flex items-center justify-center shrink-0 text-sm">' +
        '<i class="fas ' + item.icon + '"></i></div>' +
        '<div class="min-w-0 flex-1">' +
        '<p class="text-sm font-semibold text-gray-800 truncate">' + escHtml(item.primary) + '</p>' +
        '<p class="text-xs text-gray-400 truncate">' + escHtml(item.secondary) + '</p>' +
        '</div>' +
        (item.meta ? '<span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ' + item.metaClass + '">' + escHtml(item.meta) + '</span>' : '') +
        '</div>';
    });
  });

  html += '<div class="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">' +
    '<span class="text-xs text-gray-400"><kbd class="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono text-xs">↑↓</kbd> navigate · ' +
    '<kbd class="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono text-xs">Enter</kbd> open · ' +
    '<kbd class="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono text-xs">Esc</kbd> close</span>' +
    '</div>';

  resultsEl.innerHTML = html;

  // Attach click handlers
  resultsEl.querySelectorAll('.gs-result').forEach(function(el) {
    el.addEventListener('mousedown', function(e) {
      e.preventDefault();
      const idx = parseInt(el.getAttribute('data-gs-idx'));
      closeGlobalSearch();
      _gsResults[idx].action();
    });
  });

  panel.classList.remove('hidden');
}

function globalSearchKeydown(e) {
  const isMobile = e.target.id === 'globalSearchMobile';
  const panel = document.getElementById(isMobile ? 'globalSearchPanelMobile' : 'globalSearchPanel');
  if (panel.classList.contains('hidden')) return;

  if (e.key === 'Escape') { closeGlobalSearch(); e.preventDefault(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _gsActiveIdx = Math.min(_gsActiveIdx + 1, _gsResults.length - 1);
    _gsHighlight(isMobile);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _gsActiveIdx = Math.max(_gsActiveIdx - 1, 0);
    _gsHighlight(isMobile);
  } else if (e.key === 'Enter' && _gsActiveIdx >= 0 && _gsResults[_gsActiveIdx]) {
    e.preventDefault();
    closeGlobalSearch();
    _gsResults[_gsActiveIdx].action();
  }
}

function _gsHighlight(isMobile) {
  const container = document.getElementById(isMobile ? 'globalSearchResultsMobile' : 'globalSearchResults');
  container.querySelectorAll('.gs-result').forEach(function(el, i) {
    if (i === _gsActiveIdx) {
      el.classList.add('bg-indigo-50');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('bg-indigo-50');
    }
  });
}

function closeGlobalSearch() {
  ['globalSearchPanel','globalSearchPanelMobile'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  ['globalSearch','globalSearchMobile'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const btn = document.getElementById('globalSearchClear');
  if (btn) btn.classList.add('hidden');
  _gsResults = [];
  _gsActiveIdx = -1;
}

// Close search panel when clicking outside
document.addEventListener('mousedown', function(e) {
  const wrap1 = document.getElementById('globalSearchWrap');
  const wrap2 = document.getElementById('globalSearchWrapMobile');
  if ((!wrap1 || !wrap1.contains(e.target)) && (!wrap2 || !wrap2.contains(e.target))) {
    ['globalSearchPanel','globalSearchPanelMobile'].forEach(function(id) {
      const el = document.getElementById(id); if (el) el.classList.add('hidden');
    });
  }
});

// ═══ LUBRICANTS CATALOGUE ═══
let allLubricants = [];
let _lubBrandFilter = '';
let _lubTypeFilter  = '';

const LUB_BRAND_COLORS = {
  Toyota:   { bg:'#eff6ff', text:'#2563eb' },
  Total:    { bg:'#fff7ed', text:'#c2410c' },
  Castrol:  { bg:'#f0fdf4', text:'#16a34a' },
  Shell:    { bg:'#fffbeb', text:'#b45309' },
  Mobil:    { bg:'#fef2f2', text:'#dc2626' },
  Valvoline:{ bg:'#f5f3ff', text:'#7c3aed' },
  Other:    { bg:'#f8fafc', text:'#64748b' },
};
const LUB_TYPE_COLORS = {
  'Engine Oil':           '#2563eb',
  'Gear Oil':             '#7c3aed',
  'Transmission Fluid':   '#d97706',
  'Brake Fluid':          '#dc2626',
  'Power Steering Fluid': '#0891b2',
  'Coolant':              '#16a34a',
  'Grease':               '#64748b',
  'Other':                '#94a3b8',
};

async function loadLubricants() {
  const { data } = await axios.get('/api/catalogue/lubricants');
  allLubricants = data;
  renderLubricantsStats(data);
  renderLubricantsTable(data);
}

function setLubBrandTab(brand, btn) {
  _lubBrandFilter = brand;
  document.querySelectorAll('#lubBrandTabs button').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-brand') === brand);
  });
  applyLubFilters();
}

function setLubTypeTab(type, btn) {
  _lubTypeFilter = type;
  document.querySelectorAll('#lubTypeTabs button').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  applyLubFilters();
}

function filterLubricants(search) {
  applyLubFilters(search);
}

function applyLubFilters(search) {
  const q = (search !== undefined ? search : (document.getElementById('lubSearch')?.value || '')).toLowerCase();
  let list = allLubricants;
  if (_lubBrandFilter) list = list.filter(function(l) { return l.brand === _lubBrandFilter; });
  if (_lubTypeFilter)  list = list.filter(function(l) { return l.lubricantType === _lubTypeFilter; });
  if (q) list = list.filter(function(l) {
    return l.description.toLowerCase().includes(q) || l.viscosity.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q) || l.lubricantType.toLowerCase().includes(q);
  });
  renderLubricantsStats(list);
  renderLubricantsTable(list);
}

function renderLubricantsStats(list) {
  const el = document.getElementById('lubStats');
  if (!el) return;
  if (!list.length) { el.innerHTML = ''; return; }
  const types = [...new Set(list.map(function(l) { return l.lubricantType; }))];
  const totalStock = list.reduce(function(s, l) { return s + (l.stockQuantity || 0); }, 0);
  const outOfStock = list.filter(function(l) { return (l.stockQuantity || 0) === 0; }).length;
  const avgMargin = list.reduce(function(s, l) { return s + l.margin; }, 0) / list.length;
  const bestMargin = Math.max.apply(null, list.map(function(l) { return l.margin; }));
  el.innerHTML = [
    { label:'Total Products', value: list.length,          icon:'fa-tint',        color:'#2563eb' },
    { label:'Types',          value: types.length,         icon:'fa-layer-group', color:'#7c3aed' },
    { label:'Avg Margin',     value:'TZS '+fmt(Math.round(avgMargin)), icon:'fa-chart-line', color:'#16a34a' },
    { label:'Best Margin',    value:'TZS '+fmt(bestMargin), icon:'fa-trophy',      color:'#d97706' },
    { label:'In Stock',       value: totalStock+' units',  icon:'fa-boxes',       color:'#0891b2' },
    { label:'Out of Stock',   value: outOfStock,           icon:'fa-exclamation-circle', color:'#dc2626' },
  ].map(function(s) {
    return '<div class="card p-4 border-l-4" style="border-color:'+s.color+'">' +
      '<div class="flex items-center gap-3 mb-1">' +
        '<i class="fas '+s.icon+' text-sm" style="color:'+s.color+'"></i>' +
        '<p class="text-xs text-gray-500 font-semibold uppercase">'+s.label+'</p>' +
      '</div>' +
      '<p class="text-xl font-bold text-gray-900">'+s.value+'</p>' +
    '</div>';
  }).join('');
}

function renderLubricantsTable(list) {
  const tbody = document.getElementById('lubTable');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="14" class="text-center py-12 text-gray-400"><i class="fas fa-tint text-3xl mb-3 block"></i>No lubricants found</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function(l) {
    const bc = LUB_BRAND_COLORS[l.brand] || { bg:'#f8fafc', text:'#64748b' };
    const tc = LUB_TYPE_COLORS[l.lubricantType] || '#64748b';
    const marginPct = l.sellingPrice > 0 ? Math.round((l.margin / l.sellingPrice) * 100) : 0;
    const marginColor = marginPct >= 40 ? '#16a34a' : marginPct >= 25 ? '#d97706' : '#dc2626';
    const stockBadge = (l.stockQuantity || 0) === 0
      ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><i class="fas fa-times-circle"></i>Out</span>'
      : (l.stockQuantity || 0) <= 5
        ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-exclamation-triangle"></i>'+l.stockQuantity+'</span>'
        : '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><i class="fas fa-check"></i>'+l.stockQuantity+'</span>';
    const batchCell = l.batchNumber
      ? '<span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">'+l.batchNumber+'</span>'
      : '<span class="text-xs text-gray-300">—</span>';
    const serialCell = l.partSerialNumber
      ? '<span class="text-xs font-mono text-gray-700">'+l.partSerialNumber+'</span>'
      : '<span class="text-xs text-gray-300">—</span>';
    return '<tr class="table-row border-b border-gray-50" data-id="'+l.id+'">' +
      '<td class="px-4 py-3">'+batchCell+'</td>' +
      '<td class="px-4 py-3"><span class="badge" style="background:'+bc.bg+';color:'+bc.text+'">'+l.brand+'</span></td>' +
      '<td class="px-4 py-3 font-medium text-gray-800 text-sm max-w-[220px]">'+l.description+'</td>' +
      '<td class="px-4 py-3">'+serialCell+'</td>' +
      '<td class="px-4 py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background:'+tc+'20;color:'+tc+'">'+l.lubricantType+'</span></td>' +
      '<td class="px-4 py-3 text-sm text-gray-600 font-mono">'+l.viscosity+'</td>' +
      '<td class="px-4 py-3 text-sm text-gray-600">'+l.volume+'</td>' +
      '<td class="px-4 py-3 text-right text-gray-600">'+fmt(l.buyingPrice)+'</td>' +
      '<td class="px-4 py-3 text-right font-bold text-gray-900">'+fmt(l.sellingPrice)+'</td>' +
      '<td class="px-4 py-3 text-right font-semibold text-green-600">'+fmt(l.margin)+'</td>' +
      '<td class="px-4 py-3 text-right"><span class="font-bold text-sm" style="color:'+marginColor+'">'+marginPct+'%</span></td>' +
      (function(){
        const needsInterval = l.lubricantType === 'Engine Oil' || l.lubricantType === 'Transmission Fluid';
        if (!needsInterval) return '<td class="px-4 py-3 text-center text-gray-300 text-xs">—</td>';
        if (l.mileageInterval) return '<td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700"><i class="fas fa-tachometer-alt text-[10px]"></i>'+l.mileageInterval.toLocaleString()+' km</span></td>';
        return '<td class="px-4 py-3 text-center"><span class="text-xs text-amber-500 font-medium"><i class="fas fa-exclamation-circle mr-0.5"></i>Not set</span></td>';
      })() +
      '<td class="px-4 py-3 text-right">'+stockBadge+'</td>' +
      '<td class="px-4 py-3 text-center">' +
        '<div class="flex items-center justify-center gap-1">' +
          '<button class="lub-edit-btn w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" data-id="'+l.id+'" title="Edit"><i class="fas fa-pen text-xs"></i></button>' +
          '<button class="lub-restock-btn w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors" data-id="'+l.id+'" title="Add Stock"><i class="fas fa-plus text-xs"></i></button>' +
          '<button class="lub-del-btn w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors" data-id="'+l.id+'" title="Delete"><i class="fas fa-trash text-xs"></i></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
  // Wire events via addEventListener
  tbody.querySelectorAll('.lub-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { showEditLubricantModal(btn.getAttribute('data-id')); });
  });
  tbody.querySelectorAll('.lub-restock-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { showLubRestockModal(btn.getAttribute('data-id')); });
  });
  tbody.querySelectorAll('.lub-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteLubricant(btn.getAttribute('data-id')); });
  });
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function lubTypeChanged() {
  const type = document.getElementById('lub-type').value;
  const row  = document.getElementById('lub-intervalRow');
  const needsInterval = type === 'Engine Oil' || type === 'Transmission Fluid';
  if (needsInterval) { row.classList.remove('hidden'); }
  else { row.classList.add('hidden'); document.getElementById('lub-interval').value = ''; }
}

function showAddLubricantModal() {
  document.getElementById('lub-id').value = '';
  document.getElementById('lubModal-title').textContent = 'Add Lubricant';
  document.getElementById('lubModal-submitLabel').textContent = 'Add Lubricant';
  ['lub-brand','lub-type','lub-description','lub-viscosity','lub-volume','lub-buyPrice','lub-sellPrice','lub-serial'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('lub-stock').value    = '0';
  document.getElementById('lub-interval').value = '';
  document.getElementById('lub-intervalRow').classList.add('hidden');
  document.getElementById('lub-marginPreview').classList.add('hidden');
  document.getElementById('lub-batchRow').classList.add('hidden');
  document.getElementById('lub-batchAutoNotice').classList.remove('hidden');
  openModal('modal-lubricant');
}

function showEditLubricantModal(id) {
  const l = allLubricants.find(function(x) { return x.id === id; });
  if (!l) return;
  document.getElementById('lub-id').value = l.id;
  document.getElementById('lubModal-title').textContent = 'Edit Lubricant';
  document.getElementById('lubModal-submitLabel').textContent = 'Save Changes';
  document.getElementById('lub-brand').value       = l.brand || '';
  document.getElementById('lub-type').value        = l.lubricantType || '';
  document.getElementById('lub-description').value = l.description || '';
  document.getElementById('lub-viscosity').value   = l.viscosity || '';
  document.getElementById('lub-volume').value      = l.volume || '';
  document.getElementById('lub-buyPrice').value    = l.buyingPrice || '';
  document.getElementById('lub-sellPrice').value   = l.sellingPrice || '';
  document.getElementById('lub-stock').value       = l.stockQuantity || 0;
  document.getElementById('lub-interval').value   = l.mileageInterval || '';
  document.getElementById('lub-serial').value      = l.partSerialNumber || '';
  // Hide the add-mode notice and show batch number (read-only)
  document.getElementById('lub-batchAutoNotice').classList.add('hidden');
  if (l.batchNumber) {
    document.getElementById('lub-batchDisplay').textContent = l.batchNumber;
    document.getElementById('lub-batchRow').classList.remove('hidden');
  } else {
    // Pre-seeded items without batch; show pending notice
    document.getElementById('lub-batchDisplay').textContent = 'Assigned on next save';
    document.getElementById('lub-batchRow').classList.remove('hidden');
  }
  lubTypeChanged(); // show/hide interval row based on type
  lubCalcMargin();
  openModal('modal-lubricant');
}

function lubCalcMargin() {
  const buy  = parseFloat(document.getElementById('lub-buyPrice').value)  || 0;
  const sell = parseFloat(document.getElementById('lub-sellPrice').value) || 0;
  const margin = sell - buy;
  const pct = sell > 0 ? Math.round((margin / sell) * 100) : 0;
  const el = document.getElementById('lub-marginPreview');
  if (buy > 0 || sell > 0) {
    el.classList.remove('hidden');
    document.getElementById('lub-marginAmt').textContent = 'TZS ' + fmt(margin);
    document.getElementById('lub-marginPct').textContent = '(' + pct + '%)';
  } else {
    el.classList.add('hidden');
  }
}

async function submitLubricant() {
  const id      = document.getElementById('lub-id').value;
  const brand   = document.getElementById('lub-brand').value;
  const type    = document.getElementById('lub-type').value;
  const desc    = document.getElementById('lub-description').value.trim();
  const visc    = document.getElementById('lub-viscosity').value.trim();
  const vol     = document.getElementById('lub-volume').value.trim();
  const buyP    = parseFloat(document.getElementById('lub-buyPrice').value)  || 0;
  const sellP   = parseFloat(document.getElementById('lub-sellPrice').value) || 0;
  const stock   = parseInt(document.getElementById('lub-stock').value)       || 0;
  if (!brand) { showToast('Please select a brand', 'error'); return; }
  if (!type)  { showToast('Please select a type', 'error'); return; }
  if (!desc)  { showToast('Description is required', 'error'); return; }
  if (sellP <= 0) { showToast('Selling price must be greater than 0', 'error'); return; }
  const payload = { brand, lubricantType: type, description: desc, viscosity: visc, volume: vol, buyingPrice: buyP, sellingPrice: sellP, stockQuantity: stock,
    partSerialNumber: document.getElementById('lub-serial').value.trim() || undefined,
    mileageInterval: (type === 'Engine Oil' || type === 'Transmission Fluid') ? (parseInt(document.getElementById('lub-interval').value) || undefined) : undefined };
  try {
    if (id) {
      await axios.put('/api/catalogue/lubricants/' + id, payload);
      showToast('Lubricant updated');
    } else {
      await axios.post('/api/catalogue/lubricants', payload);
      showToast('Lubricant added');
    }
    closeModal('modal-lubricant');
    const { data } = await axios.get('/api/catalogue/lubricants');
    allLubricants = data;
    applyLubFilters();
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to save lubricant', 'error');
  }
}

// ── Restock Modal ─────────────────────────────────────────────────────────────
function showLubRestockModal(id) {
  const l = allLubricants.find(function(x) { return x.id === id; });
  if (!l) return;
  document.getElementById('lubRestock-id').value = l.id;
  document.getElementById('lubRestock-name').textContent = l.description;
  document.getElementById('lubRestock-current').textContent = (l.stockQuantity || 0) + ' units';
  document.getElementById('lubRestock-qty').value = '';
  document.getElementById('lubRestock-preview').classList.add('hidden');
  openModal('modal-lubRestock');
}

function lubRestockPreview() {
  const id  = document.getElementById('lubRestock-id').value;
  const qty = parseInt(document.getElementById('lubRestock-qty').value) || 0;
  const l   = allLubricants.find(function(x) { return x.id === id; });
  const preview = document.getElementById('lubRestock-preview');
  if (qty > 0 && l) {
    document.getElementById('lubRestock-newTotal').textContent = ((l.stockQuantity || 0) + qty) + ' units';
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

async function submitLubRestock() {
  const id  = document.getElementById('lubRestock-id').value;
  const qty = parseInt(document.getElementById('lubRestock-qty').value) || 0;
  if (qty <= 0) { showToast('Please enter a quantity greater than 0', 'error'); return; }
  try {
    await axios.patch('/api/catalogue/lubricants/' + id + '/restock', { quantity: qty });
    showToast('Stock updated');
    closeModal('modal-lubRestock');
    const { data } = await axios.get('/api/catalogue/lubricants');
    allLubricants = data;
    applyLubFilters();
  } catch(err) {
    showToast('Failed to restock', 'error');
  }
}

async function deleteLubricant(id) {
  const l = allLubricants.find(function(x) { return x.id === id; });
  if (!l) return;
  if (!confirm('Delete "' + l.description + '"? This cannot be undone.')) return;
  try {
    await axios.delete('/api/catalogue/lubricants/' + id);
    showToast('"' + l.description + '" deleted');
    const { data } = await axios.get('/api/catalogue/lubricants');
    allLubricants = data;
    applyLubFilters();
  } catch(err) {
    showToast('Failed to delete', 'error');
  }
}

// ═══ LUBRICANTS BULK UPLOAD ═══
let _lubBulkRows = [];   // parsed & validated rows ready for import

// Valid values for normalisation
const LUB_VALID_BRANDS = ['Toyota','Total','Castrol','Shell','Mobil','Valvoline','Other'];
const LUB_VALID_TYPES  = ['Engine Oil','Gear Oil','Transmission Fluid','Brake Fluid','Power Steering Fluid','Coolant','Grease','Other'];

function showLubBulkUploadModal() {
  lubBulkClearFile();
  openModal('modal-lubBulkUpload');
}

function lubBulkHandleDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('lubBulk-dropzone');
  dz.classList.remove('border-blue-500','bg-blue-50');
  const file = event.dataTransfer.files[0];
  if (file) lubBulkParseFile(file);
}

function lubBulkClearFile() {
  _lubBulkRows = [];
  document.getElementById('lubBulk-fileInput').value = '';
  document.getElementById('lubBulk-status').className = 'hidden mb-3';
  document.getElementById('lubBulk-status').innerHTML = '';
  document.getElementById('lubBulk-previewWrap').classList.add('hidden');
  document.getElementById('lubBulk-previewBody').innerHTML = '';
  document.getElementById('lubBulk-errorList').classList.add('hidden');
  document.getElementById('lubBulk-errorList').innerHTML = '';
  document.getElementById('lubBulk-importBtn').classList.add('hidden');
}

function lubBulkParseFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    lubBulkShowStatus('error', 'File too large — maximum 5 MB');
    return;
  }
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv','xlsx','xls'].includes(ext)) {
    lubBulkShowStatus('error', 'Unsupported file type. Please use .csv, .xlsx or .xls');
    return;
  }
  lubBulkShowStatus('info', '<i class="fas fa-spinner fa-spin mr-2"></i>Parsing file…');

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let rows = [];
      if (ext === 'csv') {
        // Parse CSV with XLSX
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      }
      if (!rows.length) {
        lubBulkShowStatus('error', 'File is empty or has no data rows');
        return;
      }
      lubBulkValidateAndPreview(rows, file.name);
    } catch(err) {
      lubBulkShowStatus('error', 'Failed to parse file: ' + err.message);
    }
  };
  reader.readAsBinaryString(file);
}

function lubBulkNormaliseHeader(h) {
  // Normalise common column name variations
  h = String(h).trim().toLowerCase().replace(/[\s_-]+/g,'');
  const map = {
    brand:'brand', type:'type', lubricanttype:'type', lubtype:'type',
    description:'description', desc:'description', name:'description', productname:'description',
    viscosity:'viscosity', grade:'viscosity',
    volume:'volume', size:'volume', packsize:'volume',
    buyingprice:'buyingPrice', buyprice:'buyingPrice', costprice:'buyingPrice', cost:'buyingPrice',
    sellingprice:'sellingPrice', sellprice:'sellingPrice', saleprice:'sellingPrice', price:'sellingPrice',
    stock:'stock', stockquantity:'stock', qty:'stock', quantity:'stock', initialstock:'stock',
    mileageinterval:'mileageInterval', interval:'mileageInterval', serviceinterval:'mileageInterval', kminterval:'mileageInterval',
    partserial:'partSerialNumber', partnumber:'partSerialNumber', serialnumber:'partSerialNumber', partno:'partSerialNumber', serialno:'partSerialNumber',
  };
  return map[h] || h;
}

function lubBulkValidateAndPreview(rawRows, fileName) {
  // Map headers
  const firstRow = rawRows[0];
  const headerMap = {};
  Object.keys(firstRow).forEach(function(h) { headerMap[lubBulkNormaliseHeader(h)] = h; });

  const required = ['brand','description','type','buyingPrice','sellingPrice','stock'];
  const missing  = required.filter(function(k) { return !headerMap[k]; });
  if (missing.length) {
    lubBulkShowStatus('error', 'Missing required columns: <strong>' + missing.join(', ') + '</strong>. Please check your file headers.');
    return;
  }

  const validated = [];
  const errors    = [];

  rawRows.forEach(function(raw, i) {
    const rowNum = i + 2; // 1-based + header row
    function get(key) { return headerMap[key] ? String(raw[headerMap[key]] || '').trim() : ''; }

    const brand       = get('brand');
    const description = get('description');
    const type        = get('type');
    const viscosity   = get('viscosity');
    const volume      = get('volume');
    const buyRaw      = get('buyingPrice').replace(/,/g,'');
    const sellRaw     = get('sellingPrice').replace(/,/g,'');
    const stockRaw    = get('stock').replace(/,/g,'');
    const intervalRaw = get('mileageInterval').replace(/,/g,'');
    const serial       = get('partSerialNumber');

    const rowErrors = [];

    // Normalise brand
    const normBrand = LUB_VALID_BRANDS.find(function(b) { return b.toLowerCase() === brand.toLowerCase(); }) || brand;
    if (!LUB_VALID_BRANDS.includes(normBrand)) rowErrors.push('unknown brand "' + brand + '"');

    // Normalise type
    const normType = LUB_VALID_TYPES.find(function(t) { return t.toLowerCase() === type.toLowerCase(); }) || type;
    if (!LUB_VALID_TYPES.includes(normType)) rowErrors.push('unknown type "' + type + '"');

    const buyingPrice  = parseFloat(buyRaw);
    const sellingPrice = parseFloat(sellRaw);
    const stockQty     = parseInt(stockRaw);
    const interval     = intervalRaw ? parseInt(intervalRaw) : undefined;

    if (isNaN(buyingPrice)  || buyingPrice  < 0) rowErrors.push('invalid buyingPrice');
    if (isNaN(sellingPrice) || sellingPrice <= 0) rowErrors.push('invalid sellingPrice');
    if (isNaN(stockQty)     || stockQty     < 0)  rowErrors.push('invalid stock');
    if (intervalRaw && (isNaN(interval) || interval < 0)) rowErrors.push('invalid mileageInterval');

    const rowObj = {
      rowNum: rowNum,
      brand: normBrand,
      description: description,
      type: normType,
      viscosity: viscosity,
      volume: volume,
      buyingPrice: isNaN(buyingPrice)  ? 0 : buyingPrice,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      stock: isNaN(stockQty) ? 0 : stockQty,
      mileageInterval: (!intervalRaw || isNaN(interval)) ? undefined : interval,
      partSerialNumber: serial || undefined,
      errors: rowErrors,
      valid: rowErrors.length === 0,
    };
    validated.push(rowObj);
    if (rowErrors.length) errors.push('Row ' + rowNum + ': ' + rowErrors.join('; '));
  });

  _lubBulkRows = validated;
  const goodCount = validated.filter(function(r) { return r.valid; }).length;
  const badCount  = validated.length - goodCount;

  // Build preview table
  const tbody  = document.getElementById('lubBulk-previewBody');
  const fmtNum = function(n) { return n ? n.toLocaleString() : '—'; };
  tbody.innerHTML = validated.slice(0, 200).map(function(r) {
    const statusBadge = r.valid
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><i class="fas fa-check text-[9px]"></i>OK</span>'
      : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700" title="' + r.errors.join('; ') + '"><i class="fas fa-exclamation text-[9px]"></i>Error</span>';
    const rowCls = r.valid ? '' : 'bg-red-50';
    return '<tr class="border-b border-gray-100 ' + rowCls + '">' +
      '<td class="px-3 py-1.5 text-gray-400">' + r.rowNum + '</td>' +
      '<td class="px-3 py-1.5 font-semibold">' + (r.brand||'—') + '</td>' +
      '<td class="px-3 py-1.5 max-w-[200px] truncate">' + (r.description||'—') + '</td>' +
      '<td class="px-3 py-1.5">' + (r.type||'—') + '</td>' +
      '<td class="px-3 py-1.5">' + (r.viscosity||'—') + '</td>' +
      '<td class="px-3 py-1.5">' + (r.volume||'—') + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.buyingPrice) + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.sellingPrice) + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.stock) + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + (r.mileageInterval ? r.mileageInterval.toLocaleString() + ' km' : '—') + '</td>' +
      '<td class="px-3 py-1.5 text-center">' + statusBadge + '</td>' +
      '</tr>';
  }).join('');

  // Label
  document.getElementById('lubBulk-previewLabel').textContent =
    'Preview: ' + validated.length + ' row(s) from "' + fileName + '"' +
    (badCount ? ' — ' + badCount + ' row(s) have errors (shown in red)' : ' — all rows valid');

  // Error list
  const errDiv = document.getElementById('lubBulk-errorList');
  if (errors.length) {
    errDiv.classList.remove('hidden');
    errDiv.innerHTML = '<p class="font-semibold mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>' + errors.length + ' error(s) found — these rows will be skipped during import:</p>' +
      errors.map(function(e) { return '<p class="mt-0.5">• ' + e + '</p>'; }).join('');
  } else {
    errDiv.classList.add('hidden');
  }

  document.getElementById('lubBulk-previewWrap').classList.remove('hidden');

  if (goodCount > 0) {
    const importBtn = document.getElementById('lubBulk-importBtn');
    importBtn.classList.remove('hidden');
    document.getElementById('lubBulk-importLabel').textContent = 'Import ' + goodCount + ' lubricant' + (goodCount !== 1 ? 's' : '');
  }

  if (badCount === 0) {
    lubBulkShowStatus('success', '<i class="fas fa-check-circle mr-2 text-green-600"></i><span class="text-green-800 font-semibold">All ' + goodCount + ' rows are valid and ready to import.</span>');
  } else if (goodCount > 0) {
    lubBulkShowStatus('warning', '<i class="fas fa-exclamation-triangle mr-2 text-amber-500"></i><span class="text-amber-800 font-semibold">' + goodCount + ' valid / ' + badCount + ' invalid row(s). Only valid rows will be imported.</span>');
  } else {
    lubBulkShowStatus('error', '<i class="fas fa-times-circle mr-2"></i>No valid rows found. Please fix the errors and re-upload.');
  }
}

function lubBulkShowStatus(type, html) {
  const el  = document.getElementById('lubBulk-status');
  const cls = {
    success: 'flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm mb-3',
    warning: 'flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-3',
    error:   'flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm mb-3 text-red-800',
    info:    'flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm mb-3 text-blue-800',
  };
  el.className = cls[type] || cls.info;
  el.innerHTML = html;
}

async function lubBulkImport() {
  const validRows = _lubBulkRows.filter(function(r) { return r.valid; });
  if (!validRows.length) return;

  const btn = document.getElementById('lubBulk-importBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Importing…';

  try {
    const payload = validRows.map(function(r) {
      return {
        brand: r.brand,
        description: r.description,
        lubricantType: r.type,
        viscosity: r.viscosity || '',
        volume: r.volume || '',
        buyingPrice: r.buyingPrice,
        sellingPrice: r.sellingPrice,
        stockQuantity: r.stock,
        ...(r.mileageInterval ? { mileageInterval: r.mileageInterval } : {}),
        ...(r.partSerialNumber ? { partSerialNumber: r.partSerialNumber } : {}),
      };
    });

    const { data } = await axios.post('/api/catalogue/lubricants/bulk', payload);
    const added   = data.added   || 0;
    const skipped = data.skipped || 0;

    closeModal('modal-lubBulkUpload');
    lubBulkClearFile();

    // Refresh lubricants list
    const { data: fresh } = await axios.get('/api/catalogue/lubricants');
    allLubricants = fresh;
    applyLubFilters();

    showToast('\u2714 ' + added + ' lubricant' + (added !== 1 ? 's' : '') + ' imported successfully' + (skipped ? ' (' + skipped + ' skipped)' : ''), 'success');
  } catch(err) {
    lubBulkShowStatus('error', '<i class="fas fa-times-circle mr-2"></i>Import failed: ' + (err?.response?.data?.error || err.message));
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-database mr-1.5"></i><span id="lubBulk-importLabel">Retry Import</span>';
  }
}

function downloadLubricantTemplate() {
  const headers = ['brand','description','type','viscosity','volume','buyingPrice','sellingPrice','stock','mileageInterval','partSerialNumber'];
  const examples = [
    ['Toyota','Toyota Genuine Motor Oil 5W-30','Engine Oil','5W-30','4L',55000,85000,20,10000,'TOY-5W30-4L'],
    ['Total','Total Quartz 9000 5W-40','Engine Oil','5W-40','5L',68000,98000,15,15000,'TTL-Q9000-5W40'],
    ['Castrol','Castrol ATF Dexron III','Transmission Fluid','ATF','1L',10000,18000,30,40000,'CST-ATF-D3'],
    ['Shell','Shell Brake Fluid DOT 4','Brake Fluid','DOT 4','500ml',8000,14000,25,'','SHL-BF-DOT4'],
    ['Mobil','Mobil Gear Oil 80W-90','Gear Oil','80W-90','1L',12000,20000,18,'','MOB-GO-80W90'],
  ];

  const ws_data = [headers].concat(examples);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Column widths
  ws['!cols'] = [12,40,22,12,10,14,14,8,16,20].map(function(w) { return { wch: w }; });

  XLSX.utils.book_append_sheet(wb, ws, 'Lubricants');
  XLSX.writeFile(wb, 'lubricants_upload_template.xlsx');
  showToast('Template downloaded — fill in your data and re-upload', 'info');
}

// ═══ PARTS BULK UPLOAD ═══
const PART_VALID_CATEGORIES = ['Air Filter','AC Filter','Oil Filter','Diesel Filter','Spark Plugs','Accessory'];
let _partBulkRows = [];

function partBulkHandleDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('partBulk-dropzone');
  dz.classList.remove('border-green-500','bg-green-50');
  const file = event.dataTransfer.files[0];
  if (file) partBulkParseFile(file);
}

function partBulkClearFile() {
  _partBulkRows = [];
  document.getElementById('partBulk-fileInput').value = '';
  document.getElementById('partBulk-status').className = 'hidden mb-3';
  document.getElementById('partBulk-status').innerHTML = '';
  document.getElementById('partBulk-previewWrap').classList.add('hidden');
  document.getElementById('partBulk-previewBody').innerHTML = '';
  document.getElementById('partBulk-errorList').classList.add('hidden');
  document.getElementById('partBulk-errorList').innerHTML = '';
  document.getElementById('partBulk-importBtn').classList.add('hidden');
}

function partBulkParseFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    partBulkShowStatus('error', 'File too large — maximum 5 MB');
    return;
  }
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv','xlsx','xls'].includes(ext)) {
    partBulkShowStatus('error', 'Unsupported file type. Please use .csv, .xlsx or .xls');
    return;
  }
  partBulkShowStatus('info', '<i class="fas fa-spinner fa-spin mr-2"></i>Parsing file…');
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { partBulkShowStatus('error', 'File is empty or has no data rows'); return; }
      partBulkValidateAndPreview(rows, file.name);
    } catch(err) {
      partBulkShowStatus('error', 'Failed to parse file: ' + err.message);
    }
  };
  reader.readAsBinaryString(file);
}

function partBulkNormaliseHeader(h) {
  h = String(h).trim().toLowerCase().replace(/[\s_-]+/g,'');
  const map = {
    category:'category', cat:'category', type:'category',
    description:'description', desc:'description', name:'description', partname:'description',
    compatiblemodels:'compatibleModels', models:'compatibleModels', compatible:'compatibleModels', fitment:'compatibleModels',
    buyingprice:'buyingPrice', buyprice:'buyingPrice', costprice:'buyingPrice', cost:'buyingPrice',
    sellingprice:'sellingPrice', sellprice:'sellingPrice', saleprice:'sellingPrice', price:'sellingPrice',
    stock:'stock', stockquantity:'stock', qty:'stock', quantity:'stock', initialstock:'stock',
    partserial:'partSerialNumber', partnumber:'partSerialNumber', serialnumber:'partSerialNumber',
    partno:'partSerialNumber', serialno:'partSerialNumber', partserialnumber:'partSerialNumber',
  };
  return map[h] || h;
}

function partBulkValidateAndPreview(rawRows, fileName) {
  const firstRow = rawRows[0];
  const headerMap = {};
  Object.keys(firstRow).forEach(function(h) { headerMap[partBulkNormaliseHeader(h)] = h; });

  const required = ['category','description','sellingPrice'];
  const missing  = required.filter(function(k) { return !headerMap[k]; });
  if (missing.length) {
    partBulkShowStatus('error', 'Missing required columns: <strong>' + missing.join(', ') + '</strong>. Please check your file headers.');
    return;
  }

  const validated = [];
  const errors    = [];

  rawRows.forEach(function(raw, i) {
    const rowNum = i + 2;
    function get(key) { return headerMap[key] ? String(raw[headerMap[key]] || '').trim() : ''; }

    const category    = get('category');
    const description = get('description');
    const models      = get('compatibleModels');
    const serial      = get('partSerialNumber');
    const buyRaw      = get('buyingPrice').replace(/,/g,'');
    const sellRaw     = get('sellingPrice').replace(/,/g,'');
    const stockRaw    = get('stock').replace(/,/g,'');

    const rowErrors = [];
    if (!description) rowErrors.push('description is empty');
    if (!category)    rowErrors.push('category is missing');

    const normCat = PART_VALID_CATEGORIES.find(function(c) { return c.toLowerCase() === category.toLowerCase(); }) || category;
    if (category && !PART_VALID_CATEGORIES.includes(normCat)) rowErrors.push('unknown category "' + category + '"');

    const buyingPrice  = parseFloat(buyRaw);
    const sellingPrice = parseFloat(sellRaw);
    const stockQty     = parseInt(stockRaw);

    if (isNaN(sellingPrice) || sellingPrice <= 0) rowErrors.push('invalid sellingPrice');
    if (buyRaw && (isNaN(buyingPrice) || buyingPrice < 0)) rowErrors.push('invalid buyingPrice');
    if (stockRaw && (isNaN(stockQty) || stockQty < 0)) rowErrors.push('invalid stock');

    const rowObj = {
      rowNum,
      category: normCat,
      description,
      compatibleModels: models,
      partSerialNumber: serial || undefined,
      buyingPrice: isNaN(buyingPrice) ? 0 : buyingPrice,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      stock: isNaN(stockQty) ? 0 : stockQty,
      errors: rowErrors,
      valid: rowErrors.length === 0,
    };
    validated.push(rowObj);
    if (rowErrors.length) errors.push('Row ' + rowNum + ': ' + rowErrors.join('; '));
  });

  _partBulkRows = validated;
  const goodCount = validated.filter(function(r) { return r.valid; }).length;
  const badCount  = validated.length - goodCount;

  const tbody  = document.getElementById('partBulk-previewBody');
  const fmtNum = function(n) { return (n && n > 0) ? n.toLocaleString() : '—'; };
  tbody.innerHTML = validated.slice(0, 200).map(function(r) {
    const statusBadge = r.valid
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><i class="fas fa-check text-[9px]"></i>OK</span>'
      : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700" title="' + r.errors.join('; ') + '"><i class="fas fa-exclamation text-[9px]"></i>Error</span>';
    const rowCls = r.valid ? '' : 'bg-red-50';
    return '<tr class="border-b border-gray-100 ' + rowCls + '">' +
      '<td class="px-3 py-1.5 text-gray-400">' + r.rowNum + '</td>' +
      '<td class="px-3 py-1.5 font-semibold">' + (r.category||'—') + '</td>' +
      '<td class="px-3 py-1.5 max-w-[180px] truncate">' + (r.description||'—') + '</td>' +
      '<td class="px-3 py-1.5 text-gray-500">' + (r.compatibleModels||'—') + '</td>' +
      '<td class="px-3 py-1.5 font-mono">' + (r.partSerialNumber||'—') + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.buyingPrice) + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.sellingPrice) + '</td>' +
      '<td class="px-3 py-1.5 text-right">' + fmtNum(r.stock) + '</td>' +
      '<td class="px-3 py-1.5 text-center">' + statusBadge + '</td>' +
      '</tr>';
  }).join('');

  document.getElementById('partBulk-previewLabel').textContent =
    'Preview: ' + validated.length + ' row(s) from "' + fileName + '"' +
    (badCount ? ' — ' + badCount + ' row(s) have errors (shown in red)' : ' — all rows valid');

  const errDiv = document.getElementById('partBulk-errorList');
  if (errors.length) {
    errDiv.classList.remove('hidden');
    errDiv.innerHTML = '<p class="font-semibold mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>' + errors.length + ' error(s) found — these rows will be skipped:</p>' +
      errors.map(function(e) { return '<p class="mt-0.5">• ' + e + '</p>'; }).join('');
  } else {
    errDiv.classList.add('hidden');
  }

  document.getElementById('partBulk-previewWrap').classList.remove('hidden');

  if (goodCount > 0) {
    const importBtn = document.getElementById('partBulk-importBtn');
    importBtn.classList.remove('hidden');
    document.getElementById('partBulk-importLabel').textContent = 'Import ' + goodCount + ' part' + (goodCount !== 1 ? 's' : '');
  }

  if (badCount === 0) {
    partBulkShowStatus('success', '<i class="fas fa-check-circle mr-2 text-green-600"></i><span class="text-green-800 font-semibold">All ' + goodCount + ' rows are valid and ready to import.</span>');
  } else if (goodCount > 0) {
    partBulkShowStatus('warning', '<i class="fas fa-exclamation-triangle mr-2 text-amber-500"></i><span class="text-amber-800 font-semibold">' + goodCount + ' valid / ' + badCount + ' invalid row(s). Only valid rows will be imported.</span>');
  } else {
    partBulkShowStatus('error', '<i class="fas fa-times-circle mr-2"></i>No valid rows found. Please fix the errors and re-upload.');
  }
}

function partBulkShowStatus(type, html) {
  const el  = document.getElementById('partBulk-status');
  const cls = {
    success: 'flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm mb-3',
    warning: 'flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-3',
    error:   'flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm mb-3 text-red-800',
    info:    'flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm mb-3 text-blue-800',
  };
  el.className = cls[type] || cls.info;
  el.innerHTML = html;
}

async function partBulkImport() {
  const validRows = _partBulkRows.filter(function(r) { return r.valid; });
  if (!validRows.length) return;

  const btn = document.getElementById('partBulk-importBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Importing…';

  try {
    const payload = validRows.map(function(r) {
      return {
        category: r.category,
        description: r.description,
        compatibleModels: r.compatibleModels || '',
        buyingPrice: r.buyingPrice,
        sellingPrice: r.sellingPrice,
        stockQuantity: r.stock,
        ...(r.partSerialNumber ? { partSerialNumber: r.partSerialNumber } : {}),
      };
    });

    const { data } = await axios.post('/api/catalogue/parts/bulk', payload);
    const added   = data.added   || 0;
    const skipped = data.skipped || 0;

    closeModal('modal-partBulk');
    partBulkClearFile();

    // Refresh parts list
    const { data: fresh } = await axios.get('/api/catalogue/parts');
    allParts = fresh;
    filterParts();

    showToast('✔ ' + added + ' part' + (added !== 1 ? 's' : '') + ' imported successfully' + (skipped ? ' (' + skipped + ' skipped)' : ''), 'success');
  } catch(err) {
    partBulkShowStatus('error', '<i class="fas fa-times-circle mr-2"></i>Import failed: ' + (err?.response?.data?.error || err.message));
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-database mr-1.5"></i><span id="partBulk-importLabel">Retry Import</span>';
  }
}

function downloadPartTemplate() {
  const headers = ['category','description','compatibleModels','buyingPrice','sellingPrice','stock','partSerialNumber'];
  const examples = [
    ['Air Filter','Air Filter – Toyota Hilux 2.7','HILUX,FORTUNER',7000,25000,15,'TOY-AF-HILUX-2.7'],
    ['Oil Filter','Oil Filter – Toyota Land Cruiser','LAND CRUISER,PRADO',9000,22000,20,'TOY-OF-LC200'],
    ['Spark Plugs','NGK Spark Plug – Iridium','COROLLA,CAMRY,VIOS',8000,18000,30,'NGK-IR-CORD'],
    ['AC Filter','Cabin Air Filter – Nissan X-Trail','X-TRAIL,QASHQAI',6000,16000,12,'NIS-AC-XTRAIL'],
    ['Diesel Filter','Diesel Filter – Mitsubishi Canter','CANTER,FUSO',12000,28000,10,'MIT-DF-CANTER'],
    ['Accessory','Steering Wheel Cover – Universal','UNIVERSAL',5000,12000,25,'ACC-SWC-UNV'],
  ];

  const ws_data = [headers].concat(examples);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [14,40,30,14,14,8,22].map(function(w) { return { wch: w }; });
  XLSX.utils.book_append_sheet(wb, ws, 'Parts');
  XLSX.writeFile(wb, 'parts_upload_template.xlsx');
  showToast('Template downloaded — fill in your data and re-upload', 'info');
}

// ═══ OIL SERVICES (pricing tiers — kept for job card add-service modal) ═══
let oilData = [];
async function loadOilServices() {
  const { data } = await axios.get('/api/catalogue/oil');
  oilData = data;
}

let _currentOilBrand = 'Toyota';

function showOilBrand(brand, btn) {
  _currentOilBrand = brand;
  document.querySelectorAll('#oilBrandTabs button').forEach(b => {
    b.className = 'px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200';
  });
  if (btn) btn.className = 'px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow';
  const product = oilData.find(p => p.brand === brand);
  const banner = document.getElementById('oilFleetBanner');
  // Show fleet banner for any brand that has fleet discounts configured
  if (product && (product.fleetDiscount3to5 > 0 || product.fleetDiscount5plus > 0)) {
    banner.classList.remove('hidden');
    document.getElementById('oilFleetBannerText').innerHTML =
      '3\u20135 vehicles: <strong>TZS ' + fmt(product.fleetDiscount3to5) + ' off</strong> per car &nbsp;|&nbsp; 5+ vehicles: <strong>TZS ' + fmt(product.fleetDiscount5plus) + ' off</strong> per car';
  } else {
    banner.classList.add('hidden');
  }
  const canManage = can('packages.manage');
  if (!product) {
    document.getElementById('oilPricingTable').innerHTML =
      '<div class="p-8 text-center text-gray-400"><i class="fas fa-oil-can text-3xl mb-3 block"></i>No pricing data for ' + brand + '.' +
      (canManage ? ' <button class="mt-3 btn-primary text-sm" onclick="showOilTierModal()"><i class="fas fa-plus mr-1"></i>Add First Tier</button>' : '') +
      '</div>';
    return;
  }
  const tc = { Standard: { bg:'#eff6ff', text:'#2563eb' }, Prestige: { bg:'#f5f3ff', text:'#7c3aed' }, Premier: { bg:'#fffbeb', text:'#d97706' } };
  const actionCol = canManage ? '<th class="text-center px-4 py-4 font-semibold text-gray-500">Actions</th>' : '';
  const rows = product.tiers.map((t, i) => {
    const actions = canManage
      ? '<td class="px-4 py-3.5 text-center"><div class="flex items-center justify-center gap-1">' +
          '<button class="oil-edit-btn w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" data-idx="' + i + '" title="Edit"><i class="fas fa-pen text-xs"></i></button>' +
          '<button class="oil-del-btn w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors" data-idx="' + i + '" title="Delete"><i class="fas fa-trash text-xs"></i></button>' +
        '</div></td>'
      : '';
    return '<tr class="border-b hover:bg-gray-50 transition-colors ' + (i % 2 === 0 ? '' : 'bg-gray-50/50') + '">' +
      '<td class="px-5 py-3.5 font-semibold text-gray-800"><i class="fas fa-tachometer-alt text-gray-400 mr-2 text-xs"></i>' + t.engineSize + '</td>' +
      '<td class="px-5 py-3.5 text-right"><span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:' + tc.Standard.bg + ';color:' + tc.Standard.text + '">' + fmt(t.standardPrice) + '</span></td>' +
      '<td class="px-5 py-3.5 text-right"><span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:' + tc.Prestige.bg + ';color:' + tc.Prestige.text + '">' + fmt(t.prestigePrice) + '</span></td>' +
      '<td class="px-5 py-3.5 text-right"><span class="inline-block px-3 py-1 rounded-lg font-bold text-sm" style="background:' + tc.Premier.bg + ';color:' + tc.Premier.text + '">' + fmt(t.premierPrice) + '</span></td>' +
      '<td class="px-5 py-3.5 text-right text-green-600 font-medium">' + fmt(t.standardMargin) + '</td>' +
      '<td class="px-5 py-3.5 text-right text-green-600 font-medium">' + fmt(t.prestigeMargin) + '</td>' +
      '<td class="px-5 py-3.5 text-right text-green-600 font-medium">' + fmt(t.premierMargin) + '</td>' +
      actions +
      '</tr>';
  }).join('');
  const fleetNote = (product.fleetDiscount3to5 > 0 || product.fleetDiscount5plus > 0)
    ? '<div class="p-4 bg-amber-50 border-t border-amber-100"><p class="text-xs text-amber-700 font-semibold"><i class="fas fa-info-circle mr-1"></i>Fleet Discount: TZS ' + fmt(product.fleetDiscount3to5) + '/car for 3\u20135 vehicles | TZS ' + fmt(product.fleetDiscount5plus) + '/car for 5+ vehicles (per service)</p></div>'
    : '';
  const tableEl = document.getElementById('oilPricingTable');
  tableEl.innerHTML =
    '<div class="overflow-x-auto"><table class="w-full text-sm">' +
    '<thead><tr class="bg-gray-50 border-b">' +
    '<th class="text-left px-5 py-4 font-bold text-gray-700">Engine Size</th>' +
    '<th class="text-right px-5 py-4 font-bold" style="color:' + tc.Standard.text + '"><div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:' + tc.Standard.text + '"></span>Standard</div></th>' +
    '<th class="text-right px-5 py-4 font-bold" style="color:' + tc.Prestige.text + '"><div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:' + tc.Prestige.text + '"></span>Prestige</div></th>' +
    '<th class="text-right px-5 py-4 font-bold" style="color:' + tc.Premier.text + '"><div class="flex items-center justify-end gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:' + tc.Premier.text + '"></span>Premier</div></th>' +
    '<th class="text-right px-5 py-4 font-semibold text-gray-500">Std Margin</th>' +
    '<th class="text-right px-5 py-4 font-semibold text-gray-500">Pres Margin</th>' +
    '<th class="text-right px-5 py-4 font-semibold text-gray-500">Prem Margin</th>' +
    actionCol +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table></div>' +
    fleetNote;
  // Wire up action buttons via event listeners (avoids inline onclick string-escaping)
  tableEl.querySelectorAll('.oil-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { showOilTierModal(brand, parseInt(btn.getAttribute('data-idx'), 10)); });
  });
  tableEl.querySelectorAll('.oil-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteOilTier(brand, parseInt(btn.getAttribute('data-idx'), 10)); });
  });
}

// ═══ OIL TIER MODAL ═══
function showOilTierModal(brand, tierIndex) {
  if (!can('packages.manage')) { showToast('Permission denied', 'error'); return; }
  const b = brand || _currentOilBrand;
  document.getElementById('oilTier-brand').value = b;
  document.getElementById('oilTier-index').value = tierIndex !== undefined ? String(tierIndex) : '';
  const isEdit = tierIndex !== undefined && tierIndex !== null && tierIndex !== '';
  document.getElementById('oilTierModalTitle').textContent = isEdit ? 'Edit Engine Size Tier' : 'Add Engine Size Tier';
  if (isEdit) {
    const product = oilData.find(p => p.brand === b);
    const t = product && product.tiers[tierIndex];
    if (t) {
      document.getElementById('oilTier-engineSize').value = t.engineSize || '';
      document.getElementById('oilTier-stdPrice').value = t.standardPrice || '';
      document.getElementById('oilTier-stdMargin').value = t.standardMargin || '';
      document.getElementById('oilTier-presPrice').value = t.prestigePrice || '';
      document.getElementById('oilTier-presMargin').value = t.prestigeMargin || '';
      document.getElementById('oilTier-premPrice').value = t.premierPrice || '';
      document.getElementById('oilTier-premMargin').value = t.premierMargin || '';
    }
  } else {
    ['oilTier-engineSize','oilTier-stdPrice','oilTier-stdMargin','oilTier-presPrice','oilTier-presMargin','oilTier-premPrice','oilTier-premMargin'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
  ['oilTier-stdPct','oilTier-presPct','oilTier-premPct'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('oilTier-marginPreview').classList.add('hidden');
  oilTierCalcMargin();
  openModal('modal-oilTier');
}

function oilTierCalcMargin() {
  const pairs = [
    { priceId:'oilTier-stdPrice',  marginId:'oilTier-stdMargin',  pctId:'oilTier-stdPct'  },
    { priceId:'oilTier-presPrice', marginId:'oilTier-presMargin', pctId:'oilTier-presPct' },
    { priceId:'oilTier-premPrice', marginId:'oilTier-premMargin', pctId:'oilTier-premPct' },
  ];
  const details = [];
  pairs.forEach(p => {
    const price = parseFloat(document.getElementById(p.priceId).value) || 0;
    const marginEl = document.getElementById(p.marginId);
    const existingMargin = parseFloat(marginEl.value);
    // Only auto-fill margin if not already entered by user
    if (!marginEl.dataset.userEdited && price > 0) {
      // Don't overwrite if user typed a value
    }
    const margin = parseFloat(marginEl.value) || 0;
    const pct = price > 0 ? Math.round((margin / price) * 100) : 0;
    const pctEl = document.getElementById(p.pctId);
    if (price > 0) {
      pctEl.textContent = pct + '% margin';
      pctEl.classList.remove('hidden');
      details.push(pct + '%');
    } else {
      pctEl.classList.add('hidden');
    }
  });
  const preview = document.getElementById('oilTier-marginPreview');
  if (details.length > 0) {
    preview.classList.remove('hidden');
    document.getElementById('oilTier-marginDetails').innerHTML =
      ['Standard','Prestige','Premier'].map((label, i) => {
        const price = parseFloat(document.getElementById(['oilTier-stdPrice','oilTier-presPrice','oilTier-premPrice'][i]).value) || 0;
        const margin = parseFloat(document.getElementById(['oilTier-stdMargin','oilTier-presMargin','oilTier-premMargin'][i]).value) || 0;
        const pct = price > 0 ? Math.round((margin / price) * 100) : 0;
        return '<span class="text-green-700">' + label + ': <strong>TZS ' + fmt(margin) + '</strong> (' + pct + '%)</span>';
      }).join(' &nbsp;|&nbsp; ');
  } else {
    preview.classList.add('hidden');
  }
}

function oilTierMarginChanged(tier) {
  const marginId = 'oilTier-' + tier + 'Margin';
  document.getElementById(marginId).dataset.userEdited = '1';
  oilTierCalcMargin();
}

async function submitOilTier() {
  const brand = document.getElementById('oilTier-brand').value;
  const indexStr = document.getElementById('oilTier-index').value;
  const engineSize = document.getElementById('oilTier-engineSize').value.trim();
  const stdPrice  = parseFloat(document.getElementById('oilTier-stdPrice').value)  || 0;
  const stdMargin = parseFloat(document.getElementById('oilTier-stdMargin').value) || 0;
  const presPrice  = parseFloat(document.getElementById('oilTier-presPrice').value)  || 0;
  const presMargin = parseFloat(document.getElementById('oilTier-presMargin').value) || 0;
  const premPrice  = parseFloat(document.getElementById('oilTier-premPrice').value)  || 0;
  const premMargin = parseFloat(document.getElementById('oilTier-premMargin').value) || 0;
  if (!engineSize) { showToast('Please enter an engine size label', 'error'); return; }
  if (stdPrice <= 0 || presPrice <= 0 || premPrice <= 0) { showToast('All three tier prices are required', 'error'); return; }
  const payload = {
    engineSize,
    standardPrice: stdPrice, standardMargin: stdMargin,
    prestigePrice: presPrice, prestigeMargin: presMargin,
    premierPrice: premPrice, premierMargin: premMargin
  };
  try {
    if (indexStr !== '' && indexStr !== undefined) {
      await axios.patch('/api/catalogue/oil/' + brand + '/tier/' + indexStr, payload);
      showToast('Tier updated successfully');
    } else {
      await axios.post('/api/catalogue/oil/' + brand + '/tier', payload);
      showToast('New tier added');
    }
    closeModal('modal-oilTier');
    const { data } = await axios.get('/api/catalogue/oil');
    oilData = data;
    showOilBrand(brand, null);
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to save tier', 'error');
  }
}

async function deleteOilTier(brand, tierIndex) {
  const product = oilData.find(p => p.brand === brand);
  const t = product && product.tiers[tierIndex];
  if (!t) return;
  if (!confirm('Delete tier "' + t.engineSize + '" from ' + brand + '? This cannot be undone.')) return;
  try {
    await axios.delete('/api/catalogue/oil/' + brand + '/tier/' + tierIndex);
    showToast('Tier deleted');
    const { data } = await axios.get('/api/catalogue/oil');
    oilData = data;
    showOilBrand(brand, null);
  } catch(err) {
    showToast('Failed to delete tier', 'error');
  }
}

// ═══ OIL FLEET MODAL ═══
function showOilFleetModal() {
  if (!can('packages.manage')) { showToast('Permission denied', 'error'); return; }
  const brand = _currentOilBrand;
  const product = oilData.find(p => p.brand === brand);
  document.getElementById('oilFleet-brand').value = brand;
  document.getElementById('oilFleet-brandLabel').textContent = brand;
  document.getElementById('oilFleet-3to5').value = product ? (product.fleetDiscount3to5 || '') : '';
  document.getElementById('oilFleet-5plus').value = product ? (product.fleetDiscount5plus || '') : '';
  openModal('modal-oilFleet');
}

async function submitOilFleet() {
  const brand = document.getElementById('oilFleet-brand').value;
  const d3to5 = parseFloat(document.getElementById('oilFleet-3to5').value) || 0;
  const d5plus = parseFloat(document.getElementById('oilFleet-5plus').value) || 0;
  try {
    await axios.patch('/api/catalogue/oil/' + brand + '/fleet', { fleetDiscount3to5: d3to5, fleetDiscount5plus: d5plus });
    showToast('Fleet discounts updated for ' + brand);
    closeModal('modal-oilFleet');
    const { data } = await axios.get('/api/catalogue/oil');
    oilData = data;
    showOilBrand(brand, null);
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to update fleet discounts', 'error');
  }
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
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-12 text-gray-400"><i class="fas fa-search text-3xl mb-3 block"></i>No parts found</td></tr>';
    return;
  }
  tbody.innerHTML = parts.map(function(p) {
    const c = CAT_COLORS[p.category] || { bg:'#f1f5f9', text:'#64748b' };
    const marginPct = Math.round((p.margin / p.sellingPrice) * 100);
    const marginColor = marginPct >= 50 ? '#16a34a' : marginPct >= 30 ? '#d97706' : '#dc2626';
    const batchCell = p.batchNumber
      ? '<span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">'+p.batchNumber+'</span>'
      : '<span class="text-xs text-gray-300">\u2014</span>';
    const serialCell = p.partSerialNumber
      ? '<span class="text-xs font-mono text-gray-700">'+p.partSerialNumber+'</span>'
      : '<span class="text-xs text-gray-300">\u2014</span>';
    const modelsHtml = (function() {
      const parts2 = (p.compatibleModels || '').split(',').filter(function(m) { return m.trim(); });
      const visible = parts2.slice(0,3).map(function(m) { return '<span class="tag bg-gray-100 text-gray-600">'+m.trim()+'</span>'; }).join('');
      const extra = parts2.length > 3 ? '<span class="tag bg-gray-100 text-gray-400">+' + (parts2.length-3) + ' more</span>' : '';
      return visible + extra;
    })();
    const stockBadge = (p.stockQuantity || 0) === 0
      ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><i class="fas fa-times-circle"></i>Out</span>'
      : (p.stockQuantity || 0) <= 5
        ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><i class="fas fa-exclamation-triangle"></i>'+p.stockQuantity+'</span>'
        : '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><i class="fas fa-check"></i>'+p.stockQuantity+'</span>';
    return '<tr class="table-row border-b border-gray-50">' +
      '<td class="px-4 py-3">'+batchCell+'</td>' +
      '<td class="px-4 py-3"><span class="badge" style="background:'+c.bg+';color:'+c.text+'">'+p.category+'</span></td>' +
      '<td class="px-4 py-3 font-medium text-gray-800 text-sm">'+p.description+'</td>' +
      '<td class="px-4 py-3 text-xs text-gray-500"><div class="flex flex-wrap gap-1">'+modelsHtml+'</div></td>' +
      '<td class="px-4 py-3">'+serialCell+'</td>' +
      '<td class="px-4 py-3 text-right text-gray-600">'+fmt(p.buyingPrice)+'</td>' +
      '<td class="px-4 py-3 text-right font-bold text-gray-900">'+fmt(p.sellingPrice)+'</td>' +
      '<td class="px-4 py-3 text-right font-semibold text-green-600">'+fmt(p.margin)+'</td>' +
      '<td class="px-4 py-3 text-right"><span class="font-bold text-sm" style="color:'+marginColor+'">'+marginPct+'%</span></td>' +
      '<td class="px-4 py-3 text-right">'+stockBadge+'</td>' +
      '<td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1">' +
        '<button onclick="showEditCataloguePartModal(&apos;'+p.id+'&apos;)" title="Edit part" class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"><i class="fas fa-pen text-xs"></i></button>' +
        '<button onclick="showRestockModal(&apos;'+p.id+'&apos;)" title="Add stock" class="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"><i class="fas fa-plus text-xs"></i></button>' +
      '</div></td>' +
    '</tr>';
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
  document.getElementById('acp-serial').value = '';
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
  const serial = document.getElementById('acp-serial').value.trim();
  const { data } = await axios.post('/api/catalogue/parts', {
    category: cat, description: desc, compatibleModels: models,
    buyingPrice: buy, sellingPrice: sell, stockQuantity: stock,
    ...(serial ? { partSerialNumber: serial } : {})
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
  document.getElementById('ecp-serial').value = p.partSerialNumber || '';
  document.getElementById('ecp-buy').value = p.buyingPrice;
  document.getElementById('ecp-sell').value = p.sellingPrice;
  // Show batch number (read-only) — always visible in Edit mode
  document.getElementById('ecp-batchDisplay').textContent = p.batchNumber || 'Assigned on next save';
  document.getElementById('ecp-batchRow').classList.remove('hidden');
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
  const serial = document.getElementById('ecp-serial').value.trim();
  if (!desc || sell <= 0) { showToast('Please fill in required fields', 'error'); return; }
  const margin = sell - buy;
  const { data } = await axios.put('/api/catalogue/parts/' + id, {
    category: cat, description: desc, compatibleModels: models,
    buyingPrice: buy, sellingPrice: sell, margin,
    partSerialNumber: serial || undefined
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
  allCarWash = data;
  renderCarWashGrid(data);
}

function renderCarWashGrid(data) {
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
      <div class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:\${cfg.color}20">
            <i class="fas \${cfg.icon}" style="color:\${cfg.color}"></i>
          </div>
          <div><h3 class="font-bold text-gray-900">\${cfg.title}</h3><p class="text-xs text-gray-400">\${cfg.desc}</p></div>
        </div>
      </div>
      <div class="space-y-2">
        \${(groups[cfg.type] || []).map(pkg => \`
          <div class="group flex items-start gap-2 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
            <div class="flex-1 min-w-0 pr-1">
              <p class="font-semibold text-gray-800 text-sm">\${pkg.name}</p>
              <p class="text-xs text-gray-500 mt-0.5">\${pkg.description}</p>
              \${pkg.includes ? \`<div class="flex flex-wrap gap-1 mt-2">\${pkg.includes.map(i => \`<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">\${i}</span>\`).join('')}</div>\` : ''}
              \${pkg.vehicleCount ? \`<p class="text-xs text-blue-600 font-semibold mt-1"><i class="fas fa-car mr-1"></i>\${pkg.vehicleCount} vehicles</p>\` : ''}
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <div class="text-right mr-1">
                \${pkg.price > 0 ? \`<p class="font-bold text-gray-900 text-sm">\${fmt(pkg.price)}</p><p class="text-xs text-gray-400">\${pkg.vehicleCount ? '/month' : '/visit'}</p>\` : \`<span class="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Quote</span>\`}
              </div>
              <button onclick="showEditCarWashModal('\${pkg.id}')" title="Edit" class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0"><i class="fas fa-pen text-xs"></i></button>
              <button onclick="deleteCarWash('\${pkg.id}',this.dataset.name)" data-name="\${pkg.name}" title="Delete" class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"><i class="fas fa-trash text-xs"></i></button>
            </div>
          </div>
        \`).join('') || \`<p class="text-center text-gray-300 py-4 text-sm">No items in this category</p>\`}
      </div>
    </div>
  \`).join('');
}

// ═══ ADD-ON SERVICES ═══
let allAddOns = [];
let _addonCatFilter = '';

async function loadAddOns() {
  const { data } = await axios.get('/api/catalogue/addons');
  allAddOns = data;
  renderAddOns(data);
}

function setAddonCatFilter(cat, btn) {
  _addonCatFilter = cat;
  document.querySelectorAll('#addonCatTabs button').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-cat') === cat);
  });
  const filtered = cat ? allAddOns.filter(s => s.category === cat) : allAddOns;
  renderAddOns(filtered);
}

function renderAddOns(list) {
  const catConfig = {
    Diagnostic: { icon:'fa-laptop-medical', color:'#dc2626', bg:'#fee2e2' },
    Inspection:  { icon:'fa-search-plus',    color:'#2563eb', bg:'#dbeafe' },
    Tyres:       { icon:'fa-circle-notch',   color:'#7c3aed', bg:'#ede9fe' },
    Alignment:   { icon:'fa-ruler-combined', color:'#16a34a', bg:'#dcfce7' },
    Other:       { icon:'fa-wrench',         color:'#64748b', bg:'#f1f5f9' },
  };
  const canManage = can('addons.manage');
  const grid = document.getElementById('addOnsGrid');
  if (!list.length) {
    grid.innerHTML =
      '<div class="col-span-3 text-center py-16 text-gray-400">' +
      '<i class="fas fa-tools text-4xl mb-4 block"></i>' +
      '<p class="text-lg font-semibold mb-2">No add-on services yet</p>' +
      (canManage ? '<button class="btn-primary text-sm mt-2" onclick="showNewAddonModal()"><i class="fas fa-plus mr-1"></i>Add First Service</button>' : '') +
      '</div>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const cfg = catConfig[s.category] || catConfig['Other'];
    const actions = canManage
      ? '<div class="flex items-center gap-2 mt-4 pt-4 border-t">' +
          '<button class="flex-1 btn-secondary text-sm py-2 addon-edit-btn" data-id="' + s.id + '"><i class="fas fa-pen mr-1"></i>Edit</button>' +
          '<button class="flex-1 btn-danger text-sm py-2 addon-del-btn" data-id="' + s.id + '"><i class="fas fa-trash mr-1"></i>Delete</button>' +
        '</div>'
      : '<div class="mt-4 pt-4 border-t"><button class="w-full btn-primary text-sm addon-add-btn" data-id="' + s.id + '"><i class="fas fa-plus mr-1"></i>Add to Job</button></div>';
    return '<div class="card p-6 hover:shadow-lg transition-shadow">' +
      '<div class="flex items-start gap-4 mb-4">' +
        '<div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:' + cfg.bg + '">' +
          '<i class="fas ' + cfg.icon + ' text-xl" style="color:' + cfg.color + '"></i>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<h3 class="font-bold text-gray-900 text-lg leading-tight">' + s.name + '</h3>' +
          '<span class="badge mt-1 inline-block" style="background:' + cfg.bg + ';color:' + cfg.color + '">' + s.category + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="text-sm text-gray-600 mb-4 leading-relaxed">' + (s.description || '') + '</p>' +
      '<div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">' +
        '<div>' +
          '<p class="text-2xl font-bold text-gray-900">' + fmt(s.price) + '</p>' +
          '<p class="text-xs text-gray-400 mt-0.5">' + s.unit + '</p>' +
        '</div>' +
      '</div>' +
      actions +
    '</div>';
  }).join('');
  // Attach event listeners using data-id (avoids inline string escaping issues)
  grid.querySelectorAll('.addon-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { showEditAddonModal(btn.getAttribute('data-id')); });
  });
  grid.querySelectorAll('.addon-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const s = allAddOns.find(function(a) { return a.id === btn.getAttribute('data-id'); });
      if (s) deleteAddon(s.id, s.name);
    });
  });
  grid.querySelectorAll('.addon-add-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const s = allAddOns.find(function(a) { return a.id === btn.getAttribute('data-id'); });
      if (s) addServiceToJob(s.name, s.price, s.unit);
    });
  });
}

// ─── Add-on Modal ─────────────────────────────────────────────────────────────
function showNewAddonModal() {
  if (!can('addons.manage')) { showToast('Permission denied', 'error'); return; }
  document.getElementById('addon-id').value = '';
  document.getElementById('addonModal-title').textContent = 'New Add-on Service';
  document.getElementById('addonModal-submitLabel').textContent = 'Add Service';
  document.getElementById('addon-name').value = '';
  document.getElementById('addon-category').value = '';
  document.getElementById('addon-unit').value = '';
  document.getElementById('addon-description').value = '';
  document.getElementById('addon-price').value = '';
  document.getElementById('addon-pricePreview').classList.add('hidden');
  openModal('modal-addonService');
}

function showEditAddonModal(id) {
  if (!can('addons.manage')) { showToast('Permission denied', 'error'); return; }
  const s = allAddOns.find(a => a.id === id);
  if (!s) return;
  document.getElementById('addon-id').value = s.id;
  document.getElementById('addonModal-title').textContent = 'Edit Add-on Service';
  document.getElementById('addonModal-submitLabel').textContent = 'Save Changes';
  document.getElementById('addon-name').value = s.name || '';
  document.getElementById('addon-category').value = s.category || '';
  document.getElementById('addon-unit').value = s.unit || '';
  document.getElementById('addon-description').value = s.description || '';
  document.getElementById('addon-price').value = s.price || '';
  addonPricePreview();
  openModal('modal-addonService');
}

function addonPricePreview() {
  const price = parseFloat(document.getElementById('addon-price').value) || 0;
  const el = document.getElementById('addon-pricePreview');
  if (price > 0) {
    el.textContent = 'TZS ' + fmt(price);
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

async function submitAddonService() {
  const id   = document.getElementById('addon-id').value;
  const name = document.getElementById('addon-name').value.trim();
  const cat  = document.getElementById('addon-category').value;
  const unit = document.getElementById('addon-unit').value.trim();
  const desc = document.getElementById('addon-description').value.trim();
  const price = parseFloat(document.getElementById('addon-price').value) || 0;
  if (!name) { showToast('Service name is required', 'error'); return; }
  if (!cat)  { showToast('Please select a category', 'error'); return; }
  if (!unit) { showToast('Unit label is required (e.g. "per service")', 'error'); return; }
  if (price <= 0) { showToast('Please enter a price greater than 0', 'error'); return; }
  const payload = { name, category: cat, unit, description: desc, price };
  try {
    if (id) {
      await axios.put('/api/catalogue/addons/' + id, payload);
      showToast('Add-on service updated');
    } else {
      await axios.post('/api/catalogue/addons', payload);
      showToast('New add-on service created');
    }
    closeModal('modal-addonService');
    await loadAddOns();
    // Re-apply category filter
    if (_addonCatFilter) setAddonCatFilter(_addonCatFilter, null);
  } catch(err) {
    showToast(err.response?.data?.error || 'Failed to save add-on service', 'error');
  }
}

async function deleteAddon(id, name) {
  if (!can('addons.manage')) { showToast('Permission denied', 'error'); return; }
  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
  try {
    await axios.delete('/api/catalogue/addons/' + id);
    showToast('"' + name + '" deleted');
    await loadAddOns();
    if (_addonCatFilter) setAddonCatFilter(_addonCatFilter, null);
  } catch(err) {
    showToast('Failed to delete add-on service', 'error');
  }
}

function addServiceToJob(name, price, unit) {
  showToast(name + ' (' + fmt(price) + ' ' + unit + ') — open a Job Card to add this service', 'info');
}

// ═══ EXPENSES ═══════════════════════════════════════════════════════════════

const EXP_CAT_COLORS = {
  'Parts & Materials':   '#3b82f6',
  'Labour':              '#8b5cf6',
  'Subcontractor':       '#f59e0b',
  'Equipment & Tools':   '#10b981',
  'Utilities':           '#06b6d4',
  'Rent & Facilities':   '#6366f1',
  'Marketing & Admin':   '#ec4899',
  'Transport & Delivery':'#f97316',
  'Miscellaneous':       '#94a3b8',
};

const EXP_STATUS_CFG = {
  Pending:  { bg:'#fff7ed', text:'#c2410c' },
  Approved: { bg:'#eff6ff', text:'#1d4ed8' },
  Paid:     { bg:'#f0fdf4', text:'#15803d' },
  Rejected: { bg:'#fef2f2', text:'#b91c1c' },
};

function expStatusBadge(s) {
  const c = EXP_STATUS_CFG[s] || { bg:'#f8fafc', text:'#64748b' };
  return '<span class="status-pill text-xs" style="background:'+c.bg+';color:'+c.text+'">'+s+'</span>';
}

function expCatBadge(cat) {
  const color = EXP_CAT_COLORS[cat] || '#94a3b8';
  return '<span class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full" style="background:'+color+'20;color:'+color+'">'+cat+'</span>';
}

function _pmIcon(method) {
  if (method === 'Mobile Money') return 'fa-mobile-alt';
  if (method === 'Bank')         return 'fa-university';
  if (method === 'Lipa Number')  return 'fa-hashtag';
  if (method === 'Cash')         return 'fa-money-bill-wave';
  return 'fa-credit-card';
}

function _pmBadge(method) {
  if (!method) return '';
  var icon = _pmIcon(method);
  var cfg = {
    'Cash':         { bg:'#f0fdf4', color:'#16a34a' },
    'Mobile Money': { bg:'#eff6ff', color:'#2563eb' },
    'Bank':         { bg:'#f5f3ff', color:'#7c3aed' },
    'Lipa Number':  { bg:'#fff7ed', color:'#ea580c' },
  };
  var c = cfg[method] || { bg:'#f8fafc', color:'#64748b' };
  return '<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style="background:'+c.bg+';color:'+c.color+'"><i class="fas '+icon+'"></i>'+method+'</span>';
}

async function loadExpenses() {
  try {
    const [expRes, summaryRes] = await Promise.all([
      axios.get('/api/expenses'),
      axios.get('/api/expenses/summary'),
    ]);
    allExpenses = expRes.data;
    _renderExpenseSummaryCards(summaryRes.data);
    _renderExpenseCharts(summaryRes.data);
    _renderExpensesTable(allExpenses);
  } catch(e) { showToast('Failed to load expenses', 'error'); }
}

function _renderExpenseSummaryCards(s) {
  const cards = [
    { label:'Total Expenses',    value:fmt(s.total),         icon:'fa-coins',          g1:'#dc2626', g2:'#ef4444' },
    { label:'Paid',              value:fmt(s.totalPaid),     icon:'fa-check-circle',   g1:'#16a34a', g2:'#22c55e' },
    { label:'Pending / Approved',value:fmt(s.totalPending),  icon:'fa-clock',          g1:'#d97706', g2:'#f59e0b' },
    { label:'Job-Linked Costs',  value:fmt(s.jobLinked),     icon:'fa-clipboard-list', g1:'#2563eb', g2:'#3b82f6' },
  ];
  document.getElementById('expenseStats').innerHTML = cards.map(c =>
    '<div class="stat-card" style="--g1:'+c.g1+';--g2:'+c.g2+'">' +
      '<div class="flex items-start justify-between">' +
        '<div>' +
          '<p class="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">'+c.label+'</p>' +
          '<p class="text-xl sm:text-2xl font-bold">'+c.value+'</p>' +
        '</div>' +
        '<div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">' +
          '<i class="fas '+c.icon+' text-white"></i>' +
        '</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

function _renderExpenseCharts(s) {
  const months = s.months || [];
  const trendLabels = months.map(function(m) { var d = new Date(m[0]+'-01'); return d.toLocaleDateString('en-GB',{month:'short',year:'2-digit'}); });
  const trendVals   = months.map(function(m) { return m[1]; });
  if (_expenseTrendChart) _expenseTrendChart.destroy();
  const tCtx = document.getElementById('expenseTrendChart');
  if (tCtx) _expenseTrendChart = new Chart(tCtx, {
    type:'bar',
    data:{ labels:trendLabels, datasets:[{ label:'Spend (TZS)', data:trendVals, backgroundColor:'rgba(239,68,68,0.7)', borderRadius:6 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ ticks:{ callback:function(v){ return (v/1000)+'k'; } } } } }
  });
  const cats   = Object.keys(s.byCategory || {});
  const cVals  = Object.values(s.byCategory || {});
  const cColors = cats.map(function(c){ return EXP_CAT_COLORS[c] || '#94a3b8'; });
  if (_expenseCatChart) _expenseCatChart.destroy();
  const cCtx = document.getElementById('expenseCategoryChart');
  if (cCtx) _expenseCatChart = new Chart(cCtx, {
    type:'doughnut',
    data:{ labels:cats, datasets:[{ data:cVals, backgroundColor:cColors, borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{ size:10 }, boxWidth:12 } } } }
  });
}

function _renderExpensesTable(list) {
  const tbody = document.getElementById('expensesTable');
  document.getElementById('expenseCount').textContent = list.length + ' record' + (list.length!==1?'s':'');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-10 text-gray-400">No expenses found</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function(e) {
    // Auto-generated expenses (from adding parts/services) are read-only — managed via job card
    var isAuto = !!e.auto;
    var autoBadge = isAuto
      ? '<span class="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ml-1.5" title="Auto-recorded from job card parts/services"><i class="fas fa-robot text-purple-500" style="font-size:0.65rem"></i> Auto</span>'
      : '';
    var actionBtns = isAuto
      ? '<button class="text-blue-500 hover:text-blue-700 text-sm" title="View" data-exp-view="'+e.id+'"><i class="fas fa-eye"></i></button>' +
        '<span class="text-gray-300 text-xs ml-1" title="Auto-recorded — edit via job card parts/services"><i class="fas fa-lock"></i></span>'
      : '<button class="text-blue-500 hover:text-blue-700 text-sm" title="View" data-exp-view="'+e.id+'"><i class="fas fa-eye"></i></button>' +
        '<button class="text-amber-500 hover:text-amber-700 text-sm" title="Edit" data-exp-edit="'+e.id+'"><i class="fas fa-edit"></i></button>' +
        '<button class="text-red-400 hover:text-red-600 text-sm" title="Delete" data-exp-del="'+e.id+'"><i class="fas fa-trash"></i></button>';
    return '<tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors' + (isAuto ? ' bg-purple-50/30' : '') + '">' +
      '<td class="px-4 py-3 text-gray-700 whitespace-nowrap">'+fmtDate(e.date)+'</td>' +
      '<td class="px-4 py-3">' +
        '<p class="font-medium text-gray-800 text-sm flex items-center flex-wrap gap-1">'+e.description+autoBadge+'</p>' +
        (e.receiptRef ? '<p class="text-xs text-gray-400 mt-0.5">Ref: '+e.receiptRef+'</p>' : '') +
      '</td>' +
      '<td class="px-4 py-3">'+expCatBadge(e.category)+'</td>' +
      '<td class="px-4 py-3">' +
        (e.jobCardId
          ? '<button class="text-blue-600 text-xs font-semibold hover:underline" data-exp-job="'+e.jobCardId+'">'+(e.jobCardNumber||e.jobCardId)+'</button>'
          : '<span class="text-gray-400 text-xs">Overhead</span>') +
      '</td>' +
      '<td class="px-4 py-3 text-sm text-gray-600">' +
        (e.vendorId
          ? '<button class="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1" data-exp-vendor="'+e.vendorId+'"><i class="fas fa-store mr-1 text-blue-400"></i>'+escHtml(e.vendor||e.vendorId)+'</button>'
          : (e.vendor ? '<span class="text-gray-500 text-xs">'+escHtml(e.vendor)+'</span>' : '<span class="text-gray-400 text-xs">-</span>')) +
      '</td>' +
      '<td class="px-4 py-3">' + (e.paymentMethod ? _pmBadge(e.paymentMethod) : '<span class="text-gray-300 text-xs">-</span>') + '</td>' +
      '<td class="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">'+fmt(e.amount)+'</td>' +
      '<td class="px-4 py-3">'+expStatusBadge(e.status)+'</td>' +
      '<td class="px-4 py-3">' +
        '<div class="flex items-center justify-center gap-2">' + actionBtns + '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  tbody.querySelectorAll('[data-exp-view]').forEach(function(btn) {
    btn.addEventListener('click', function() { viewExpenseDetail(btn.dataset.expView); });
  });
  tbody.querySelectorAll('[data-exp-edit]').forEach(function(btn) {
    btn.addEventListener('click', function() { showEditExpenseModal(btn.dataset.expEdit); });
  });
  tbody.querySelectorAll('[data-exp-del]').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteExpense(btn.dataset.expDel); });
  });
  tbody.querySelectorAll('[data-exp-job]').forEach(function(btn) {
    btn.addEventListener('click', function() { viewJobDetail(btn.dataset.expJob); });
  });
  tbody.querySelectorAll('[data-exp-vendor]').forEach(function(btn) {
    btn.addEventListener('click', function() { viewVendorDetail(btn.dataset.expVendor); });
  });
}

function applyExpenseFilters() {
  const cat    = document.getElementById('expFilter-category').value;
  const status = document.getElementById('expFilter-status').value;
  const scope  = document.getElementById('expFilter-scope').value;
  const from   = document.getElementById('expFilter-from').value;
  const to     = document.getElementById('expFilter-to').value;
  var list = allExpenses;
  if (cat)    list = list.filter(function(e){ return e.category === cat; });
  if (status) list = list.filter(function(e){ return e.status === status; });
  if (scope === 'job')      list = list.filter(function(e){ return e.jobCardId; });
  if (scope === 'overhead') list = list.filter(function(e){ return !e.jobCardId; });
  if (from)   list = list.filter(function(e){ return e.date >= from; });
  if (to)     list = list.filter(function(e){ return e.date <= to; });
  _renderExpensesTable(list);
}

function clearExpenseFilters() {
  ['expFilter-category','expFilter-status','expFilter-scope','expFilter-from','expFilter-to']
    .forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
  _renderExpensesTable(allExpenses);
}

async function showAddExpenseModal(preJobId) {
  _expenseEditId = null;
  document.getElementById('expModal-title').textContent = 'Add Expense';
  document.getElementById('expModal-subtitle').textContent = 'Record a new expense entry';
  document.getElementById('expenseForm').reset();
  expVendorClear();
  expVendorOnCategoryChange();
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('exp-status').value = 'Pending';
  await _populateExpJobDropdown(preJobId || '');
  openModal('modal-expense');
}

async function showEditExpenseModal(expId) {
  const exp = allExpenses.find(function(e){ return e.id === expId; });
  if (!exp) return;
  _expenseEditId = expId;
  document.getElementById('expModal-title').textContent = 'Edit Expense';
  document.getElementById('expModal-subtitle').textContent = 'Update expense details';
  document.getElementById('exp-date').value        = exp.date;
  document.getElementById('exp-category').value    = exp.category;
  document.getElementById('exp-description').value = exp.description;
  document.getElementById('exp-amount').value      = exp.amount;
  document.getElementById('exp-status').value      = exp.status;
  // Populate vendor picker
  expVendorClear();
  if (exp.vendorId) {
    expVendorSelect(exp.vendorId, exp.vendor || exp.vendorId);
  } else if (exp.vendor) {
    document.getElementById('exp-vendor-search').value = exp.vendor;
    document.getElementById('exp-vendor').value        = exp.vendor;
  }
  expVendorOnCategoryChange();
  document.getElementById('exp-receiptRef').value     = exp.receiptRef     || '';
  document.getElementById('exp-paymentMethod').value  = exp.paymentMethod  || '';
  document.getElementById('exp-notes').value          = exp.notes          || '';
  await _populateExpJobDropdown(exp.jobCardId || '');
  openModal('modal-expense');
}

async function _populateExpJobDropdown(selectedJobId) {
  if (!allJobCards.length) {
    const { data } = await axios.get('/api/jobcards');
    allJobCards = data;
  }
  const sel = document.getElementById('exp-jobCardId');
  sel.innerHTML = '<option value="">— Overhead / not job-specific —</option>' +
    allJobCards.map(function(j){
      return '<option value="'+j.id+'" '+(j.id===selectedJobId?'selected':'')+'>'+j.jobCardNumber+' – '+(j.customerName||'')+' '+(j.vehicleReg||'')+'</option>';
    }).join('');
}

async function submitExpense(e) {
  e.preventDefault();
  // Validate vendor selection for required categories
  if (!expVendorValidate()) return;
  const vendorId = document.getElementById('exp-vendorId').value.trim() || undefined;
  const vendorName = document.getElementById('exp-vendor').value.trim() || undefined;
  const body = {
    date:        document.getElementById('exp-date').value,
    category:    document.getElementById('exp-category').value,
    description: document.getElementById('exp-description').value,
    amount:      parseFloat(document.getElementById('exp-amount').value) || 0,
    status:      document.getElementById('exp-status').value,
    vendorId:    vendorId,
    vendor:      vendorName,
    receiptRef:     document.getElementById('exp-receiptRef').value.trim()    || undefined,
    jobCardId:      document.getElementById('exp-jobCardId').value              || undefined,
    paymentMethod:  document.getElementById('exp-paymentMethod').value          || undefined,
    notes:          document.getElementById('exp-notes').value.trim()           || undefined,
  };
  try {
    if (_expenseEditId) {
      await axios.put('/api/expenses/' + _expenseEditId, body);
      showToast('\u2714 Expense updated');
    } else {
      await axios.post('/api/expenses', body);
      showToast('\u2714 Expense recorded');
    }
    closeModal('modal-expense');
    loadExpenses();
    syncFinance();
  } catch(err) { showToast('Failed to save expense', 'error'); }
}

async function deleteExpense(expId) {
  if (!confirm('Delete this expense? This cannot be undone.')) return;
  try {
    await axios.delete('/api/expenses/' + expId);
    showToast('Expense deleted');
    loadExpenses();
    syncFinance();
  } catch(err) { showToast('Failed to delete', 'error'); }
}

function viewExpenseDetail(expId) {
  const e = allExpenses.find(function(x){ return x.id === expId; });
  if (!e) return;
  const sc = EXP_STATUS_CFG[e.status] || { bg:'#f8fafc', text:'#64748b' };
  document.getElementById('expenseDetailBody').innerHTML =
    '<div class="space-y-4">' +
      '<div class="flex items-start justify-between gap-3 p-4 bg-gray-50 rounded-xl">' +
        '<div>' +
          '<p class="font-semibold text-gray-900">'+e.description+'</p>' +
          '<p class="text-xs text-gray-500 mt-0.5">'+fmtDate(e.date)+(e.vendor?' &middot; '+e.vendor:'')+'</p>' +
        '</div>' +
        '<p class="text-xl font-bold text-gray-900 flex-shrink-0">'+fmt(e.amount)+'</p>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><p class="text-xs text-gray-400 mb-0.5">Category</p>'+expCatBadge(e.category)+'</div>' +
        '<div><p class="text-xs text-gray-400 mb-0.5">Status</p>'+expStatusBadge(e.status)+'</div>' +
        (e.jobCardId ? '<div><p class="text-xs text-gray-400 mb-0.5">Job Card</p><button class="text-blue-600 text-sm font-semibold hover:underline" data-det-job="'+e.jobCardId+'">'+(e.jobCardNumber||e.jobCardId)+'</button></div>' :
                       '<div><p class="text-xs text-gray-400 mb-0.5">Scope</p><p class="text-sm text-gray-600">Overhead</p></div>') +
        (e.paymentMethod ? '<div><p class="text-xs text-gray-400 mb-0.5">Payment Method</p><p class="text-sm text-gray-700"><i class="fas '+_pmIcon(e.paymentMethod)+' mr-1 text-blue-400"></i>'+e.paymentMethod+'</p></div>' : (e.paidBy ? '<div><p class="text-xs text-gray-400 mb-0.5">Paid By</p><p class="text-sm text-gray-700">'+e.paidBy+'</p></div>' : '')) +
        (e.receiptRef ? '<div><p class="text-xs text-gray-400 mb-0.5">Receipt Ref</p><p class="text-sm text-gray-700">'+e.receiptRef+'</p></div>' : '') +
      '</div>' +
      (e.notes ? '<div class="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800"><i class="fas fa-sticky-note mr-1"></i>'+e.notes+'</div>' : '') +
      '<div class="border-t border-gray-100 pt-4">' +
        '<p class="text-xs text-gray-400 mb-2 font-semibold">Change Status</p>' +
        '<div class="flex flex-wrap gap-2" id="expDetailStatusBtns"></div>' +
      '</div>' +
      '<div class="flex gap-2 pt-2">' +
        '<button class="btn-secondary flex-1 text-sm" data-close-exp-detail="1">Close</button>' +
        '<button class="btn-primary flex-1 text-sm" data-edit-from-detail="'+e.id+'"><i class="fas fa-edit mr-1"></i>Edit</button>' +
      '</div>' +
    '</div>';

  document.querySelector('[data-close-exp-detail]')?.addEventListener('click', function() {
    closeModal('modal-expenseDetail');
  });
  document.querySelector('[data-det-job]')?.addEventListener('click', function() {
    closeModal('modal-expenseDetail'); viewJobDetail(this.dataset.detJob);
  });
  document.querySelector('[data-edit-from-detail]')?.addEventListener('click', function() {
    closeModal('modal-expenseDetail'); showEditExpenseModal(this.dataset.editFromDetail);
  });
  var statusContainer = document.getElementById('expDetailStatusBtns');
  ['Pending','Approved','Paid','Rejected'].forEach(function(st) {
    var btn = document.createElement('button');
    btn.className = 'text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ' +
      (e.status === st ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400');
    btn.textContent = st;
    var expId2 = e.id;
    btn.addEventListener('click', async function() {
      await axios.patch('/api/expenses/' + expId2 + '/status', { status: st });
      showToast('Status updated to ' + st);
      closeModal('modal-expenseDetail');
      loadExpenses();
      syncFinance();
    });
    statusContainer.appendChild(btn);
  });
  openModal('modal-expenseDetail');
}

// ─── Job-Card Expense Panel ─────────────────────────────────────────────────
async function loadJobExpenses(jobId) {
  const { data } = await axios.get('/api/expenses?jobCardId=' + jobId);
  const container = document.getElementById('jobExpenses');
  if (!container) return;
  const total = data.reduce(function(s, e){ return s + e.amount; }, 0);
  container.innerHTML =
    '<div class="flex items-center justify-between mb-3">' +
      '<p class="text-sm font-semibold text-gray-700">Job Expenses</p>' +
      '<div class="flex items-center gap-2">' +
        '<span class="text-sm font-bold text-red-600">'+fmt(total)+'</span>' +
        '<button class="btn-primary text-xs py-1 px-2" data-add-job-exp2="'+jobId+'"><i class="fas fa-plus mr-1"></i>Add</button>' +
      '</div>' +
    '</div>' +
    (data.length ? '<div class="space-y-2">' +
      data.map(function(e) {
        var autoBadge = e.auto
          ? '<span class="inline-flex items-center gap-0.5 text-xs font-semibold bg-purple-100 text-purple-700 px-1 py-0.5 rounded" title="Auto-recorded from parts/services"><i class="fas fa-robot" style="font-size:0.6rem"></i> Auto</span>'
          : '';
        return '<div class="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0' + (e.auto ? ' bg-purple-50/40 rounded px-1' : '') + '">' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-sm text-gray-800 font-medium truncate flex items-center gap-1">'+e.description+autoBadge+'</p>' +
            '<p class="text-xs text-gray-400">'+fmtDate(e.date)+' &middot; '+e.category+(e.vendor?' &middot; '+e.vendor:'')+'</p>' +
          '</div>' +
          '<div class="flex items-center gap-2 flex-shrink-0">' +
            '<p class="text-sm font-semibold text-gray-900">'+fmt(e.amount)+'</p>' +
            expStatusBadge(e.status) +
          '</div>' +
        '</div>';
      }).join('') + '</div>'
    : '<p class="text-xs text-gray-400 text-center py-3">No expenses logged for this job</p>');
  container.querySelector('[data-add-job-exp2]')?.addEventListener('click', function() {
    showAddExpenseModal(this.dataset.addJobExp2);
  });
}

// ─── Mark Invoice Paid ───────────────────────────────────────────────────────
// Delegates to the pay modal; jobId used to refresh after payment
function markInvoicePaid(invId, jobId) {
  showPayInvoiceModal(invId, jobId);
}

// ─── Job P&L Panel ────────────────────────────────────────────────────────────
async function loadJobPL(jobId) {
  var panel = document.getElementById('jobPLPanel-' + jobId);
  if (!panel) return;
  try {
    var { data } = await axios.get('/api/finance/job/' + jobId);
    var netColor = data.netProfit >= 0 ? 'text-green-600' : 'text-red-600';
    var marginColor = data.margin >= 30 ? 'text-green-600' : data.margin >= 0 ? 'text-amber-600' : 'text-red-600';
    panel.innerHTML =
      '<h4 class="font-bold text-gray-800 mb-3"><i class="fas fa-chart-line text-indigo-500 mr-2"></i>Job P&L</h4>' +
      '<div class="space-y-2 text-sm">' +
        '<div class="flex justify-between"><span class="text-gray-400">Revenue</span><span class="font-semibold text-green-600">' + fmt(data.revenue) + '</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-400">Job Expenses</span><span class="font-semibold text-red-600">' + fmt(data.totalExpenses) + '</span></div>' +
        '<div class="flex justify-between border-t pt-2"><span class="font-semibold">Net Profit</span><span class="font-bold ' + netColor + '">' + fmt(data.netProfit) + '</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-400">Margin</span><span class="font-semibold ' + marginColor + '">' + data.margin.toFixed(1) + '%</span></div>' +
      '</div>' +
      (data.revenue === 0 ? '<p class="text-xs text-gray-400 mt-2 italic">Revenue shows after invoice is paid</p>' : '');
  } catch(e) {
    panel.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">P&L unavailable</p>';
  }
}

// ─── Time Tracking Panel ──────────────────────────────────────────────────────
const STATUS_COLORS_TT = {
  RECEIVED:                   { bg:'#dbeafe', text:'#1d4ed8' },
  INSPECTION:                 { bg:'#e0e7ff', text:'#4338ca' },
  PFI_PREPARATION:            { bg:'#fef3c7', text:'#d97706' },
  AWAITING_INSURER_APPROVAL:  { bg:'#fee2e2', text:'#dc2626' },
  REPAIR_IN_PROGRESS:         { bg:'#d1fae5', text:'#059669' },
  WAITING_FOR_PARTS:          { bg:'#ffedd5', text:'#ea580c' },
  QUALITY_CHECK:              { bg:'#f0fdf4', text:'#16a34a' },
  COMPLETED:                  { bg:'#dcfce7', text:'#15803d' },
  INVOICED:                   { bg:'#f5f3ff', text:'#7c3aed' },
  RELEASED:                   { bg:'#f1f5f9', text:'#475569' }
};
const STATUS_LABELS_TT = {
  RECEIVED:'Received', INSPECTION:'Inspection', PFI_PREPARATION:'PFI Prep',
  AWAITING_INSURER_APPROVAL:'Insurer Approval', REPAIR_IN_PROGRESS:'Repair',
  WAITING_FOR_PARTS:'Waiting Parts', QUALITY_CHECK:'Quality Check',
  COMPLETED:'Completed', INVOICED:'Invoiced', RELEASED:'Released'
};

async function loadTimeTrack(jobId) {
  var container = document.getElementById('timeTrackContent-' + jobId);
  if (!container) return;
  try {
    var { data } = await axios.get('/api/jobcards/' + jobId + '/timeline');
    renderTimeTrack(container, data);
  } catch(e) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Time tracking unavailable</p>';
  }
}

function refreshTimeTrack(jobId) {
  var container = document.getElementById('timeTrackContent-' + jobId);
  if (!container) return;
  container.innerHTML = '<p class="text-xs text-gray-400 text-center py-2"><i class="fas fa-spinner fa-spin mr-1"></i>Refreshing…</p>';
  loadTimeTrack(jobId);
}

function renderTimeTrack(container, data) {
  var tl = data.timeline || [];
  var totalMins = data.totalTATMins || 0;
  var totalFormatted = data.totalTATFormatted || '0m';

  // TAT summary row
  var isCompleted = ['COMPLETED','INVOICED','RELEASED'].includes(data.currentStatus);
  var tatColor = isCompleted ? 'text-green-700' : 'text-violet-700';
  var tatBg = isCompleted ? 'bg-green-50' : 'bg-violet-50';

  var html = '<div class="' + tatBg + ' rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between">' +
    '<div>' +
      '<p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total TAT</p>' +
      '<p class="text-base font-bold ' + tatColor + '">' + totalFormatted + '</p>' +
    '</div>' +
    '<div class="text-right">' +
      '<p class="text-xs text-gray-400">' + (isCompleted ? 'Completed' : 'In Progress') + '</p>' +
      (data.completedAt ? '<p class="text-xs text-green-600 font-medium">' + fmtDate(data.completedAt) + '</p>' : '') +
    '</div>' +
  '</div>';

  // Timeline bar + entries
  if (tl.length === 0) {
    html += '<p class="text-xs text-gray-400 text-center py-2">No timeline data yet</p>';
    container.innerHTML = html;
    return;
  }

  // Visual proportional bar (based on duration)
  var maxMins = Math.max(...tl.map(function(e){ return e.durationMins || 0; }), 1);
  html += '<div class="space-y-2">';
  tl.forEach(function(entry) {
    var cfg = STATUS_COLORS_TT[entry.status] || { bg:'#f1f5f9', text:'#64748b' };
    var label = STATUS_LABELS_TT[entry.status] || entry.status;
    var pct = Math.max(8, Math.round(((entry.durationMins || 0) / maxMins) * 100));
    var isOpen = entry.isOpen;
    var techName = entry.technicianName || '';

    html += '<div class="group relative">' +
      '<div class="flex items-center justify-between text-xs mb-0.5">' +
        '<div class="flex items-center gap-1.5 min-w-0">' +
          '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0" style="background:' + cfg.bg + ';color:' + cfg.text + '">' + label + '</span>' +
          (isOpen ? '<span class="text-xs text-violet-500 font-semibold animate-pulse"><i class="fas fa-circle text-[6px] mr-0.5"></i>Live</span>' : '') +
        '</div>' +
        '<span class="font-semibold text-gray-700 flex-shrink-0 ml-2">' + (entry.durationFormatted || '—') + '</span>' +
      '</div>' +
      '<div class="h-2 rounded-full bg-gray-100 overflow-hidden">' +
        '<div class="h-2 rounded-full transition-all" style="width:' + pct + '%;background:' + cfg.text + ';opacity:0.6"></div>' +
      '</div>' +
      (techName ? '<p class="text-xs text-gray-400 mt-0.5"><i class="fas fa-user-hard-hat mr-1"></i>' + techName + '</p>' : '') +
    '</div>';
  });
  html += '</div>';

  // Working hours note
  html += '<p class="text-xs text-gray-300 mt-3 text-center">Working hrs: 08:00–18:00, Mon–Sun</p>';

  container.innerHTML = html;
}

// ─── Finance Summary Cards (Dashboard) ───────────────────────────────────────
var _finSummaryCache = null;

async function loadFinanceSummaryCards() {
  try {
    var { data } = await axios.get('/api/finance/summary');
    _finSummaryCache = data;
    // Update dashboard finance snapshot
    var el = function(id){ return document.getElementById(id); };
    if (el('dfCollected'))   el('dfCollected').textContent   = fmt(data.invoices.totalPaid);
    if (el('dfOutstanding')) el('dfOutstanding').textContent = fmt(data.invoices.outstanding);
    if (el('dfOverdue'))     el('dfOverdue').textContent     = fmt(data.invoices.overdue);
    if (el('dfPipeline'))    el('dfPipeline').textContent    = fmt(data.pipeline.value);
    if (el('dfExpenses'))    el('dfExpenses').textContent    = fmt(data.expenses.total);
    if (el('dfNetIncome')) {
      el('dfNetIncome').textContent = fmt(data.pl.netIncome);
      el('dfNetIncome').className = 'text-base font-bold ' + (data.pl.netIncome >= 0 ? 'text-green-700' : 'text-red-600');
    }
    if (el('dfMarginPct'))   el('dfMarginPct').textContent   = 'Margin: ' + data.pl.grossMargin.toFixed(1) + '%';
    // Show/hide the finance cards row based on permission
    var row = el('dashFinanceCards');
    if (row) {
      row.classList.toggle('hidden', !can('finance.view'));
    }
  } catch(e) {
    // Silently fail – finance cards just won't update
  }
}

// ─── Finance Sync Helper ─────────────────────────────────────────────────────
// Call after ANY invoice or expense mutation. Updates:
//   1. Dashboard finance summary cards (always)
//   2. Invoices page table (if currently active)
//   3. Expenses page (if currently active)
//   4. Finance page full reload (if currently active)
async function syncFinance() {
  // 1. Always refresh dashboard summary cards
  await loadFinanceSummaryCards();

  // 2. Re-render Invoices page if it's visible
  var invPage = document.getElementById('page-invoices');
  if (invPage && invPage.classList.contains('active')) {
    loadInvoices();
  }

  // 3. Re-render Expenses page if it's visible
  var expPage = document.getElementById('page-expenses');
  if (expPage && expPage.classList.contains('active')) {
    loadExpenses();
  }

  // 4. Full Finance page reload if it's visible
  var finPage = document.getElementById('page-finance');
  if (finPage && finPage.classList.contains('active')) {
    loadFinance();
  }
}

// ─── Finance Page ─────────────────────────────────────────────────────────────
var _finData = null;
var _finPLChart = null;
var _finExpPieChart = null;
var _finAllInvoices = [];

async function loadFinance() {
  try {
    var [finRes, invRes] = await Promise.all([
      axios.get('/api/finance/summary'),
      axios.get('/api/invoices'),
    ]);
    _finData = finRes.data;
    _finAllInvoices = invRes.data;
    renderFinanceKPIs(_finData);
    renderFinancePLChart(_finData);
    renderFinanceExpPie(_finData);
    renderFinanceInvStatus(_finData);
    renderFinancePipeline(_finData);
    renderFinanceInvoices();
  } catch(e) {
    showToast('Failed to load Finance data', 'error');
  }
}

function renderFinanceKPIs(d) {
  var set = function(id, val) { var el = document.getElementById(id); if(el) el.textContent = val; };
  var setHtml = function(id, val) { var el = document.getElementById(id); if(el) el.innerHTML = val; };
  // Invoice row
  set('finTotalInvoiced',    fmt(d.invoices.totalInvoiced));
  set('finTotalInvoicedCount', d.invoices.totalCount + ' invoice' + (d.invoices.totalCount !== 1 ? 's' : ''));
  set('finCollected',        fmt(d.invoices.totalPaid));
  set('finCollectedCount',   d.invoices.paidCount + ' paid');
  set('finOutstanding',      fmt(d.invoices.outstanding));
  set('finOutstandingCount', d.invoices.outstandingCount + ' pending');
  set('finOverdue',          fmt(d.invoices.overdue));
  set('finOverdueCount',     d.invoices.overdueCount + ' overdue');
  set('finPipeline',         fmt(d.pipeline.value));
  set('finPipelineCount',    d.pipeline.jobCount + ' job' + (d.pipeline.jobCount !== 1 ? 's' : ''));
  set('finBookings',         d.appointments.count + ' booking' + (d.appointments.count !== 1 ? 's' : ''));
  set('finBookingsCount',    fmt(d.appointments.expectedValue) + ' est.');
  // P&L row
  set('finGrossIncome',   fmt(d.pl.grossIncome));
  set('finTotalExpenses', fmt(d.expenses.total));
  setHtml('finExpBreakdown', 'Job: ' + fmt(d.expenses.jobLinked) + ' + Overhead: ' + fmt(d.expenses.overhead));
  var netEl = document.getElementById('finNetIncome');
  if (netEl) {
    netEl.textContent = fmt(d.pl.netIncome);
    netEl.className = 'text-xl font-bold ' + (d.pl.netIncome >= 0 ? 'text-green-600' : 'text-red-600');
  }
  var marginEl = document.getElementById('finMarginPct');
  if (marginEl) {
    marginEl.textContent = d.pl.grossMargin.toFixed(1) + '%';
    marginEl.className = 'text-xl font-bold ' + (d.pl.grossMargin >= 30 ? 'text-green-600' : d.pl.grossMargin >= 10 ? 'text-amber-600' : 'text-red-600');
  }
  set('finAvgJob', 'Avg job value: ' + fmt(d.pl.avgJobValue));
  // Discounts row
  set('finTotalDiscounts', fmt(d.discounts ? d.discounts.total : 0));
  set('finDiscountCount', (d.discounts ? d.discounts.invoiceCount : 0) + ' invoice' + ((d.discounts?.invoiceCount !== 1) ? 's' : '') + ' discounted');
}

function renderFinancePLChart(d) {
  var ctx = document.getElementById('finPLChart');
  if (!ctx) return;
  if (_finPLChart) { _finPLChart.destroy(); _finPLChart = null; }
  var months = d.trends.pl;
  if (!months || !months.length) {
    ctx.closest('.card').querySelector('h3').insertAdjacentHTML('afterend','<p class="text-gray-400 text-sm text-center py-8">No data yet</p>');
    return;
  }
  var labels = months.map(function(m) {
    var parts = m.month.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1])-1] + ' ' + parts[0].slice(2);
  });
  _finPLChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Revenue', data: months.map(function(m){ return m.revenue; }), backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
        { label: 'Expenses', data: months.map(function(m){ return m.expenses; }), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 },
        { label: 'Net', data: months.map(function(m){ return m.net; }), type: 'line', borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#6366f1' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } },
      scales: {
        y: { ticks: { callback: function(v){ return 'TZS ' + (v/1000).toFixed(0) + 'K'; } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderFinanceExpPie(d) {
  var ctx = document.getElementById('finExpPieChart');
  if (!ctx) return;
  if (_finExpPieChart) { _finExpPieChart.destroy(); _finExpPieChart = null; }
  var cats = Object.entries(d.expenses.byCategory || {}).sort(function(a,b){ return b[1]-a[1]; });
  if (!cats.length) {
    ctx.parentElement.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No expense data yet</p>';
    return;
  }
  var palette = ['#f87171','#fb923c','#facc15','#4ade80','#34d399','#60a5fa','#a78bfa','#f472b6','#94a3b8'];
  _finExpPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(function(c){ return c[0]; }),
      datasets: [{ data: cats.map(function(c){ return c[1]; }), backgroundColor: palette.slice(0, cats.length), borderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 11 } } },
        tooltip: { callbacks: { label: function(ctx){ return ctx.label + ': TZS ' + ctx.raw.toLocaleString(); } } }
      }
    }
  });
}

function renderFinanceInvStatus(d) {
  var container = document.getElementById('finInvStatusBars');
  if (!container) return;
  var total = d.invoices.totalInvoiced || 1;
  var rows = [
    { label: 'Paid',        amount: d.invoices.totalPaid,    color: 'bg-green-400', count: d.invoices.paidCount },
    { label: 'Outstanding', amount: d.invoices.outstanding,  color: 'bg-amber-400', count: d.invoices.outstandingCount },
    { label: 'Overdue',     amount: d.invoices.overdue,      color: 'bg-red-400',   count: d.invoices.overdueCount },
  ];
  container.innerHTML = rows.map(function(r) {
    var pct = total > 0 ? ((r.amount / total) * 100).toFixed(1) : '0.0';
    return '<div class="mb-4">' +
      '<div class="flex justify-between text-sm mb-1">' +
        '<span class="font-medium text-gray-700">' + r.label + ' <span class="text-gray-400 text-xs">(' + r.count + ')</span></span>' +
        '<span class="font-semibold text-gray-800">' + fmt(r.amount) + ' <span class="text-gray-400 text-xs">(' + pct + '%)</span></span>' +
      '</div>' +
      '<div class="h-3 bg-gray-100 rounded-full overflow-hidden">' +
        '<div class="h-full ' + r.color + ' rounded-full transition-all duration-500" style="width:' + pct + '%"></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderFinancePipeline(d) {
  var container = document.getElementById('finPipelineFunnel');
  if (!container) return;
  var stages = [
    { label: 'Open Jobs (no invoice)', value: d.pipeline.value,             count: d.pipeline.jobCount,         color: 'bg-purple-400', icon: 'fa-tools' },
    { label: 'Upcoming Bookings',      value: d.appointments.expectedValue, count: d.appointments.count,         color: 'bg-blue-400',   icon: 'fa-calendar' },
    { label: 'Outstanding Invoices',   value: d.invoices.outstanding,       count: d.invoices.outstandingCount,  color: 'bg-amber-400',  icon: 'fa-file-invoice' },
    { label: 'Overdue Invoices',       value: d.invoices.overdue,           count: d.invoices.overdueCount,      color: 'bg-red-400',    icon: 'fa-exclamation-circle' },
  ];
  container.innerHTML = stages.map(function(s, i) {
    var width = 100 - (i * 12);
    return '<div style="width:' + width + '%;margin:0 auto">' +
      '<div class="' + s.color + ' rounded-lg px-3 py-2 text-white text-center">' +
        '<div class="text-xs font-semibold"><i class="fas ' + s.icon + ' mr-1"></i>' + s.label + '</div>' +
        '<div class="text-sm font-bold mt-0.5">' + fmt(s.value) + '</div>' +
        '<div class="text-xs opacity-80">' + s.count + ' item' + (s.count !== 1 ? 's' : '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderFinanceInvoices() {
  if (!_finAllInvoices) return;
  var statusFilter = (document.getElementById('finInvStatusFilter') || {}).value || '';
  var list = _finAllInvoices;
  if (statusFilter) list = list.filter(function(i){ return i.status === statusFilter; });
  // Sort: overdue first, then by issuedAt desc
  list = list.slice().sort(function(a, b) {
    var rank = { Overdue: 0, Issued: 1, 'Partially Paid': 2, Draft: 3, Paid: 4 };
    var ra = rank[a.status] !== undefined ? rank[a.status] : 4;
    var rb = rank[b.status] !== undefined ? rank[b.status] : 4;
    if (ra !== rb) return ra - rb;
    return b.issuedAt.localeCompare(a.issuedAt);
  });
  var tbody = document.getElementById('finInvTable');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-400">No invoices found</td></tr>';
    return;
  }
  tbody.innerHTML = list.slice(0, 50).map(function(inv) {
    var statusClass = inv.status === 'Paid' ? 'bg-green-100 text-green-700'
      : inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700'
      : inv.status === 'Overdue' ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';
    var methodIcon = inv.paymentMethod === 'Mobile Money' ? 'fa-mobile-alt' : inv.paymentMethod === 'Bank' ? 'fa-university' : inv.paymentMethod === 'Lipa Number' ? 'fa-hashtag' : inv.paymentMethod === 'Cash' ? 'fa-money-bill-wave' : '';
    var methodHtml = inv.paymentMethod ? '<span class="text-xs text-gray-500"><i class="fas ' + methodIcon + ' mr-0.5"></i>' + inv.paymentMethod + '</span>' : '';
    var payBtn = (inv.status !== 'Paid') ?
      '<button class="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100" onclick="showPayInvoiceModal(&#39;' + inv.id + '&#39;)">' +
        (inv.status === 'Partially Paid' ? 'Pay Balance' : 'Record Payment') + '</button>' : '';
    var overdueBtn = (inv.status === 'Issued' && inv.dueDate && inv.dueDate < new Date().toISOString().slice(0,10)) ?
      '<button class="text-xs text-red-600 hover:underline font-semibold ml-1" onclick="markInvoiceOverdue(&#39;' + inv.id + '&#39;)">Overdue</button>' : '';
    return '<tr class="border-b border-gray-50 hover:bg-gray-50">' +
      '<td class="py-2 pr-3 font-mono text-xs font-semibold text-gray-700">' + inv.invoiceNumber + '</td>' +
      '<td class="py-2 pr-3 text-xs">' + (inv.jobCardNumber || '—') + '</td>' +
      '<td class="py-2 pr-3 text-xs truncate max-w-28">' + (inv.customerName || '—') + '</td>' +
      '<td class="py-2 pr-3 text-xs text-right font-semibold">' + fmt(inv.totalAmount) + '</td>' +
      '<td class="py-2 pr-3 text-xs text-gray-400">' + (inv.dueDate || '—') + '</td>' +
      '<td class="py-2 pr-3 text-xs text-gray-400">' + (inv.paidAt ? fmtDate(inv.paidAt) : '—') + '</td>' +
      '<td class="py-2 pr-3 text-xs">' + methodHtml + '</td>' +
      '<td class="py-2 pr-3"><span class="badge text-xs ' + statusClass + '">' + inv.status + '</span></td>' +
      '<td class="py-2 text-xs whitespace-nowrap">' + payBtn + overdueBtn + '</td>' +
    '</tr>';
  }).join('');
}

// Kept for any legacy call sites — now delegates to the pay modal
function markInvoicePaidFromFinance(invId) {
  showPayInvoiceModal(invId);
}

async function markInvoiceOverdue(invId) {
  try {
    await axios.patch('/api/invoices/' + invId + '/status', { status: 'Overdue' });
    showToast('Invoice marked as Overdue', 'warning');
    syncFinance();
  } catch(e) {
    showToast('Could not update invoice status', 'error');
  }
}

// ═══ NOTIFICATIONS ═══

// Priority meta — colours and icons
var NOTIF_META = {
  info:    { bg:'#eff6ff', border:'#bfdbfe', icon:'fas fa-info-circle',  iconColor:'#3b82f6', dot:'bg-blue-500'   },
  success: { bg:'#f0fdf4', border:'#bbf7d0', icon:'fas fa-check-circle', iconColor:'#22c55e', dot:'bg-green-500'  },
  warning: { bg:'#fffbeb', border:'#fde68a', icon:'fas fa-exclamation-triangle', iconColor:'#f59e0b', dot:'bg-yellow-500' },
  error:   { bg:'#fef2f2', border:'#fecaca', icon:'fas fa-times-circle', iconColor:'#ef4444', dot:'bg-red-500'    },
};
var NOTIF_TYPE_LABEL = {
  job_created:'Job Created', job_status:'Status Update', job_completed:'Job Completed',
  pfi_created:'PFI Created', pfi_sent:'PFI Sent', pfi_approved:'PFI Approved', pfi_rejected:'PFI Rejected',
  invoice_created:'Invoice', invoice_paid:'Invoice Paid', invoice_overdue:'Invoice Overdue',
  appointment_created:'Appointment', appointment_reminder:'Reminder', appointment_cancelled:'Cancelled',
  expense_created:'Expense', expense_approved:'Expense Status',
  low_stock:'Low Stock', parts_added:'Parts Added', service_added:'Service Added',
};

function notifTimeAgo(iso) {
  var d = Date.now() - new Date(iso).getTime();
  var m = Math.floor(d/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  var h = Math.floor(m/60);
  if (h < 24) return h + 'h ago';
  var dy = Math.floor(h/24);
  if (dy < 7) return dy + 'd ago';
  return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

// ── Bell dropdown ────────────────────────────────────────────────────────────
async function loadNotifDropdown() {
  var res = await axios.get('/api/notifications?limit=15');
  var list = res.data.notifications;
  var unread = res.data.unreadCount;
  // Update badge
  var badge = document.getElementById('notifBadge');
  var dropBadge = document.getElementById('notifDropBadge');
  if (unread > 0) {
    var label = unread > 99 ? '99+' : String(unread);
    badge.textContent = label; badge.classList.remove('hidden'); badge.classList.add('flex');
    dropBadge.textContent = label + ' new'; dropBadge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden'); badge.classList.remove('flex');
    dropBadge.classList.add('hidden');
  }
  var el = document.getElementById('notifList');
  if (!list.length) {
    el.innerHTML = '<p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-bell-slash mb-2 block text-2xl"></i>All caught up!</p>';
    return;
  }
  el.innerHTML = list.map(function(n) {
    var m = NOTIF_META[n.priority] || NOTIF_META.info;
    return '<div class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ' + (n.read ? 'opacity-60' : '') + '" data-notif-id="' + n.id + '">' +
      '<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style="background:' + m.bg + ';border:1px solid ' + m.border + '">' +
        '<i class="' + m.icon + ' text-xs" style="color:' + m.iconColor + '"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        (n.read ? '' : '<span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 mb-0.5 align-middle"></span>') +
        '<span class="text-xs font-bold text-gray-800">' + escHtml(n.title) + '</span>' +
        '<p class="text-xs text-gray-500 mt-0.5 leading-relaxed">' + escHtml(n.message) + '</p>' +
        '<div class="flex items-center gap-2 mt-1">' +
          '<span class="text-xs text-gray-400">' + notifTimeAgo(n.createdAt) + '</span>' +
          '<span class="text-xs px-1.5 py-0.5 rounded font-medium" style="background:' + m.bg + ';color:' + m.iconColor + '">' + (NOTIF_TYPE_LABEL[n.type] || n.type) + '</span>' +
        '</div>' +
      '</div>' +
      (!n.read ? '<button class="text-gray-300 hover:text-blue-500 text-xs flex-shrink-0 mt-1" data-mark-read="' + n.id + '" title="Mark read"><i class="fas fa-check"></i></button>' : '') +
    '</div>';
  }).join('');
  // Click handlers
  el.querySelectorAll('[data-notif-id]').forEach(function(row) {
    row.addEventListener('click', async function(e) {
      if (e.target.closest('[data-mark-read]')) return;
      var id = this.dataset.notifId;
      await axios.patch('/api/notifications/' + id + '/read');
      loadNotifDropdown();
    });
  });
  el.querySelectorAll('[data-mark-read]').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      await axios.patch('/api/notifications/' + this.dataset.markRead + '/read');
      loadNotifDropdown();
    });
  });
}

function toggleNotifDropdown() {
  var dd = document.getElementById('notifDropdown');
  var isHidden = dd.classList.contains('hidden');
  if (isHidden) {
    dd.classList.remove('hidden');
    loadNotifDropdown();
    // Close on outside click
    setTimeout(function() {
      document.addEventListener('click', closeNotifOnOutside, { once: true });
    }, 0);
  } else {
    closeNotifDropdown();
  }
}
function closeNotifOnOutside(e) {
  var wrap = document.getElementById('notifBellWrap');
  if (!wrap.contains(e.target)) closeNotifDropdown();
  else document.addEventListener('click', closeNotifOnOutside, { once: true });
}
function closeNotifDropdown() {
  document.getElementById('notifDropdown').classList.add('hidden');
}

async function markAllRead() {
  await axios.patch('/api/notifications/read-all');
  loadNotifDropdown();
  if (document.getElementById('page-notifications').classList.contains('active')) loadNotificationsPage();
  showToast('All notifications marked as read','success');
}
async function clearReadNotifs() {
  await axios.delete('/api/notifications/clear-read');
  loadNotifDropdown();
  if (document.getElementById('page-notifications').classList.contains('active')) loadNotificationsPage();
  showToast('Read notifications cleared');
}

// ── Notifications page ───────────────────────────────────────────────────────
async function loadNotificationsPage() {
  var typeF  = document.getElementById('notifFilter-type')?.value || '';
  var readF  = document.getElementById('notifFilter-read')?.value || '';
  var priF   = document.getElementById('notifFilter-priority')?.value || '';

  var params = '/api/notifications?limit=200';
  if (typeF) params += '&type=' + encodeURIComponent(typeF);

  var res = await axios.get(params);
  var all  = res.data.notifications;

  // Client-side filter for read/priority (API doesn't have these)
  if (readF === 'unread') all = all.filter(function(n){ return !n.read; });
  if (readF === 'read')   all = all.filter(function(n){ return n.read; });
  if (priF)               all = all.filter(function(n){ return n.priority === priF; });

  // Stats
  var total   = all.length;
  var unread  = all.filter(function(n){ return !n.read; }).length;
  var crit    = all.filter(function(n){ return n.priority==='error'||n.priority==='warning'; }).length;
  var success = all.filter(function(n){ return n.priority==='success'; }).length;
  var statsEl = document.getElementById('notifStats');
  if (statsEl) statsEl.innerHTML = [
    { label:'Total',    value:total,   icon:'fas fa-bell',         color:'#3b82f6', bg:'#eff6ff' },
    { label:'Unread',   value:unread,  icon:'fas fa-envelope',     color:'#8b5cf6', bg:'#f5f3ff' },
    { label:'Alerts',   value:crit,    icon:'fas fa-exclamation-triangle', color:'#f59e0b', bg:'#fffbeb' },
    { label:'Success',  value:success, icon:'fas fa-check-circle', color:'#22c55e', bg:'#f0fdf4' },
  ].map(function(s) {
    return '<div class="card p-4 flex items-center gap-3">' +
      '<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:' + s.bg + '">' +
        '<i class="' + s.icon + '" style="color:' + s.color + '"></i>' +
      '</div>' +
      '<div><p class="text-xs text-gray-500 font-medium">' + s.label + '</p><p class="text-xl font-bold text-gray-900">' + s.value + '</p></div>' +
    '</div>';
  }).join('');

  // Count
  var countEl = document.getElementById('notifPageCount');
  if (countEl) countEl.textContent = total + ' notification' + (total !== 1 ? 's' : '');

  // List
  var listEl = document.getElementById('notifPageList');
  if (!listEl) return;
  if (!all.length) {
    listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-12"><i class="fas fa-bell-slash text-3xl mb-3 block"></i>No notifications match your filters</p>';
    return;
  }
  listEl.innerHTML = all.map(function(n) {
    var m = NOTIF_META[n.priority] || NOTIF_META.info;
    return '<div class="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ' + (n.read ? 'opacity-60' : '') + '" data-np-id="' + n.id + '">' +
      '<div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style="background:' + m.bg + ';border:1px solid ' + m.border + '">' +
        '<i class="' + m.icon + '" style="color:' + m.iconColor + '"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2 flex-wrap">' +
          (!n.read ? '<span class="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>' : '') +
          '<span class="font-bold text-gray-900 text-sm">' + escHtml(n.title) + '</span>' +
          '<span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:' + m.bg + ';color:' + m.iconColor + '">' + (NOTIF_TYPE_LABEL[n.type] || n.type) + '</span>' +
        '</div>' +
        '<p class="text-sm text-gray-600 mt-1">' + escHtml(n.message) + '</p>' +
        '<div class="flex items-center gap-3 mt-2 flex-wrap">' +
          '<span class="text-xs text-gray-400"><i class="fas fa-clock mr-1"></i>' + notifTimeAgo(n.createdAt) + '</span>' +
          (n.jobCardNumber ? '<span class="text-xs text-blue-600 font-medium cursor-pointer hover:underline" data-np-job="' + n.jobCardId + '">' + n.jobCardNumber + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-1 flex-shrink-0">' +
        (!n.read ? '<button class="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium" data-np-mark="' + n.id + '"><i class="fas fa-check mr-1"></i>Read</button>' : '<span class="text-xs text-gray-400 font-medium"><i class="fas fa-check-double mr-1"></i>Read</span>') +
        '<button class="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" data-np-del="' + n.id + '" title="Delete"><i class="fas fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');

  listEl.querySelectorAll('[data-np-mark]').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      await axios.patch('/api/notifications/' + this.dataset.npMark + '/read');
      loadNotificationsPage(); loadNotifDropdown();
    });
  });
  listEl.querySelectorAll('[data-np-del]').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      if (!confirm('Delete this notification?')) return;
      await axios.delete('/api/notifications/' + this.dataset.npDel);
      loadNotificationsPage(); loadNotifDropdown();
    });
  });
  listEl.querySelectorAll('[data-np-job]').forEach(function(span) {
    span.addEventListener('click', function() {
      viewJobDetail(this.dataset.npJob);
    });
  });
}

function resetNotifFilters() {
  ['notifFilter-type','notifFilter-read','notifFilter-priority'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  loadNotificationsPage();
}

// Helper: escape HTML
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Escape for use inside HTML attribute values (handles single quotes too)
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ═══════════════════════════════════════════════════════════════════
// ─── VENDORS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

var allVendors = [];
var _vendorEditId = null;

async function loadVendors() {
  try {
    const { data } = await axios.get('/api/vendors');
    allVendors = data;
    _renderVendorStats(data);
    _renderVendorsGrid(data);
  } catch(e) { showToast('Failed to load vendors', 'error'); }
}

function _renderVendorStats(list) {
  const total    = list.length;
  const active   = list.filter(function(v){ return v.status === 'Active'; }).length;
  const inactive = list.filter(function(v){ return v.status === 'Inactive'; }).length;
  const totalSpend = list.reduce(function(s, v){ return s + (v.totalSpend || 0); }, 0);
  const stats = [
    { label:'Total Vendors',  value: total,    icon:'fa-store',       g1:'#2563eb', g2:'#3b82f6' },
    { label:'Active',         value: active,   icon:'fa-check-circle',g1:'#16a34a', g2:'#22c55e' },
    { label:'Inactive',       value: inactive, icon:'fa-pause-circle',g1:'#d97706', g2:'#f59e0b' },
    { label:'Total Spend',    value:'TZS '+fmt(totalSpend), icon:'fa-coins', g1:'#7c3aed', g2:'#8b5cf6' },
  ];
  document.getElementById('vendorStats').innerHTML = stats.map(function(s){
    return '<div class="stat-card" style="--g1:'+s.g1+';--g2:'+s.g2+'">' +
      '<div class="flex items-start justify-between">' +
        '<div>' +
          '<p class="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">'+s.label+'</p>' +
          '<p class="text-xl sm:text-2xl font-bold">'+s.value+'</p>' +
        '</div>' +
        '<div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">' +
          '<i class="fas '+s.icon+' text-white text-lg"></i>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function _renderVendorsGrid(list) {
  var grid = document.getElementById('vendorsGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-store text-4xl mb-3 block opacity-40"></i><p class="font-medium">No vendors found</p><p class="text-sm mt-1">Add your first vendor to get started.</p></div>';
    return;
  }
  grid.innerHTML = list.map(function(v){
    var statusCls = v.status === 'Active' ? 'badge-active' : 'badge-inactive';
    var initials = v.name.split(' ').slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
    var avatarBg = v.status === 'Active' ? 'background:linear-gradient(135deg,#2563eb,#7c3aed)' : 'background:linear-gradient(135deg,#9ca3af,#6b7280)';
    return '<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">' +
      '<div class="flex items-start justify-between gap-3">' +
        '<div class="flex items-center gap-3">' +
          '<div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style="'+avatarBg+'">'+initials+'</div>' +
          '<div class="min-w-0">' +
            '<p class="font-bold text-gray-900 truncate">'+escHtml(v.name)+'</p>' +
            '<p class="text-xs text-gray-500 truncate">'+(v.location ? escHtml(v.location) : '-')+'</p>' +
          '</div>' +
        '</div>' +
        '<span class="badge '+statusCls+' flex-shrink-0">'+v.status+'</span>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2 text-sm">' +
        '<div class="flex items-center gap-1.5 text-gray-600"><i class="fas fa-phone w-4 text-gray-400"></i>'+escHtml(v.phone)+'</div>' +
        (v.email ? '<div class="flex items-center gap-1.5 text-gray-600 truncate"><i class="fas fa-envelope w-4 text-gray-400"></i><span class="truncate">'+escHtml(v.email)+'</span></div>' : '<div></div>') +
        (v.tin   ? '<div class="flex items-center gap-1.5 text-gray-500 text-xs"><i class="fas fa-id-card w-4 text-gray-400"></i>TIN: '+escHtml(v.tin)+'</div>'   : '<div></div>') +
        (v.vrn   ? '<div class="flex items-center gap-1.5 text-gray-500 text-xs"><i class="fas fa-file-invoice w-4 text-gray-400"></i>VRN: '+escHtml(v.vrn)+'</div>' : '<div></div>') +
      '</div>' +
      '<div class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">' +
        '<span><i class="fas fa-receipt mr-1 text-gray-400"></i>'+(v.expenseCount||0)+' expense'+(v.expenseCount===1?'':'s')+'</span>' +
        '<span class="font-semibold text-gray-700">TZS '+fmt(v.totalSpend||0)+'</span>' +
      '</div>' +
      '<div class="flex gap-2 pt-1">' +
        '<button class="btn-secondary flex-1 text-xs py-1.5 vnd-view" data-vnd="'+v.id+'"><i class="fas fa-eye mr-1"></i>View</button>' +
        '<button class="btn-secondary flex-1 text-xs py-1.5 vnd-edit" data-vnd="'+v.id+'"><i class="fas fa-pen mr-1"></i>Edit</button>' +
        '<button class="btn-secondary flex-1 text-xs py-1.5 text-red-500 hover:bg-red-50 vnd-del" data-vnd="'+v.id+'"><i class="fas fa-trash mr-1"></i>Del</button>' +
      '</div>' +
    '</div>';
  }).join('');

  // Event delegation — safe against any special characters in vendor names/IDs
  grid.querySelectorAll('.vnd-view').forEach(function(btn){
    btn.addEventListener('click', function(){ viewVendorDetail(btn.dataset.vnd); });
  });
  grid.querySelectorAll('.vnd-edit').forEach(function(btn){
    btn.addEventListener('click', function(){ editVendor(btn.dataset.vnd); });
  });
  grid.querySelectorAll('.vnd-del').forEach(function(btn){
    btn.addEventListener('click', function(){ deleteVendor(btn.dataset.vnd); });
  });
}

function filterVendors() {
  var q      = (document.getElementById('vendorSearch').value || '').toLowerCase();
  var status = document.getElementById('vendorFilterStatus').value;
  var list = allVendors.filter(function(v){
    var matchQ = !q || v.name.toLowerCase().includes(q) || (v.phone && v.phone.includes(q)) ||
                 (v.tin && v.tin.toLowerCase().includes(q)) || (v.location && v.location.toLowerCase().includes(q));
    var matchS = !status || v.status === status;
    return matchQ && matchS;
  });
  _renderVendorsGrid(list);
}

function showVendorModal(vendorId) {
  _vendorEditId = vendorId || null;
  document.getElementById('vendorForm').reset();
  document.getElementById('vendorModalTitle').textContent = vendorId ? 'Edit Vendor' : 'Add Vendor';
  document.getElementById('vendorModalSub').textContent   = vendorId ? 'Update vendor details' : 'Register a new supplier';
  if (vendorId) {
    var v = allVendors.find(function(x){ return x.id === vendorId; });
    if (v) {
      document.getElementById('vnd-name').value     = v.name     || '';
      document.getElementById('vnd-phone').value    = v.phone    || '';
      document.getElementById('vnd-email').value    = v.email    || '';
      document.getElementById('vnd-tin').value      = v.tin      || '';
      document.getElementById('vnd-vrn').value      = v.vrn      || '';
      document.getElementById('vnd-location').value = v.location || '';
      document.getElementById('vnd-status').value   = v.status   || 'Active';
      document.getElementById('vnd-notes').value    = v.notes    || '';
    }
  }
  openModal('modal-vendor');
}

function editVendor(vendorId) { showVendorModal(vendorId); }

async function submitVendor(e) {
  e.preventDefault();
  var body = {
    name:     document.getElementById('vnd-name').value.trim(),
    phone:    document.getElementById('vnd-phone').value.trim(),
    email:    document.getElementById('vnd-email').value.trim()    || undefined,
    tin:      document.getElementById('vnd-tin').value.trim()      || undefined,
    vrn:      document.getElementById('vnd-vrn').value.trim()      || undefined,
    location: document.getElementById('vnd-location').value.trim() || undefined,
    status:   document.getElementById('vnd-status').value,
    notes:    document.getElementById('vnd-notes').value.trim()    || undefined,
  };
  try {
    if (_vendorEditId) {
      await axios.put('/api/vendors/' + _vendorEditId, body);
      showToast('\u2714 Vendor updated');
    } else {
      await axios.post('/api/vendors', body);
      showToast('\u2714 Vendor registered');
    }
    closeModal('modal-vendor');
    await loadVendors();
  } catch(err) { showToast('Failed to save vendor', 'error'); }
}

async function deleteVendor(vendorId) {
  if (!confirm('Delete this vendor? Vendors with linked expenses cannot be deleted - deactivate them instead.')) return;
  try {
    await axios.delete('/api/vendors/' + vendorId);
    showToast('\u2714 Vendor deleted');
    loadVendors();
  } catch(err) {
    var msg = (err.response && err.response.data && err.response.data.error) ? err.response.data.error : 'Failed to delete vendor';
    showToast(msg, 'error');
  }
}

async function viewVendorDetail(vendorId) {
  try {
    var { data } = await axios.get('/api/vendors/' + vendorId);
    var v = data;
    var initials = v.name.split(' ').slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
    var statusBadgeCls = v.status === 'Active' ? 'badge-active' : 'badge-inactive';
    var statusBadgeHtml = '<span class="badge ' + statusBadgeCls + '">' + v.status + '</span>';

    // Header
    document.getElementById('vndDetailName').textContent = v.name;
    document.getElementById('vndDetailSub').textContent  = v.location || 'Vendor profile';

    // Info grid
    document.getElementById('vndDetailInfo').innerHTML =
      _vndField('fa-phone','Phone', v.phone) +
      _vndField('fa-envelope','Email', v.email || '-') +
      _vndField('fa-id-card','TIN', v.tin || '-') +
      _vndField('fa-file-invoice','VRN', v.vrn || '-') +
      _vndField('fa-map-marker-alt','Location', v.location || '-') +
      _vndField('fa-circle','Status', statusBadgeHtml) +
      (v.notes ? _vndField('fa-sticky-note','Notes', escHtml(v.notes)) : '');

    // KPIs
    document.getElementById('vndDetailKpis').innerHTML =
      '<div class="bg-blue-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-blue-700">'+(v.expenseCount||0)+'</p><p class="text-xs text-blue-500 mt-0.5">Linked Expenses</p></div>' +
      '<div class="bg-purple-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-purple-700">TZS '+fmt(v.totalSpend||0)+'</p><p class="text-xs text-purple-500 mt-0.5">Total Spend</p></div>';

    // Expense history
    if (v.expenses && v.expenses.length) {
      document.getElementById('vndDetailExpenses').innerHTML = v.expenses.map(function(e){
        return '<tr class="hover:bg-gray-50">' +
          '<td class="px-3 py-2 whitespace-nowrap text-gray-500 text-xs">'+fmtDate(e.date)+'</td>' +
          '<td class="px-3 py-2 text-gray-800 text-sm">'+escHtml(e.description)+(e.receiptRef?'<br><span class="text-xs text-gray-400">'+escHtml(e.receiptRef)+'</span>':'')+'</td>' +
          '<td class="px-3 py-2 hidden sm:table-cell"><span class="badge badge-info text-xs">'+e.category+'</span></td>' +
          '<td class="px-3 py-2 text-right font-semibold text-gray-800 text-sm">'+fmt(e.amount)+'</td>' +
          '<td class="px-3 py-2"><span class="badge badge-'+e.status.toLowerCase()+'">'+e.status+'</span></td>' +
        '</tr>';
      }).join('');
    } else {
      document.getElementById('vndDetailExpenses').innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm"><i class="fas fa-receipt text-3xl mb-2 block opacity-30"></i>No expenses linked to this vendor yet</td></tr>';
    }

    // Action buttons — use data attributes to avoid quote nesting issues
    document.getElementById('vndDetailActions').innerHTML =
      '<button class="btn-secondary flex-1 vnd-detail-edit" data-vnd="'+v.id+'"><i class="fas fa-pen mr-1"></i>Edit</button>' +
      '<button class="btn-primary flex-1 vnd-detail-close">Close</button>';
    document.querySelector('.vnd-detail-edit').addEventListener('click', function(){
      closeModal('modal-vendorDetail');
      editVendor(document.querySelector('.vnd-detail-edit').dataset.vnd);
    });
    document.querySelector('.vnd-detail-close').addEventListener('click', function(){
      closeModal('modal-vendorDetail');
    });

    openModal('modal-vendorDetail');
  } catch(err) { showToast('Failed to load vendor details', 'error'); }
}

function _vndField(icon, label, val) {
  return '<div class="flex items-start gap-2.5">' +
    '<div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fas '+icon+' text-blue-500 text-xs"></i></div>' +
    '<div><p class="text-xs text-gray-400 font-medium">'+label+'</p><p class="text-sm text-gray-800 font-medium mt-0.5">'+val+'</p></div>' +
  '</div>';
}

// ─── EXPENSE VENDOR PICKER ───────────────────────────────────────────

function _expVendorCategories() {
  return ['Parts & Materials', 'Subcontractor', 'Equipment & Tools'];
}

function _expVendorIsRequired() {
  var cat = document.getElementById('exp-category').value;
  return _expVendorCategories().indexOf(cat) !== -1;
}

function expVendorOnCategoryChange() {
  var req = _expVendorIsRequired();
  document.getElementById('expVendorRequired').classList.toggle('hidden', !req);
  document.getElementById('expVendorHint').classList.toggle('hidden', req);
  document.getElementById('expVendorWarning').classList.add('hidden');
}

function expVendorSearch() {
  var q    = (document.getElementById('exp-vendor-search').value || '').toLowerCase();
  var list = document.getElementById('exp-vendor-list');
  var vendors = allVendors.filter(function(v){
    return v.status === 'Active' && (!q ||
      v.name.toLowerCase().includes(q) ||
      (v.tin && v.tin.toLowerCase().includes(q)) ||
      (v.location && v.location.toLowerCase().includes(q)));
  });
  if (!vendors.length) {
    list.innerHTML = '<li class="px-4 py-3 text-sm text-gray-400 italic">No registered vendors found</li>';
  } else {
    list.innerHTML = vendors.map(function(v){
      var initials = v.name.split(' ').slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
      return '<li class="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm exp-vendor-item" data-vid="'+v.id+'" data-vname="'+escAttr(v.name)+'">'+
        '<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">'+initials+'</div>'+
        '<div class="min-w-0">'+
          '<p class="font-medium text-gray-800 truncate">'+escHtml(v.name)+'</p>'+
          '<p class="text-xs text-gray-400">'+(v.tin?'TIN: '+v.tin+'  ':'')+''+(v.location?v.location:'')+'</p>'+
        '</div>'+
        (v.vrn ? '<span class="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">VRN</span>' : '') +
      '</li>';
    }).join('');
    // Use event delegation – safe against vendor names with quotes
    list.querySelectorAll('.exp-vendor-item').forEach(function(li) {
      li.addEventListener('mousedown', function(ev) {
        ev.preventDefault(); // prevent blur from firing before click
        expVendorSelect(li.dataset.vid, li.dataset.vname);
      });
    });
  }
  list.classList.remove('hidden');
  document.getElementById('expVendorClear').classList.toggle('hidden', !document.getElementById('exp-vendor-search').value);
}

function expVendorSelect(vendorId, vendorName) {
  document.getElementById('exp-vendorId').value        = vendorId;
  document.getElementById('exp-vendor').value          = vendorName;
  document.getElementById('exp-vendor-search').value   = vendorName;
  document.getElementById('expVendorClear').classList.remove('hidden');
  document.getElementById('exp-vendor-list').classList.add('hidden');
  document.getElementById('expVendorWarning').classList.add('hidden');
}

function expVendorClear() {
  document.getElementById('exp-vendorId').value       = '';
  document.getElementById('exp-vendor').value         = '';
  document.getElementById('exp-vendor-search').value  = '';
  document.getElementById('expVendorClear').classList.add('hidden');
  document.getElementById('exp-vendor-list').classList.add('hidden');
}

function expVendorValidate() {
  if (_expVendorIsRequired() && !document.getElementById('exp-vendorId').value) {
    document.getElementById('expVendorWarning').classList.remove('hidden');
    document.getElementById('exp-vendor-search').focus();
    return false;
  }
  return true;
}

// ═══ INIT ═══
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

// Try to restore session from localStorage, otherwise show login screen
(async function() {
  var loggedIn = await tryAutoLogin();
  if (loggedIn) {
    loadDashboard();
    loadNotifDropdown();
    startNotifPolling();
  }
  // If not logged in, the login screen is already visible (default state)
})();
</script>
</body>
</html>`;
}

export default app
