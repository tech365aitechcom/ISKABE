const { roles } = require('../constant')
const Event = require('../models/event.model')

exports.createEvent = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create event.',
      })
    }

    const event = new Event({
      ...req.body,
      createdBy: userId,
    })

    await event.save()

    res.status(201).json({
      message: 'Event created successfully',
      data: event,
    })
  } catch (error) {
    console.error(error)

    // Handle MongoDB Duplicate Key Error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error',
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        errmsg: error.errmsg,
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message,
    })
  }
}

exports.getAllEvents = async (req, res) => {
  try {
    const { search, sportType, isPublished, page = 1, limit = 10 } = req.query

    const filter = {}

    if (sportType) filter.sportType = sportType

    if (isPublished === 'true') {
      filter.isDraft = false
    } else if (isPublished === 'false') {
      filter.isDraft = true
    }

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Event.countDocuments(filter)

    const events = await Event.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate('venue')
      .populate({
        path: 'promoter',
        populate: {
          path: 'userId',
          select:
            '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v',
        },
      })

    res.json({
      success: true,
      message: 'Event list fetched',
      data: {
        items: events,
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
    res.status(500).json({ error: 'Error fetching events' })
  }
}

exports.updateEvent = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { id } = req.params

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event',
      })
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error updating event' })
  }
}

exports.deleteEvent = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { id } = req.params

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event',
      })
    }

    await event.deleteOne() // ✅ replaces event.remove()

    res.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting event' })
  }
}

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params

    const event = await Event.findById(id)
      .populate('venue')
      .populate({
        path: 'promoter',
        populate: {
          path: 'userId',
          select:
            '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v',
        },
      })
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    res.json({ success: true, data: event })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching event details' })
  }
}

exports.toggleEventStatus = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { id } = req.params
    const { isDraft } = req.body

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    // Check if the logged-in user is the creator of the event
    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event status',
      })
    }

    if (typeof isDraft !== 'undefined') event.isDraft = isDraft

    await event.save()

    res.json({ success: true, message: 'Event status updated', data: event })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error toggling event status' })
  }
}
