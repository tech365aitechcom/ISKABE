const mongoose = require('mongoose')

const fighterCheckInSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    fighter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FighterProfile',
      required: true,
    },
    category: {
      type: String,
      enum: ['Novice', 'Amateur', 'Pro'],
      required: true,
    },
    weighInValue: {
      type: Number, // lbs
      required: true,
      min: 0,
    },
    isOfficialWeight: {
      type: Boolean,
      default: false,
    },
    weighInDate: {
      type: Date,
      default: Date.now,
    },
    checkInStatus: {
      type: String,
      enum: ['Checked In', 'Not Checked', 'No Show'],
      default: 'Not Checked',
    },
    heightInInches: {
      type: Number,
    },
    fightRecord: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
    },
    trainingFacility: {
      type: String,
    },
    requiredPaymentsPaid: {
      type: String,
      enum: ['All', 'None', 'Partial'],
      default: 'None',
    },
    paymentNotes: {
      type: String,
    },
    medicalExamDone: {
      type: Boolean,
      default: false,
    },
    physicalRenewalDate: {
      type: Date,
    },
    licenseRenewalDate: {
      type: Date,
    },
    hotelConfirmationNumber: {
      type: String,
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
        match: /^[\d\-+()\s]+$/,
      },
    },
    lastEvent: {
      type: String,
    },
    skillRank: {
      type: String,
    },
    parentalConsentUploaded: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('FighterCheckIn', fighterCheckInSchema)
