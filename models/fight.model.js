const mongoose = require('mongoose')

const fightSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    bracket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bracket',
      required: true,
    },
    bout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bout',
      required: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed'],
      default: 'Scheduled',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FighterProfile',
    },
    resultMethod: {
      type: String,
      enum: [
        'Decision',
        'Knockout',
        'Walkover',
        'Disqualified',
        'Draw',
        'Other',
      ],
    },
    resultDetails: {
      round: Number,
      time: String,
      reason: String,
    },
    judgeScores: {
      red: [Number],
      blue: [Number],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Fight', fightSchema)
