const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')

const promoterSchema = new mongoose.Schema(
  {
    // Profile Info
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

    promoterName: {
      type: String,
      required: [true, 'Promoter Name is required'],
      unique: true,
      trim: true,
      match: [
        /^[A-Za-z\s]+$/,
        'Promoter Name must contain only alphabetic characters',
      ],
    },

    abbreviation: {
      type: String,
      required: [true, 'Abbreviation is required'],
      maxlength: [10, 'Abbreviation must be max 10 characters'],
      trim: true,
      uppercase: true,
    },

    websiteURL: {
      type: String,
      required: [true, 'Website URL is required'],
      validate: {
        validator: function (v) {
          return validator.isURL(v, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        },
        message: 'Must be a valid http or https URL',
      },
    },

    // Contact Info
    contactPersonName: {
      type: String,
      required: [true, 'Contact Person Name is required'],
      trim: true,
      match: [
        /^[A-Za-z\s]+$/,
        'Contact Person Name must contain only alphabetic characters',
      ],
    },

    mobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{10,15}$/.test(v)
        },
        message: 'Mobile Number must be 10-15 digits, valid phone format',
      },
    },

    alternateMobileNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\+?[0-9]{10,15}$/.test(v)
        },
        message:
          'Alternate Mobile Number must be 10-15 digits, valid phone format',
      },
    },

    emailAddress: {
      type: String,
      required: [true, 'Email Address is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email address'],
    },

    aboutUs: {
      type: String,
      maxlength: [500, 'About Us must be max 500 characters'],
    },

    // Compliance
    sanctioningBody: {
      type: String,
      required: [true, 'Sanctioning Body is required'],
      enum: ['IKF', 'WBC', 'USA Boxing'], // Add the full master list here
    },

    // Documents
    licenseCertificate: {
      type: String, // Store file path or URL
      required: [true, 'License / Certificate is required'],
      validate: {
        validator: function (v) {
          return /\.(pdf|jpg|jpeg|png)$/i.test(v)
        },
        message: 'License/Certificate must be .pdf, .jpg, or .png file',
      },
      maxLength: 10 * 1024 * 1024, // max 10MB, validation should be done during upload
    },

    // Address Info
    street1: {
      type: String,
      required: [true, 'Street 1 is required'],
    },
    street2: {
      type: String,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      enum: ['United States'], // Extend with master country list if needed
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      enum: ['California'], // Extend with master state list if needed
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      match: [/^[A-Za-z\s]+$/, 'City must contain only alphabetic characters'],
    },
    zipPostalCode: {
      type: String,
      required: [true, 'ZIP/Postal Code is required'],
      match: [/^\d{5,6}$/, 'ZIP/Postal Code must be 5 or 6 digits'],
    },

    // Access
    accountStatus: {
      type: String,
      required: [true, 'Account Status is required'],
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },

    assignRole: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['Promoter', 'Viewer', 'Admin'],
    },

    adminNotes: {
      type: String,
      maxlength: [300, 'Admin notes must be less than 300 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Password hashing before saving
promoterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Add method to compare password on login
promoterSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('Promoter', promoterSchema)
