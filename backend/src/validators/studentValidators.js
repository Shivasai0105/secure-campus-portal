const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return res.status(400).json({
            message: errorMessages[0],
            errors: errorMessages
        });
    }
    next();
};

/**
 * Validation rules for bonafide request
 */
const validateBonafideRequest = [
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be between 10 and 500 characters')
        .matches(/^[a-zA-Z0-9\s.,!?'-]+$/)
        .withMessage('Reason contains invalid characters'),

    handleValidationErrors
];

module.exports = {
    validateBonafideRequest,
    handleValidationErrors
};
