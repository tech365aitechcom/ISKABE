const Registration = require('../models/registration.model')
const Event = require('../models/event.model')

exports.createRegistration = async (req, res) => {
  try {
    const { id: userId } = req.user

    const registration = new Registration({
      ...req.body,
      createdBy: userId,
    })

    await registration.save()

    // Increment registeredParticipants count in the associated Event
    await Event.findByIdAndUpdate(
      registration.event,
      { $inc: { registeredParticipants: 1 } },
      { new: true }
    )

    res.status(201).json({
      message: 'Registration successful',
      data: registration,
    })
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message })
  }
}

exports.getRegistrations = async (req, res) => {
  try {
    const {
      regStartDate,
      regEndDate,
      eventDate,
      selectedEvent,
      registrationType,
      search,
      page = 1,
      limit = 10,
    } = req.query

    const filter = {}

    // Filter by registration type
    if (registrationType) {
      filter.registrationType = registrationType
    }

    // Filter by registration date range
    if (regStartDate || regEndDate) {
      filter.createdAt = {}
      if (regStartDate) filter.createdAt.$gte = new Date(regStartDate)
      if (regEndDate) filter.createdAt.$lte = new Date(regEndDate)
    }

    // Filter by event ID
    if (selectedEvent) {
      filter.event = selectedEvent
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Base query
    let registrations = await Registration.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate('event')

    // Filter by search term after population
    if (search) {
      const regex = new RegExp(search, 'i')
      registrations = registrations.filter((reg) => {
        const fighterName = `${reg.firstName} ${reg.lastName}`
        const trainerName = reg.trainerName || ''
        const eventName = reg.event?.name || ''
        return (
          regex.test(fighterName) ||
          regex.test(trainerName) ||
          regex.test(eventName)
        )
      })
    }

    // Filter by eventDate after population
    if (eventDate) {
      const targetDate = new Date(eventDate).toISOString().split('T')[0]
      registrations = registrations.filter((reg) => {
        const eventDateOnly = reg.event?.date?.toISOString().split('T')[0]
        return eventDateOnly === targetDate
      })
    }

    res.json({
      success: true,
      message: 'Registrations list fetched',
      data: {
        items: registrations,
        pagination: {
          totalItems: registrations.length,
          currentPage: parseInt(page),
          totalPages: Math.ceil(registrations.length / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching registrations' })
  }
}

exports.getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({
      success: true,
      message: 'Registration fetched successfully',
      data: registration,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching item' })
  }
}

exports.updateRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({
      success: true,
      message: 'Registration updated successfully',
      data: registration,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error updating item' })
  }
}

exports.deleteRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id)
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({
      success: true,
      message: 'Registration deleted successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting item' })
  }
}
