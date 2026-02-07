const HOST = window.location.hostname || "localhost";
const API_URL = `http://${HOST}:5000/api`;

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const submitBtn = document.querySelector('.btn-login');

    // Reset UI
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Logging in...';

    console.log('Attempting login with:', email);
    console.log('API URL:', `${API_URL}/auth/login`);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            console.log('Login successful!');
            console.log('User role:', data.user?.role);

            // Redirect based on role
            if (data.user && data.user.role === 'faculty') {
                console.log('Redirecting to faculty dashboard...');
                window.location.href = 'faculty-dashboard.html';
            } else if (data.user && data.user.role === 'student') {
                console.log('Redirecting to student dashboard...');
                window.location.href = 'student-dashboard.html';
            } else {
                console.log('Redirecting to index...');
                window.location.href = 'index.html';
            }
        } else {
            console.error('Login failed:', data.message);
            errorMsg.textContent = data.message || 'Login failed. Please check your credentials.';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Network error:', error);
        errorMsg.textContent = 'Network error. Please try again later.';
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Log In <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>';
    }
});
