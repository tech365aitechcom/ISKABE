const { roles } = require('../constant')
const SpectatorTicket = require('../models/spectatorTicket.model')

// Create a new Spectator Ticket with tiers
exports.createSpectatorTicket = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create tournament settings.',
      })
    }

    const { eventId, tiers } = req.body

    const existingTicket = await SpectatorTicket.findOne({ eventId })
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'Spectator ticket for this event already exists',
      })
    }

    const newTicket = new SpectatorTicket({ eventId, tiers, createdBy: userId })
    await newTicket.save()

    return res.status(201).json({
      success: true,
      message: 'Spectator ticket created successfully',
      data: newTicket,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Get all spectator tickets
exports.getAllSpectatorTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await SpectatorTicket.countDocuments()
    const tickets = await SpectatorTicket.find()
      .populate('eventId')
      .skip(skip)
      .limit(parseInt(limit))

    return res.status(200).json({
      success: true,
      message: 'Spectator tickets fetched successfully',
      data: {
        items: tickets,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Get single spectator ticket by event ID
exports.getSpectatorTicketByEventId = async (req, res) => {
  try {
    const { eventId } = req.params
    const ticket = await SpectatorTicket.findOne({ eventId }).populate(
      'eventId'
    )
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: 'Spectator ticket not found' })
    }
    return res.status(200).json({ success: true, data: ticket })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Update spectator ticket
exports.updateSpectatorTicket = async (req, res) => {
  try {
    const { eventId } = req.params

    const updated = await SpectatorTicket.findOneAndUpdate(
      { eventId },
      req.body,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: 'Spectator ticket not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Spectator ticket updated successfully',
      data: updated,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Delete spectator ticket
exports.deleteSpectatorTicket = async (req, res) => {
  try {
    const { eventId } = req.params
    const deleted = await SpectatorTicket.findOneAndDelete({ eventId })
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Spectator ticket not found' })
    }

    return res
      .status(200)
      .json({ success: true, message: 'Spectator ticket deleted successfully' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
