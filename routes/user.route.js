const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const authController = require('../controllers/user.controller')
const { protect } = require('../middlewares/auth.middleware')

// Signup route
router.post(
  '/signup',
  [
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .matches(/^[a-zA-Z]+$/)
      .withMessage('First name must contain only letters'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .matches(/^[a-zA-Z]+$/)
      .withMessage('Last name must contain only letters'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    body('dobMonth')
      .notEmpty()
      .withMessage('Month is required')
      .isInt({ min: 1, max: 12 }),
    body('dobDay')
      .notEmpty()
      .withMessage('Day is required')
      .isInt({ min: 1, max: 31 }),
    body('dobYear')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 1900, max: new Date().getFullYear() - 18 }),
    body('country').notEmpty().withMessage('Country is required'), // Add more specific validation later
    body('phoneNumber').notEmpty().withMessage('Phone number is required'), // Add more specific validation later
    body('termsAgreed')
      .isBoolean()
      .withMessage('You must agree to the terms and conditions'),
  ],
  authController.signup
)

// Login route
router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
)

// Forgot password route
router.post(
  '/forgot-password',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .normalizeEmail(),
  ],
  authController.forgotPassword
)

// Reset password route
router.post(
  '/reset-password/:token',
  [
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('confirmNewPassword')
      .notEmpty()
      .withMessage('Confirm new password is required')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
  ],
  authController.resetPassword
)

// Change password route
router.post('/change-password', protect, authController.changePassword)

// Email verification route
router.post('/verify-email', authController.verifyEmail)

// Get user profile route
router.get('/users/:id', protect, authController.getUserById)

// Update user profile route
router.put('/users/:id', protect, authController.updateUserById)

module.exports = router
