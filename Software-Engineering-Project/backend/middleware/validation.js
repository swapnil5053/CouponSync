// Validation Middleware using express-validator
import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * EPIC 1: Story 5 - Validate user registration
 */
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('Use at least 8 characters with an uppercase letter, a lowercase letter, and a number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'merchant', 'customer'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors
];

/**
 * EPIC 1: Story 1 - Validate campaign creation
 */
export const validateCampaignCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Campaign name must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('type')
    .isIn(['percentage', 'fixed', 'bogo', 'free_shipping'])
    .withMessage('Discount type must be percentage, fixed, bogo, or free_shipping'),
  body('discount')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('end_date')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('max_redemptions')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        throw new Error('Max redemptions must be at least 1');
      }
      return true;
    }),
  body('budget')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Budget must be a non-negative number');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * EPIC 1: Story 2 - Validate campaign update
 */
export const validateCampaignUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Campaign name must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('type')
    .optional()
    .isIn(['percentage', 'fixed', 'bogo', 'free_shipping'])
    .withMessage('Invalid discount type'),
  body('discount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('max_redemptions')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        throw new Error('Max redemptions must be at least 1');
      }
      return true;
    }),
  body('budget')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Budget must be a non-negative number');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * EPIC 2: Story 1 - Validate coupon generation
 */
export const validateCouponGeneration = [
  body('campaign_id')
    .isInt({ min: 1 })
    .withMessage('Valid campaign ID is required'),
  body('count')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Count must be between 1 and 10000'),
  body('code_length')
    .optional()
    .isInt({ min: 6, max: 20 })
    .withMessage('Code length must be between 6 and 20'),
  body('prefix')
    .optional()
    .trim()
    .isLength({ max: 5 })
    .matches(/^[A-Z0-9]*$/)
    .withMessage('Prefix must be alphanumeric uppercase, max 5 characters'),
  handleValidationErrors
];

/**
 * EPIC 4: Story 1 - Validate coupon redemption
 */
export const validateCouponRedemption = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 6, max: 30 })
    .withMessage('Coupon code must be between 6 and 30 characters'),
  body('transaction_id')
    .optional()
    .trim()
    .isLength({ max: 255 }),
  body('order_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Order amount must be a positive number'),
  handleValidationErrors
];

/**
 * Validate ID parameter
 */
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

/**
 * Validate pagination parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * EPIC 3: Story 1 - Validate email distribution
 */
export const validateEmailDistribution = [
  body('campaign_id')
    .isInt({ min: 1 })
    .withMessage('Valid campaign ID is required'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .isEmail()
    .withMessage('All recipients must be valid email addresses'),
  handleValidationErrors
];

/**
 * EPIC 3: Story 2 - Validate SMS distribution
 */
export const validateSMSDistribution = [
  body('campaign_id')
    .isInt({ min: 1 })
    .withMessage('Valid campaign ID is required'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('All recipients must be valid phone numbers'),
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateCampaignCreation,
  validateCampaignUpdate,
  validateCouponGeneration,
  validateCouponRedemption,
  validateId,
  validatePagination,
  validateEmailDistribution,
  validateSMSDistribution
};
