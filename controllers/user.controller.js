const User = require('../models/user.model')
const Suspension = require('../models/suspension.model')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const emailService = require('../services/email.service')
const config = require('../config/config')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

// Helper function to generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex')
}

exports.signup = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    firstName,
    lastName,
    email,
    role,
    password,
    dobMonth,
    dobDay,
    dobYear,
    country,
    phoneNumber,
    termsAgreed,
    redirectUrl,
  } = req.body

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    // Combine date of birth
    const dateOfBirth = new Date(`${dobYear}-${dobMonth}-${dobDay}`)
    const age = new Date().getFullYear() - dateOfBirth.getFullYear()
    if (age < 18) {
      return res
        .status(400)
        .json({ message: 'You must be at least 18 years old to register' })
    }

    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const newUser = new User({
      firstName,
      lastName,
      email,
      role,
      password,
      dateOfBirth,
      country,
      phoneNumber,
      termsAgreed,
      verificationToken,
      verificationTokenExpiry,
    })

    await newUser.save()

    // Send verification email
    const verificationLink = `${redirectUrl}?token=${verificationToken}&email=${email}`
    await emailService.sendVerificationEmail(email, verificationLink)

    res.status(201).json({
      message:
        'Account created! Please check your inbox to verify your email address.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Something went wrong during signup' })
  }
}

exports.login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    const user = await User.findOne({ email }).select(
      '-createdAt -updatedAt -__v -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry'
    )

    if (!user) {
      return res.status(404).json({ message: 'Email not registered' })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Account not verified. Please check your email.' })
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date()
    await user.save()

    const userObj = user.toObject()
    delete userObj.password

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    )

    res.status(200).json({ message: 'Login successful', token, user: userObj })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Something went wrong during login' })
  }
}

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, redirectUrl } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' })
    }

    const resetToken = generateVerificationToken()

    user.resetPasswordToken = resetToken
    user.resetPasswordExpiry = Date.now() + config.resetTokenExpiry * 1000 // 1 hour
    await user.save()

    const resetLink = `${redirectUrl}?token=${resetToken}`
    await emailService.sendForgotPasswordEmail(email, resetLink)

    res
      .status(200)
      .json({ message: 'Password reset email sent. Please check your inbox.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res
      .status(500)
      .json({ message: 'Something went wrong while processing your request' })
  }
}

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { newPassword, confirmNewPassword } = req.body
  const { token } = req.query

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    user.password = newPassword
    user.resetPasswordToken = null
    user.resetPasswordExpiry = null
    await user.save()

    res.status(200).json({
      message:
        'Password updated successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res
      .status(500)
      .json({ message: 'Something went wrong while resetting your password' })
  }
}

exports.verifyEmail = async (req, res) => {
  const { token, email } = req.body
  if (!token || !email) {
    return res.status(400).json({ message: 'Token and email are required' })
  }
  try {
    const user = await User.findOne({
      email,
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    })

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired verification link' })
    }

    user.isVerified = true
    user.verificationToken = null
    user.verificationTokenExpiry = null
    await user.save()

    res.status(200).json({
      message: 'Email verified successfully! You can now log in.',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).send('Something went wrong during email verification.')
  }
}

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body
  const { id: userId } = req.user

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required.' })
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long.',
    })
  }

  if (!/\d/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'New password must contain at least one number.',
    })
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation do not match.',
    })
  }

  try {
    const user = await User.findById(userId)

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'Current password is incorrect.' })
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password)
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.',
      })
    }

    user.password = newPassword
    await user.save()

    return res
      .status(200)
      .json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        '-password -resetPasswordToken -resetPasswordExpire -createdBy -__v -verificationToken -verificationTokenExpiry'
      )
      .populate([
        {
          path: 'trainerProfile',
          populate: {
            path: 'affiliatedFighters',
            model: 'FighterProfile',
            populate: {
              path: 'userId',
              model: 'User',
            },
          },
        },
        {
          path: 'trainerProfile',
          populate: {
            path: 'associatedEvents',
            model: 'Event',
          },
        },
      ])

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const suspension = await Suspension.findOne({ person: user._id })
      .sort({ createdAt: -1 })
      .populate('sportingEventUID')

    const userWithSuspension = {
      ...user.toObject(),
      suspension,
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: userWithSuspension,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
    })
  }
}

exports.updateUserById = async (req, res) => {
  try {
    const updates = req.body

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -resetPasswordToken -resetPasswordExpire')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user',
    })
  }
}
