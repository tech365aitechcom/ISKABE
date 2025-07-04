const { roles } = require('../constant')
const Event = require('../models/event.model')
const Venue = require('../models/venue.model')
const Registration = require('../models/registration.model')

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

    // Duplicate key error
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0]
      const message = `${
        duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)
      } already exists. Please choose another.`
      return res.status(400).json({ error: message })
    }

    // Validation errors (including CastError and custom validators)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => {
        // Clean up ObjectId Cast errors
        if (
          err.name === 'CastError' &&
          err.kind === 'ObjectId' &&
          err.value === ''
        ) {
          if (err.path === 'venue') return 'Venue is required'
          if (err.path === 'promoter') return 'Promoter is required'
        }

        return err.message
      })

      return res.status(400).json({ error: messages.join(', ') })
    }

    // Default fallback
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message,
    })
  }
}

exports.getAllEvents = async (req, res) => {
  try {
    const {
      search,
      sportType,
      country,
      state,
      city,
      date,
      isPublished,
      page = 1,
      limit = 10,
    } = req.query

    const filter = {}

    // Normalize and apply isPublished filter
    const isPublishedStr = String(isPublished).toLowerCase()
    if (isPublishedStr === 'true') {
      filter.isDraft = false
    } else if (isPublishedStr === 'false') {
      filter.isDraft = true
    }

    if (sportType) filter.sportType = sportType
    if (search) filter.name = { $regex: search, $options: 'i' }

    // Filter by date range on event's startDate
    if (date) {
      const start = new Date(date)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      filter.startDate = { $gte: start, $lte: end }
    }

    // 🧠 Step 1: Find matching venue IDs
    const venueQuery = {}
    if (country) venueQuery['address.country'] = country
    if (state) venueQuery['address.state'] = state
    if (city) venueQuery['address.city'] = city

    let venueIds = []
    if (country || state || city) {
      const venues = await Venue.find(venueQuery).select('_id')
      venueIds = venues.map((v) => v._id)

      // If no venue matches, return early
      if (venueIds.length === 0) {
        return res.json({
          success: true,
          message: 'Event list fetched',
          data: {
            items: [],
            pagination: {
              totalItems: 0,
              currentPage: parseInt(page),
              totalPages: 0,
              pageSize: parseInt(limit),
            },
          },
        })
      }

      filter.venue = { $in: venueIds }
    }

    // Pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Count total matching events
    const total = await Event.countDocuments(filter)

    // 🧠 Step 2: Find matching events
    const events = await Event.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
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
    console.error('Error fetching events:', error)
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
    const { id: userId ,role} = req.user
    const { id } = req.params

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    if (role !== roles.superAdmin) {
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

    let registeredFighters = []

    if (event.registeredParticipants > 0) {
      const fighters = await Registration.find({
        event: id,
        registrationType: 'fighter',
      })
        .populate({
          path: 'createdBy',
          select: 'fighterProfile',
          populate: {
            path: 'fighterProfile',
            select: '_id',
          },
        })
        .select('firstName lastName weightClass country createdBy')
        .lean()

      // Reshape data to only return required fields
      registeredFighters = fighters.map((fighter) => ({
        firstName: fighter.firstName,
        lastName: fighter.lastName,
        weightClass: fighter.weightClass,
        country: fighter.country,
        fighterProfileId: fighter.createdBy?.fighterProfile?._id || null,
      }))
    }

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        registeredFighters,
      },
    })
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
