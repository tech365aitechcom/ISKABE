const User = require('../models/user.model')
const Registration = require('../models/registration.model')
const Fight = require('../models/fight.model')
const Bout = require('../models/bout.model')
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

// Helper function to check suspension status
const checkSuspensionStatus = async (userId) => {
  const activeSuspensions = await Suspension.find({
    person: userId,
    status: 'Active'
  }).populate('sportingEventUID')

  if (activeSuspensions.length === 0) {
    // Update user suspension status if no active suspensions
    await User.findByIdAndUpdate(userId, { isSuspended: false })
    return { isSuspended: false }
  }

  const currentDate = new Date()
  const expiredSuspensions = []
  let hasActiveSuspension = false
  
  for (const suspension of activeSuspensions) {
    let suspensionExpired = false

    // Check for indefinite suspension
    if (suspension.indefinite) {
      hasActiveSuspension = true
      return {
        isSuspended: true,
        type: 'indefinite',
        reason: suspension.type,
        message: `Your account is indefinitely suspended due to ${suspension.type.toLowerCase()} reasons. Please contact support.`,
        suspensionDetails: suspension
      }
    }

    // Medical suspension - requires clearance
    if (suspension.type === 'Medical' && !suspension.medicalClearance) {
      hasActiveSuspension = true
      return {
        isSuspended: true,
        type: 'medical',
        reason: 'Medical clearance required',
        message: 'Your account is suspended pending medical clearance. Please submit required medical documentation.',
        suspensionDetails: suspension
      }
    }

    // Check days without training
    if (suspension.daysWithoutTraining) {
      const daysSinceIncident = Math.floor((currentDate - new Date(suspension.incidentDate)) / (1000 * 60 * 60 * 24))
      if (daysSinceIncident < suspension.daysWithoutTraining) {
        hasActiveSuspension = true
        const remainingDays = suspension.daysWithoutTraining - daysSinceIncident
        return {
          isSuspended: true,
          type: 'training',
          reason: 'Training suspension active',
          message: `You are suspended from training for ${remainingDays} more days (until ${new Date(new Date(suspension.incidentDate).getTime() + suspension.daysWithoutTraining * 24 * 60 * 60 * 1000).toLocaleDateString()}).`,
          suspensionDetails: suspension,
          remainingDays
        }
      } else {
        suspensionExpired = true
      }
    }

    // Check days before competing
    if (suspension.daysBeforeCompeting) {
      const daysSinceIncident = Math.floor((currentDate - new Date(suspension.incidentDate)) / (1000 * 60 * 60 * 24))
      if (daysSinceIncident < suspension.daysBeforeCompeting) {
        hasActiveSuspension = true
        const remainingDays = suspension.daysBeforeCompeting - daysSinceIncident
        return {
          isSuspended: true,
          type: 'competition',
          reason: 'Competition suspension active',
          message: `You are suspended from competing for ${remainingDays} more days (until ${new Date(new Date(suspension.incidentDate).getTime() + suspension.daysBeforeCompeting * 24 * 60 * 60 * 1000).toLocaleDateString()}).`,
          suspensionDetails: suspension,
          remainingDays
        }
      } else {
        suspensionExpired = true
      }
    }

    // Mark suspension for closure if expired
    if (suspensionExpired) {
      expiredSuspensions.push(suspension._id)
    }
  }

  // Close expired suspensions
  if (expiredSuspensions.length > 0) {
    await Suspension.updateMany(
      { _id: { $in: expiredSuspensions } },
      { status: 'Closed' }
    )
  }

  // Update user suspension status based on active suspensions
  if (!hasActiveSuspension) {
    await User.findByIdAndUpdate(userId, { isSuspended: false })
  }

  return { isSuspended: hasActiveSuspension }
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
      if (existingUser.isSuspended) {
        return res
          .status(403)
          .json({
            message:
              'This account has been suspended. You cannot register again with this email.',
          })
      }
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

    // Check comprehensive suspension status
    const suspensionCheck = await checkSuspensionStatus(user._id)
    if (suspensionCheck.isSuspended) {
      return res.status(403).json({
        message: suspensionCheck.message,
        suspensionType: suspensionCheck.type,
        reason: suspensionCheck.reason,
        ...(suspensionCheck.remainingDays && { remainingDays: suspensionCheck.remainingDays }),
        suspensionDetails: {
          incidentDate: suspensionCheck.suspensionDetails.incidentDate,
          type: suspensionCheck.suspensionDetails.type,
          description: suspensionCheck.suspensionDetails.description,
          ...(suspensionCheck.suspensionDetails.sportingEventUID && { 
            event: suspensionCheck.suspensionDetails.sportingEventUID.name 
          })
        }
      })
    }

    // Legacy suspension check (fallback)
    if (user.isSuspended) {
      return res
        .status(403)
        .json({ message: 'Your account has been suspended by the admin.' })
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

    // Rate limit: 15 minutes between reset requests
    const now = Date.now()
    const recentRequestGap = 15 * 60 * 1000 // 15 minutes

    if (
      user.resetPasswordExpiry &&
      user.resetPasswordExpiry - now > recentRequestGap
    ) {
      const waitMinutes = Math.ceil((user.resetPasswordExpiry - now) / 60000)
      return res.status(429).json({
        message: `Too many reset requests. Please wait ${waitMinutes} minutes before trying again.`,
      })
    }

    const resetToken = generateVerificationToken()

    user.resetPasswordToken = resetToken
    user.resetPasswordExpiry = now + config.resetTokenExpiry * 1000 // typically 1 hour
    await user.save()

    const resetLink = `${redirectUrl}?token=${resetToken}`
    await emailService.sendForgotPasswordEmail(email, resetLink)

    res.status(200).json({
      message: 'Password reset email sent. Please check your inbox.',
    })
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
          populate: [
            {
              path: 'affiliatedFighters',
              model: 'FighterProfile',
              populate: {
                path: 'userId',
                model: 'User',
              },
            },
            {
              path: 'associatedEvents',
              model: 'Event',
            },
          ],
        },
        {
          path: 'fighterProfile',
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

exports.checkEmail = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    })
  }

  try {
    const user = await User.findOne({ email })

    return res.status(200).json({
      success: true,
      exists: !!user,
    })
  } catch (error) {
    console.error('Check email error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while checking email',
    })
  }
}

exports.getFighterSystemRecord = async (req, res) => {
  const { email } = req.params

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    })
  }

  try {
    // Find all registrations for this fighter (regardless of User schema presence)
    const registrations = await Registration.find({
      email: email,
      registrationType: 'fighter',
    })

    if (!registrations.length) {
      return res.status(200).json({
        success: true,
        message: 'Fighter system record fetched successfully',
        data: {
          email: email,
          systemRecord: '0-0-0',
          breakdown: {
            wins: 0,
            losses: 0,
            draws: 0,
            totalFights: 0,
          },
          registrationsCount: 0,
        },
      })
    }

    // Get fighter name from the most recent registration
    const latestRegistration = registrations.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0]
    const fighterName = `${latestRegistration.firstName} ${latestRegistration.lastName}`

    const registrationIds = registrations.map((reg) => reg._id)

    // Find all bouts where this fighter participated
    const bouts = await Bout.find({
      $or: [
        { redCorner: { $in: registrationIds } },
        { blueCorner: { $in: registrationIds } },
      ],
    }).populate('fight')

    let wins = 0
    let losses = 0
    let draws = 0

    // Calculate W-L-D from completed fights
    for (const bout of bouts) {
      if (bout.fight && bout.fight.status === 'Completed') {
        const fight = bout.fight

        if (
          fight.resultMethod === 'Draw' ||
          fight.resultMethod === 'No Contest'
        ) {
          draws++
        } else if (fight.winner) {
          const fighterWon = registrationIds.some(
            (id) => id.toString() === fight.winner.toString()
          )
          if (fighterWon) {
            wins++
          } else {
            losses++
          }
        }
      }
    }

    const systemRecord = `${wins}-${losses}-${draws}`

    return res.status(200).json({
      success: true,
      message: 'Fighter system record fetched successfully',
      data: {
        email: email,
        systemRecord: systemRecord,
        breakdown: {
          wins,
          losses,
          draws,
          totalFights: wins + losses + draws,
        },
        registrationsCount: registrations.length,
      },
    })
  } catch (error) {
    console.error('Get fighter system record error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching fighter system record',
    })
  }
}
