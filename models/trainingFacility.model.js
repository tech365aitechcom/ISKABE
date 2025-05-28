const mongoose = require('mongoose')
const validator = require('validator')

const trainerSchema = new mongoose.Schema({
  existingTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for searchable dropdown (optional)
  name: { type: String, trim: true, maxlength: 100 }, // required if no existingTrainerId
  roleTitle: { type: String, trim: true, maxlength: 100 },
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
  existingFighterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for searchable dropdown (optional)
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
    facilityName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    facilityLogoUrl: {
      type: String,
      required: true,
    },
    martialArtsStyles: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one martial arts style must be selected',
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email address'],
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d+$/.test(v),
        message: 'Phone number must contain only digits',
      },
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },

    // Facility Description & Branding
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    externalWebsite: {
      type: String,
      validate: {
        validator: (v) => !v || validator.isURL(v),
        message: 'Invalid URL format',
      },
    },
    imageGalleryUrls: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 images allowed in gallery',
      },
      default: [],
    },
    videoIntroductionUrl: {
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
      required: true,
      default: 'Active',
    },
    approvalStatus: {
      type: Boolean,
      required: true,
      default: false, // false = Pending, true = Approved
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('TrainingFacility', trainingFacilitySchema)
