const User = require('../models/user.model')
const TrainerProfile = require('../models/TrainerProfile.model')
const Suspension = require('../models/suspension.model')

exports.getAllTrainerProfiles = async (req, res) => {
  try {
    const trainerProfiles = await TrainerProfile.find().populate(
      'userId',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    return res.status(200).json({ success: true, data: trainerProfiles })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

exports.createTrainerProfile = async (req, res) => {
  try {
    const { id: userId } = req.user

    const trainer = new TrainerProfile({
      ...req.body,
      userId,
    })

    await trainer.save()

    return res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      data: trainer,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

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
      'preferredRuleSets',
      'certification',
      'bio',
      'instagram',
      'facebook',
      'youtube',
      'affiliatedFighters',
      'emergencyContactName',
      'emergencyContactNumber',
      'associatedEvents',
      'accreditationType',
      'isSuspended',
      'isDraft',
    ]

    // --- Suspension logic ---
    if (payload.isSuspended) {
      const existingSuspension = await Suspension.findOne({
        person: userId,
        status: { $in: ['Active', 'Pending'] },
      })

      const suspensionData = {
        person: userId,
        status: 'Active',
        type: payload.suspensionType,
        incidentDate: payload.suspensionStartDate,
        description: payload.suspensionNotes,
        daysWithoutTraining: payload.daysWithoutTraining,
        indefinite: payload.indefinite,
        medicalClearance: payload.medicalClearance,
        medicalDocument: payload.medicalDocument,
        createdBy: userId,
      }

      if (existingSuspension) {
        // Update existing suspension
        await Suspension.findByIdAndUpdate(
          existingSuspension._id,
          suspensionData,
          {
            new: true,
            runValidators: true,
          }
        )
      } else {
        // Create new suspension
        await Suspension.create(suspensionData)
      }
    }

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

    if (
      trainerUpdates.preferredRuleSets &&
      typeof trainerUpdates.preferredRuleSets === 'string'
    ) {
      trainerUpdates.preferredRuleSets = trainerUpdates.preferredRuleSets
        .split(',')
        .map((style) => style.trim())
      delete trainerUpdates.preferredRuleSets
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
      message: 'Trainer profile updated successfully',
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
