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

    heroBanner: {
      platformName: { type: String, maxlength: 50 },
      tagline: { type: String, maxlength: 100 },
      heroImage: String,
      cta: CTASchema,
      position: Number,
    },

    topFighters: {
      sectionTitle: String,
      fighterIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      position: Number,
    },

    upcomingEvents: {
      sectionTitle: String,
      eventIds: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
      ctaButtons: [CTASchema],
      viewCalendarText: { type: String },
      position: Number,
    },

    latestMedia: {
      sectionTitle: String,
      mediaItems: [
        {
          mediaType: { type: String, enum: ['image', 'video'], required: true },
          url: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      position: Number,
    },

    eventResults: {
      sectionTitle: String,
      resultIds: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
      position: Number,
    },

    newsPosts: {
      sectionTitle: String,
      newsIds: [{ type: Schema.Types.ObjectId, ref: 'News' }],
      position: Number,
    },

    footer: {
      footerLinks: [
        {
          label: String,
          route: String,
        },
      ],
      socialMedia: [
        {
          platform: String,
          icon: String,
          link: String,
        },
      ],
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
