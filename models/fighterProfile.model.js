const mongoose = require('mongoose')

const fighterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    nickname: String,

    height: String,
    weight: Number,
    weightClass: String,
    location: String,

    instagram: String,
    youtube: String,
    facebook: String,

    // Fight Background
    bio: String,
    primaryGym: String,
    coachName: String,
    affiliations: [String],
    trainingExperience: String,
    credentials: String,

    // Career
    nationalRank: Number,
    globalRank: Number,
    awards: [String],
    recordHighlights: [String],

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
