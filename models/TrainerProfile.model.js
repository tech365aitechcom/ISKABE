const mongoose = require('mongoose')

const trainerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Personal Info
    height: Number,
    weight: Number,
    // Gym Info
    gymName: String,
    gymLocation: String,
    // Experience Info
    yearsOfExperience: String,
    trainerType: String,
    preferredRuleSets: [String],

    // Credentials
    certification: String,
    bio: String,
    instagram: String,
    facebook: String,
    youtube: String,

    affiliatedFighters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FighterProfile',
      },
    ],

    // Emergency Info
    emergencyContactName: {
      type: String,
    },
    emergencyContactNumber: {
      type: String,
    },

    // Event Association
    associatedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    accreditationType: String,
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema)
