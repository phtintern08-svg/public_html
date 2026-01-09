/* Session Transfer Logic */
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('user_id') && urlParams.has('role')) {
    const userId = urlParams.get('user_id');
    const role = urlParams.get('role');

    if (role === 'rider') {
      localStorage.setItem('user_id', userId);
      localStorage.setItem('role', role);

      const username = urlParams.get('username');
      if (username) {
        localStorage.setItem('username', username);
        localStorage.setItem('rider_name', username);
      }

      const email = urlParams.get('email');
      if (email) localStorage.setItem('email', email);

      const phone = urlParams.get('phone');
      if (phone) localStorage.setItem('phone', phone);

      // Create user object for consistency
      const userObj = { user_id: userId, role: role, username, email, phone };
      localStorage.setItem('user', JSON.stringify(userObj));

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
})();

const ThreadlyApi = window.ThreadlyApi || (() => {
  const rawBase =
    window.THREADLY_API_BASE ||
    window.APP_API_BASE ||
    localStorage.getItem('THREADLY_API_BASE') ||
    '';

  let base = rawBase.trim().replace(/\/$/, '');
  if (!base) {
    // Force API to main domain (localhost:5000)
    // This handles requests from subdomains (rider.localhost) correctly
    base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com';
  }

  const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

  return {
    baseUrl: base,
    buildUrl,
    fetch: (path, options = {}) => fetch(buildUrl(path), options),
  };
})();
window.ThreadlyApi = ThreadlyApi;

const sidebarHTML = (status) => {
  const isVerified = status === 'active' || status === 'approved';
  const isPending = status === 'pending' || status === 'under-review' || status === 'verification_submitted';
  const isSuspended = status === 'suspended';

  // Define menu items
  const menuItems = [
    {
      href: 'home.html',
      icon: 'layout-dashboard',
      label: 'Dashboard',
      visible: true // Always visible
    },
    {
      href: 'verification.html',
      icon: 'shield-check',
      label: 'Verification',
      badgeClass: (['active', 'approved'].includes(status)) ? 'approved' :
        (status === 'rejected') ? 'rejected' :
          (['pending', 'under-review', 'verification_submitted'].includes(status)) ? 'pending' : 'pending',
      badgeText: (['active', 'approved'].includes(status)) ? 'Approved' :
        (status === 'rejected') ? 'Rejected' :
          (['pending', 'under-review', 'verification_submitted'].includes(status)) ? 'Pending' : 'Action Req',
      visible: true // Always visible
    },
    {
      href: 'assigned-deliveries.html',
      icon: 'package',
      label: 'Assigned Deliveries',
      visible: isVerified
    },
    {
      href: 'delivery-history.html',
      icon: 'history',
      label: 'Delivery History',
      visible: isVerified
    },
    {
      href: 'earnings.html',
      icon: 'dollar-sign',
      label: 'Earnings & Payouts',
      visible: isVerified
    },
    {
      href: 'notifications.html',
      icon: 'bell',
      label: 'Notifications',
      badgeId: 'notifications-count',
      visible: isVerified
    },
    {
      href: 'profile.html',
      icon: 'user-cog',
      label: 'Profile & Settings',
      visible: true // Always visible
    },
    {
      href: 'support.html',
      icon: 'headphones',
      label: 'Support & Helpdesk',
      visible: true // Always visible
    }
  ];

  // Generate HTML for menu items
  const navHTML = menuItems
    .filter(item => item.visible)
    .map(item => `
      <a href="${item.href}" class="menu-item flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors hover:bg-black hover:text-white">
        <i data-lucide="${item.icon}" class="w-5 h-5"></i> 
        <span>${item.label}</span>
        ${item.badgeId ? `<span class="notification-badge" id="${item.badgeId}" style="display:none">0</span>` : ''}
        ${item.badgeClass ? `<span class="verification-badge ${item.badgeClass}">${item.badgeText}</span>` : ''}
      </a>
    `).join('');

  return `
<aside class="sidebar bg-[#1273EB] flex flex-col justify-between h-screen fixed md:relative z-50 transition-all duration-300 -translate-x-full md:translate-x-0 w-[265px] shrink-0">
  <div class="p-5 flex items-center gap-3 text-xl font-bold">
    <i data-lucide="shirt" class="w-6 h-6 text-[#FFCC00]"></i>
    <a href="#">
      <span class="text-[#FFCC00]">Thread</span><span class="text-white">ly</span>
    </a>
  </div>

  <nav class="flex-1 px-4 mt-3 text-sm overflow-y-auto scrollbar-hide">
    <p class="uppercase text-xs mb-3 opacity-70">Delivery Partner</p>
    ${navHTML}
  </nav>

  <div class="p-4 flex items-center gap-3 bg-[#0d61c9]">
    <div id="userAvatar" class="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center font-bold">R</div>
    <div>
      <p id="userName" class="font-semibold text-sm">Rider</p>
      <a href="#" onclick="logout(event)" class="text-xs opacity-80 hover:underline">Logout</a>
    </div>
  </div>
</aside>

<button id="mobile-menu-toggle" class="md:hidden fixed top-4 right-4 z-50 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition">
  <i data-lucide="menu" class="w-6 h-6"></i>
</button>

<style>
  /* Hide scrollbar while maintaining scroll functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
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

  .verification-badge {
    margin-left: auto;
    background-color: #fbbf24;
    color: #000;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
  }
  
  .verification-badge.approved {
    background-color: #10b981;
    color: white;
  }

  .verification-badge.rejected {
    background-color: #ef4444;
    color: white;
  }

  .verification-badge.pending {
    background-color: #fbbf24;
    color: #000;
  }
</style>
`;
};

function setActiveLink() {
  const currentPage = window.location.pathname.split("/").pop().trim() || "home.html";
  const links = document.querySelectorAll(".menu-item");

  links.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
      link.style.backgroundColor = "#FFCC00";
      link.style.color = "#000";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("sidebar-container");
  if (container) {
    // Get user status
    let status = 'pending_verification'; // Default
    try {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        // Try to get fresh status from API
        try {
          const response = await ThreadlyApi.fetch(`/rider/status/${userId}`);
          if (response.ok) {
            const data = await response.json();
            // Use verification_status from the API response
            status = data.verification_status || 'pending_verification';
          } else {
            // Fallback to default if API fails
            status = 'pending_verification';
          }
        } catch (e) {
          // Fallback to default if API fails
          status = 'pending_verification';
        }
      }
    } catch (e) {
      console.error("Error getting user status:", e);
    }

    container.innerHTML = sidebarHTML(status);

    if (window.lucide) {
      lucide.createIcons();
    }

    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const sidebar = container.querySelector(".sidebar");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("-translate-x-full");
      });

      document.addEventListener("click", (e) => {
        if (window.innerWidth < 768 &&
          !sidebar.contains(e.target) &&
          !toggleBtn.contains(e.target) &&
          !sidebar.classList.contains("-translate-x-full")) {
          sidebar.classList.add("-translate-x-full");
        }
      });
    }

    setActiveLink();
    populateUserData();
    fetchNotificationCount();
  }
});

function populateUserData() {
  const username = localStorage.getItem('rider_name') || 'Rider';
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');

  if (userNameEl) {
    userNameEl.textContent = username;
  }

  if (userAvatarEl) {
    const initial = username.charAt(0).toUpperCase();
    userAvatarEl.textContent = initial;
  }
}

async function fetchNotificationCount() {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.log('No user_id found in localStorage');
      return;
    }

    const response = await ThreadlyApi.fetch(`/rider/notifications?rider_id=${userId}&unread_only=true`);
    if (response.ok) {
      const data = await response.json();
      const notificationsCountEl = document.getElementById('notifications-count');
      if (notificationsCountEl) {
        const unreadCount = Array.isArray(data) ? data.length : (data.unread_count || 0);
        notificationsCountEl.textContent = unreadCount;
        notificationsCountEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }
    }
  } catch (error) {
    console.error('Error fetching notification count:', error);
  }
}

function logout(event) {
  event.preventDefault();
  localStorage.removeItem('rider_id');
  localStorage.removeItem('rider_name');
  localStorage.removeItem('rider_email');
  localStorage.removeItem('rider_phone');
  localStorage.removeItem('role');
  window.location.href = window.location.hostname === 'localhost' ? 'http://localhost:5000/' : 'https://apparels.impromptuindian.com/';
}
