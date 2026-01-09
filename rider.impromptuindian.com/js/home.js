// Rider Home Page Logic
(function () {
    const user = JSON.parse(localStorage.getItem('user'));
    const riderId = user ? user.user_id : null;
    let locationInterval = null;

    document.addEventListener('DOMContentLoaded', async () => {
        if (!user || user.role !== 'rider') {
            window.location.href = '../login.html';
            return;
        }

        if (window.lucide) {
            lucide.createIcons();
        }

        // Initialize dashboard state
        fetchRiderStatus();
        fetchActiveTasks();

        // Check if previously online
        const wasOnline = localStorage.getItem('rider_is_online') === 'true';
        if (wasOnline) {
            toggleAvailability(true);
        }
    });

    async function fetchRiderStatus() {
        if (!riderId) return;
        try {
            const response = await apiFetch(`${getApiBase()}/rider/status/${riderId}`);
            if (response.ok) {
                const data = await response.json();
                updateDashboardStats(data);

                // syncing UI with backend state
                if (data.is_online) {
                    setOnlineUI(true);
                    startLocationUpdates();
                }
            }
        } catch (e) {
            console.error('Error fetching rider status:', e);
        }
    }

    function updateDashboardStats(data) {
        // Stats mapping
        if (data.stats) {
            document.getElementById('total-assigned').textContent = data.stats.total_assigned || 0;
            document.getElementById('pending-pickup').textContent = data.stats.pending_pickup || 0;
            document.getElementById('out-for-delivery').textContent = data.stats.out_for_delivery || 0;
            document.getElementById('completed-today').textContent = data.stats.completed_today || 0;

            document.getElementById('earnings-today').textContent = '₹' + (data.stats.earnings_today || 0);
            document.getElementById('earnings-week').textContent = '₹' + (data.stats.earnings_week || 0);
            document.getElementById('earnings-month').textContent = '₹' + (data.stats.earnings_month || 0);
            document.getElementById('pending-payout').textContent = '₹' + (data.stats.pending_payout || 0);
        }
    }

    async function toggleAvailability(forceState = null) {
        const toggle = document.getElementById('availabilityToggle');
        if (!toggle) return;

        const currentState = toggle.classList.contains('active');
        const newState = forceState !== null ? forceState : !currentState;

        try {
            // Get current location if going online
            let coords = { lat: null, lon: null };
            if (newState) {
                try {
                    const locService = new LocationService();
                    const locData = await locService.getCurrentLocation();

                    coords = {
                        lat: locData.coords.latitude,
                        lon: locData.coords.longitude
                    };

                    if (locData.address) {
                        showToast(`Location detected: ${locData.address.city || 'Success'}`, 'info');
                    } else {
                        showToast('GPS active, but address look up failed.', 'warning');
                    }

                } catch (geoErr) {
                    console.warn('Geolocation failed:', geoErr);
                    let errMsg = 'Location access is required for automatic assignments.';
                    if (geoErr.message && geoErr.message.includes('denied')) errMsg = 'Location permission denied. Please enable it in your browser settings.';
                    else if (geoErr.message && geoErr.message.includes('timeout')) errMsg = 'Location request timed out. Please check your GPS signal.';

                    showToast(errMsg, 'error');
                }
            }

            const response = await apiFetch(`${getApiBase()}/rider/update-presence`, {
                method: 'POST',
                body: JSON.stringify({
                    rider_id: riderId,
                    is_online: newState,
                    latitude: coords.lat,
                    longitude: coords.lon
                })
            });

            if (response.ok) {
                setOnlineUI(newState);
                localStorage.setItem('rider_is_online', newState);

                if (newState) {
                    startLocationUpdates();
                    showToast('You are now online and ready for orders');
                } else {
                    stopLocationUpdates();
                    showToast('You are now offline');
                }
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (e) {
            console.error('Error toggling availability:', e);
            showToast('Connection error. Please try again.', 'error');
        }
    }

    function setOnlineUI(isOnline) {
        const toggle = document.getElementById('availabilityToggle');
        const statusBadge = document.getElementById('statusBadge');
        const statusText = document.getElementById('statusText');

        if (isOnline) {
            toggle.classList.add('active');
            statusBadge.className = 'status-badge online';
            statusText.textContent = 'Online';
        } else {
            toggle.classList.remove('active');
            statusBadge.className = 'status-badge offline';
            statusText.textContent = 'Offline';
        }
    }

    function startLocationUpdates() {
        if (locationInterval) clearInterval(locationInterval);

        // Update location every 2 minutes
        locationInterval = setInterval(async () => {
            try {
                const coords = await getCurrentLocation();
                await apiFetch(`${getApiBase()}/rider/update-presence`, {
                    method: 'POST',
                    body: JSON.stringify({
                        rider_id: riderId,
                        latitude: coords.lat,
                        longitude: coords.lon
                    })
                });
            } catch (e) {
                console.error('Periodic location update failed:', e);
            }
        }, 120000);
    }

    function stopLocationUpdates() {
        if (locationInterval) {
            clearInterval(locationInterval);
            locationInterval = null;
        }
    }

    function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({ code: 0, message: 'Geolocation not supported' });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                err => reject(err),
                { enableHighAccuracy: true, timeout: 8000 } // Increased timeout to 8s
            );
        });
    }

    async function fetchActiveTasks() {
        const container = document.getElementById('active-tasks-container');
        if (!container || !riderId) return;

        try {
            const response = await apiFetch(`${getApiBase()}/rider/deliveries/assigned?rider_id=${riderId}`, {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                const tasks = data.deliveries || [];
                renderTasks(tasks);
            } else {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">No active delivery tasks</p>';
            }
        } catch (e) {
            console.error('Error fetching tasks:', e);
        }
    }

    function renderTasks(tasks) {
        const container = document.getElementById('active-tasks-container');
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No active tasks. Go online to receive orders!</p>';
            return;
        }

        container.innerHTML = tasks.slice(0, 3).map(task => `
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-3 hover:border-blue-500/50 transition-all">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-semibold text-white">Order #${String(task.order_id).padStart(5, '0')}</h4>
                        <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> 
                            Pickup: ${task.vendor_business_name || 'Vendor'}
                        </p>
                    </div>
                    <span class="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        ${task.status.replace('_', ' ')}
                    </span>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                    <span class="text-xs text-gray-300">Target: ${task.customer_city || 'Near You'}</span>
                    <a href="assigned-deliveries.html" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors">
                        Details <i data-lucide="chevron-right" class="w-3 h-3"></i>
                    </a>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-2xl z-[100] transform transition-all translate-y-10 opacity-0 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        `;
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        }, 100);

        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function getApiBase() {
        return window.THREADLY_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apparels.impromptuindian.com');
    }

    // API fetch helper that automatically adds Authorization header
    function apiFetch(url, options = {}) {
        const token = localStorage.getItem("token");
        
        // Merge headers
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };
        
        // Add Authorization header if token exists
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        
        return fetch(url, {
            ...options,
            headers: headers
        });
    }

    function refreshDashboard() {
        const btn = document.querySelector('.btn-refresh-modern');
        const icon = btn.querySelector('i');
        icon.classList.add('animate-spin');

        fetchRiderStatus();
        fetchActiveTasks();

        setTimeout(() => icon.classList.remove('animate-spin'), 1000);
    }

    // Exports
    window.toggleAvailability = toggleAvailability;
    window.refreshDashboard = refreshDashboard;
})();
