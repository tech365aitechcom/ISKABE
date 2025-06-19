const { roles } = require('../constant')
const promoterProfileModel = require('../models/promoterProfile.model')
const User = require('../models/user.model')
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
      userName,
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
      contactPersonName,
      alternatePhoneNumber,
      abbreviation,
      websiteURL,
      aboutUs,
      sanctioningBody,
      licenseCertificate,
      accountStatus,
      assignRole,
      adminNotes,
      redirectUrl,
    } = req.body

    const { firstName, middleName, lastName } = splitFullName(name)

    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    // Create user
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      userName,
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
      name,
      contactPersonName,
      alternatePhoneNumber,
      abbreviation,
      websiteURL,
      aboutUs,
      sanctioningBody,
      licenseCertificate,
      accountStatus,
      assignRole,
      adminNotes,
      createdBy: userId,
    })

    await promoter.save()

    // Send verification email
    const verificationLink = `${redirectUrl}?token=${verificationToken}&email=${email}`
    await emailService.sendVerificationEmail(email, verificationLink)

    res.status(201).json({
      message:
        'Promoter created successfully! Please check registered email for verification.',
      user,
      promoter,
    })
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0]

      let message = 'Duplicate value detected.'
      if (duplicateField === 'email') {
        message = 'Email already exists.'
      } else if (duplicateField === 'name') {
        message = 'Promoter with same name already exists.'
      }

      return res.status(400).json({
        success: false,
        message,
      })
    }

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
            { name: { $regex: searchRegex } },
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

exports.getPromoterProfileById = async (req, res) => {
  try {
    const { id } = req.params
    const promoter = await promoterProfileModel
      .findById(id)
      .populate(
        'userId',
        '-verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' })
    }
    res.json({
      success: true,
      message: 'Promoter fetched successfully',
      data: promoter,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching promoter' })
  }
}

exports.updatePromoterProfile = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body

    const userFields = [
      'userName',
      'email',
      'phoneNumber',
      'country',
      'state',
      'city',
      'street1',
      'street2',
      'postalCode',
      'password',
      'profilePhoto',
    ]

    const promoterFields = [
      'name',
      'contactPersonName',
      'alternatePhoneNumber',
      'abbreviation',
      'websiteURL',
      'aboutUs',
      'sanctioningBody',
      'licenseCertificate',
      'accountStatus',
      'assignRole',
      'adminNotes',
    ]

    const userUpdates = {}
    const promoterUpdates = {}

    for (const key in payload) {
      if (userFields.includes(key)) {
        userUpdates[key] = payload[key]
      } else if (promoterFields.includes(key)) {
        promoterUpdates[key] = payload[key]
      }
    }

    const promoter = await promoterProfileModel.findById(id)
    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' })
    }

    const user = await User.findByIdAndUpdate(promoter.userId, userUpdates, {
      new: true,
      runValidators: true,
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const updatedPromoter = await promoterProfileModel.findByIdAndUpdate(
      id,
      promoterUpdates,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Promoter updated successfully',
      data: { user, updatedPromoter },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error updating promoter' })
  }
}

exports.deletePromoterProfile = async (req, res) => {
  try {
    const { id } = req.params

    // Find the promoter profile by ID
    const promoter = await promoterProfileModel.findById(id)

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' })
    }
    console.log({ promoter })
    // Delete the associated user
    await User.findByIdAndDelete(promoter.userId)

    // Delete the promoter profile
    await promoterProfileModel.findByIdAndDelete(id)

    res.json({ message: 'Promoter deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting promoter and user' })
  }
}
