const { roles } = require('../constant')
const CashCode = require('../models/cashCode.model')
const Event = require('../models/event.model')
const User = require('../models/user.model')
const FighterProfile = require('../models/fighterProfile.model')
const TrainerProfile = require('../models/TrainerProfile.model')
const { default: mongoose } = require('mongoose')

const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

exports.requestCashCode = async (req, res) => {
  try {
    const { id: createdBy, role: createdRole } = req.user

    if (createdRole !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create cash codes.',
      })
    }

    const {
      userId,
      role,
      name,
      email,
      phoneNumber,
      eventId,
      eventDate,
      amountPaid,
      paymentType,
      paymentNotes,
    } = req.body

    if (!userId && role !== roles.spectator) {
      return res.status(400).json({
        success: false,
        message: `Select ${role} from dropdown for cash code generation.`,
      })
    }

    // Basic validation
    if (
      !role ||
      !eventId ||
      !eventDate ||
      amountPaid === undefined ||
      !paymentType
    ) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found.' })

    // Generate unique code
    let code
    let isUnique = false
    while (!isUnique) {
      code = generateRandomCode()
      const existing = await CashCode.findOne({ code, event: eventId })
      if (!existing) isUnique = true
    }

    // Create eventDateCode
    const eventDateCode = new Date(eventDate).toISOString().split('T')[0] // YYYY-MM-DD

    // Resolve user info if userId is provided
    let resolvedName = name
    let resolvedEmail = email
    let resolvedPhoneNumber = phoneNumber

    if (userId) {
      let user_id = userId
      if (role === roles.fighter) {
        const fighter = await FighterProfile.findOne({
          _id: new mongoose.Types.ObjectId(userId),
        })
        if (!fighter)
          return res.status(404).json({ message: 'Fighter not found' })
        user_id = fighter.userId
      } else if (role === roles.trainer) {
        const trainer = await TrainerProfile.findOne({
          _id: new mongoose.Types.ObjectId(userId),
        })
        if (!trainer)
          return res
            .status(404)
            .json({ success: false, message: 'Trainer not found' })
        user_id = trainer.userId
      }
      const user = await User.findById(user_id)
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: 'User not found' })

      resolvedName = `${user.firstName} ${user.lastName}`
      resolvedEmail = user.email
      resolvedPhoneNumber = user.phoneNumber
    } else {
      if (!name || !email || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message:
            'Name, email, and phoneNumber are required for non-registered users.',
        })
      }
    }

    // Prevent duplicate code per event/date/user or name
    const queryConditions = [{ email: resolvedEmail }]
    if (userId) {
      queryConditions.push({ user: userId })
    }
    
    const existingCode = await CashCode.findOne({
      event: eventId,
      eventDateCode,
      $or: queryConditions,
    })

    if (existingCode) {
      return res.status(200).json({
        message: 'Code already exists for this user and event date.',
        data: {
          code: existingCode.code,
          name: existingCode.name,
          event: event.title,
          eventDateCode: existingCode.eventDateCode,
        },
      })
    }

    const newCode = await CashCode.create({
      code,
      user: userId || null,
      name: resolvedName,
      role,
      email: resolvedEmail,
      phoneNumber: resolvedPhoneNumber,
      event: eventId,
      eventDateCode,
      paymentType,
      amountPaid,
      paymentNotes,
      createdBy,
    })

    res.status(201).json({
      success: true,
      message: 'Code generated successfully',
      data: {
        _id: newCode._id,
        code: newCode.code,
        name: newCode.name,
        event: event.title,
        eventDateCode: newCode.eventDateCode,
        paymentType: newCode.paymentType,
        amountPaid: newCode.amountPaid,
        issuedAt: newCode.issuedAt,
      },
    })
  } catch (error) {
    console.error('Request Code Error:', error)
    res.status(500).json({ message: 'Something went wrong' })
  }
}

exports.getAllCashCodes = async (req, res) => {
  try {
    const { eventId, page = 1, limit = 10 } = req.query

    const filter = {}
    if (eventId) filter.event = eventId

    // // Enrich each code with fighter/trainer profile (if exists)
    // const enrichedCodes = await Promise.all(
    //   codes.map(async (code) => {
    //     let userId = code.user

    //     let fighterProfile = null
    //     let trainerProfile = null
    //     let userProfile = null
    //     if (code.role === roles.fighter) {
    //       fighterProfile = await FighterProfile.findById(userId)
    //     } else if (code.role === roles.trainer) {
    //       trainerProfile = await TrainerProfile.findById(userId)
    //     } else {
    //       userProfile = await User.findById(userId)
    //     }

    //     return {
    //       ...code.toObject(),
    //       fighterProfile,
    //       trainerProfile,
    //       userProfile,
    //     }
    //   })
    // )

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await CashCode.countDocuments(filter)

    // Populate basic user info
    const codes = await CashCode.find(filter)
      .populate('event')
      .populate('createdBy', 'firstName lastName')
      .lean()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: codes,
      pagination: {
        totalItems: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        pageSize: parseInt(limit),
      },
    })
  } catch (error) {
    console.error('Get Cash Codes Error:', error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

exports.getCashCodeById = async (req, res) => {
  try {
    const { id } = req.params

    const cashCode = await CashCode.findById(id).populate('event')

    if (!cashCode) {
      return res.status(404).json({ message: 'Cash code not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Cash code fetched successfully',
      data: cashCode,
    })
  } catch (error) {
    console.error('Get CashCode Error:', error)
    res.status(500).json({ message: 'Something went wrong' })
  }
}

exports.updateCashCode = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const cashCode = await CashCode.findById(id)
    if (!cashCode) {
      return res.status(404).json({ message: 'Cash code not found' })
    }

    Object.assign(cashCode, updates)
    await cashCode.save()

    res.status(200).json({
      success: true,
      message: 'Cash code updated successfully',
      data: cashCode,
    })
  } catch (error) {
    console.error('Update CashCode Error:', error)
    res.status(500).json({ message: 'Something went wrong' })
  }
}

exports.deleteCashCode = async (req, res) => {
  try {
    const { id } = req.params

    const deleted = await CashCode.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ message: 'Cash code not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Cash code deleted successfully',
    })
  } catch (error) {
    console.error('Delete CashCode Error:', error)
    res.status(500).json({ message: 'Something went wrong' })
  }
}
