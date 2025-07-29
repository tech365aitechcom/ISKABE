const mongoose = require('mongoose')

const cashCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      minlength: 4,
      maxlength: 6,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    role: {
      type: String,
      enum: ['spectator', 'fighter', 'trainer'],
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    name: {
      type: String,
    },

    email: {
      type: String,
      match: /.+\@.+\..+/,
    },

    phoneNumber: {
      type: String,
    },

    paymentType: {
      type: String,
      enum: ['cash', 'comp', 'manual', 'other'],
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentNotes: {
      type: String,
      maxlength: 200,
    },
    eventDateCode: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    redemptionStatus: {
      type: String,
      enum: ['Not Yet', 'Checked-In'],
      default: 'Not Yet',
    },

    redeemedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('CashCode', cashCodeSchema)
