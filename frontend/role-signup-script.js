const API_URL = `http://${window.location.hostname}:5000/api`;

// Password Validation Config
const PASSWORD_CONFIG = {
    MIN_LENGTH: 12,
    REGEX: {
        UPPER: /[A-Z]/,
        LOWER: /[a-z]/,
        NUMBER: /[0-9]/,
        SPECIAL: /[!@#$%^&*]/
    }
};

function togglePass(id) {
    const input = document.getElementById(id);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= PASSWORD_CONFIG.MIN_LENGTH) score++;
    if (PASSWORD_CONFIG.REGEX.UPPER.test(password)) score++;
    if (PASSWORD_CONFIG.REGEX.LOWER.test(password)) score++;
    if (PASSWORD_CONFIG.REGEX.NUMBER.test(password)) score++;
    if (PASSWORD_CONFIG.REGEX.SPECIAL.test(password)) score++;
    return score;
}

function updateStrengthMeter(password) {
    const bar = document.getElementById('strength-bar');
    const score = checkPasswordStrength(password);
    const colors = ['#e53935', '#e53935', '#ffca28', '#43a047', '#43a047', '#1b5e20'];
    const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];

    bar.style.width = widths[score];
    bar.style.backgroundColor = colors[score];
}

async function registerUser(role, data) {
    try {
        const response = await fetch(`${API_URL}/auth/register-${role}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = 'login.html';
        } else {
            alert(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const form = document.querySelector('form');

    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updateStrengthMeter(e.target.value);
            // Basic validation check
            const score = checkPasswordStrength(e.target.value);
            if (score < 5) {
                passwordInput.classList.add('invalid');
                passwordInput.classList.remove('valid');
            } else {
                passwordInput.classList.remove('invalid');
                passwordInput.classList.add('valid');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Password Match Check
            if (passwordInput.value !== confirmInput.value) {
                alert("Passwords do not match!");
                return;
            }

            // Password Strength Check
            if (checkPasswordStrength(passwordInput.value) < 5) {
                alert("Password does not meet security requirements.");
                return;
            }

            // Gather Data
            const formData = {};
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox') return; // Handled separately if needed
                if (input.id !== 'confirm-password') {
                    // Convert kebab-case ids to camelCase keys if needed, or send as is
                    // For now, mapping IDs manually to expected backend fields
                    let key = input.id.replace(/-./g, x => x[1].toUpperCase()); // kebab to camel
                    formData[key] = input.value;
                }
            });

            // Special handling for specific fields to match backend schema
            const role = window.CURRENT_ROLE;

            // Normalize keys for backend
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                department: formData.department
            };

            if (role === 'student') {
                payload.rollNumber = document.getElementById('roll-number').value;
                payload.semester = document.getElementById('semester').value;
            } else if (role === 'faculty') {
                payload.employeeId = document.getElementById('employee-id').value;
                payload.designation = document.getElementById('designation').value;
                payload.officeNumber = document.getElementById('office-number').value;
            } else if (role === 'admin') {
                payload.employeeId = document.getElementById('employee-id').value;
                payload.adminLevel = document.getElementById('admin-level').value;
                payload.officeLocation = document.getElementById('office-location').value;
            }

            await registerUser(role, payload);
        });
    }
});
