const mongoose = require('mongoose')

const redemptionLogSchema = new mongoose.Schema(
  {
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    quantity: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ['QR', 'Manual'],
      default: 'Manual',
    },
  },
  { _id: false }
)

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
    transactionId: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },
    redemptionStatus: {
      type: String,
      enum: ['Not Redeemed', 'Partially Redeemed', 'Redeemed'],
      default: 'Not Redeemed',
    },
    redeemedQuantity: {
      type: Number,
      default: 0,
    },
    redeemedAt: {
      type: Date,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    entryMode: {
      type: String,
      enum: ['QR', 'Manual'],
      default: 'Manual',
    },
    redemptionLogs: [redemptionLogSchema],
  },
  { timestamps: true }
)

module.exports = mongoose.model(
  'SpectatorTicketPurchase',
  spectatorTicketPurchaseSchema
)
