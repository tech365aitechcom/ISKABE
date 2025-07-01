const { roles } = require('../constant')
const HomepageConfig = require('../models/homeSetting.model')

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
    const settings = await HomepageConfig.findOne()
      .populate('upcomingEvents') // Populate Events
      .populate('latestNews') // Populate News
      .populate({
        path: 'topFighters', // Populate Fighters
        populate: {
          path: 'userId',
          model: 'User',
          select:
            '-password -__v -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry',
        },
      })
      .lean()

    if (settings?.menuItems?.length) {
      settings.menuItems.sort((a, b) => a.sortOrder - b.sortOrder)
    }

    res.json({
      success: true,
      data: settings,
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
