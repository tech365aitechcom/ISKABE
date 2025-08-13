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
    startDayNumber: {
      type: Number,
    },
    boutRound: {
      type: Number,
    },
    maxCompetitors: {
      type: Number,
    },
    group: String, // Optional: "Group A", "Group B"
    bracketCriteria: String,
    proClass: {
      type: String,
      enum: ['Pro', 'Amateur'],
    },
    title: {
      type: String,
      enum: [
        'World Championship',
        'Continental Championship',
        'National Championship',
        'Multi-State Championship',
        'State Championship',
        'Multi-County Championship',
        'Tribal Championship',
        'County Championship',
        'Promotion Title',
        'Metro Championship',
        'City Championship',
        'Local Championship',
      ],
    },
    status: {
      type: String,
      enum: [
        'Open',
        'Started',
        'Undefined',
        'Cancelled',
        'Completed',
        'Not Ready Yet',
        'Closed To New Participants',
      ],
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
        ref: 'Registration',
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
