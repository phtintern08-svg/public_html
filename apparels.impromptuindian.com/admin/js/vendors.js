// vendors.js - Vendor management specific logic
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

// Fetch vendor counts from backend
async function fetchVendorCounts() {
    try {
        let pendingRequests = 0;
        let rejectedRequests = 0;
        // Fetch vendor requests (pending, under-review, rejected)
        const requestsResponse = await ThreadlyApi.fetch('/admin/vendor-requests');

        if (requestsResponse.ok) {
            const requests = await requestsResponse.json();
            pendingRequests = requests.filter(v => v.status === 'pending').length;
            rejectedRequests = requests.filter(v => v.status === 'rejected').length;

            // Update notification badge
            const requestsBadge = document.getElementById('requests-count');
            if (pendingRequests > 0) {
                requestsBadge.textContent = pendingRequests;
                requestsBadge.classList.add('show');
            }

            // Update rejected badge
            const rejectedBadge = document.getElementById('rejected-vendors-count');
            if (rejectedBadge && rejectedRequests > 0) {
                rejectedBadge.textContent = rejectedRequests;
                rejectedBadge.classList.add('show');
            }
        }

        // Fetch quotation submissions (pending)
        const quotationsResponse = await ThreadlyApi.fetch('/admin/quotation-submissions');
        let pendingQuotations = 0;
        if (quotationsResponse.ok) {
            const quotations = await quotationsResponse.json();
            pendingQuotations = quotations.length; // Endpoint returns only pending

            // Update notification badge
            const quotationsBadge = document.getElementById('quotations-count');
            if (pendingQuotations > 0) {
                quotationsBadge.textContent = pendingQuotations;
                quotationsBadge.classList.add('show');
            }
        }

        // Fetch verified vendors (approved, active)
        const verifiedResponse = await ThreadlyApi.fetch('/admin/verified-vendors');
        let verifiedCount = 0;
        if (verifiedResponse.ok) {
            const verified = await verifiedResponse.json();
            verifiedCount = verified.length;
        }

        // Calculate total vendors
        const totalVendors = pendingRequests + verifiedCount;

        // Update stat cards
        document.getElementById('pending-requests-count').textContent = pendingRequests;
        document.getElementById('pending-quotations-count').textContent = pendingQuotations;
        document.getElementById('verified-vendors-count').textContent = verifiedCount;
        document.getElementById('rejected-vendors-stat').textContent = rejectedRequests;
        document.getElementById('total-vendors-count').textContent = totalVendors;

    } catch (error) {
        console.error('Error fetching vendor counts:', error);
        // Set to 0 if error
        document.getElementById('pending-requests-count').textContent = '0';
        document.getElementById('pending-quotations-count').textContent = '0';
        document.getElementById('verified-vendors-count').textContent = '0';
        document.getElementById('total-vendors-count').textContent = '0';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    onScroll();
    window.addEventListener('scroll', onScroll);

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Fetch vendor counts
    fetchVendorCounts();
});
