const FighterProfile = require('../models/fighterProfile.model')
const User = require('../models/user.model')

exports.updateFighterProfileById = async (req, res) => {
  try {
    const { id: userId } = req.user

    const payload = req.body

    // Define model-specific fields
    const userFields = [
      'fullName',
      'nickName',
      'userName',
      'profilePhoto',
      'gender',
      'dateOfBirth',
      'phoneNumber',
      'email',
    ]

    const fighterFields = [
      'height',
      'weight',
      'weightClass',
      'location',
      'instagram',
      'youtube',
      'facebook',
      'bio',
      'gymInfo',
      'coachName',
      'affiliations',
      'trainingExperience',
      'credentials',
      'nationalRank',
      'globalRank',
      'achievements',
      'recordString',
      'mediaGallery',
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
      message: 'User and Fighter Profile updated successfully',
      data: { user, fighterProfile },
    })
  } catch (error) {
    console.error('Update error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user and fighter profile',
    })
  }
}
