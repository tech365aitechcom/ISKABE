const mongoose = require('mongoose')

const promoterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Specific to promoter
    abbreviation: {
      type: String,
      required: true,
      maxlength: 10,
      trim: true,
      uppercase: true,
    },

    websiteURL: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/[\w.-]+(?:\.[\w\.-]+)+[/#?]?.*$/.test(v)
        },
        message: 'Invalid URL format',
      },
    },

    aboutUs: {
      type: String,
      maxlength: 500,
    },
    sanctioningBody: {
      type: String,
      required: true,
      enum: ['ISKA', 'WBC', 'USA Boxing', 'IKF'], // extend as needed
    },

    licenseCertificate: {
      type: String,
      validate: {
        validator: function (v) {
          return /\.(pdf|jpg|jpeg|png)$/i.test(v)
        },
        message: 'Must be a valid document/image file',
      },
    },

    accountStatus: {
      type: String,
      required: true,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },

    assignRole: {
      type: String,
      required: true,
      enum: ['Promoter', 'Viewer', 'Admin'],
    },

    adminNotes: {
      type: String,
      maxlength: 300,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PromoterProfile', promoterProfileSchema)
