const mongoose = require('mongoose')

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { _id: true }
)

const ContactSettingsSchema = new mongoose.Schema(
  {
    emailRecipients: [{ type: String, required: true }],
    subjects: [SubjectSchema],
    enableCaptcha: { type: Boolean, default: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    googleMapEmbedUrl: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ContactSettings', ContactSettingsSchema)
