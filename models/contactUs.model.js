const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    subIssue: { type: String },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    state: {
      type: String,
      enum: ['New', 'In Progress', 'Closed'],
      default: 'New',
    },
    responseDate: {
      type: Date,
    },
    responseSent: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Contact', contactSchema)
