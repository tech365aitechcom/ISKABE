const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Core Transaction Info
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    transactionType: {
      type: String,
      enum: ['Product Purchase', 'Event Registration', 'Membership Fee'],
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Refunded', 'Pending', 'Failed'],
      required: true,
      default: 'Paid',
    },
    paymentMethod: {
      type: String, // e.g., 'Credit Card (Visa)', 'PayPal'
      required: true,
    },

    // Item Information (Optional for non-item purchases)
    itemName: {
      type: String,
    },
    itemSKU: {
      type: String,
    },
    description: {
      type: String,
    },

    // Event Info (Optional, only for event-related purchases)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },

    entryType: {
      type: String,
      enum: ['Fighter', 'Trainer', 'Spectator'],
    },

    invoice: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
)

module.exports = mongoose.model('Purchase', purchaseSchema)
