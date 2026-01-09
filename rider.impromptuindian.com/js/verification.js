// Rider Verification Page JavaScript
lucide.createIcons();

/* ---------------------------
   DOCUMENT TYPES
---------------------------*/
const REQUIRED_DOCUMENTS = [
    { id: 'aadhar', label: 'Aadhar Card', icon: 'id-card', required: true, extraFields: [{ name: 'aadhar_number', placeholder: 'Enter Aadhar Number' }] },
    { id: 'pan', label: 'PAN Card', icon: 'credit-card', required: true, extraFields: [{ name: 'pan_number', placeholder: 'Enter PAN Number' }] },
    {
        id: 'dl', label: 'Driving License', icon: 'car', required: true,
        extraFields: [
            { name: 'dl_number', placeholder: 'DL Number', width: 'full' },
            { name: 'dl_name', placeholder: 'Name on DL', width: 'full' },
            { name: 'dl_validity', placeholder: 'Valid Upto (YYYY-MM-DD)', type: 'date', width: 'full' }
        ]
    },
    { id: 'vehicle_rc', label: 'Vehicle RC', icon: 'file-text', required: true, extraFields: [{ name: 'vehicle_rc_number', placeholder: 'Enter RC Number' }] },
    { id: 'insurance', label: 'Vehicle Insurance', icon: 'shield', required: true, extraFields: [{ name: 'insurance_policy_number', placeholder: 'Enter Policy Number' }] },
    {
        id: 'bank', label: 'Bank Details', icon: 'landmark', required: true,
        extraFields: [
            { name: 'bank_account_number', placeholder: 'Account Number', width: 'full' },
            { name: 'bank_holder_name', placeholder: 'Account Holder Name', width: 'full' },
            { name: 'bank_branch', placeholder: 'Branch Name', width: 'half' },
            { name: 'ifsc_code', placeholder: 'IFSC Code', width: 'half' }
        ]
    },
    { id: 'photo', label: 'Profile Photo', icon: 'user', required: true }
];

/* ---------------------------
   STATE
---------------------------*/
let verificationStatus = 'pending_verification'; // Default
let documents = {};
let currentDocumentId = null;
let selectedFile = null;
// Use token-based authentication (backend controls roles)
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login.html";
}

// Load user data from individual localStorage items
const user = {
    user_id: localStorage.getItem("user_id"),
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email")
};

const riderId = user.user_id;

/* ---------------------------
   API FUNCTIONS
---------------------------*/
async function fetchVerificationStatus() {
    if (!riderId) return;
    try {
        const response = await ThreadlyApi.fetch(`/rider/verification/status/${riderId}`);
        if (response.ok) {
            const data = await response.json();

            // Map backend status to UI status
            const rawStatus = (data.status || '').toLowerCase();
            if (['approved', 'active'].includes(rawStatus)) verificationStatus = 'active';
            else if (['rejected'].includes(rawStatus)) verificationStatus = 'rejected';
            else if (['pending', 'under-review', 'verification_submitted'].includes(rawStatus)) verificationStatus = 'verification_submitted';
            else verificationStatus = 'pending_verification';

            // Populate documents from backend
            const backendDocs = data.documents || {};
            REQUIRED_DOCUMENTS.forEach(doc => {
                const bDoc = backendDocs[doc.id];
                documents[doc.id] = {
                    status: bDoc ? (bDoc.status === 'uploaded' ? 'selected' : bDoc.status) : 'pending',
                    fileName: bDoc ? bDoc.fileName : null,
                    file: null, // We don't have the file object for pre-filled data, only filename
                    ...bDoc // Load any other properties like manual fields if they exist in bDoc
                };

                // If status is 'uploaded' in backend, treat as 'selected'/'uploaded' in UI
                if (documents[doc.id].status === 'uploaded') documents[doc.id].status = 'selected';
            });

            renderStatusBanner();
            renderTimeline();
            renderDocumentsGrid();

            // Check if user is already active/submitted
            if (['verification_submitted', 'active'].includes(verificationStatus)) {
                document.getElementById('submit-section').style.display = 'none';
                disableForm();
            }
        }
    } catch (e) {
        console.error('Error fetching status:', e);
        showAlert('Error', 'Failed to fetch verification status', 'error');
    }
}

function disableForm() {
    const form = document.getElementById('vehicle-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => input.disabled = true);
        form.classList.add('opacity-75', 'pointer-events-none');
    }
}

/* ---------------------------
   RENDER STATUS BANNER
---------------------------*/
function renderStatusBanner() {
    const banner = document.getElementById('status-banner');
    if (!banner) return;

    let bannerHTML = '';

    switch (verificationStatus) {
        case 'pending_verification':
            bannerHTML = `
        <div class="status-banner status-warning">
            <i data-lucide="alert-circle" class="w-6 h-6"></i>
            <div class="flex-1">
                <h4 class="status-title">Verification Not Submitted</h4>
                <p class="status-description">Upload all required documents and submit for verification to start receiving orders.</p>
            </div>
        </div>
    `;
            break;
        case 'verification_submitted':
            bannerHTML = `
        <div class="status-banner status-info">
            <i data-lucide="clock" class="w-6 h-6"></i>
            <div class="flex-1">
                <h4 class="status-title">Verification Pending</h4>
                <p class="status-description">Your documents have been submitted. Waiting for admin review.</p>
            </div>
        </div>
    `;
            break;
        case 'active':
            bannerHTML = `
        <div class="status-banner status-success">
            <i data-lucide="check-circle-2" class="w-6 h-6"></i>
            <div class="flex-1">
                <h4 class="status-title">Verification Approved!</h4>
                <p class="status-description">Congratulations! Your rider account is verified. You can now accept deliveries.</p>
            </div>
        </div>
    `;
            break;
        case 'suspended':
            bannerHTML = `
        <div class="status-banner status-error">
            <i data-lucide="x-circle" class="w-6 h-6"></i>
            <div class="flex-1">
                <h4 class="status-title">Account Suspended</h4>
                <p class="status-description">Your account has been suspended. Please contact support.</p>
            </div>
        </div>
    `;
            break;
        case 'rejected':
            bannerHTML = `
        <div class="status-banner status-error">
            <i data-lucide="x-circle" class="w-6 h-6"></i>
            <div class="flex-1">
                <h4 class="status-title">Verification Rejected</h4>
                <p class="status-description">Your verification was rejected. Please review feedback and re-submit.</p>
            </div>
        </div>
    `;
            break;
    }

    banner.innerHTML = bannerHTML;
    lucide.createIcons();
}

/* ---------------------------
   RENDER TIMELINE
---------------------------*/
function renderTimeline() {
    const timeline = document.getElementById('verification-timeline');
    if (!timeline) return;

    const isRejected = (verificationStatus === 'rejected');

    const steps = [
        { id: 'submit', label: 'Documents Submitted', status: getStepStatus('submit') },
        { id: 'review', label: 'Under Review', status: getStepStatus('review') },
        {
            id: 'outcome',
            label: isRejected ? 'Rejected' : 'Approved',
            status: getStepStatus('outcome')
        }
    ];

    const html = steps.map((step, index) => `
<div class="timeline-item ${step.status}">
<div class="timeline-marker">
    ${(step.status === 'completed' || step.status === 'rejected') ?
            (step.status === 'rejected' ? '<i data-lucide="x" class="w-4 h-4"></i>' : '<i data-lucide="check" class="w-4 h-4"></i>') :
            step.status === 'current' ? '<div class="timeline-pulse"></div>' :
                '<div class="timeline-dot"></div>'}
</div>
<div class="timeline-content">
    <p class="timeline-label">${step.label}</p>
</div>
${index < steps.length - 1 ? '<div class="timeline-line"></div>' : ''}
</div>
`).join('');

    timeline.innerHTML = html;
    lucide.createIcons();
}

function getStepStatus(stepId) {
    // If we are pending initial verification (not submitted), everything is pending except maybe first? 
    // Actually submit is pending too.
    if (verificationStatus === 'pending_verification') return 'pending';

    // If Active (Approved)
    if (verificationStatus === 'active') return 'completed';

    // If Rejected
    if (verificationStatus === 'rejected') {
        if (stepId === 'submit') return 'completed';
        if (stepId === 'review') return 'completed';
        if (stepId === 'outcome') return 'rejected';
        return 'pending';
    }

    // If Verification Submitted (Under Review)
    if (verificationStatus === 'verification_submitted') {
        if (stepId === 'submit') return 'completed';
        if (stepId === 'review') return 'current';
        return 'pending';
    }

    return 'pending';
}

/* ---------------------------
   RENDER DOCUMENTS GRID
---------------------------*/
function renderDocumentsGrid() {
    const grid = document.getElementById('documents-grid');
    if (!grid) return;

    const html = REQUIRED_DOCUMENTS.map(docType => {
        const doc = documents[docType.id] || { status: 'pending' };
        // Status mapping and logic
        let displayStatus = doc.status;
        if (displayStatus === 'uploaded') displayStatus = 'selected';

        const statusIcon = getStatusIcon(displayStatus);
        const statusLabel = getStatusLabel(displayStatus);
        const statusClass = displayStatus;
        const isRejectedGlobal = verificationStatus === 'rejected';
        const isPendingGlobal = verificationStatus === 'pending_verification';
        let canUpload = isPendingGlobal;

        if (isRejectedGlobal) {
            // Only allow upload if specific doc is rejected or never uploaded (pending)
            // If approved or uploaded(but not rejected yet? logic says rejected global implies some are rejected), lock it
            canUpload = (doc.status === 'rejected' || doc.status === 'pending' || !doc.status);
        }

        // Render extra inputs
        let extraInputsHtml = '';
        if (docType.extraFields) {
            extraInputsHtml = docType.extraFields.map(field => {
                const val = doc[field.name] || '';
                const isUploaded = (doc.status === 'uploaded' || doc.status === 'selected' || doc.status === 'approved');

                // If rejected, we might need to edit extra fields too!
                const isRejected = (doc.status === 'rejected');
                const shouldHide = isUploaded && !isRejected; // Hide if uploaded/approved and NOT rejected. If rejected, show.

                const displayStyle = shouldHide ? 'display: none !important;' : 'display: block !important;';

                const disabled = !canUpload ? 'disabled' : '';
                return `
                    <div class="mt-2" style="${displayStyle}">
                        <label class="text-xs text-gray-400 block mb-1">${field.placeholder}</label>
                        <input type="text" 
                               id="input-${docType.id}-${field.name}" 
                               class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                               style="${displayStyle}"
                               placeholder="${field.placeholder}"
                               value="${val}"
                               oninput="window.updateExtraField('${docType.id}', '${field.name}', this.value)"
                               ${disabled}
                        >
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="document-card ${statusClass}">
                <div class="document-header">
                    <div class="document-icon">
                        <i data-lucide="${docType.icon}" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="document-title">${docType.label}</h4>
                        ${docType.required ? '<span class="required-badge">Required</span>' : '<span class="optional-badge">Optional</span>'}
                    </div>
                </div>
                <div class="document-body">
                    <div class="document-status ${statusClass}">
                        <i data-lucide="${statusIcon}" class="w-4 h-4"></i>
                        <span>${statusLabel}</span>
                    </div>
                    
                    ${doc.status === 'rejected' && doc.remarks ? `
                        <div class="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                            <strong>Rejection Reason:</strong> ${doc.remarks}
                        </div>
                    ` : ''}

                    ${doc.fileName ? `
                        <div class="document-file">
                            <i data-lucide="file" class="w-4 h-4 text-gray-400"></i>
                            <span class="file-name">${doc.fileName}</span>
                            ${canUpload ? `
                                <button class="btn-remove-icon ml-auto text-red-400 hover:text-red-300" onclick="removeDocument('${docType.id}')" title="Remove File">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${extraInputsHtml}
                </div>
                <div class="document-actions">
                    ${canUpload ? `
                        <button class="btn-upload" onclick="openUploadModal('${docType.id}')">
                            <i data-lucide="upload" class="w-4 h-4"></i>
                            ${(doc.status === 'selected' || doc.status === 'uploaded' || doc.status === 'rejected') ? 'Change File' : 'Upload'}
                        </button>
                    ` : `
                       ${doc.fileName ? `<button class="btn-upload opacity-50 cursor-not-allowed">
                            <i data-lucide="check-circle" class="w-4 h-4"></i> Submitted
                        </button>` : ''}
                    `}
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = html;
    lucide.createIcons();
}

function getStatusIcon(status) {
    const icons = {
        'pending': 'circle',
        'uploaded': 'check-circle',
        'selected': 'check-circle',
        'under-review': 'clock',
        'approved': 'check-circle',
        'rejected': 'x-circle'
    };
    return icons[status] || 'circle';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pending Upload',
        'uploaded': 'Uploaded',
        'selected': 'Ready to Submit',
        'under-review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected'
    };
    return labels[status] || 'Pending';
}

/* ---------------------------
   UPLOAD MODAL
---------------------------*/
function openUploadModal(docId) {
    const docType = REQUIRED_DOCUMENTS.find(d => d.id === docId);

    // Validate manual fields
    let missingFields = [];
    if (docType && docType.extraFields) {
        docType.extraFields.forEach(field => {
            const inputId = `input-${docId}-${field.name}`;
            const el = document.getElementById(inputId);

            let val = '';
            if (el) val = el.value.trim();
            // Check state backup
            if (!val && documents[docId] && documents[docId][field.name]) {
                val = documents[docId][field.name];
            }

            if (!val) {
                missingFields.push(field.placeholder);
            }
        });
    }

    if (missingFields.length > 0) {
        showAlert('Alert', `Please enter ${missingFields.join(', ')} before uploading`, 'error');
        return;
    }

    currentDocumentId = docId;
    selectedFile = null;

    // const docType = REQUIRED_DOCUMENTS.find(d => d.id === docId); // Already declared above
    const modal = document.getElementById('upload-modal');
    const modalTitle = document.getElementById('modal-doc-title');
    const filePreview = document.getElementById('file-preview');

    modalTitle.textContent = `Upload ${docType.label}`;
    filePreview.classList.add('hidden');
    filePreview.innerHTML = '';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Setup file input
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');

    fileInput.value = ''; // Reset input
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);

    uploadArea.onclick = () => fileInput.click();

    // Drag and drop
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    };
    uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFileSelect(e.dataTransfer.files[0]);
    };
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentDocumentId = null;
    selectedFile = null;
}

function handleFileSelect(file) {
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Error', 'File size must be less than 5MB', 'error');
        return;
    }

    selectedFile = file;
    const filePreview = document.getElementById('file-preview');

    filePreview.innerHTML = `
<div class="preview-item flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
    <i data-lucide="file-check" class="w-8 h-8 text-green-500"></i>
    <div class="flex-1">
        <p class="preview-filename font-medium">${file.name}</p>
        <p class="preview-filesize text-sm text-gray-400">${(file.size / 1024).toFixed(1)} KB</p>
    </div>
</div>
`;
    filePreview.classList.remove('hidden');
    lucide.createIcons();
}

/* ---------------------------
   STATE MANAGEMENT HACK
---------------------------*/
window.updateExtraField = function (docId, fieldName, value) {
    if (!documents[docId]) documents[docId] = { status: 'pending' };
    documents[docId][fieldName] = value;
};

async function confirmUpload() {
    if (!selectedFile || !currentDocumentId || !riderId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('rider_id', riderId);
    formData.append('doc_type', currentDocumentId);

    // Append manual fields
    const docDef = REQUIRED_DOCUMENTS.find(d => d.id === currentDocumentId);
    if (docDef && docDef.extraFields) {
        docDef.extraFields.forEach(field => {
            const inputId = `input-${currentDocumentId}-${field.name}`;
            const el = document.getElementById(inputId);
            let val = '';
            if (el) val = el.value.trim();
            if (!val && documents[currentDocumentId] && documents[currentDocumentId][field.name]) {
                val = documents[currentDocumentId][field.name];
            }
            if (val) {
                formData.append(field.name, val);
            }
        });
    }

    try {
        const response = await ThreadlyApi.fetch('/rider/verification/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            // Update state
            documents[currentDocumentId] = {
                ...documents[currentDocumentId],
                status: 'uploaded',
                fileName: selectedFile.name,
                fileUrl: data.fileUrl,
                // We no longer need to store the raw file or manually resend it on submit
                // But we keep manual fields in state visually if needed
                file: null
            };

            // Read back manual fields into state to ensure persistence in UI
            if (docDef && docDef.extraFields) {
                docDef.extraFields.forEach(field => {
                    const inputId = `input-${currentDocumentId}-${field.name}`;
                    const el = document.getElementById(inputId);
                    if (el) documents[currentDocumentId][field.name] = el.value.trim();
                });
            }

            renderDocumentsGrid();
            showAlert('Success', 'Document uploaded successfully', 'success');
            closeUploadModal();
        } else {
            const err = await response.json();
            showAlert('Error', err.error || 'Upload failed', 'error');
        }
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Upload failed', 'error');
    }
}

function removeDocument(docId) {
    if (!confirm('Are you sure you want to remove this file?')) return;

    documents[docId] = {
        ...documents[docId], // Preserves manual inputs
        status: 'pending',
        fileName: null,
        file: null
    };

    renderDocumentsGrid();
}

/* ---------------------------
   SUBMIT VERIFICATION
---------------------------*/
async function submitVerification() {
    // 1. Check if all required documents are selected or already uploaded from backend
    const missingDocs = REQUIRED_DOCUMENTS.filter(doc => {
        if (!doc.required) return false;
        const currentDoc = documents[doc.id];
        if (!currentDoc || (currentDoc.status === 'pending' && !currentDoc.file)) return true;
        return false;
    });

    if (missingDocs.length > 0) {
        showAlert('Error', `Please upload all required documents (${missingDocs.length} missing)`, 'error');
        return;
    }

    // Validate Extra Fields and Collect Data
    let missingExtras = [];
    let extraData = {};

    REQUIRED_DOCUMENTS.forEach(doc => {
        if (doc.extraFields) {
            doc.extraFields.forEach(field => {
                const inputId = `input-${doc.id}-${field.name}`;
                const el = document.getElementById(inputId);
                if (el) {
                    const val = el.value.trim();
                    if (val) {
                        extraData[field.name] = val;
                    } else if (documents[doc.id] && documents[doc.id][field.name]) {
                        // Fallback to state if input value is empty (might happen if display:none messes with value? usually not, but safe check)
                        extraData[field.name] = documents[doc.id][field.name];
                    } else {
                        missingExtras.push(`${doc.label}: ${field.placeholder}`);
                    }
                } else if (documents[doc.id] && documents[doc.id][field.name]) {
                    // Fallback to state if element is missing from DOM
                    extraData[field.name] = documents[doc.id][field.name];
                } else {
                    missingExtras.push(`${doc.label}: ${field.placeholder}`);
                }
            });
        }
    });

    if (missingExtras.length > 0) {
        showAlert('Error', `Please fill in details for: ${missingExtras.join(', ')}`, 'error');
        return;
    }

    // 2. Validate Vehicle Form
    const vehicleType = document.getElementById('vehicle_type').value;
    const vehicleNumber = document.getElementById('vehicle_number').value;
    const serviceZone = document.getElementById('service_zone').value;

    if (!vehicleType || !vehicleNumber || !serviceZone) {
        showAlert('Error', 'Please fill in all vehicle details', 'error');
        return;
    }

    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Processing...';

    try {
        // 3. Upload Document Files (Iteratively)
        const uploadPromises = Object.keys(documents).map(async (docType) => {
            const doc = documents[docType];
            if (doc.file) { // Only upload if there is a new file
                const formData = new FormData();
                formData.append('rider_id', riderId);
                formData.append('doc_type', docType);
                formData.append('file', doc.file);

                // Append manual fields to upload request to save them immediately
                // We access the `extraData` object which was collected earlier in step 2 of this function
                // But we don't have access to the specific fields for this docType easily unless we look them up
                // Or we can just check `extraData` for fields associated with this docType.

                // Better approach:
                const docDef = REQUIRED_DOCUMENTS.find(d => d.id === docType);
                if (docDef && docDef.extraFields) {
                    docDef.extraFields.forEach(field => {
                        const val = extraData[field.name];
                        if (val) {
                            formData.append(field.name, val);
                        }
                    });
                }

                const resp = await ThreadlyApi.fetch('/rider/verification/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!resp.ok) {
                    throw new Error(`Failed to upload ${docType}`);
                }
            }
        });

        await Promise.all(uploadPromises);

        // 4. Update Vehicle Details 
        const vehicleData = new FormData();
        vehicleData.append('rider_id', riderId);
        vehicleData.append('vehicle_type', vehicleType);
        vehicleData.append('vehicle_number', vehicleNumber);
        vehicleData.append('service_zone', serviceZone);

        await ThreadlyApi.fetch('/rider/update-vehicle', {
            method: 'POST',
            body: vehicleData
        });

        // 5. Final Submit to Change Status
        const submitResp = await ThreadlyApi.fetch('/rider/verification/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rider_id: riderId, ...extraData })
        });

        if (submitResp.ok) {
            showAlert('Success', 'Verification submitted successfully!', 'success');

            // Update local status
            verificationStatus = 'verification_submitted';
            renderStatusBanner();
            renderTimeline();
            renderDocumentsGrid();
            document.getElementById('submit-section').style.display = 'none';
            disableForm();
        } else {
            throw new Error('Submission failed');
        }

    } catch (error) {
        console.error('Error submitting verification:', error);
        showAlert('Error', 'Submission failed. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/* ---------------------------
   INITIALIZATION
---------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    fetchVerificationStatus();
    setupCustomDropdowns();

    // Reveal animation
    const revealEls = document.querySelectorAll(".reveal");
    function revealOnScroll() {
        const trigger = window.innerHeight * 0.9;
        revealEls.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < trigger) el.classList.add("show");
        });
    }

    setTimeout(revealOnScroll, 100);
    window.addEventListener("scroll", revealOnScroll);

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUploadModal();
            closeAlert();
        }
    });
});

/* ---------------------------
   CUSTOM DROPDOWN LOGIC
---------------------------*/
function setupCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-select');

    dropdowns.forEach(dropdown => {
        const select = dropdown.querySelector('select');
        const trigger = dropdown.querySelector('.trigger');
        const triggerValue = trigger.querySelector('.value');
        const panel = dropdown.querySelector('.panel');

        // Populate panel options
        Array.from(select.options).forEach(opt => {
            // Skip placeholder/empty value options in the list
            if (opt.value === "") return;

            const div = document.createElement('div');
            div.className = 'option' + (opt.selected ? ' selected' : '');
            div.textContent = opt.textContent;
            div.dataset.value = opt.value;

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update select
                select.value = opt.value;
                select.dispatchEvent(new Event('change')); // Trigger change event if needed

                // Update trigger
                triggerValue.textContent = opt.textContent;

                // Update UI state
                panel.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                div.classList.add('selected');

                closeAllDropdowns();
            });

            panel.appendChild(div);
        });

        // Toggle panel
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !panel.classList.contains('hidden');
            closeAllDropdowns(); // Close others
            if (!isOpen) {
                panel.classList.remove('hidden');
            }
        });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        closeAllDropdowns();
    });

    function closeAllDropdowns() {
        document.querySelectorAll('.custom-select .panel').forEach(p => p.classList.add('hidden'));
    }
}
