const { roles } = require('../constant')
const promoterProfileModel = require('../models/promoterProfile.model')
const userModel = require('../models/user.model')
const emailService = require('../services/email.service')
const crypto = require('crypto')

const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex')
}

function splitFullName(fullName = '') {
  const nameParts = fullName.trim().split(/\s+/)

  const firstName = nameParts[0] || ''
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const middleName =
    nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''

  return { firstName, middleName, lastName }
}

exports.createPromoter = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create news posts.',
      })
    }

    const {
      name,
      email,
      phoneNumber,
      country,
      state,
      city,
      street1,
      street2,
      postalCode,
      password,
      termsAgreed = true,
      profilePhoto,

      // Promoter-specific
      alternatePhoneNumber,
      abbreviation,
      websiteURL,
      aboutUs,
      userName,
      sanctioningBody,
      licenseCertificate,
      accountStatus,
      assignRole,
      adminNotes,
    } = req.body

    const { firstName, middleName, lastName } = splitFullName(name)

    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    // Create user
    const user = await userModel.create({
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      country,
      state,
      city,
      street1,
      street2,
      postalCode,
      password,
      termsAgreed,
      profilePhoto,
      role: 'promoter',
      verificationToken,
      verificationTokenExpiry,
    })

    // Create promoter profile
    const promoter = new promoterProfileModel({
      userId: user._id,
      alternatePhoneNumber,
      abbreviation,
      websiteURL,
      aboutUs,
      userName,
      sanctioningBody,
      licenseCertificate,
      accountStatus,
      assignRole,
      adminNotes,
      createdBy: userId,
    })

    await promoter.save()

    // Send verification email
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`
    await emailService.sendVerificationEmail(email, verificationLink)

    res.status(201).json({
      message: 'Promoter and User created successfully',
      user,
      promoter,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllPromoterProfile = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const searchRegex = new RegExp(search, 'i')

    const matchStage = search
      ? {
          $or: [
            { abbreviation: { $regex: searchRegex } },
            { 'user.firstName': { $regex: searchRegex } },
            { 'user.lastName': { $regex: searchRegex } },
            { 'user.email': { $regex: searchRegex } },
          ],
        }
      : {}

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $unwind: '$createdBy',
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [
            { $count: 'total' },
            {
              $addFields: {
                page: parseInt(page),
                pageSize: parseInt(limit),
              },
            },
          ],
          items: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ]

    const result = await promoterProfileModel.aggregate(pipeline)
    const data = result[0]
    const totalItems = data.metadata[0]?.total || 0

    res.json({
      success: true,
      message: 'Promoter list fetched',
      data: {
        items: data.items,
        pagination: {
          totalItems,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching promoter' })
  }
}
