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
    profilePhoto: String, // Image URL or file path
    height: Number,
    weight: Number,
    // Gym Info
    gymName: String,
    gymLocation: String,
    // Experience Info
    yearsOfExperience: String,
    trainerTypes: [String],
    preferredRuleSets: [String],

    // Credentials
    certifications: [String], // Array of file paths or URLs
    bio: String,
    instagram: String,
    facebook: String,

    affiliatedFighters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fighter',
      },
    ],

    // Emergency Info
    emergencyContactName: {
      type: String,
      required: true,
    },
    emergencyContactNumber: {
      type: String,
      required: true,
    },

    // Event Association
    associatedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    accreditationType: String,

    medicalDocuments: [String],
  },
  { timestamps: true }
)

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema)
