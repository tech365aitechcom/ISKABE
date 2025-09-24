const FighterProfile = require('../models/fighterProfile.model')
const User = require('../models/user.model')
const Suspension = require('../models/suspension.model')

exports.getAllFighterProfiles = async (req, res) => {
  try {
    const {
      country,
      state,
      city,
      trainingStyle,
      search,
      page = 1,
      limit = 10,
    } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const matchStage = {}

    if (trainingStyle) matchStage.trainingStyle = trainingStyle
    if (country) matchStage['user.country'] = country
    if (state) matchStage['user.state'] = state
    if (city) matchStage['user.city'] = city

    if (search) {
      matchStage.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
      ]
    }

    const aggregation = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          userId: 0, // exclude userId
          'user.password': 0,
          'user.verificationToken': 0,
          'user.verificationTokenExpiry': 0,
          'user.resetToken': 0,
          'user.resetTokenExpiry': 0,
          'user.__v': 0,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]

    const results = await FighterProfile.aggregate(aggregation)

    const fighterProfiles = results[0]?.data || []
    const totalItems = results[0]?.totalCount[0]?.count || 0

    return res.status(200).json({
      success: true,
      message: 'Fighter list fetched',
      data: {
        items: fighterProfiles,
        pagination: {
          totalItems,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

exports.getFighterProfileById = async (req, res) => {
  try {
    const fighter = await FighterProfile.findById(req.params.id).populate(
      'userId',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!fighter) {
      return res.status(404).json({ error: 'Fighter not found' })
    }

    const suspension = await Suspension.findOne({
      person: fighter.userId._id,
    })
      .sort({ createdAt: -1 })
      .populate('sportingEventUID')
    console.log(fighter.userId._id)

    res.json({
      success: true,
      message: 'Fighter fetched successfully',
      data: { ...fighter.toObject(), suspension },
    })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching fighter' })
  }
}

exports.updateFighterProfileById = async (req, res) => {
  try {
    const { id: userId } = req.user

    const payload = req.body

    // Define model-specific fields
    const userFields = [
      'firstName',
      'lastName',
      'nickName',
      'userName',
      'profilePhoto',
      'gender',
      'dateOfBirth',
      'phoneNumber',
      'email',
      'country',
      'state',
      'city',
    ]

    const fighterFields = [
      'height',
      'weight',
      'weightUnit',
      'weightClass',
      'instagram',
      'youtube',
      'facebook',
      'bio',
      'primaryGym',
      'coachName',
      'affiliations',
      'trainingExperience',
      'trainingStyle',
      'credentials',
      'nationalRank',
      'globalRank',
      'achievements',
      'recordHighlight',
      'imageGallery',
      'videoHighlight',
      'medicalCertificate',
      'licenseDocument',
    ]

    // Separate the data
    const userUpdates = {}
    const fighterUpdates = {}

    for (const key in payload) {
      if (userFields.includes(key)) {
        userUpdates[key] = payload[key]
      } else if (fighterFields.includes(key)) {
        fighterUpdates[key] = payload[key]
      }
    }

    // Update the User document
    const user = await User.findByIdAndUpdate(userId, userUpdates, {
      new: true,
      runValidators: true,
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Update the FighterProfile document
    const fighterProfile = await FighterProfile.findOneAndUpdate(
      { userId },
      fighterUpdates,
      { new: true, runValidators: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Fighter Profile updated successfully',
      data: { user, fighterProfile },
    })
  } catch (error) {
    console.error('Update error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while updating fighter profile',
    })
  }
}
