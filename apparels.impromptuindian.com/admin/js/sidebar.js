(function () {
  // Use a safe way to declare ThreadlyApi to avoid "already declared" errors
  if (typeof window.ThreadlyApi === 'undefined') {
    window.ThreadlyApi = (() => {
      const rawBase =
        window.THREADLY_API_BASE ||
        window.APP_API_BASE ||
        localStorage.getItem('THREADLY_API_BASE') ||
        '';

      let base = rawBase.trim().replace(/\/$/, '');
      if (!base) {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) {
          base = origin.replace(/\/$/, '');
        } else {
          base = 'https://apparels.impromptuindian.com';
        }
      }

      const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

      return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options),
      };
    })();
  }

  const ThreadlyApi = window.ThreadlyApi;

  const sidebarHTML = `
  <aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[265px] shrink-0">
    <div class="p-5 flex items-center gap-3 text-xl font-bold">
      <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
      <a href="home.html">
        <span class="text-[#FFCC00]">Impromptu</span><span class="text-white">Indian</span>
      </a>
    </div>

    <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto scrollbar-hide">
      <p class="uppercase text-xs mb-3 opacity-70">Admin Menu</p>

      <a href="home.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span>Dashboard</span>
      </a>

      <a href="orders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="shopping-bag" class="w-5 h-5"></i> <span>Orders</span>
        <span class="notification-badge" id="orders-count-badge" style="display:none">0</span>
      </a>

      <a href="vendors.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="store" class="w-5 h-5"></i> <span>Vendors</span>
      </a>

      <a href="riders.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bike" class="w-5 h-5"></i> <span>Riders</span>
      </a>

      <a href="delivery.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="truck" class="w-5 h-5"></i> <span>Delivery</span>
      </a>

      <a href="customers.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="users" class="w-5 h-5"></i> <span>Customers</span>
      </a>

      <a href="payments.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="dollar-sign" class="w-5 h-5"></i> <span>Payments</span>
      </a>

      <a href="notifications.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bell" class="w-5 h-5"></i> <span>Notifications</span>
        <span class="notification-badge" id="notifications-count">0</span>
      </a>

      <a href="reports.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="bar-chart-3" class="w-5 h-5"></i> <span>Reports</span>
      </a>

      <a href="settings.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="settings" class="w-5 h-5"></i> <span>Settings</span>
      </a>

      <a href="support.html" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="headphones" class="w-5 h-5"></i> <span>Support & Tickets</span>
      </a>
    </nav>

    <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
      <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold">A</div>
      <div>
        <p id="userName" class="font-semibold text-sm">Admin</p>
        <a href="#" onclick="logout(event)" class="text-xs opacity-80 hover:underline">Logout</a>
      </div>
    </div>
  </aside>

  <button id="mobile-menu-toggle" class="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition">
    <i data-lucide="menu" class="w-6 h-6"></i>
  </button>

  <style>
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .notification-badge {
      margin-left: auto;
      background-color: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      min-width: 1.25rem;
      text-align: center;
    }
  </style>
  `;

  function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (!submenu) return;
    const parent = submenu.previousElementSibling;

    if (submenu.classList.contains('open')) {
      submenu.classList.remove('open');
      parent.classList.remove('open');
    } else {
      document.querySelectorAll('.submenu.open').forEach(s => {
        s.classList.remove('open');
        s.previousElementSibling.classList.remove('open');
      });
      submenu.classList.add('open');
      parent.classList.add('open');
    }
  }

  function setActiveLink() {
    const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
    const links = document.querySelectorAll(".menu-item, .submenu-item");

    const parentPageMap = {
      'vendor-requests.html': 'vendors.html', 'quotation-reviews.html': 'vendors.html',
      'verified-vendors.html': 'vendors.html', 'rejected-vendors.html': 'vendors.html',
      'rider-requests.html': 'riders.html', 'verified-riders.html': 'riders.html',
      'rejected-riders.html': 'riders.html', 'riders-list.html': 'riders.html',
      'rider-assignments.html': 'delivery.html', 'delivery-history.html': 'delivery.html',
      'vendor-payouts.html': 'payments.html', 'payment-history.html': 'payments.html',
      'new-orders.html': 'orders.html', 'in-production.html': 'orders.html',
      'ready-dispatch.html': 'orders.html', 'completed-orders.html': 'orders.html',
      'support-tickets.html': 'support.html'
    };

    const parentPage = parentPageMap[currentPage];

    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPage || (parentPage && href === parentPage)) {
        link.classList.add("active");
        link.style.backgroundColor = "#FFCC00";
        link.style.color = "#000";
      }
    });
  }

  function populateUserData() {
    const username = localStorage.getItem('username') || 'Admin';
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = username;
    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
  }

  async function fetchSidebarCounts() {
    try {
      // Fetch Order Stats
      const orderStatsResponse = await ThreadlyApi.fetch('/api/admin/order-stats');
      if (orderStatsResponse.ok) {
        const stats = await orderStatsResponse.json();
        const ordersBadge = document.getElementById('orders-count-badge');
        if (ordersBadge) {
          if (stats.newOrders > 0) {
            ordersBadge.textContent = stats.newOrders;
            ordersBadge.style.display = 'inline-block';
          } else {
            ordersBadge.style.display = 'none';
          }
        }
      }

      const vendorRequestsResponse = await ThreadlyApi.fetch('/admin/vendor-requests');
      if (vendorRequestsResponse.ok) {
        const vendorRequests = await vendorRequestsResponse.json();
        const pendingCount = vendorRequests.filter(v => v.status === 'pending').length;
        const el = document.getElementById('vendor-requests-count');
        if (el) {
          el.textContent = pendingCount;
          el.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      }

      const quotationResponse = await ThreadlyApi.fetch('/admin/quotation-submissions');
      if (quotationResponse.ok) {
        const quotations = await quotationResponse.json();
        const el = document.getElementById('quotation-reviews-count');
        if (el) {
          el.textContent = quotations.length;
          el.style.display = quotations.length > 0 ? 'inline-block' : 'none';
        }
      }

      const riderRequestsResponse = await ThreadlyApi.fetch('/admin/rider-requests');
      if (riderRequestsResponse.ok) {
        const riderRequests = await riderRequestsResponse.json();
        const pendingRiders = riderRequests.filter(r => r.status === 'pending' || r.status === 'verification_submitted').length;
        const el = document.getElementById('rider-requests-count');
        if (el) {
          el.textContent = pendingRiders;
          el.style.display = pendingRiders > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (error) {
      console.error('Error fetching sidebar counts:', error);
    }
  }

  function logout(event) {
    if (event) event.preventDefault();
    localStorage.clear();
    window.location.href = 'https://apparels.impromptuindian.com/';
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sidebar-container");
    if (container) {
      container.innerHTML = sidebarHTML;
      if (window.lucide) lucide.createIcons();
      setActiveLink();
      populateUserData();
      fetchSidebarCounts();

      const toggleBtn = document.getElementById("mobile-menu-toggle");
      const sidebar = container.querySelector(".sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => sidebar.classList.toggle("-translate-x-full"));
        document.addEventListener("click", (e) => {
          if (window.innerWidth < 768 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target) && !sidebar.classList.contains("-translate-x-full")) {
            sidebar.classList.add("-translate-x-full");
          }
        });
      }
    }
  });

  // Exports
  window.logout = logout;
  window.toggleSubmenu = toggleSubmenu;
  window.fetchSidebarCounts = fetchSidebarCounts;

})();
