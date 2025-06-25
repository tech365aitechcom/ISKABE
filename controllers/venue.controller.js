const { roles } = require('../constant')
const Venue = require('../models/venue.model')
const { validationResult } = require('express-validator')

// Get all venues
exports.getVenues = async (req, res) => {
  try {
    const { city, status, search, page = 1, limit = 10 } = req.query
    const filter = {}

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' }
    }

    if (status) filter.status = status

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Venue.countDocuments(filter)

    const venues = await Venue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )

    res.json({
      success: true,
      message: 'Venues list fetched',
      data: {
        items: venues,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get single venue by ID
exports.getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' })
    }

    res.json(venue)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create new venue
exports.createVenue = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create venue.',
      })
    }

    const venue = new Venue({
      ...req.body,
      createdBy: userId,
    })

    await venue.save()

    res.status(201).json({
      message: 'Venue created successfully',
      data: venue,
    })
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0]

      let message = 'Duplicate value detected.'
      if (duplicateField === 'name') {
        message = 'Venue with same name already exists.'
      }

      return res.status(400).json({
        success: false,
        message,
      })
    }

    res.status(500).json({ error: error.message })
  }
}

// Update venue
exports.updateVenue = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const venue = await Venue.findById(req.params.id)

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' })
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      venue[key] = req.body[key]
    })

    const updatedVenue = await venue.save()
    res.json({ message: 'Venue updated successfully', data: updatedVenue })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete venue
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' })
    }

    await Venue.findByIdAndDelete(req.params.id)
    res.json({
      message: 'Venue deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
