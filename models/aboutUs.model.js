const mongoose = require('mongoose')

const AboutSchema = new mongoose.Schema({
  pageTitle: {
    type: String,
    required: true,
    default: 'About International Kickboxing Federation',
  },
  coverImage: {
    type: String, // Store the path to the uploaded image
    required: true,
  },
  missionStatement: {
    type: String,
    required: true,
    minlength: 10,
  },
  organizationHistory: {
    type: String,
    required: true,
    minlength: 20,
  },
  leadershipTeam: [
    {
      name: {
        type: String,
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
      photo: {
        type: String, // Store the path to the uploaded image
        required: true,
      },
    },
  ],
  contactURL: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v),
      message: 'Must be a valid URL',
    },
    default: 'https://ikf.com/contact',
  },
  facebookURL: {
    type: String,
    validate: {
      validator: (v) =>
        /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9\.]*$/.test(v),
      message: 'Must be a valid Facebook link',
    },
    default: '',
  },
  instagramURL: {
    type: String,
    validate: {
      validator: (v) =>
        /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_\.]*$/.test(v),
      message: 'Must be a valid Instagram link',
    },
    default: '',
  },
  twitterURL: {
    type: String,
    validate: {
      validator: (v) =>
        /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]*$/.test(v),
      message: 'Must be a valid X (Twitter) link',
    },
    default: '',
  },
  termsConditionsPDF: {
    type: String, // Store the path to the uploaded PDF
    required: true,
  },
  privacyPolicyPDF: {
    type: String, // Store the path to the uploaded PDF
    required: true,
  },
  copyrightNoticePDF: {
    type: String, // Store the path to the uploaded PDF
    required: true,
  },
  platformVersion: {
    type: String,
    required: true,
    default: 'v2.5.0',
    validate: {
      validator: (v) =>
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(
          v
        ),
      message: 'Must be a valid semantic version (x.y.z)',
    },
  },
  published: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('About', AboutSchema)
