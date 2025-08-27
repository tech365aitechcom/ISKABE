const { roles } = require('../constant')
const mongoose = require('mongoose')
const Event = require('../models/event.model')
const Venue = require('../models/venue.model')
const Registration = require('../models/registration.model')
const Bracket = require('../models/bracket.model')
const Bout = require('../models/bout.model')
const Fight = require('../models/fight.model')
const TournamentSettings = require('../models/tournamentSettings.model')
const SpectatorTicketPurchase = require('../models/spectatorTicketPurchase.model')

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

    const tournamentSettings = new TournamentSettings({
      eventId: event._id,
      createdBy: userId,
      simpleFees: {
        fighterFee: 0,
        trainerFee: 0,
        currency: '$',
      },
      detailedFees: [],
      bracketSettings: {
        maxFightersPerBracket: 0,
      },
      ruleStyles: {
        semiContact: [],
        fullContact: [],
      },
    })

    await tournamentSettings.save()

    res.status(201).json({
      success: true,
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

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params

    // 🔹 Fetch Event with promoter + venue + createdBy
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

    // 🔹 Get Brackets with populated fighters
    const brackets = await Bracket.find({ event: id })
      .populate('fighters.fighter')
      .lean()

    // 🔹 Collect Bracket IDs
    const bracketIds = brackets.map((bracket) => bracket._id)

    // 🔹 Get Bouts for these brackets
    const bouts = await Bout.find({ bracket: { $in: bracketIds } })
      .populate('redCorner')
      .populate('blueCorner')
      .lean()

    // 🔹 Get Fights for these bouts
    const boutIds = bouts.map((bout) => bout._id)
    const fights = await Fight.find({ bout: { $in: boutIds } })
      .populate('winner')
      .lean()

    // 🔹 Organize Brackets → Bouts → Fights
    const bracketsWithDetails = brackets.map((bracket) => {
      const bracketBouts = bouts.filter(
        (bout) => bout.bracket.toString() === bracket._id.toString()
      )

      const boutsWithFights = bracketBouts.map((bout) => {
        const boutFights = fights.filter(
          (fight) => fight.bout.toString() === bout._id.toString()
        )

        return {
          ...bout,
          fights: boutFights,
        }
      })

      return {
        ...bracket,
        bouts: boutsWithFights,
      }
    })

    // 🔹 Registered Fighters (outside brackets, direct event registrations)
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

      registeredFighters = fighters.map((fighter) => ({
        firstName: fighter.firstName,
        lastName: fighter.lastName,
        weightClass: fighter.weightClass,
        country: fighter.country,
        fighterProfileId: fighter.createdBy?.fighterProfile?._id || null,
      }))
    }

    // 🔹 Counts
    const bracketCount = brackets.length
    const boutCount = bouts.length
    const fightCount = fights.length

    // 🔹 Revenue Calcs
    const totalRegistrationFees = await Registration.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    const totalSpectatorTicketAmount = await SpectatorTicketPurchase.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])

    const spectatorTicketTotal = totalSpectatorTicketAmount[0]?.total || 0
    const totalFee =
      spectatorTicketTotal *
      (parseFloat(process.env.TICKET_FEE_PERCENTAGE) || 0)
    const totalNetRevenue = spectatorTicketTotal - totalFee

    // 🔹 Final Response
    res.json({
      success: true,
      data: {
        ...event.toObject(),
        registeredFighters,
        brackets: bracketsWithDetails,
        bracketCount,
        boutCount,
        fightCount,
        totalRegistrationFees: totalRegistrationFees[0]?.total || 0,
        totalSpectatorTicketAmount: spectatorTicketTotal,
        totalFee,
        totalNetRevenue,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error fetching event details with brackets, bouts, and fights',
    })
  }
}

exports.updateEvent = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    const { id } = req.params

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    // Allow superAdmin to edit any event, or creator to edit

    if (role !== roles.superAdmin && event.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event',
      })
    }

    // Update the event fields and save (this preserves validation

    Object.assign(event, req.body)
    const updatedEvent = await event.save()

    // Populate promoter and venue fields for the response
    const populatedEvent = await Event.findById(updatedEvent._id)
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
      message: 'Event updated successfully',
      data: populatedEvent,
    })
  } catch (error) {
    console.error('Update event error:', error)

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
        details: error.errors,
      })
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0]
      const message = `${
        duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)
      } already exists`
      return res.status(400).json({
        success: false,
        error: message,
      })
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: `Invalid ${error.path}: ${error.value}`,
      })
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Error updating event',
      message: error.message,
    })
  }
}

exports.toggleEventStatus = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    const { id } = req.params
    const { isDraft } = req.body

    const event = await Event.findById(id)

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' })
    }

    // Check if the logged-in user is the creator of the event or has admin privileges
    if (event.createdBy.toString() !== userId && role !== roles.superAdmin) {
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

exports.deleteEvent = async (req, res) => {
  try {
    const { role } = req.user
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

    // Find all brackets under this event
    const brackets = await Bracket.find({ event: id })

    for (const bracket of brackets) {
      // Delete all bouts under this bracket
      const bouts = await Bout.find({ bracket: bracket._id })

      for (const bout of bouts) {
        // Delete fights under each bout
        await Fight.deleteMany({ bout: bout._id })
      }

      // Delete all bouts
      await Bout.deleteMany({ bracket: bracket._id })
    }

    // Delete all brackets under the event
    await Bracket.deleteMany({ event: id })
    await TournamentSettings.deleteOne({ eventId: id })

    // Finally delete the event
    await event.deleteOne()

    res.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting event' })
  }
}
