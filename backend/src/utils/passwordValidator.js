const validator = require('validator');

/**
 * Common passwords list (top 20 most common passwords)
 */
const COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { isValid: false, errors: ['Password is required'] };
    }

    // Minimum length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Maximum length check (prevent DoS)
    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    }

    // Common password check (case-insensitive)
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a stronger password');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validatePasswordStrength
};
