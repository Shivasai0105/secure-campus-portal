const API_URL = `http://${window.location.hostname}:5000/api`;
let csrfToken = null;
let currentUser = null;

// --- DOM Elements ---
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
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
        loginSection.classList.add("hidden");
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
        loginSection.classList.remove("hidden");
        dashboardSection.classList.add("hidden");
    }
}

// --- Auth Flow ---

async function checkSession() {
    try {
        await fetchCsrfToken();
        const res = await apiCall("/auth/me");
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            updateUI(currentUser);
        } else {
            updateUI(null);
        }
    } catch (err) {
        console.error(err);
        updateUI(null);
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("hidden");
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await apiCall("/auth/login", "POST", { email, password });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            await fetchCsrfToken(); // Refresh token after login
            updateUI(currentUser);
        } else {
            loginError.textContent = data.message || "Login failed";
            loginError.classList.remove("hidden");
        }
    } catch (err) {
        loginError.textContent = "Network error";
        loginError.classList.remove("hidden");
    }
});

logoutBtn.addEventListener("click", async () => {
    await apiCall("/auth/logout", "POST");
    currentUser = null;
    window.location.reload();
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

// Init
checkSession();
