const mongoose = require('mongoose')

const suspensionSchema = new mongoose.Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Pending', 'Closed'],
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
      set: (v) => (v === '' ? null : v),
    },

    description: {
      type: String,
      required: false,
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
    medicalClearance: {
      type: Boolean,
      default: false,
    },
    medicalDocument: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Suspension', suspensionSchema)
