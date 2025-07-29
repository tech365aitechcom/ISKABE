const { roles } = require('../constant')
const TournamentSettings = require('../models/tournamentSettings.model')

exports.createTournamentSettings = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create tournament settings.',
      })
    }

    const settings = new TournamentSettings({
      ...req.body,
      createdBy: userId,
    })

    await settings.save()

    res.status(201).json({
      success: true,
      message: 'Tournament settings created successfully',
      data: settings,
    })
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000 && error.keyPattern?.eventId) {
      return res.status(409).json({
        success: false,
        message: 'Tournament settings already exist for this event.',
      })
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create tournament settings',
      error,
    })
  }
}

exports.getTournamentSettingsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params
    const settings = await TournamentSettings.findOne({ eventId })

    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: 'Tournament settings not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Tournament settings fetched successfully',
      data: settings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament settings',
      error,
    })
  }
}

exports.updateTournamentSettings = async (req, res) => {
  try {
    const { eventId } = req.params
    const updatedSettings = await TournamentSettings.findOneAndUpdate(
      { eventId },
      req.body,
      { new: true, runValidators: true }
    )

    if (!updatedSettings) {
      return res
        .status(404)
        .json({ success: false, message: 'Tournament settings not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Tournament settings updated successfully',
      data: updatedSettings,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update tournament settings',
      error,
    })
  }
}

exports.deleteTournamentSettings = async (req, res) => {
  try {
    const { eventId } = req.params
    const deleted = await TournamentSettings.findOneAndDelete({ eventId })

    if (!deleted) {
      return res.status(404).json({ message: 'Tournament settings not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Tournament settings deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error,
    })
  }
}
