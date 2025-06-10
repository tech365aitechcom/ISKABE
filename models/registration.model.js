const mongoose = require('mongoose')

const registrationSchema = new mongoose.Schema(
  {
    registrationType: {
      type: String,
      enum: ['trainer', 'fighter'],
      required: true,
    },

    // Personal Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dateOfBirth: { type: Date, required: true },

    // Contact Info
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },

    // Address
    street1: { type: String, required: true },
    street2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },

    // Trainer-specific
    fightersRepresented: { type: String }, // one per line (textarea)
    waiverAgreed: { type: Boolean },
    signature: { type: String },

    // Fighter-specific
    profilePhoto: { type: String }, // store image URL or path
    heightUnit: { type: String, enum: ['Inches', 'CM'] },
    height: { type: Number },
    walkAroundWeight: { type: Number },
    weightUnit: { type: String, enum: ['LBS', 'KG'] },
    proFighter: { type: Boolean },
    paidToFight: { type: Boolean },
    systemRecord: { type: String, default: '0-0-0' },
    additionalRecords: [
      {
        style: String,
        wins: Number,
        losses: Number,
        draws: Number,
      },
    ],
    ruleStyle: { type: String },
    weightClass: { type: String },
    skillLevel: {
      type: String,
      enum: ['Class A', 'Class B', 'Class C', 'Novice'],
    },
    bracketLabel: { type: String },
    trainerName: { type: String },
    gymName: { type: String },
    trainerPhone: { type: String },
    trainerEmail: { type: String },
    confirmTrainerEmail: { type: String },
    isAdult: { type: Boolean },
    status: {
      type: String,
      enum: ['Pending', 'Rejected', 'Verified'],
      default: 'Pending',
    },
    // Waiver
    legalDisclaimerAccepted: { type: Boolean },
    waiverSignature: { type: String },

    // Payment
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    cashCode: String,
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Registration', registrationSchema)
