const { roles } = require('../constant')
const HomepageConfig = require('../models/homeSetting.model')
const News = require('../models/news.model')
const Event = require('../models/event.model')
const FighterProfile = require('../models/fighterProfile.model') // Add this import
const User = require('../models/user.model') // Add this import if not already imported

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
    const settings = await HomepageConfig.findOne().lean()

    // Sort menuItems by sortOrder if available
    if (settings?.menuItems?.length) {
      settings.menuItems.sort((a, b) => a.sortOrder - b.sortOrder)
    }

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
      isDraft: false,
    })
      .sort({ startDate: 1 })
      .limit(4)
      .select('name startDate endDate venue poster briefDescription')
      .populate('venue', 'name location')
      .lean()

    // Fetch top fighters with their user details
    const topFighters = await FighterProfile.find({})
      .populate({
        path: 'userId',
        select: 'firstName lastName profileImage wins losses draws', // Adjust fields based on your User model
      })
      .select('height weight weightClass nationalRank globalRank imageGallery bio')
      .limit(4) // Show top 6 fighters
      .lean()

    // Filter out fighters without user data and format the response
    const formattedFighters = topFighters
      .filter(fighter => fighter.userId)
      .map(fighter => ({
        _id: fighter._id,
        name: `${fighter.userId.firstName} ${fighter.userId.lastName}`,
        record: `${fighter.userId.wins || 0}–${fighter.userId.losses || 0}${fighter.userId.draws ? `–${fighter.userId.draws}` : ''}`,
        image: fighter.userId.profileImage || fighter.imageGallery?.[0] || '/fighter.png',
        weight: fighter.weight,
        weightClass: fighter.weightClass,
        rank: fighter.nationalRank || fighter.globalRank,
        bio: fighter.bio
      }))

    res.json({
      success: true,
      data: settings,
      latestNews,
      upcomingEvents,
      topFighters: formattedFighters, // Add this to the response
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getNavbarConfig = async (req, res) => {
  try {
    // Fetch only logo and menuItems fields
    const settings = await HomepageConfig.findOne()
      .select('logo menuItems')
      .lean()

    res.json({
      success: true,
      data: settings,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateHomePageConfig = async (req, res) => {
  try {
    const settings = await HomepageConfig.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    })
    res.json({
      success: true,
      message: 'Home page config updated',
      data: settings,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteHomePageConfig = async (req, res) => {
  try {
    await HomepageConfig.deleteMany({})
    res.json({ success: true, message: 'Home page config deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}