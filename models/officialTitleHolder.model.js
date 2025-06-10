const mongoose = require('mongoose')

const OfficialTitleHolderSchema = new mongoose.Schema(
  {
    proClassification: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    ageClass: {
      type: String,
      required: true,
    },
    weightClass: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    fighter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FighterProfile',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model(
  'OfficialTitleHolder',
  OfficialTitleHolderSchema
)
