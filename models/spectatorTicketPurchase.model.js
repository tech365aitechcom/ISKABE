const mongoose = require('mongoose')

const spectatorTicketPurchaseSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpectatorTicket',
      required: true,
    },
    tier: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    buyerType: {
      type: String,
      enum: ['guest', 'user'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestDetails: {
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    cashCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashCode',
      default: null,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
    qrCode: {
      type: String,
    },
    ticketCode: {
      type: String, // 4-digit alphanumeric or unique token
      required: true,
      unique: true,
    },
    redemptionStatus: {
      type: String,
      enum: ['Not Redeemed', 'Redeemed'],
      default: 'Not Redeemed',
    },
    redeemedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model(
  'SpectatorTicketPurchase',
  spectatorTicketPurchaseSchema
)
