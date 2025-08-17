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
    sequenceNumber: {
      type: Number,
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
    group: Number,
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
    ring: Number,
    weightClass: {
      min: Number,
      max: Number,
    },
    fighters: [
      {
        fighter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Registration',
          required: true,
        },
        seed: {
          type: Number,
          required: true,
        },
        _id: false,
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
