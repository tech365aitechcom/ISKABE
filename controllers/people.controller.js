const { roles } = require('../constant')
const User = require('../models/user.model')
const emailService = require('../services/email.service')
const crypto = require('crypto')

const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex')
}

exports.createPeople = async (req, res) => {
  try {
    const { id: userId, role: createdByRole } = req.user

    if (createdByRole !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create news posts.',
      })
    }
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      nickname,
      email,
      gender,
      dateOfBirth,
      role,
      password,
      about,
      isPremium,
      adminNotes,
      phoneNumber,
      country,
      state,
      postalCode,
      city,
      street1,
      street2,
      profilePhoto,
      termsAgreed = true,
      redirectUrl,
    } = req.body

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const people = new User({
      firstName,
      middleName,
      lastName,
      suffix,
      nickname,
      email,
      gender,
      dateOfBirth,
      role,
      password,
      about,
      isPremium,
      adminNotes,
      phoneNumber,
      country,
      state,
      postalCode,
      city,
      street1,
      street2,
      profilePhoto,
      createdBy: userId,
      termsAgreed,
      verificationToken,
      verificationTokenExpiry,
    })

    await people.save()

    // Send verification email
    const verificationLink = `${redirectUrl}?token=${verificationToken}&email=${email}`
    await emailService.sendVerificationEmail(email, verificationLink)

    res.status(201).json({
      message:
        'People created successfully! Please check registered email for verification.',
      people,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllPeople = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { id, name, gender, role, page = 1, limit = 10 } = req.query

    const filter = {}

    if (id) {
      filter._id = id
    }

    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
      ]
    }

    if (gender) {
      if (gender === 'Unspecified') {
        filter.$or = [
          ...(filter.$or || []),
          { gender: { $exists: false } },
          { gender: 'other' },
        ]
      } else {
        filter.gender = gender
      }
    }

    if (role) {
      filter.role = role
    }

    // Fetch the current user's role
    const currentUser = await User.findById(userId).select('role')

    if (currentUser?.role === 'superAdmin') {
      // Exclude the current superAdmin user from the results
      filter._id = { ...(filter._id || {}), $ne: userId }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const users = await User.find(filter)
      .select(
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(filter)

    res.json({
      success: true,
      message: 'People fetched successfully',
      items: users,
      pagination: {
        totalItems: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        pageSize: parseInt(limit),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.getPeopleById = async (req, res) => {
  try {
    const { id } = req.params
    const people = await User.findById(id)
      .select(
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
    if (!people) {
      return res.status(404).json({ message: 'People not found' })
    }
    res.json({
      success: true,
      message: 'People fetched successfully',
      data: people,
    })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.updatePeople = async (req, res) => {
  try {
    const { id } = req.params
    const people = await User.findByIdAndUpdate(id, req.body, { new: true })
    if (!people) {
      return res.status(404).json({ message: 'People not found' })
    }
    res.json({
      success: true,
      message: 'People updated successfully',
      data: people,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.deletePeople = async (req, res) => {
  try {
    const { id } = req.params
    const people = await User.findByIdAndDelete(id)
    if (!people) {
      return res.status(404).json({ message: 'People not found' })
    }
    res.json({
      success: true,
      message: 'People deleted successfully',
    })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
