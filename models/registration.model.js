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
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    email: {
      type: String,
      required: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Invalid email format',
      ],
    },
    dateOfBirth: { type: Date, required: true },
    phoneNumber: { type: String, required: true },

    // Address
    street1: { type: String, required: true },
    street2: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    postalCode: { type: String, required: true },

    // Trainer-specific
    fightersRepresented: { type: String },
    waiverAgreed: { type: Boolean },
    signature: { type: String },

    // Fighter-specific
    profilePhoto: { type: String },
    heightUnit: { type: String, enum: ['inches', 'cm'] },
    height: { type: Number },
    walkAroundWeight: { type: Number },
    weightUnit: { type: String, enum: ['LBS', 'KG'] },
    proFighter: { type: Boolean },
    paidToFight: { type: Boolean },
    systemRecord: { type: String, default: '0-0-0' },
    additionalRecords: {
      type: String,
    },
    ruleStyle: { type: String },
    weightClass: { type: String },
    skillLevel: {
      type: String,
      enum: [
        'Novice: 0-2 Years',
        'Class C: 2-4 Years (Cup Award)',
        'Class B: 4-6 Years (Belt Award)',
        'Class A: 6+ Years (Belt Award)',
      ],
    },
    trainerName: { type: String },
    gymName: { type: String },
    trainerPhone: { type: String },
    trainerEmail: { type: String },
    isAdult: { type: Boolean },

    // Waiver
    legalDisclaimerAccepted: { type: Boolean },
    waiverSignature: { type: String },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
    cashCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashCode',
      default: null,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Rejected', 'Verified'],
      default: 'Pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Registration', registrationSchema)
