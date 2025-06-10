const { roles } = require('../constant')
const NewsPost = require('../models/news.model')

exports.createNews = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create news posts.',
      })
    }

    const newsPost = new NewsPost({
      ...req.body,
      createdBy: userId,
    })

    await newsPost.save()

    res.status(201).json({
      message: 'News post created successfully',
      data: newsPost,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error creating news post' })
  }
}

exports.getAllNews = async (req, res) => {
  try {
    const { category, search, isPublished, page = 1, limit = 10 } = req.query
    const filter = {}
    if (category) filter.category = category

    if (isPublished === 'true') {
      filter.status = 'Published'
    } else if (isPublished === 'false') {
      filter.status = 'Draft'
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await NewsPost.countDocuments(filter)

    const news = await NewsPost.find(filter)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      message: 'News list fetched',
      data: {
        items: news,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching news posts' })
  }
}

exports.getNewsById = async (req, res) => {
  try {
    const newsPost = await NewsPost.findById(req.params.id).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!newsPost) {
      return res.status(404).json({ error: 'News post not found' })
    }
    res.json({
      success: true,
      message: 'News post fetched successfully',
      data: newsPost,
    })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching news post' })
  }
}

exports.updateNews = async (req, res) => {
  try {
    const newsPost = await NewsPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!newsPost) {
      return res.status(404).json({ error: 'News post not found' })
    }
    res.json({ message: 'News post updated successfully', data: newsPost })
  } catch (error) {
    res.status(500).json({ error: 'Error updating news post' })
  }
}

exports.deleteNews = async (req, res) => {
  try {
    const newsPost = await NewsPost.findByIdAndDelete(req.params.id)
    if (!newsPost) {
      return res.status(404).json({ error: 'News post not found' })
    }
    res.json({
      success: true,
      message: 'News post deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: 'Error deleting news post' })
  }
}

exports.togglePublishStatus = async (req, res) => {
  try {
    const newsPost = await NewsPost.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    if (!newsPost) {
      return res.status(404).json({ error: 'News post not found' })
    }
    res.json({
      message: 'News post status updated successfully',
      data: newsPost,
    })
  } catch (error) {
    res.status(500).json({ error: 'Error updating news post status' })
  }
}
