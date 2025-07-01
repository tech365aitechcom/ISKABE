const mongoose = require('mongoose')
const { Schema } = mongoose

const MenuItemSchema = new Schema(
  {
    label: { type: String, required: true },
    linkType: { type: String, enum: ['route', 'url', 'modal'], required: true },
    destination: { type: String, required: true },
    openInNewTab: { type: Boolean, default: false },
    visibilityRole: {
      type: String,
      enum: ['everyone', 'loggedIn', 'admin'],
      required: true,
    },
    sortOrder: { type: Number, required: true },
    status: { type: Boolean, default: true },
  },
  { _id: false }
)

const CTASchema = new Schema(
  {
    text: { type: String, required: true },
    link: { type: String, required: true },
  },
  { _id: false }
)

const HomepageConfigSchema = new Schema(
  {
    logo: { type: String },
    menuItems: [MenuItemSchema],
    platformName: { type: String, maxlength: 50 },
    tagline: { type: String, maxlength: 100 },
    heroImage: String,
    cta: CTASchema,
    latestMedia: [
      {
        image: { type: String, required: true },
        title: { type: String, required: true },
        sortOrder: { type: Number, required: true },
      },
    ],
    upcomingEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    topFighters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FighterProfile',
      },
    ],
    latestNews: {
      type: Schema.Types.ObjectId,
      ref: 'News',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('HomepageConfig', HomepageConfigSchema)
