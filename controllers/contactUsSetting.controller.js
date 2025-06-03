const { roles } = require('../constant')
const ContactUsSetting = require('../models/contactUsSetting.model')

exports.createSettings = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create.',
      })
    }
    const existing = await ContactUsSetting.findOne()
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Settings already exist. Please update the existing settings.',
      })
    }
    const settings = new ContactUsSetting({
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

exports.getSettings = async (req, res) => {
  try {
    const settings = await ContactUsSetting.findOne()
    res.json({ success: true, data: settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const settings = await ContactUsSetting.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    })
    res.json({ success: true, message: 'Settings updated', data: settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteSettings = async (req, res) => {
  try {
    await ContactUsSetting.deleteMany({})
    res.json({ success: true, message: 'All settings deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
