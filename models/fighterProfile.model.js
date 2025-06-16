const mongoose = require('mongoose')

const fighterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    height: String,
    weight: Number,
    weightClass: String,

    instagram: String,
    youtube: String,
    facebook: String,

    // Fight Background
    bio: String,
    primaryGym: String,
    coachName: String,
    affiliations: String,
    trainingExperience: String,
    trainingStyle: String,
    credentials: String,

    // Career
    nationalRank: String,
    globalRank: String,
    achievements: String,
    recordHighlight: String,

    // Media
    imageGallery: [String], // URLs or paths
    videoHighlight: String,

    // Compliance
    medicalCertificate: String,
    licenseDocument: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('FighterProfile', fighterProfileSchema)
