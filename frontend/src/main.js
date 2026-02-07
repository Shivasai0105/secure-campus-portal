const HOST = window.location.hostname || "localhost";
const API_URL = `http://${HOST}:5000/api`;
let csrfToken = null;
let currentUser = null;

// --- DOM Elements ---
// loginSection removed
const dashboardSection = document.getElementById("dashboard-section");
// loginForm removed
// loginError removed
const logoutBtn = document.getElementById("logout-btn");

// --- Utility Functions ---

async function fetchCsrfToken() {
    try {
        const res = await fetch(`${API_URL}/csrf-token`, { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            csrfToken = data.csrfToken;
            console.log("CSRF Token fetched");
        }
    } catch (err) {
        console.error("Failed to fetch CSRF token", err);
    }
}

async function apiCall(endpoint, method = "GET", body = null) {
    // Ensure we have a token for state-changing requests
    if (["POST", "PUT", "DELETE"].includes(method) && !csrfToken) {
        await fetchCsrfToken();
    }

    const headers = {
        "Content-Type": "application/json"
    };

    // Add CSRF token if available
    if (csrfToken) {
        headers["_csrf"] = csrfToken;
    }

    const options = {
        method,
        headers,
        credentials: "include" // Important for Session Cookie
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    // Refresh token if invalid? (Basic retry logic could go here)
    if (response.status === 403) {
        // Token might be stale
        await fetchCsrfToken();
    }

    return response;
}

function showSection(sectionId) {
    document.querySelectorAll("main > div").forEach(el => el.classList.add("hidden"));
    if (sectionId) document.getElementById(sectionId).classList.remove("hidden");
}

function updateUI(user) {
    if (user) {
        dashboardSection.classList.remove("hidden");
        document.getElementById("user-name").textContent = user.name;
        document.getElementById("user-role").textContent = user.role;

        // Show Role Specific View
        document.querySelectorAll(".role-view").forEach(el => el.classList.add("hidden"));
        if (user.role === "student") {
            document.getElementById("student-view").classList.remove("hidden");
            loadStudentData();
        } else if (user.role === "faculty") {
            document.getElementById("faculty-view").classList.remove("hidden");
            loadFacultyData();
        } else if (user.role === "admin") {
            document.getElementById("admin-view").classList.remove("hidden");
            loadAdminData();
        }
    } else {
        window.location.href = 'login.html';
    }
}

// --- Auth Flow ---

// --- Auth Flow ---

async function checkSession() {
    try {
        await fetchCsrfToken();
        const res = await apiCall("/auth/me");
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;

            // Redirect students to dedicated dashboard
            if (currentUser.role === 'student' && !window.location.pathname.includes('student-dashboard.html')) {
                window.location.href = 'student-dashboard.html';
                return;
            }

            updateUI(currentUser);
        } else {
            // Redirect to login page if no session
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error(error);
        window.location.href = 'login.html';
    }
}

// Login form logic moved to login.html/login-script.js

logoutBtn.addEventListener("click", async () => {
    await apiCall("/auth/logout", "POST");
    currentUser = null;
    window.location.href = 'login.html';
});

// --- Role Specific Logic (Simplified for MVP) ---

async function loadStudentData() {
    // Notices
    const noticesRes = await apiCall("/student/notices");
    if (noticesRes.ok) {
        const { notices } = await noticesRes.json();
        const noticesList = document.getElementById("notices-list");
        if (notices.length === 0) {
            noticesList.innerHTML = "<p class='text-gray-500 text-sm'>No notices available.</p>";
        } else {
            noticesList.innerHTML = notices.map(notice => `
                <div class="border-l-4 border-purple-500 bg-purple-50 p-3 rounded">
                    <h4 class="font-bold text-purple-900">${notice.title}</h4>
                    <p class="text-sm text-gray-700 mt-1">${notice.body}</p>
                    <p class="text-xs text-gray-500 mt-2">${new Date(notice.createdAt).toLocaleDateString()}</p>
                </div>
            `).join("");
        }
    }

    // receipts
    const res = await apiCall("/student/receipts");
    if (res.ok) {
        const { receipts } = await res.json();
        const list = document.getElementById("receipts-list");
        list.innerHTML = receipts.map(r =>
            `<li class="border p-2 rounded flex justify-between">
                <span>Ref: ${r._id.substr(-6)}</span>
                <span class="font-bold">₹${r.amount}</span>
            </li>`
        ).join("");
    }

    // Bonafide History
    const historyRes = await apiCall("/student/bonafide-requests");
    if (historyRes.ok) {
        const { requests } = await historyRes.json();
        const historyList = document.getElementById("bonafide-history");
        if (historyList) {
            if (requests.length === 0) {
                historyList.innerHTML = "<li class='text-gray-500'>No history found.</li>";
            } else {
                historyList.innerHTML = requests.map(req => `
                     <li class="border p-2 rounded flex justify-between items-center bg-gray-50">
                         <span>${req.reason.substring(0, 30)}${req.reason.length > 30 ? '...' : ''}</span>
                         <span class="text-xs px-2 py-1 rounded ${req.status === 'approved' ? 'bg-green-100 text-green-800' : req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${req.status.toUpperCase()}</span>
                     </li>
                 `).join("");
            }
        }
    }
}

async function loadFacultyData() {
    const res = await apiCall("/faculty/bonafide-requests");
    if (res.ok) {
        const { requests } = await res.json();
        const container = document.getElementById("pending-bonafide-list");
        if (requests.length === 0) {
            container.innerHTML = "<p class='text-gray-500'>No pending requests.</p>";
            return;
        }
        container.innerHTML = requests.map(req => `
            <div class="border p-4 rounded bg-gray-50">
                <p class="font-semibold">${req.studentId.name} (${req.studentId.email})</p>
                <p class="text-gray-700 italic">"${req.reason}"</p>
                <div class="mt-2 space-x-2">
                    <button onclick="reviewBonafide('${req._id}', 'approve')" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Approve</button>
                    <button onclick="reviewBonafide('${req._id}', 'reject')" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Reject</button>
                </div>
            </div>
        `).join("");
    }
}

window.reviewBonafide = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    const res = await apiCall(`/faculty/bonafide-requests/${id}/review`, "POST", { action });
    if (res.ok) {
        loadFacultyData();
    } else {
        alert("Failed to review");
    }
};

async function loadAdminData() {
    // Load pending requests
    await loadAdminPendingRequests();

    // Load flagged requests
    await loadAdminFlaggedRequests();

    // Load audit logs
    const res = await apiCall("/admin/audit-logs");
    if (res.ok) {
        const { logs } = await res.json();
        const tbody = document.getElementById("audit-logs-list");
        tbody.innerHTML = logs.map(log => `
            <tr class="border-b">
                <td class="p-2 text-gray-500">${new Date(log.createdAt).toLocaleTimeString()}</td>
                <td class="p-2 font-mono text-xs">${log.userId} (${log.role})</td>
                <td class="p-2 font-semibold text-blue-700">${log.action}</td>
                <td class="p-2 text-gray-500 text-xs">${log.ip}</td>
            </tr>
         `).join("");
    }
}

// Admin bonafide request management
async function loadAdminPendingRequests() {
    const res = await apiCall("/admin/bonafide-requests");
    if (res.ok) {
        const { requests } = await res.json();
        const container = document.getElementById("admin-pending-requests");
        if (requests.length === 0) {
            container.innerHTML = "<p class='text-gray-500'>No pending requests.</p>";
            return;
        }
        container.innerHTML = requests.map(req => `
            <div class="border p-4 rounded bg-gray-50">
                <div class="flex items-start gap-3">
                    <input type="checkbox" class="admin-request-checkbox mt-1" data-id="${req._id}">
                    <div class="flex-1">
                        <p class="font-semibold">${req.studentId.name} (${req.studentId.email})</p>
                        <p class="text-gray-700 italic">"${req.reason}"</p>
                        <p class="text-xs text-gray-500 mt-1">${new Date(req.createdAt).toLocaleDateString()}</p>
                        <div class="mt-2 space-x-2">
                            <button onclick="adminReviewRequest('${req._id}', 'approve')" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Approve</button>
                            <button onclick="adminReviewRequest('${req._id}', 'reject')" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Reject</button>
                            <button onclick="adminFlagRequest('${req._id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Flag</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");
    }
}

async function loadAdminFlaggedRequests() {
    const res = await apiCall("/admin/bonafide-requests/flagged");
    if (res.ok) {
        const { requests } = await res.json();
        const container = document.getElementById("admin-flagged-requests");
        if (requests.length === 0) {
            container.innerHTML = "<p class='text-gray-500'>No flagged requests.</p>";
            return;
        }
        container.innerHTML = requests.map(req => `
            <div class="border-l-4 border-yellow-500 p-4 rounded bg-yellow-50">
                <p class="font-semibold">${req.studentId.name} (${req.studentId.email})</p>
                <p class="text-gray-700 italic">"${req.reason}"</p>
                <p class="text-sm text-yellow-800 mt-1">Flag reason: ${req.flaggedReason || 'N/A'}</p>
                <p class="text-xs text-gray-500">Status: ${req.status}</p>
                <div class="mt-2 space-x-2">
                    ${req.status === 'pending' ? `
                        <button onclick="adminReviewRequest('${req._id}', 'approve')" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Approve</button>
                        <button onclick="adminReviewRequest('${req._id}', 'reject')" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Reject</button>
                    ` : ''}
                    <button onclick="adminUnflagRequest('${req._id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-sm">Unflag</button>
                </div>
            </div>
        `).join("");
    }
}

window.adminReviewRequest = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    const res = await apiCall(`/admin/bonafide-requests/${id}/review`, "POST", { action });
    if (res.ok) {
        alert(`Request ${action}ed successfully`);
        await loadAdminPendingRequests();
        await loadAdminFlaggedRequests();
    } else {
        alert("Failed to review request");
    }
};

window.adminFlagRequest = async (id) => {
    const reason = prompt("Enter reason for flagging:");
    if (!reason) return;
    const res = await apiCall(`/admin/bonafide-requests/${id}/flag`, "POST", { reason });
    if (res.ok) {
        alert("Request flagged successfully");
        await loadAdminPendingRequests();
        await loadAdminFlaggedRequests();
    } else {
        alert("Failed to flag request");
    }
};

window.adminUnflagRequest = async (id) => {
    const res = await apiCall(`/admin/bonafide-requests/${id}/flag`, "POST", {});
    if (res.ok) {
        alert("Request unflagged successfully");
        await loadAdminFlaggedRequests();
    } else {
        alert("Failed to unflag request");
    }
};

// Student forms
document.getElementById("bonafide-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reason = document.getElementById("bonafide-reason").value;
    const res = await apiCall("/student/bonafide-requests", "POST", { reason });
    if (res.ok) {
        alert("Request submitted");
        document.getElementById("bonafide-reason").value = "";
    } else {
        alert("Failed");
    }
});

// Admin forms
document.getElementById("create-user-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("new-user-name").value;
    const email = document.getElementById("new-user-email").value;
    const password = document.getElementById("new-user-password").value;
    const role = document.getElementById("new-user-role").value;

    const res = await apiCall("/admin/users", "POST", { name, email, password, role });
    if (res.ok) {
        alert("User created successfully");
        document.getElementById("create-user-form").reset();
    } else {
        const data = await res.json();
        alert("Error: " + data.message);
    }
});

// Admin Notices
document.getElementById("create-notice-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("notice-title").value;
    const body = document.getElementById("notice-body").value;

    const res = await apiCall("/admin/notices", "POST", { title, body });
    if (res.ok) {
        alert("Notice published successfully!");
        document.getElementById("create-notice-form").reset();
    } else {
        const data = await res.json();
        alert("Error: " + data.message);
    }
});

// Faculty Notices
document.getElementById("faculty-create-notice-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("fac-notice-title").value;
    const body = document.getElementById("fac-notice-body").value;

    // Reusing the same endpoint, assuming backend permissions check role
    // Note: In a real app, might be a different endpoint or handled by permissions
    const res = await apiCall("/admin/notices", "POST", { title, body });
    if (res.ok) {
        alert("Announcement posted successfully!");
        document.getElementById("faculty-create-notice-form").reset();
    } else {
        const data = await res.json();
        alert("Error: " + data.message);
    }
});

// Admin bulk actions
document.getElementById("admin-select-all")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".admin-request-checkbox");
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
});

document.getElementById("admin-bulk-approve")?.addEventListener("click", async () => {
    const checkboxes = document.querySelectorAll(".admin-request-checkbox:checked");
    const requestIds = Array.from(checkboxes).map(cb => cb.dataset.id);

    if (requestIds.length === 0) {
        alert("Please select at least one request");
        return;
    }

    if (!confirm(`Approve ${requestIds.length} request(s)?`)) return;

    const res = await apiCall("/admin/bonafide-requests/bulk-review", "POST", { requestIds, action: "approve" });
    if (res.ok) {
        alert("Requests approved successfully");
        await loadAdminPendingRequests();
    } else {
        alert("Failed to approve requests");
    }
});

document.getElementById("admin-bulk-reject")?.addEventListener("click", async () => {
    const checkboxes = document.querySelectorAll(".admin-request-checkbox:checked");
    const requestIds = Array.from(checkboxes).map(cb => cb.dataset.id);

    if (requestIds.length === 0) {
        alert("Please select at least one request");
        return;
    }

    if (!confirm(`Reject ${requestIds.length} request(s)?`)) return;

    const res = await apiCall("/admin/bonafide-requests/bulk-review", "POST", { requestIds, action: "reject" });
    if (res.ok) {
        alert("Requests rejected successfully");
        await loadAdminPendingRequests();
    } else {
        alert("Failed to reject requests");
    }
});

// Admin certificate upload
document.getElementById("upload-certificate-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("studentId", document.getElementById("cert-student-id").value);
    formData.append("type", document.getElementById("cert-type").value);
    formData.append("certificateNumber", document.getElementById("cert-number").value);
    formData.append("certificate", document.getElementById("cert-file").files[0]);

    const res = await fetch(`${API_URL}/admin/certificates/upload`, {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    if (res.ok) {
        alert("Certificate uploaded successfully!");
        e.target.reset();
    } else {
        const data = await res.json();
        alert("Error: " + data.message);
    }
});

// Admin certificate generation (NEW - Dynamic PDF)
document.getElementById("generate-certificate-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        studentId: document.getElementById("gen-cert-student-id").value,
        type: document.getElementById("gen-cert-type").value,
        certificateNumber: document.getElementById("gen-cert-number").value,
        course: document.getElementById("gen-cert-course").value,
        academicYear: document.getElementById("gen-cert-year").value,
        purpose: document.getElementById("gen-cert-purpose").value
    };

    const res = await apiCall("/admin/certificates/generate", "POST", data);

    if (res.ok) {
        const result = await res.json();
        alert("✅ Certificate generated successfully! Students can now download it.");
        e.target.reset();
    } else {
        const error = await res.json();
        alert("Error: " + error.message);
    }
});

// Admin receipt upload
document.getElementById("upload-receipt-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("studentId", document.getElementById("receipt-student-id").value);
    formData.append("receiptNumber", document.getElementById("receipt-number").value);
    formData.append("academicYear", document.getElementById("receipt-academic-year").value);
    formData.append("semester", document.getElementById("receipt-semester").value);
    formData.append("amount", document.getElementById("receipt-amount").value);
    formData.append("paymentDate", document.getElementById("receipt-date").value);
    formData.append("paymentMode", "online");
    formData.append("feeType", document.getElementById("receipt-type").value);
    formData.append("receipt", document.getElementById("receipt-file").files[0]);

    const res = await fetch(`${API_URL}/admin/receipts/upload`, {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    if (res.ok) {
        alert("Receipt uploaded successfully!");
        e.target.reset();
    } else {
        const data = await res.json();
        alert("Error: " + data.message);
    }
});

// Init
checkSession();
