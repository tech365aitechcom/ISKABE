const Registration = require('../models/registration.model')
const Event = require('../models/event.model')
const CashCode = require('../models/cashCode.model')
const { roles } = require('../constant')
const FighterProfile = require('../models/fighterProfile.model')
const TrainerProfile = require('../models/TrainerProfile.model')
const { default: mongoose } = require('mongoose')

exports.createRegistration = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    const { cashCode: codeFromBody, event: eventId } = req.body
    let resolvedCashCode = null

    if (codeFromBody) {
      const cashCodeDoc = await CashCode.findOne({ code: codeFromBody })
      if (!cashCodeDoc) {
        return res.status(400).json({ message: 'Invalid cash code' })
      }

      if (
        cashCodeDoc.redemptionStatus === 'Checked-In' ||
        cashCodeDoc.redeemedAt
      ) {
        return res
          .status(400)
          .json({ message: 'Cash code has already been redeemed' })
      }

      if (cashCodeDoc.event.toString() !== eventId) {
        return res
          .status(400)
          .json({ message: 'Cash code does not belong to this event' })
      }

      let cashCodeUser = null
      if (cashCodeDoc.user) {
        if (role === roles.fighter) {
          const fighter = await FighterProfile.findOne({
            userId: new mongoose.Types.ObjectId(userId),
          })
          cashCodeUser = fighter._id
        } else if (role === roles.trainer) {
          const trainer = await TrainerProfile.findOne({
            userId: new mongoose.Types.ObjectId(userId),
          })
          cashCodeUser = trainer._id
        } else {
          cashCodeUser = cashCodeDoc.user
        }
        if (!cashCodeDoc.user.equals(cashCodeUser)) {
          return res.status(400).json({
            message: 'Cash code is not assigned to this user',
          })
        }
      }

      // Mark the cash code as redeemed
      cashCodeDoc.redemptionStatus = 'Checked-In'
      cashCodeDoc.redeemedAt = Date.now()
      await cashCodeDoc.save()

      resolvedCashCode = cashCodeDoc._id
    }

    // Check if the same email is already registered for this event
    const existingRegistration = await Registration.findOne({
      email: req.body.email,
      event: eventId,
    })

    if (existingRegistration) {
      return res.status(400).json({
        message: 'This user is already registered for this event',
      })
    }

    const registration = new Registration({
      ...req.body,
      cashCode: resolvedCashCode || null,
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

exports.getRegistrationsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params
    const { registrationType, page = 1, limit = 10 } = req.query
    const filter = {}
    filter.event = eventId

    if (registrationType) {
      filter.registrationType = registrationType
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Total amount collected for this event (only Paid registrations)
    const totalCollectionAgg = await Registration.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          paymentStatus: 'Paid',
        },
      },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ])
    const totalCollection = totalCollectionAgg[0]?.totalAmount || 0

    const total = await Registration.countDocuments(filter)

    const registrations = await Registration.find(filter)
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      success: true,
      message: 'Registrations list fetched',
      data: {
        items: registrations,
        totalCollection,
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
