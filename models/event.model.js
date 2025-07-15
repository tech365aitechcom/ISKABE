const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['Semi Contact', 'Full Contact', 'Point Sparring'],
    },
    koPolicy: {
      type: String,
      required: true,
      enum: ['Allowed', 'Not Allowed'],
      default: 'Not Allowed',
    },
    sportType: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v >= this.startDate
        },
        message: 'End date must be after start date',
      },
    },
    registrationStartDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v <= this.startDate
        },
        message: 'Registration start must be before event start',
      },
    },
    registrationDeadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v <= this.startDate
        },
        message: 'Deadline must be before event start',
      },
    },
    weighInDateTime: {
      type: Date,
      required: true,
    },
    rulesMeetingTime: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
        },
        message: 'Time must be in HH:MM format',
      },
    },
    spectatorDoorsOpenTime: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
        },
        message: 'Time must be in HH:MM format',
      },
    },
    fightStartTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
        },
        message: 'Time must be in HH:MM format',
      },
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    promoter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoterProfile',
      required: true,
    },
    iskaRepName: String,
    iskaRepPhone: {
      type: String,
      match: /^[0-9\-\+]{9,15}$/,
    },

    briefDescription: {
      type: String,
      required: true,
      maxlength: 255,
    },
    fullDescription: {
      type: String,
      maxlength: 1000,
    },
    rules: {
      type: String,
    },

    matchingMethod: {
      type: String,
      required: true,
    },
    externalURL: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v)
        },
        message: 'Must be a valid URL',
      },
    },
    ageCategories: [
      {
        type: String,
      },
    ],
    weightClasses: [
      {
        type: String,
      },
    ],
    sectioningBodyName: {
      type: String,
      required: true,
    },
    sectioningBodyDescription: {
      type: String,
      maxlength: 1000,
    },
    sectioningBodyImage: {
      type: String,
    },
    registeredParticipants: {
      type: Number,
      default: 0,
    },
    isDraft: {
      type: Boolean,
      default: true,
    },
    publishBrackets: {
      type: Boolean,
      default: false,
    },
    tournamentSettings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentSettings',
    },
    spectatorTicketConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpectatorTicket',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Event', eventSchema)
