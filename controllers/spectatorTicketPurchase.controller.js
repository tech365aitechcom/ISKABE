const SpectatorTicket = require('../models/spectatorTicket.model')
const SpectatorTicketPurchase = require('../models/spectatorTicketPurchase.model')
const CashCode = require('../models/cashCode.model')
const { generateTicketCode, generateQRCode } = require('../config/ticket')
const { sendTicketConfirmationEmail } = require('../services/email.service')
const { roles } = require('../constant')
const User = require('../models/user.model')
const Event = require('../models/event.model')
const FighterProfile = require('../models/fighterProfile.model')
const TrainerProfile = require('../models/TrainerProfile.model')
const { default: mongoose } = require('mongoose')

exports.buySpectatorTicket = async (req, res) => {
  try {
    const {
      eventId,
      tierName,
      quantity,
      buyerType,
      user,
      guestDetails,
      paymentMethod,
      paymentStatus,
      cashCode: cashCodeText,
    } = req.body

    if (!eventId || !tierName || !quantity || !buyerType || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const ticketConfig = await SpectatorTicket.findOne({ eventId })
    const event = await Event.findById(eventId)
    if (!ticketConfig) {
      return res
        .status(404)
        .json({ message: 'Ticket not found for this event' })
    }

    const tier = ticketConfig.tiers.find((t) => t.name === tierName)
    if (!tier) {
      return res.status(404).json({ message: 'Ticket tier not found' })
    }

    const now = new Date()
    if (
      now < new Date(tier.salesStartDate) ||
      now > new Date(tier.salesEndDate)
    ) {
      return res
        .status(400)
        .json({ message: 'Tier not available for sale now' })
    }

    if (tier.remaining < quantity) {
      return res
        .status(400)
        .json({ message: 'Not enough tickets remaining in this tier' })
    }

    if (buyerType === 'user' && !user) {
      return res
        .status(400)
        .json({ message: 'User ID required for registered user' })
    }

    if (buyerType === 'guest' && !guestDetails?.email) {
      return res.status(400).json({ message: 'Guest email is required' })
    }

    if (quantity > tier.limitPerUser) {
      return res.status(400).json({
        message:
          'You can only buy a maximum of ' +
          tier.limitPerUser +
          ' tickets per user',
      })
    }

    let cashCodeDoc = null
    let cashCodeUser = null

    if (paymentMethod === 'cash') {
      if (!cashCodeText) {
        return res
          .status(400)
          .json({ message: 'Cash code required for cash payment' })
      }

      cashCodeDoc = await CashCode.findOne({ code: cashCodeText })
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

      if (cashCodeDoc.user) {
        if (cashCodeDoc.role === roles.fighter) {
          const fighter = await FighterProfile.findOne({
            userId: new mongoose.Types.ObjectId(user),
          })
          cashCodeUser = fighter._id
        } else if (cashCodeDoc.role === roles.trainer) {
          const trainer = await TrainerProfile.findOne({
            userId: new mongoose.Types.ObjectId(user),
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
      } else {
        if (guestDetails.email !== cashCodeDoc.email) {
          return res.status(400).json({
            message: 'Cash code is not assigned to this guest',
          })
        }
      }
    }

    const totalAmount = tier.price * quantity
    const ticketCode = generateTicketCode()
    const qrCodeBuffer = await generateQRCode(ticketCode)

    const purchase = new SpectatorTicketPurchase({
      event: eventId,
      ticket: ticketConfig._id,
      tier: tierName,
      quantity,
      buyerType,
      user: buyerType === 'user' ? user : null,
      guestDetails: buyerType === 'guest' ? guestDetails : undefined,
      totalAmount,
      paymentMethod,
      paymentStatus,
      cashCode: cashCodeDoc?._id || null,
      ticketCode,
      qrCode: qrCodeBuffer,
    })

    await purchase.save()
    // Decrement remaining count
    tier.remaining -= quantity
    ticketConfig.markModified('tiers')
    await ticketConfig.save()

    if (cashCodeText) {
      // Mark the cash code as redeemed
      cashCodeDoc.redemptionStatus = 'Checked-In'
      cashCodeDoc.redeemedAt = Date.now()
      await cashCodeDoc.save()
    }

    const userDoc = await User.findById(cashCodeUser)
    const recipientEmail =
      buyerType === 'user' ? userDoc.email : guestDetails.email

    await sendTicketConfirmationEmail({
      to: recipientEmail,
      name: guestDetails?.firstName || userDoc?.firstName || 'Spectator',
      eventTitle: event.name,
      eventLink: `https://ikffe.vercel.app/events/${eventId}`,
      purchaseDate: new Date().toISOString(),
      tierTitle: tierName,
      quantity,
      totalAmount,
      ticketCode,
      qrCodeBuffer,
    })

    return res.status(201).json({
      success: true,
      message:
        'Ticket purchased successfully,Please check your email for details',
      data: purchase,
    })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
}

exports.redeemSpectatorTicket = async (req, res) => {
  try {
    const { ticketCode, quantityToRedeem, entryMode = 'Manual' } = req.body
    const { id: userId } = req.user

    if (!ticketCode || !quantityToRedeem) {
      return res
        .status(400)
        .json({ message: 'Ticket code and quantity are required' })
    }

    const ticketPurchase = await SpectatorTicketPurchase.findOne({ ticketCode })

    if (!ticketPurchase) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    if (ticketPurchase.redemptionStatus === 'Redeemed') {
      return res.status(400).json({ message: 'Ticket already fully redeemed' })
    }

    const remainingToRedeem =
      ticketPurchase.quantity - ticketPurchase.redeemedQuantity

    if (quantityToRedeem > remainingToRedeem) {
      return res.status(400).json({
        message: `Only ${remainingToRedeem} ticket(s) remaining to redeem`,
      })
    }

    // Update fields
    ticketPurchase.redeemedQuantity += quantityToRedeem

    if (ticketPurchase.redeemedQuantity === ticketPurchase.quantity) {
      ticketPurchase.redemptionStatus = 'Redeemed'
      ticketPurchase.redeemedAt = new Date()
    } else {
      ticketPurchase.redemptionStatus = 'Partially Redeemed'
    }

    // Log this redemption
    ticketPurchase.redemptionLogs.push({
      redeemedAt: new Date(),
      redeemedBy: userId,
      quantity: quantityToRedeem,
      method: entryMode,
    })

    // Save who last redeemed and how
    ticketPurchase.redeemedBy = userId
    ticketPurchase.entryMode = entryMode

    await ticketPurchase.save()

    return res.status(200).json({
      success: true,
      message: `${quantityToRedeem} ticket(s) redeemed successfully`,
      updatedStatus: ticketPurchase.redemptionStatus,
      remaining: ticketPurchase.quantity - ticketPurchase.redeemedQuantity,
    })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
}

exports.getTicketByCode = async (req, res) => {
  try {
    const { ticketCode } = req.params

    const ticket = await SpectatorTicketPurchase.findOne({
      ticketCode,
    }).populate('event ticket user')

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket found successfully',
      data: ticket,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.getTicketsByUser = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const filter = { user: userId }

    const total = await SpectatorTicketPurchase.countDocuments(filter)

    const tickets = await SpectatorTicketPurchase.find(filter)
      .populate('event')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    return res.status(200).json({
      success: true,
      data: {
        items: tickets,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.getEventPurchases = async (req, res) => {
  try {
    const { eventId } = req.params
    const { page = 1, limit = 10 } = req.query

    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)
    const skip = (parsedPage - 1) * parsedLimit

    const filter = { event: eventId }

    const total = await SpectatorTicketPurchase.countDocuments(filter)

    const purchases = await SpectatorTicketPurchase.find(filter)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)

    return res.status(200).json({
      success: true,
      message: 'Purchases fetched successfully',
      data: {
        items: purchases,
        pagination: {
          totalItems: total,
          currentPage: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          pageSize: parsedLimit,
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
