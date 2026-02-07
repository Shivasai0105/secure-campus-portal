const HOST = window.location.hostname || "localhost";
const API_BASE = `http://${HOST}:5000/api`;

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    setupEventListeners();
    loadPendingRequests();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();
        document.getElementById("faculty-name").textContent = data.user.name;
    } catch (error) {
        console.error("Error checking auth:", error);
        window.location.href = "login.html";
    }
}

// Setup event listeners
function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll(".menu-item:not(.logout-item)").forEach(item => {
        item.addEventListener("click", () => {
            const section = item.dataset.section;
            showSection(section);

            // Update active menu item
            document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // Logout
    document.getElementById("logout-btn").addEventListener("click", async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
        window.location.href = "login.html";
    });

    // Announcement form
    document.getElementById("announcement-form").addEventListener("submit", handleAnnouncementSubmit);

    // Bulk actions
    document.getElementById("select-all").addEventListener("change", handleSelectAll);
    document.getElementById("bulk-approve-btn").addEventListener("click", () => handleBulkAction("approve"));
    document.getElementById("bulk-reject-btn").addEventListener("click", () => handleBulkAction("reject"));
}

// Show section
function showSection(sectionName) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${sectionName}-section`).classList.add("active");

    // Load data when switching sections
    if (sectionName === "pending-requests") {
        loadPendingRequests();
    } else if (sectionName === "flagged-requests") {
        loadFlaggedRequests();
    }
}

// Handle announcement submission
async function handleAnnouncementSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("notice-title").value.trim();
    const body = document.getElementById("notice-body").value.trim();

    if (!title || !body) {
        showAlert("announcement-alert", "Please fill in all fields", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/faculty/notices`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ title, body })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("announcement-alert", "Announcement published successfully!", "success");
            document.getElementById("announcement-form").reset();
        } else {
            showAlert("announcement-alert", data.message || "Failed to publish announcement", "error");
        }
    } catch (error) {
        console.error("Error publishing announcement:", error);
        showAlert("announcement-alert", "Network error. Please try again.", "error");
    }
}

// Load pending requests
async function loadPendingRequests() {
    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            displayPendingRequests(data.requests);
        } else {
            showAlert("pending-alert", data.message || "Failed to load requests", "error");
        }
    } catch (error) {
        console.error("Error loading pending requests:", error);
        showAlert("pending-alert", "Network error. Please try again.", "error");
    }
}

// Display pending requests
function displayPendingRequests(requests) {
    const container = document.getElementById("pending-requests-container");

    if (!requests || requests.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No pending requests</p>
      </div>
    `;
        return;
    }

    const tableHTML = `
    <table class="requests-table">
      <thead>
        <tr>
          <th><input type="checkbox" id="select-all-table"></th>
          <th>Student</th>
          <th>Email</th>
          <th>Reason</th>
          <th>Requested On</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(req => `
          <tr>
            <td><input type="checkbox" class="request-checkbox" data-id="${req._id}"></td>
            <td>${DOMPurify.sanitize(req.studentId?.name || "Unknown")}</td>
            <td>${DOMPurify.sanitize(req.studentId?.email || "N/A")}</td>
            <td>${DOMPurify.sanitize(req.reason)}</td>
            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn-primary btn-small" onclick="reviewRequest('${req._id}', 'approve')">Approve</button>
              <button class="btn-danger btn-small" onclick="reviewRequest('${req._id}', 'reject')">Reject</button>
              <button class="btn-secondary btn-small" onclick="flagRequest('${req._id}')">Flag</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

    container.innerHTML = tableHTML;

    // Setup select all in table
    document.getElementById("select-all-table").addEventListener("change", handleSelectAll);
}

// Load flagged requests
async function loadFlaggedRequests() {
    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests/flagged`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            displayFlaggedRequests(data.requests);
        } else {
            showAlert("flagged-alert", data.message || "Failed to load flagged requests", "error");
        }
    } catch (error) {
        console.error("Error loading flagged requests:", error);
        showAlert("flagged-alert", "Network error. Please try again.", "error");
    }
}

// Display flagged requests
function displayFlaggedRequests(requests) {
    const container = document.getElementById("flagged-requests-container");

    if (!requests || requests.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-flag"></i>
        <p>No flagged requests</p>
      </div>
    `;
        return;
    }

    const tableHTML = `
    <table class="requests-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Reason</th>
          <th>Flag Reason</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(req => `
          <tr>
            <td>${DOMPurify.sanitize(req.studentId?.name || "Unknown")}</td>
            <td>${DOMPurify.sanitize(req.studentId?.email || "N/A")}</td>
            <td>${DOMPurify.sanitize(req.reason)}</td>
            <td>${DOMPurify.sanitize(req.flaggedReason || "N/A")}</td>
            <td><span class="status-badge status-flagged">Flagged</span></td>
            <td>
              ${req.status === "pending" ? `
                <button class="btn-primary btn-small" onclick="reviewRequest('${req._id}', 'approve')">Approve</button>
                <button class="btn-danger btn-small" onclick="reviewRequest('${req._id}', 'reject')">Reject</button>
              ` : `<span class="status-badge status-${req.status}">${req.status}</span>`}
              <button class="btn-secondary btn-small" onclick="unflagRequest('${req._id}')">Unflag</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

    container.innerHTML = tableHTML;
}

// Handle select all
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll(".request-checkbox");
    checkboxes.forEach(cb => cb.checked = e.target.checked);
}

// Handle bulk action
async function handleBulkAction(action) {
    const checkboxes = document.querySelectorAll(".request-checkbox:checked");
    const requestIds = Array.from(checkboxes).map(cb => cb.dataset.id);

    if (requestIds.length === 0) {
        showAlert("pending-alert", "Please select at least one request", "error");
        return;
    }

    const confirmMsg = `Are you sure you want to ${action} ${requestIds.length} request(s)?`;
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests/bulk-review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ requestIds, action })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("pending-alert", data.message || `Successfully ${action}ed requests`, "success");
            loadPendingRequests();
        } else {
            showAlert("pending-alert", data.message || `Failed to ${action} requests`, "error");
        }
    } catch (error) {
        console.error(`Error ${action}ing requests:`, error);
        showAlert("pending-alert", "Network error. Please try again.", "error");
    }
}

// Review individual request
async function reviewRequest(requestId, action) {
    const confirmMsg = `Are you sure you want to ${action} this request?`;
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests/${requestId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ action })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("pending-alert", `Request ${action}ed successfully`, "success");
            loadPendingRequests();
        } else {
            showAlert("pending-alert", data.message || `Failed to ${action} request`, "error");
        }
    } catch (error) {
        console.error(`Error ${action}ing request:`, error);
        showAlert("pending-alert", "Network error. Please try again.", "error");
    }
}

// Flag request
async function flagRequest(requestId) {
    const reason = prompt("Enter reason for flagging this request:");
    if (!reason) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests/${requestId}/flag`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ reason })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("pending-alert", "Request flagged successfully", "success");
            loadPendingRequests();
        } else {
            showAlert("pending-alert", data.message || "Failed to flag request", "error");
        }
    } catch (error) {
        console.error("Error flagging request:", error);
        showAlert("pending-alert", "Network error. Please try again.", "error");
    }
}

// Unflag request
async function unflagRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE}/faculty/bonafide-requests/${requestId}/flag`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("flagged-alert", "Request unflagged successfully", "success");
            loadFlaggedRequests();
        } else {
            showAlert("flagged-alert", data.message || "Failed to unflag request", "error");
        }
    } catch (error) {
        console.error("Error unflagging request:", error);
        showAlert("flagged-alert", "Network error. Please try again.", "error");
    }
}

// Show alert
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    const alertClass = type === "success" ? "alert-success" : "alert-error";

    container.innerHTML = `
    <div class="alert ${alertClass}">
      ${DOMPurify.sanitize(message)}
    </div>
  `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = "";
    }, 5000);
}
