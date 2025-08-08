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
      ref: 'Registration',
    },
    resultMethod: {
      type: String,
      enum: [
        'Decision',
        'TKO',
        'KO',
        'Draw',
        'Disqualified',
        'Forfeit',
        'No Contest',
        'Technical Decision',
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
    notes: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Fight', fightSchema)
