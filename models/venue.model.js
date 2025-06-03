const mongoose = require('mongoose')

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
    },
    address: {
      street1: {
        type: String,
        required: [true, 'Street address is required'],
      },
      street2: {
        type: String,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
      },
    },
    contactName: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    contactEmail: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true // Optional field
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v)
        },
        message: 'Please enter a valid email address',
      },
    },
    capacity: {
      type: Number,
    },
    mapLink: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true // Optional field
          return /^(https?:\/\/)?(www\.)?(google\.com|maps\.google\.com)/.test(
            v
          )
        },
        message: 'Please enter a valid Google Maps link',
      },
    },
    media: {
      type: [String],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Cancelled', 'Upcoming'],
    },
    autoStatusChange: {
      type: Boolean,
      default: false,
    },
    scheduledStatus: {
      type: String,
      // enum: ['Active', 'Inactive', 'Cancelled', 'Upcoming', 'Archived'],
    },
    statusChangeDate: {
      type: Date,
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

module.exports = mongoose.model('Venue', venueSchema)
