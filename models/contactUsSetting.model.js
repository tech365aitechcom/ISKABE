const mongoose = require('mongoose')

const ContactSettingsSchema = new mongoose.Schema(
  {
    topics: [
      {
        type: String,
        unique: true,
      },
    ],
    enableCaptcha: { type: Boolean, default: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    googleMapEmbedUrl: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ContactSettings', ContactSettingsSchema)
