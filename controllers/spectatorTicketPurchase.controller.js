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
      if (
        !cashCodeDoc ||
        cashCodeDoc.redemptionStatus === 'Checked-In' ||
        cashCodeDoc.redeemedAt
      ) {
        return res
          .status(400)
          .json({ message: 'Invalid or already used cash code' })
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
      paymentStatus: paymentMethod === 'cash' ? 'Pending' : 'Paid',
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
      eventLink: `https://ikffe.vercel.app/event/${eventId}`,
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
    })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
}
