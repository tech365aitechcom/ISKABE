const mongoose = require('mongoose')

const ticketTierSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 250,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    remaining: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.capacity
        },
        message: 'Remaining must be less than or equal to capacity',
      },
    },
    availabilityMode: {
      type: String,
      enum: ['Online', 'OnSite', 'Both'],
      required: true,
    },
    salesStartDate: {
      type: Date,
      required: true,
      // validate: {
      //   validator: function (v) {
      //     if (!v) return true
      //     const today = new Date()
      //     today.setUTCHours(0, 0, 0, 0)
      //     const salesDate = new Date(v)
      //     salesDate.setUTCHours(0, 0, 0, 0)
      //     return salesDate >= today
      //   },

      //   message: 'Sales start date must be today or later',
      // },
    },
    salesEndDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return !v || v >= this.salesStartDate
        },
        message: 'Sales end date must be after start date',
      },
    },
    limitPerUser: {
      type: Number,
      min: 0,
      default: 0, // 0 = no limit
    },
    refundPolicyNotes: {
      type: String,
      maxlength: 150,
      trim: true,
    },
  },
  { _id: false }
)

const spectatorTicketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    tiers: {
      type: [ticketTierSchema],
      default: [],
      validate: {
        validator: function (tiers) {
          const orders = tiers.map((t) => t.order)
          return new Set(orders).size === orders.length // Unique order values
        },
        message: 'Ticket orders must be unique',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('SpectatorTicket', spectatorTicketSchema)
