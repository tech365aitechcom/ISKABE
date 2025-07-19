const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const FighterProfile = require('./fighterProfile.model')

const userSchema = new mongoose.Schema(
  {
    profilePhoto: { type: String },

    firstName: {
      type: String,
      required: [true, 'First Name is required'],
      match: [/^[A-Za-z]+$/, 'First Name must contain only letters'],
      trim: true,
    },
    middleName: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Middle Name must contain only letters'],
      trim: true,
    },
    lastName: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Last Name must contain only letters'],
      trim: true,
    },
    nickName: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Nick Name must contain only letters'],
      trim: true,
    },
    userName: { type: String, trim: true },
    suffix: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Suffix must contain only letters'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email Address is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email address'],
    },

    role: {
      type: String,
      enum: ['user', 'parent', 'fighter', 'trainer', 'promoter', 'superAdmin'],
      required: [true, 'Role is required'],
    },

    gender: { type: String, enum: ['Male', 'Female', 'Other'] },

    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (dob) {
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          return age >= 13
        },
        message: 'You must be at least 13 years old',
      },
    },

    country: { type: String, required: [true, 'Country is required'] },
    state: { type: String },
    city: { type: String },
    street1: { type: String },
    street2: { type: String },
    postalCode: { type: String },

    phoneNumber: {
      type: String,
      required: [true, 'Phone Number is required'],
      validate: {
        validator: function (value) {
          return /^\+?[0-9]{10,15}$/.test(value)
        },
        message: 'Please enter a valid phone number',
      },
    },

    isPremium: { type: Boolean, default: false },
    about: {
      type: String,
      maxlength: [500, 'About Us must be max 500 characters'],
    },
    adminNotes: {
      type: String,
      maxlength: [500, 'Notes must be max 500 characters'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (value) {
          return /\d/.test(value)
        },
        message: 'Password must contain at least one number',
      },
    },

    termsAgreed: {
      type: Boolean,
      required: [true, 'You must agree to the terms and conditions'],
    },

    isVerified: { type: Boolean, default: false },
    isSuspended: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    communicationPreferences: {
      type: [String],
      default: [],
    },
    lastLogin: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual for fighterProfile
userSchema.virtual('fighterProfile', {
  ref: 'FighterProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
})

// Virtual for trainerProfile
userSchema.virtual('trainerProfile', {
  ref: 'TrainerProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
})

// Virtual for suspension
userSchema.virtual('suspension', {
  ref: 'Suspension',
  localField: '_id',
  foreignField: 'person',
})

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Post-save hook to auto-create fighter/trainer profile
userSchema.post('save', async function (doc, next) {
  try {
    if (doc.role === 'fighter') {
      const exists = await FighterProfile.findOne({ userId: doc._id })
      if (!exists) {
        await FighterProfile.create({ userId: doc._id })
      }
    }
    next()
  } catch (err) {
    next(err)
  }
})

module.exports = mongoose.model('User', userSchema)
