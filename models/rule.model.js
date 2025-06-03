const mongoose = require('mongoose')

const RuleSchema = new mongoose.Schema(
  {
    categoryTabName: {
      type: String,
      required: true,
    },
    subTabName: {
      type: String,
      required: true,
    },
    subTabRuleDescription: {
      type: String,
      required: true,
      maxlength: 1500,
    },
    ruleTitle: {
      type: String,
      required: true,
      maxlength: 100,
    },
    ruleDescription: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    pdfUploadUrl: {
      type: String,
      required: false,
      match: /\.pdf$/,
    },
    videoLink: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(
            v
          )
        },
        message: 'Video link must be from YouTube or Vimeo',
      },
    },
    sortOrder: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Rule', RuleSchema)
