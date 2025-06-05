const User = require('../models/user.model')
const TrainerProfile = require('../models/trainerProfile.model')

exports.updateTrainerProfileById = async (req, res) => {
  try {
    const { id: userId } = req.user

    const payload = req.body

    // --- Define the keys for User and TrainerProfile ---
    const userFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'profilePhoto',
      'gender',
      'dateOfBirth',
      'country',
    ]

    const trainerFields = [
      'height',
      'weight',
      'gymName',
      'gymLocation',
      'yearsOfExperience',
      'trainerType',
      'preferredStyles',
      'certifications',
      'bioAchievements',
      'instagramUrl',
      'facebookUrl',
      'youtubeUrl',
      'affiliatedFighters',
      'emergencyContactName',
      'emergencyContactNumber',
      'associatedEvents',
      'accreditationType',
      'medicalDocs',
    ]

    // --- Extract user and trainer updates ---
    const userUpdates = {}
    const trainerUpdates = {}

    for (const key in payload) {
      if (userFields.includes(key)) {
        userUpdates[key] = payload[key]
      } else if (trainerFields.includes(key)) {
        trainerUpdates[key] = payload[key]
      }
    }

    // --- Transform specific fields if needed ---
    if (
      trainerUpdates.trainerType &&
      typeof trainerUpdates.trainerType === 'string'
    ) {
      trainerUpdates.trainerTypes = trainerUpdates.trainerType
        .split(',')
        .map((type) => type.trim())
      delete trainerUpdates.trainerType
    }

    if (
      trainerUpdates.preferredStyles &&
      typeof trainerUpdates.preferredStyles === 'string'
    ) {
      trainerUpdates.preferredRuleSets = trainerUpdates.preferredStyles
        .split(',')
        .map((style) => style.trim())
      delete trainerUpdates.preferredStyles
    }

    // --- Update User model ---
    const user = await User.findByIdAndUpdate(userId, userUpdates, {
      new: true,
      runValidators: true,
    }).select('-password -resetPasswordToken -resetPasswordExpire')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // --- Update TrainerProfile model ---
    const trainerProfile = await TrainerProfile.findOneAndUpdate(
      { userId },
      trainerUpdates,
      { new: true, runValidators: true, upsert: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Trainer profile and user info updated successfully',
      data: {
        user,
        trainerProfile,
      },
    })
  } catch (error) {
    console.error('Error updating trainer profile:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while updating trainer profile',
    })
  }
}
