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
    const { search, page = 1, limit = 10 } = req.query
    const filter = {}
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Registration.countDocuments(filter)

    const registrations = await Registration.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate('event')

    res.json({
      success: true,
      message: 'Registrations list fetched',
      data: {
        items: registrations,
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
