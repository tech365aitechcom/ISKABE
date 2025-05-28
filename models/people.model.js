const mongoose = require('mongoose')
const validator = require('validator')

const peopleSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String, // store image URL or file path
      validate: {
        validator: function (v) {
          // simple check for image extension if provided
          return !v || /\.(jpg|jpeg|png)$/i.test(v)
        },
        message: 'Profile image must be a .jpg or .png file',
      },
    },
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
      required: [true, 'Last Name is required'],
      match: [/^[A-Za-z]+$/, 'Last Name must contain only letters'],
      trim: true,
    },
    suffix: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Suffix must contain only letters'],
      trim: true,
    },
    nickName: {
      type: String,
      match: [/^[A-Za-z]+$/, 'Nick Name must contain only letters'],
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
      default: 'user',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
      validate: {
        validator: function (dob) {
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          return age >= 18
        },
        message: 'You must be at least 18 years old',
      },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    about: {
      type: String,
      maxlength: [500, 'About Us must be max 500 characters'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes must be max 500 characters'],
    },
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
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    street1: {
      type: String,
    },
    street2: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('People', peopleSchema)
