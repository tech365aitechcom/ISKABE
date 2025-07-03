const mongoose = require('mongoose')
const validator = require('validator')

const trainerSchema = new mongoose.Schema({
  existingTrainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainerProfile',
  }, // for searchable dropdown (optional)
  name: { type: String, trim: true, maxlength: 100 }, // required if no existingTrainerId
  role: { type: String, trim: true, maxlength: 100 },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => !v || validator.isEmail(v),
      message: 'Invalid email format for trainer',
    },
  },
  phone: { type: String, trim: true },
  bio: { type: String, maxlength: 500, trim: true },
  image: { type: String },
})

const fighterSchema = new mongoose.Schema({
  existingFighterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FighterProfile',
  }, // for searchable dropdown (optional)
  name: { type: String, trim: true, maxlength: 100 }, // required if no existingFighterId
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  age: {
    type: Number,
    min: 18,
    validate: {
      validator: (v) => v === undefined || v >= 18,
      message: 'Fighter must be at least 18 years old',
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => !v || validator.isEmail(v),
      message: 'Invalid email format for trainer',
    },
  },
  phone: { type: String, trim: true },
  record: {
    type: String,
    trim: true,
    match: [/^\d+-\d+-\d+$/, 'Fighter record must be in X–Y–Z format'],
  },
  bio: { type: String, maxlength: 500, trim: true },
  image: { type: String },
})

const trainingFacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    logo: {
      type: String,
    },
    martialArtsStyles: {
      type: [String],
    },
    email: {
      type: String,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
    },

    address: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },

    // Facility Description & Branding
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    externalWebsite: {
      type: String,
    },
    imageGallery: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 images allowed in gallery',
      },
      default: [],
    },
    videoIntroduction: {
      type: String,
      validate: {
        validator: (v) =>
          !v || /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v),
        message: 'Video URL must be a valid YouTube link',
      },
    },

    // Trainers & Fighters Association
    trainers: {
      type: [trainerSchema],
      default: [],
    },
    fighters: {
      type: [fighterSchema],
      default: [],
    },

    // Invite System
    sendInvites: {
      type: Boolean,
      default: false,
    },

    // Admin Section
    facilityStatus: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    adminApproveStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    isAdminApprovalRequired: {
      type: Boolean,
      default: false,
    },
    termsAgreed: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('TrainingFacility', trainingFacilitySchema)
