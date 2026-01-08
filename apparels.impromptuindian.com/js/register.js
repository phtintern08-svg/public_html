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

const tabCustomer = document.getElementById("tabCustomer");
const tabVendor = document.getElementById("tabVendor");

const customerForm = document.getElementById("customerForm");
const vendorForm = document.getElementById("vendorForm");

// Track verification status
const verificationStatus = {
    custEmail: false,
    custPhone: false,
    vendEmail: false,
    vendPhone: false
};

// Track timers
const timers = {};

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

// --- Indian Phone Number Validation ---
function validateIndianPhone(phone) {
    // Remove spaces, dashes, and +91 prefix
    const cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '').replace(/^91/, '');
    // Indian mobile: 10 digits, starts with 6, 7, 8, or 9
    const regex = /^[6-9]\d{9}$/;
    return regex.test(cleaned);
}

function checkPhoneValidation(prefix) {
    const phoneInput = document.getElementById(`${prefix}Phone`);
    const phoneValue = phoneInput.value;

    if (phoneValue === '') {
        phoneInput.classList.remove('border-green-500', 'border-red-500');
        return;
    }

    if (validateIndianPhone(phoneValue)) {
        phoneInput.classList.remove('border-red-500');
        phoneInput.classList.add('border-green-500');
    } else {
        phoneInput.classList.remove('border-green-500');
        phoneInput.classList.add('border-red-500');
    }
}

// --- Password Strength Validation ---
function checkPasswordStrength(prefix) {
    const password = document.getElementById(`${prefix}Pass`).value;
    const strengthIndicator = document.getElementById(`${prefix}PasswordStrength`);

    if (!strengthIndicator) return;

    if (password === '') {
        strengthIndicator.classList.add('hidden');
        return;
    }

    strengthIndicator.classList.remove('hidden');

    const conditions = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const lengthEl = document.getElementById(`${prefix}CondLength`);
    const uppercaseEl = document.getElementById(`${prefix}CondUppercase`);
    const lowercaseEl = document.getElementById(`${prefix}CondLowercase`);
    const numberEl = document.getElementById(`${prefix}CondNumber`);
    const specialEl = document.getElementById(`${prefix}CondSpecial`);

    // Update each condition indicator
    updateCondition(lengthEl, conditions.length);
    updateCondition(uppercaseEl, conditions.uppercase);
    updateCondition(lowercaseEl, conditions.lowercase);
    updateCondition(numberEl, conditions.number);
    updateCondition(specialEl, conditions.special);

    // Update password input border
    const passInput = document.getElementById(`${prefix}Pass`);
    const allValid = conditions.length && conditions.uppercase && conditions.lowercase && conditions.number && conditions.special;

    if (allValid) {
        passInput.classList.remove('border-red-500', 'border-yellow-500');
        passInput.classList.add('border-green-500');
    } else if (conditions.length) {
        passInput.classList.remove('border-red-500', 'border-green-500');
        passInput.classList.add('border-yellow-500');
    } else {
        passInput.classList.remove('border-green-500', 'border-yellow-500');
        passInput.classList.add('border-red-500');
    }
}

function updateCondition(element, isValid) {
    if (!element) return;
    if (isValid) {
        element.classList.remove('text-gray-500');
        element.classList.add('text-green-400');
        element.querySelector('.cond-icon').textContent = '✓';
    } else {
        element.classList.remove('text-green-400');
        element.classList.add('text-gray-500');
        element.querySelector('.cond-icon').textContent = '○';
    }
}

function isPasswordValid(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

// --- OTP Input Logic ---
function generateOtpInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ''; // Clear existing

    for (let i = 0; i < 6; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'otp-input';
        input.dataset.index = i;

        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && !/^\d+$/.test(val)) {
                e.target.value = ''; // Only numbers
                return;
            }

            if (val) {
                // Move to next input
                const next = container.querySelector(`input[data-index="${i + 1}"]`);
                if (next) next.focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                // Move to prev input
                const prev = container.querySelector(`input[data-index="${i - 1}"]`);
                if (prev) prev.focus();
            }
        });

        container.appendChild(input);
    }
}

function getOtpValue(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input');
    let otp = '';
    inputs.forEach(input => otp += input.value);
    return otp;
}

// Initialize OTP inputs for all fields
generateOtpInputs('otp-inputs-custEmail');
generateOtpInputs('otp-inputs-custPhone');
generateOtpInputs('otp-inputs-vendEmail');
generateOtpInputs('otp-inputs-vendPhone');


function activateTab(isCustomer) {
    if (isCustomer) {
        tabCustomer.classList.add("bg-[#0f131a]", "text-white");
        tabVendor.classList.remove("bg-[#0f131a]", "text-white");
        tabVendor.classList.add("text-gray-400");

        customerForm.classList.remove("hidden");
        vendorForm.classList.add("hidden");

    } else {
        tabVendor.classList.add("bg-[#0f131a]", "text-white");
        tabCustomer.classList.remove("bg-[#0f131a]", "text-white");
        tabCustomer.classList.add("text-gray-400");

        vendorForm.classList.remove("hidden");
        customerForm.classList.add("hidden");
    }
}

if (tabCustomer && tabVendor) {
    tabCustomer.addEventListener("click", () => activateTab(true));
    tabVendor.addEventListener("click", () => activateTab(false));

    // Check URL parameter for role and auto-select tab
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role === 'vendor') {
        activateTab(false); // false = vendor tab
    } else {
        activateTab(true); // default to customer tab
    }
}

// Initialize Lucide Icons
lucide.createIcons();

// --- OTP Handling ---
async function handleGetOtp(fieldId) {
    const inputField = document.getElementById(fieldId);
    const otpContainer = document.getElementById(`otp-${fieldId}`);
    const getOtpBtn = document.getElementById(`${fieldId}OtpBtn`);
    const timerDiv = document.getElementById(`timer-${fieldId}`);

    if (!inputField.value) {
        showAlert('Missing Info', 'Please enter a value first.', 'error');
        return;
    }

    // Determine type
    const type = fieldId.toLowerCase().includes('email') ? 'email' : 'phone';

    // Phone OTP is disabled - DISABLED
    if (type === 'phone') {
        showAlert('Phone OTP Disabled', 'Phone OTP authentication is currently disabled. Please use email for OTP verification.', 'error');
        getOtpBtn.disabled = false;
        getOtpBtn.innerText = "Get OTP";
        return;
    }

    // Validate email format before sending OTP
    if (type === 'email') {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(inputField.value)) {
            showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
            getOtpBtn.disabled = false;
            getOtpBtn.innerText = "Get OTP";
            return;
        }
    }

    // Validate Indian phone number before sending OTP - DISABLED
    // if (type === 'phone') {
    //     if (!validateIndianPhone(inputField.value)) {
    //         showAlert('Invalid Mobile Number', 'The mobile number you entered is not valid. Please provide a 10-digit mobile number.', 'error');
    //         return;
    //     }
    // }

    // Disable button temporarily
    getOtpBtn.disabled = true;
    getOtpBtn.innerText = "Sending...";

    try {
        const response = await ThreadlyApi.fetch('/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: inputField.value, type: type })
        });

        // Handle response - check for HTML error pages
        let result;
        try {
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the OTP service. Please check if the server is running.', 'error');
                getOtpBtn.disabled = false;
                getOtpBtn.innerText = "Get OTP";
                return;
            }

            // Try to parse as JSON
            result = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            getOtpBtn.disabled = false;
            getOtpBtn.innerText = "Get OTP";
            return;
        }

        if (response.ok) {
            showAlert('OTP Sent', `OTP sent to ${inputField.value}. ${type === 'phone' ? 'Check your phone.' : 'Check your email.'}`, 'success');

            // Show OTP input
            otpContainer.classList.remove('hidden');

            // Start 60 second timer
            startTimer(fieldId, getOtpBtn, timerDiv);

        } else {
            showAlert('Error', 'Error sending OTP: ' + result.error, 'error');
            getOtpBtn.innerText = "Get OTP";
            getOtpBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Connection Error', 'Failed to connect to server.', 'error');
        getOtpBtn.innerText = "Get OTP";
        getOtpBtn.disabled = false;
    }
}

function startTimer(fieldId, button, timerDiv) {
    let timeLeft = 60;

    // Clear any existing timer
    if (timers[fieldId]) {
        clearInterval(timers[fieldId]);
    }

    timerDiv.classList.remove('hidden');
    button.disabled = true;
    button.innerText = "Resend OTP";
    button.classList.remove('bg-[#ffd43b]', 'text-black', 'hover:bg-[#e6be35]');
    button.classList.add('bg-transparent', 'text-[#ffd43b]', 'border', 'border-[#ffd43b]', 'hover:bg-[#ffd43b]', 'hover:text-black', 'opacity-50', 'cursor-not-allowed');

    timers[fieldId] = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `Resend OTP in ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timers[fieldId]);
            button.disabled = false;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
            timerDiv.classList.add('hidden');
        }
    }, 1000);
}

async function verifyOtp(fieldId) {
    const inputField = document.getElementById(fieldId);
    
    // Phone OTP is disabled - DISABLED
    const type = fieldId.toLowerCase().includes('email') ? 'email' : 'phone';
    if (type === 'phone') {
        showAlert('Phone OTP Disabled', 'Phone OTP authentication is currently disabled. Please use email for OTP verification.', 'error');
        return;
    }
    
    const otpContainer = document.getElementById(`otp-${fieldId}`);
    const getOtpBtn = document.getElementById(`${fieldId}OtpBtn`);
    const timerDiv = document.getElementById(`timer-${fieldId}`);
    const verifiedIcon = document.getElementById(`verified-${fieldId}-icon`);

    // Get OTP from the 6 boxes
    const otpValue = getOtpValue(`otp-inputs-${fieldId}`);

    if (otpValue.length !== 6) {
        showAlert('Invalid OTP', 'Please enter the full 6-digit OTP.', 'error');
        return;
    }

    try {
        const response = await ThreadlyApi.fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: inputField.value,
                otp: otpValue
            })
        });

        // Handle response - check for HTML error pages
        let result;
        try {
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the OTP verification service. Please check if the server is running.', 'error');
                return;
            }

            // Try to parse as JSON
            result = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok && result.verified) {
            verificationStatus[fieldId] = true;

            // Hide OTP input container, button, and timer
            otpContainer.classList.add('hidden');
            getOtpBtn.classList.add('hidden');
            timerDiv.classList.add('hidden');

            // Clear any running timer
            if (timers[fieldId]) {
                clearInterval(timers[fieldId]);
            }

            // Show green checkmark icon
            verifiedIcon.classList.remove('hidden');

            // Make input field read-only and add green border
            inputField.readOnly = true;
            inputField.classList.add('border-green-400');

            showAlert('Verified', 'OTP verified successfully!', 'success');
        } else {
            showAlert('Verification Failed', result.error || 'Invalid OTP', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error', 'Failed to verify OTP.', 'error');
    }
}

// --- API Integration ---

async function registerUser(data) {
    try {
        const response = await ThreadlyApi.fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Handle response - check for HTML error pages
        let result;
        try {
            const text = await response.text();

            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON. This usually means the API endpoint is not found or the server is returning an error page.');
                showAlert('Server Error', 'Unable to reach the registration service. Please check if the server is running.', 'error');
                return;
            }

            // Try to parse as JSON
            result = JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, show a more helpful error
            console.error('Failed to parse response as JSON:', parseError);
            showAlert('Server Error', 'Server returned an invalid response. Please try again later.', 'error');
            return;
        }

        if (response.ok) {
            showAlert('Success', 'Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showAlert('Registration Failed', result.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error', 'Failed to connect to the server.', 'error');
    }
}

// --- Password Match Validation ---
function checkPasswordMatch(prefix) {
    const password = document.getElementById(`${prefix}Pass`).value;
    const confirmPassword = document.getElementById(`${prefix}ConfirmPass`).value;
    const matchMessage = document.getElementById(`${prefix}PasswordMatch`);
    const confirmInput = document.getElementById(`${prefix}ConfirmPass`);

    if (confirmPassword === '') {
        matchMessage.classList.add('hidden');
        confirmInput.classList.remove('border-green-500', 'border-red-500');
        return;
    }

    matchMessage.classList.remove('hidden');

    if (password === confirmPassword) {
        matchMessage.textContent = '✓ Passwords match';
        matchMessage.classList.remove('text-red-400');
        matchMessage.classList.add('text-green-400');
        confirmInput.classList.remove('border-red-500');
        confirmInput.classList.add('border-green-500');
    } else {
        matchMessage.textContent = '✗ Passwords do not match';
        matchMessage.classList.remove('text-green-400');
        matchMessage.classList.add('text-red-400');
        confirmInput.classList.remove('border-green-500');
        confirmInput.classList.add('border-red-500');
    }
}

if (customerForm) {
    customerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Check if email is verified (if provided)
        const email = document.getElementById('custEmail').value;
        if (email && !verificationStatus.custEmail) {
            showAlert('Verification Required', 'Please verify your email before registering.', 'error');
            return;
        }

        // Check if phone is verified (if provided)
        const phone = document.getElementById('custPhone').value;
        if (phone && !verificationStatus.custPhone) {
            showAlert('Verification Required', 'Please verify your phone number before registering.', 'error');
            return;
        }

        // Validate Indian phone number format
        if (phone && !validateIndianPhone(phone)) {
            showAlert('Invalid Mobile Number', 'The mobile number you entered is not valid. Please provide a 10-digit Indian mobile number.', 'error');
            return;
        }

        const username = document.getElementById('custName').value;
        const password = document.getElementById('custPass').value;
        const confirmPassword = document.getElementById('custConfirmPass').value;

        // Check password strength
        if (!isPasswordValid(password)) {
            showAlert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.', 'error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            showAlert('Password Mismatch', 'Passwords do not match. Please re-enter.', 'error');
            return;
        }

        registerUser({
            username,
            email,
            password,
            phone,
            role: 'customer'
        });
    });
}

if (vendorForm) {
    vendorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Check if email is verified (if provided)
        const email = document.getElementById('vendEmail').value;
        if (email && !verificationStatus.vendEmail) {
            showAlert('Verification Required', 'Please verify your email before registering.', 'error');
            return;
        }

        // Check if phone is verified (if provided)
        const phone = document.getElementById('vendPhone').value;
        if (phone && !verificationStatus.vendPhone) {
            showAlert('Verification Required', 'Please verify your phone number before registering.', 'error');
            return;
        }

        // Validate Indian phone number format
        if (phone && !validateIndianPhone(phone)) {
            showAlert('Invalid Mobile Number', 'The mobile number you entered is not valid. Please provide a 10-digit Indian mobile number.', 'error');
            return;
        }

        const username = document.getElementById('vendName').value;
        const password = document.getElementById('vendPass').value;
        const confirmPassword = document.getElementById('vendConfirmPass').value;
        const business_name = document.getElementById('vendBusiness').value;

        // Check password strength
        if (!isPasswordValid(password)) {
            showAlert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.', 'error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            showAlert('Password Mismatch', 'Passwords do not match. Please re-enter.', 'error');
            return;
        }

        registerUser({
            username,
            email,
            password,
            phone,
            business_name,
            role: 'vendor'
        });
    });
}
