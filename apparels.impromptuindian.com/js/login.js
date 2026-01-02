lucide.createIcons(); // activate icons

const ThreadlyApi = window.ThreadlyApi || (() => {
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
            // PRODUCTION ONLY - Use production domain
            base = 'https://apparels.impromptuindian.com';
        }
    }

    const buildUrl = (path = '') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

    return {
        baseUrl: base,
        buildUrl,
        fetch: (path, options = {}) => fetch(buildUrl(path), options)
    };
})();
window.ThreadlyApi = ThreadlyApi;

const loginForm = document.getElementById('loginForm');

// --- Custom Alert Logic ---
const customAlert = document.getElementById('customAlert');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');

function showAlert(title, message, type = 'info') {
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    // Set Icon based on type
    if (type === 'success') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center"><i data-lucide="check-circle" class="w-8 h-8 text-green-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-green-500";
    } else if (type === 'error') {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center"><i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-red-500";
    } else {
        alertIcon.innerHTML = '<div class="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center"><i data-lucide="info" class="w-8 h-8 text-blue-500"></i></div>';
        alertTitle.className = "text-lg font-bold mb-2 text-blue-500";
    }

    lucide.createIcons();
    customAlert.classList.remove('hidden');
}

function closeAlert() {
    customAlert.classList.add('hidden');
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
            const response = await ThreadlyApi.fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, password })
            });

            // Try to parse response as JSON, handle HTML error pages gracefully
            let result;
            try {
                // Check if response is ok and has content
                if (!response.ok && response.status >= 500) {
                    showAlert('Server Error', 'The server encountered an error. Please try again later.', 'error');
                    return;
                }
                
                const text = await response.text();
                
                // Check if response is empty
                if (!text || text.trim().length === 0) {
                    showAlert('Server Error', 'Server returned an empty response. Please try again.', 'error');
                    return;
                }
                
                // Check if response is HTML (error page)
                const trimmedText = text.trim();
                if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<?xml')) {
                    console.warn('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                    showAlert('Server Error', 'Unable to reach the login service. Please check if the server is running.', 'error');
                    return;
                }
                
                // Try to parse as JSON
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    // If JSON parsing fails, log the actual response for debugging
                    console.warn('Failed to parse response as JSON. Response:', text.substring(0, 200));
                    showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
                    return;
                }
            } catch (parseError) {
                // If reading response fails, show a helpful error
                console.warn('Failed to read response:', parseError);
                showAlert('Server Error', 'Unable to read server response. Please check your connection and try again.', 'error');
                return;
            }

            if (response.ok) {
                // Store complete user info in localStorage
                localStorage.setItem('user', JSON.stringify(result));
                localStorage.setItem('user_id', result.user_id);
                localStorage.setItem('role', result.role);
                localStorage.setItem('username', result.username);
                localStorage.setItem('email', result.email);
                localStorage.setItem('phone', result.phone);

                showAlert('Success', 'Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 1500);
            } else {
                showAlert('Login Failed', result.error || 'Invalid credentials', 'error');
            }
        } catch (error) {
            console.error('Network Error:', error);
            showAlert('Connection Error', 'Failed to connect to the server. Please check your internet connection.', 'error');
        }
    });
}
