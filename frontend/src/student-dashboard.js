const API_URL = `http://${window.location.hostname}:5000/api`;
let currentUser = null;
let csrfToken = null;

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout
let sessionTimer = null;
let warningTimer = null;
let countdownInterval = null;

// Utility function to sanitize HTML and prevent XSS
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'div', 'span'],
            ALLOWED_ATTR: ['style', 'class']
        });
    }
    // Fallback: escape HTML if DOMPurify not available
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Fetch CSRF token
async function fetchCsrfToken() {
    try {
        const res = await fetch(`${API_URL}/csrf-token`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            csrfToken = data.csrfToken;
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

// Check authentication
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            if (currentUser.role !== 'student') {
                window.location.href = 'index.html';
                return;
            }
            updateUserInfo();
            loadDashboardData();
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error(error);
        window.location.href = 'login.html';
    }
}

function updateUserInfo() {
    document.getElementById('student-name').textContent = currentUser.name;
    document.getElementById('student-id').textContent = currentUser.rollNumber || currentUser.email;
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    // Remove active from all menu items
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');

    // Highlight menu item
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// Menu click handlers
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        showSection(section);
    });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'login.html';
    } catch (error) {
        console.error(error);
        window.location.href = 'login.html';
    }
});

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadNotices(),
        loadReceipts(),
        loadBonafideHistory()
    ]);
}

async function loadNotices() {
    try {
        const res = await fetch(`${API_URL}/student/notices`, { credentials: 'include' });
        if (res.ok) {
            const { notices } = await res.json();
            const container = document.getElementById('notices-list');

            if (notices.length === 0) {
                container.innerHTML = '<p style="color: #666;">No notices available.</p>';
            } else {
                // Sanitize all user-generated content to prevent XSS
                container.innerHTML = notices.map(notice => `
                    <div class="notice-item">
                        <div class="notice-title">${sanitizeHTML(notice.title)}</div>
                        <p style="margin: 0.5rem 0; color: #555;">${sanitizeHTML(notice.body)}</p>
                        <div class="notice-date">${new Date(notice.createdAt).toLocaleDateString()}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading notices:', error);
    }
}

async function loadReceipts() {
    try {
        const res = await fetch(`${API_URL}/student/receipts`, { credentials: 'include' });
        if (res.ok) {
            const { receipts } = await res.json();
            const container = document.getElementById('receipts-list');

            if (receipts.length === 0) {
                container.innerHTML = '<li style="color: #666; list-style: none;">No receipts found.</li>';
            } else {
                container.innerHTML = receipts.map(r => `
                    <li class="status-item">
                        <div>
                            <strong>Receipt #${r._id.substr(-6)}</strong>
                            <p style="margin: 0.25rem 0 0; color: #666; font-size: 0.9rem;">Amount: ₹${r.amount}</p>
                        </div>
                        <button class="card-btn" style="padding: 0.5rem 1rem;">Download</button>
                    </li>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading receipts:', error);
    }
}

async function loadBonafideHistory() {
    try {
        const res = await fetch(`${API_URL}/student/bonafide-requests`, { credentials: 'include' });
        if (res.ok) {
            const { requests } = await res.json();
            const container = document.getElementById('status-list');

            if (requests.length === 0) {
                container.innerHTML = '<li style="color: #666; list-style: none;">No requests found.</li>';
            } else {
                // Sanitize reason field to prevent XSS
                container.innerHTML = requests.map(req => {
                    const statusClass = req.status === 'approved' ? 'status-approved' :
                        req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                    return `
                        <li class="status-item">
                            <div>
                                <strong>Bonafide Request</strong>
                                <p style="margin: 0.25rem 0 0; color: #666; font-size: 0.9rem;">${sanitizeHTML(req.reason)}</p>
                            </div>
                            <span class="status-badge ${statusClass}">${req.status.toUpperCase()}</span>
                        </li>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading bonafide history:', error);
    }
}

// Form submissions
document.getElementById('bonafide-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const purpose = document.getElementById('bonafide-purpose').value;

    try {
        // Fetch CSRF token if not already available
        if (!csrfToken) {
            await fetchCsrfToken();
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        if (csrfToken) {
            headers['_csrf'] = csrfToken;
        }

        const res = await fetch(`${API_URL}/student/bonafide-requests`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ reason: purpose }),
            credentials: 'include'
        });

        if (res.ok) {
            alert('Bonafide request submitted successfully!');
            document.getElementById('bonafide-purpose').value = '';
            loadBonafideHistory();
            showSection('status');
        } else {
            const data = await res.json();
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error(error);
        alert('Network error. Please try again.');
    }
});

document.getElementById('complaint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Complaint submission feature will be implemented soon!');
    e.target.reset();
});

// Session timeout management
function startSessionTimeout() {
    // Clear existing timers
    clearTimeout(sessionTimer);
    clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    // Set warning timer (show modal 2 minutes before timeout)
    warningTimer = setTimeout(() => {
        showTimeoutWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set session timeout (auto-logout after 30 minutes)
    sessionTimer = setTimeout(() => {
        handleSessionTimeout();
    }, SESSION_TIMEOUT);
}

function showTimeoutWarning() {
    const modal = document.getElementById('timeout-modal');
    modal.style.display = 'flex';

    let secondsLeft = WARNING_TIME / 1000;
    const countdownEl = document.getElementById('timeout-countdown');

    countdownInterval = setInterval(() => {
        secondsLeft--;
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function resetSessionTimeout() {
    const modal = document.getElementById('timeout-modal');
    modal.style.display = 'none';
    if (countdownInterval) clearInterval(countdownInterval);
    startSessionTimeout();
}

function handleSessionTimeout() {
    alert('Your session has expired due to inactivity. Please login again.');
    window.location.href = 'login.html';
}

// Track user activity to reset timeout
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
    document.addEventListener(event, () => {
        // Only reset if user is logged in and modal is not showing
        if (currentUser && document.getElementById('timeout-modal').style.display !== 'flex') {
            startSessionTimeout();
        }
    }, { passive: true });
});

// Initialize
async function init() {
    await fetchCsrfToken();
    await checkAuth();
    // Start session timeout after successful authentication
    if (currentUser) {
        startSessionTimeout();
    }
}

init();
