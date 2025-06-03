const mongoose = require('mongoose')
const { Schema } = mongoose

const NewsPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      minlength: 10,
    },
    category: {
      type: String,
      required: true,
      enum: ['Announcement', 'Rule Update', 'Interview', 'Media'],
    },
    publishDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'Draft',
      enum: ['Draft', 'Published'],
    },
    coverImage: {
      type: String,
    },
    videoEmbedLink: {
      type: String,
      match: /^https:\/\/youtube\.com\/embed\//,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('News', NewsPostSchema)
