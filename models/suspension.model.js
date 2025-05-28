const mongoose = require('mongoose')

const suspensionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      required: true,
    },

    type: {
      type: String,
      enum: ['Disciplinary', 'Medical'],
      required: true,
    },

    incidentDate: {
      type: Date,
      required: true,
    },

    sportingEventUID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },

    description: {
      type: String,
      required: true,
      minlength: 10,
    },

    daysWithoutTraining: {
      type: Number,
      min: 0,
      default: null,
    },

    daysBeforeCompeting: {
      type: Number,
      min: 0,
      default: null,
    },

    indefinite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Suspension', suspensionSchema)
