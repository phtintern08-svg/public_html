// orders.js - Orders landing page with category navigation
// Ensure backend connectivity
window.THREADLY_API_BASE = 'https://apparels.impromptuindian.com';
// ThreadlyApi is provided by sidebar.js

// Reveal on scroll animation
function onScroll() {
    document.querySelectorAll('.reveal').forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) el.classList.add('show');
    });
}

// Fetch order counts from backend
async function fetchOrderCounts() {
    try {
        const response = await ThreadlyApi.fetch('/api/admin/order-stats');
        if (!response.ok) throw new Error('Failed to fetch orders stats');

        const stats = await response.json();

        // Update the counts with fallback to 0
        document.getElementById('new-orders-count').textContent = stats.newOrders || 0;
        document.getElementById('production-count').textContent = stats.inProduction || 0;
        document.getElementById('ready-count').textContent = stats.readyDispatch || 0;
        document.getElementById('completed-count').textContent = stats.completed || 0;

    } catch (error) {
        console.error('Error fetching order counts:', error);
        // Set to 0 if error
        document.getElementById('new-orders-count').textContent = '0';
        document.getElementById('production-count').textContent = '0';
        document.getElementById('ready-count').textContent = '0';
        document.getElementById('completed-count').textContent = '0';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    onScroll();
    window.addEventListener('scroll', onScroll);

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Fetch order counts
    fetchOrderCounts();
});
