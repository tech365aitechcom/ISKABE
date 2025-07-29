const mongoose = require('mongoose')

const bracketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    bracketNumber: {
      type: Number,
      required: true,
    },
    divisionTitle: {
      type: String,
      required: true,
    },
    group: String, // Optional: "Group A", "Group B"
    proClass: {
      type: String,
      enum: ['Pro', 'Amateur'],
    },
    title: {
      type: String,
      enum: ['Championship', 'Exhibition', 'Local Championship'],
    },
    status: {
      type: String,
      enum: ['Open', 'Started', 'Completed'],
      default: 'Open',
    },
    ageClass: String,
    sport: String,
    ruleStyle: String, // e.g., "Muay Thai", "Point Sparring"
    ring: String,
    weightClass: {
      min: Number,
      max: Number,
    },
    fightStartTime: {
      type: Date,
    },
    weighInTime: {
      type: Date,
    },
    fighters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FighterProfile',
      },
    ],
    bouts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bout',
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Bracket', bracketSchema)
