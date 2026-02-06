const API_URL = `http://${window.location.hostname}:5000/api`;

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

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = 'index.html';
        } else {
            errorMsg.textContent = data.message || 'Login failed. Please check your credentials.';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Network error. Please try again later.';
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Log In <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>';
    }
});
