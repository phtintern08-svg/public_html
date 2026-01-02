// notifications.js – admin notification center (backend integration)

const API_BASE = 'https://apparels.impromptuindian.com';

function showToast(msg) {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-msg');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Notifications data from backend
let notifications = [];

// Map notification type to icon
function getNotificationIcon(type) {
    const iconMap = {
        'order': 'shopping-cart',
        'vendor': 'factory',
        'rider': 'bike',
        'system': 'settings',
        'verification': 'user-check',
        'payment': 'credit-card'
    };
    return iconMap[type] || 'bell';
}

// Calculate relative time
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

async function fetchNotifications() {
    try {
        const response = await fetch(`${API_BASE}/admin/notifications`);
        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();
        notifications = data.map(n => ({
            id: n.id,
            type: n.type || 'system',
            title: n.title,
            message: n.message,
            time: timeAgo(n.created_at),
            read: n.is_read,
            icon: getNotificationIcon(n.type)
        }));

        renderNotifications();
    } catch (e) {
        console.error('Error fetching notifications:', e);
        showToast('Failed to load notifications');
    }
}

function renderNotifications() {
    const container = document.getElementById('notif-list');
    container.innerHTML = '';

    notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = `notif-item ${n.read ? '' : 'unread'}`;
        div.innerHTML = `
      <div class="notif-icon ${n.type}">
        <i data-lucide="${n.icon}" class="w-5 h-5"></i>
      </div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-message">${n.message}</div>
        <div class="notif-time">${n.time}</div>
        <div class="notif-actions">
          ${!n.read ? `<button class="btn-mark-read" onclick="markAsRead(${n.id})">Mark as Read</button>` : ''}
        </div>
      </div>
    `;
        container.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function filterNotifications() {
    const type = document.getElementById('type-filter').value;
    const term = document.getElementById('search-notif').value.toLowerCase();

    const filtered = notifications.filter(n => {
        const matchType = type === 'all' || n.type === type;
        const matchTerm = n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term);
        return matchType && matchTerm;
    });

    const container = document.getElementById('notif-list');
    container.innerHTML = '';

    filtered.forEach(n => {
        const div = document.createElement('div');
        div.className = `notif-item ${n.read ? '' : 'unread'}`;
        div.innerHTML = `
      <div class="notif-icon ${n.type}">
        <i data-lucide="${n.icon}" class="w-5 h-5"></i>
      </div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-message">${n.message}</div>
        <div class="notif-time">${n.time}</div>
        <div class="notif-actions">
          ${!n.read ? `<button class="btn-mark-read" onclick="markAsRead(${n.id})">Mark as Read</button>` : ''}
        </div>
      </div>
    `;
        container.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

async function markAsRead(id) {
    try {
        const response = await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to mark notification');

        await fetchNotifications();
        showToast('Notification marked as read');
    } catch (e) {
        console.error('Error marking notification:', e);
        showToast('Failed to update notification');
    }
}

async function refreshNotifications() {
    await fetchNotifications();
    showToast('Notifications refreshed');
}

// Reveal on scroll
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchNotifications();
    onScroll();
    window.addEventListener('scroll', onScroll);
});
