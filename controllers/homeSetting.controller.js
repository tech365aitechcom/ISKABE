const { roles } = require('../constant')
const HomepageConfig = require('../models/homeSetting.model')
const News = require('../models/news.model')
const Event = require('../models/event.model')

exports.createHomePageConfig = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create.',
      })
    }
    const existing = await HomepageConfig.findOne()
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Settings already exist. Please update the existing settings.',
      })
    }
    const settings = new HomepageConfig({
      ...req.body,
      createdBy: userId,
    })

    await settings.save()

    res.status(201).json({
      success: true,
      message: 'Settings created successfully',
      data: settings,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getHomePageConfig = async (req, res) => {
  try {
    // Fetch homepage configuration
    const settings = await HomepageConfig.findOne()

    // Fetch the latest published news
    const latestNews = await News.findOne({
      status: 'Published',
      isDeleted: false,
    })
      .sort({ publishDate: -1 })
      .select('title category publishDate coverImage videoEmbedLink')
      .lean()

    // Fetch upcoming events (sorted by nearest startDate)
    const upcomingEvents = await Event.find({
      startDate: { $gte: new Date() },
      isDraft: false, // only published events
    })
      .sort({ startDate: 1 }) // soonest first
      .limit(4) // adjust how many events you want
      .select('name startDate endDate venue poster briefDescription')
      .populate('venue', 'name location') // populate venue name/location
      .lean()

    res.json({
      success: true,
      data: settings,
      latestNews,
      upcomingEvents,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
