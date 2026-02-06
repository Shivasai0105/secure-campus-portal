const { body, validationResult } = require('express-validator');
const { validatePasswordStrength } = require('../utils/passwordValidator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return res.status(400).json({
            message: errorMessages[0], // Return first error for simplicity
            errors: errorMessages
        });
    }
    next();
};

/**
 * Custom password validator middleware
 */
const validatePassword = (fieldName = 'password') => {
    return body(fieldName).custom((value) => {
        const validation = validatePasswordStrength(value);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }
        return true;
    });
};

/**
 * Validation rules for student registration
 */
const validateStudentRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    validatePassword('password'),

    body('rollNumber')
        .trim()
        .notEmpty()
        .withMessage('Roll number is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Roll number must be between 3 and 20 characters'),

    body('department')
        .trim()
        .notEmpty()
        .withMessage('Department is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters'),

    body('semester')
        .trim()
        .notEmpty()
        .withMessage('Semester is required'),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be exactly 10 digits'),

    handleValidationErrors
];

/**
 * Validation rules for faculty registration
 */
const validateFacultyRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    validatePassword('password'),

    body('employeeId')
        .trim()
        .notEmpty()
        .withMessage('Employee ID is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters'),

    body('designation')
        .trim()
        .notEmpty()
        .withMessage('Designation is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Designation must be between 2 and 100 characters'),

    body('department')
        .trim()
        .notEmpty()
        .withMessage('Department is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters'),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be exactly 10 digits'),

    body('officeNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Office number must not exceed 50 characters'),

    handleValidationErrors
];

/**
 * Validation rules for admin registration
 */
const validateAdminRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    validatePassword('password'),

    body('employeeId')
        .trim()
        .notEmpty()
        .withMessage('Employee ID is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters'),

    body('adminLevel')
        .trim()
        .notEmpty()
        .withMessage('Admin level is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Admin level must be between 2 and 50 characters'),

    body('department')
        .trim()
        .notEmpty()
        .withMessage('Department is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters'),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be exactly 10 digits'),

    body('officeLocation')
        .trim()
        .notEmpty()
        .withMessage('Office location is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Office location must be between 2 and 100 characters'),

    handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

module.exports = {
    validateStudentRegistration,
    validateFacultyRegistration,
    validateAdminRegistration,
    validateLogin,
    handleValidationErrors
};
