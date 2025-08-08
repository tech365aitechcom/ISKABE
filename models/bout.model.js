const mongoose = require('mongoose')

const boutSchema = new mongoose.Schema(
  {
    bracket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bracket',
      required: true,
    },
    boutNumber: Number,
    sport: String,
    ruleStyle: String,
    ageClass: String,
    weightClass: {
      min: Number,
      max: Number,
    },
    numberOfRounds: Number,
    roundDuration: Number,
    notes: String,
    startDate: {
      type: Date,
      required: true,
    },
    redCorner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
    },
    blueCorner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
    },
    fight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fight',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Bout', boutSchema)
