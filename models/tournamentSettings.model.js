const mongoose = require('mongoose')

const DetailedRegistrationFeeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Bracket', 'Single Bout'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    minPurchase: {
      type: Number,
      required: true,
      min: 1,
    },
    maxPurchase: {
      type: Number,
      min: 1,
    },
    sport: {
      type: String,
      default: null,
    },
  },
  { _id: false }
)

const TournamentSettingsSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'Event',
    },

    simpleFees: {
      fighterFee: {
        type: Number,
        required: true,
        validate: (v) => v >= -1,
      },
      trainerFee: {
        type: Number,
        required: true,
        validate: (v) => v >= -1,
      },
      currency: {
        type: String,
        required: true,
        enum: ['$', '€', '£', '₹', '¥'],
      },
    },

    detailedFees: {
      type: [DetailedRegistrationFeeSchema],
      default: [],
    },

    // Bracket Settings
    bracketSettings: {
      maxFightersPerBracket: {
        type: Number,
        required: true,
      },
    },

    // Rule Styles
    ruleStyles: {
      semiContact: {
        type: [String],
        default: [],
      },
      fullContact: {
        type: [String],
        default: [],
      },
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

module.exports = mongoose.model('TournamentSettings', TournamentSettingsSchema)
