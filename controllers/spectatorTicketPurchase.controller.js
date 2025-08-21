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
      transactionId,
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

    // Check if tier is available for online purchase
    if (tier.availabilityMode === 'OnSite') {
      return res.status(400).json({
        message: 'This ticket tier is only available for on-site purchase',
      })
    }

    const now = new Date()

    if (now < new Date(tier.salesStartDate)) {
      return res
        .status(400)
        .json({ message: 'Ticket sales have not started yet' })
    }

    if (now > new Date(tier.salesEndDate)) {
      return res.status(400).json({ message: 'Ticket sales have ended' })
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

    let cashCodeDoc = null
    let cashCodeUser = null

    // 🟡 CASH CODE logic only applies when there's NO transactionId
    if (paymentMethod === 'cash' && !transactionId) {
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

      const ticketTotalAmount = tier.price * quantity
      if (cashCodeDoc.amountPaid < ticketTotalAmount) {
        return res.status(400).json({
          message: `Insufficient cash code amount. Required: $${ticketTotalAmount}, Available: $${cashCodeDoc.amountPaid}`,
        })
      }

      if (cashCodeDoc.user) {
        if (cashCodeDoc.role === roles.fighter) {
          const fighter = await FighterProfile.findOne({
            userId: new mongoose.Types.ObjectId(user),
          })
          cashCodeUser = fighter?._id
        } else if (cashCodeDoc.role === roles.trainer) {
          const trainer = await TrainerProfile.findOne({
            userId: new mongoose.Types.ObjectId(user),
          })
          cashCodeUser = trainer?._id
        } else {
          cashCodeUser = cashCodeDoc.user
        }

        if (!cashCodeDoc.user.equals(cashCodeUser)) {
          return res
            .status(400)
            .json({ message: 'Cash code is not assigned to this user' })
        }
      } else {
        if (guestDetails.email !== cashCodeDoc.email) {
          return res
            .status(400)
            .json({ message: 'Cash code is not assigned to this guest' })
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
      transactionId: paymentMethod === 'cash' ? null : transactionId,
      ticketCode,
      qrCode: qrCodeBuffer,
    })

    await purchase.save()

    // Decrement remaining count
    tier.remaining -= quantity
    ticketConfig.markModified('tiers')
    await ticketConfig.save()

    // ✅ Redeem the cash code only if it was used (cash & no transaction)
    if (paymentMethod === 'cash' && !transactionId && cashCodeDoc) {
      cashCodeDoc.redemptionStatus = 'Checked-In'
      cashCodeDoc.redeemedAt = Date.now()
      await cashCodeDoc.save()
    }

    // Determine email recipient
    let recipientEmail = null
    let name = 'Spectator'

    if (buyerType === 'user') {
      const userDoc = await User.findById(user)
      recipientEmail = userDoc?.email
      name = userDoc?.firstName || name
    } else {
      recipientEmail = guestDetails.email
      name = guestDetails.firstName || name
    }

    // Send confirmation email
    await sendTicketConfirmationEmail({
      to: recipientEmail,
      name,
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
        'Ticket purchased successfully. Please check your email for details.',
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
    const { id: userId, role } = req.user

    // if (role !== roles.superAdmin || role !== roles.promoter) {
    //   return res.status(403).json({
    //     message: 'Access denied,You are not authorized to redeem tickets',
    //   })
    // }

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

    // Calculate totals for all purchases in the event
    const allPurchases = await SpectatorTicketPurchase.find(filter)
    const totalCollected = allPurchases.reduce(
      (sum, purchase) => sum + purchase.totalAmount,
      0
    )
    const totalFee = totalCollected * process.env.TICKET_FEE_PERCENTAGE
    const netRevenue = totalCollected - totalFee

    // Add calculations to each item
    const itemsWithCalculations = purchases.map((purchase) => {
      const itemTotalFee =
        purchase.totalAmount * process.env.TICKET_FEE_PERCENTAGE
      const itemNetRevenue = purchase.totalAmount - itemTotalFee

      return {
        ...purchase.toObject(),
        fee: itemTotalFee,
        netRevenue: itemNetRevenue,
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Purchases fetched successfully',
      data: {
        items: itemsWithCalculations,
        totals: {
          totalCollected,
          totalFee,
          netRevenue,
        },
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

exports.getEventRedemptionLogs = async (req, res) => {
  try {
    const { eventId } = req.params
    const { page = 1, limit = 10 } = req.query

    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)
    const skip = (parsedPage - 1) * parsedLimit

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' })
    }

    // Find purchases for the event that have redemption logs
    const purchases = await SpectatorTicketPurchase.find({
      event: eventId,
      'redemptionLogs.0': { $exists: true }, // ensures at least 1 log
    })
      .populate('event', 'name')
      .populate('user', 'firstName lastName email')
      .populate('redemptionLogs.redeemedBy', 'firstName lastName email')
      .sort({ 'redemptionLogs.redeemedAt': -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean()

    // Flatten logs so each redemption is its own row
    const flattenedLogs = purchases.flatMap((purchase) =>
      purchase.redemptionLogs.map((log) => ({
        ticketCode: purchase.ticketCode,
        tier: purchase.tier,
        buyerName:
          purchase.buyerType === 'user'
            ? `${purchase.user?.firstName || ''} ${
                purchase.user?.lastName || ''
              }`.trim()
            : `${purchase.guestDetails?.firstName || ''} ${
                purchase.guestDetails?.lastName || ''
              }`.trim(),
        buyerEmail:
          purchase.buyerType === 'user'
            ? purchase.user?.email
            : purchase.guestDetails?.email,
        eventName: purchase.event?.name,
        amountPaid: purchase.totalAmount,
        redeemedAt: log.redeemedAt,
        redeemedBy: `${log.redeemedBy?.firstName || ''} ${
          log.redeemedBy?.lastName || ''
        }`.trim(),
        redeemedByEmail: log.redeemedBy?.email,
        quantity: log.quantity,
        entryMode: log.method,
      }))
    )

    // Pagination info
    const totalLogs = flattenedLogs.length
    const paginatedLogs = flattenedLogs.slice(0, parsedLimit) // since skip already applied on purchases

    return res.status(200).json({
      success: true,
      message: 'Redemption logs fetched successfully',
      data: {
        items: paginatedLogs,
        pagination: {
          totalItems: totalLogs,
          currentPage: parsedPage,
          totalPages: Math.ceil(totalLogs / parsedLimit),
          pageSize: parsedLimit,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching redemption logs:', error)
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
}

exports.checkMaxTicketLimit = async (req, res) => {
  try {
    const { eventId, buyerType, userId, guestEmail } = req.body

    if (!eventId || !buyerType) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and buyer type are required',
      })
    }

    if (buyerType === 'user' && !userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for registered users',
      })
    }

    if (buyerType === 'guest' && !guestEmail) {
      return res.status(400).json({
        success: false,
        message: 'Guest email is required for guest purchases',
      })
    }

    // Get the ticket configuration for the event
    const ticketConfig = await SpectatorTicket.findOne({ eventId })
    if (!ticketConfig) {
      return res.status(404).json({
        success: false,
        message: 'Ticket configuration not found for this event',
      })
    }

    // Build filter for existing purchases
    let purchaseFilter = { event: eventId }

    if (buyerType === 'user') {
      purchaseFilter.user = userId
      purchaseFilter.buyerType = 'user'
    } else {
      purchaseFilter.buyerType = 'guest'
      purchaseFilter['guestDetails.email'] = guestEmail
    }

    // Get existing purchases by this user/guest for this event
    const existingPurchases = await SpectatorTicketPurchase.find(purchaseFilter)

    // Calculate purchased quantities by tier
    const purchasedByTier = {}
    let totalPurchased = 0

    existingPurchases.forEach((purchase) => {
      if (!purchasedByTier[purchase.tier]) {
        purchasedByTier[purchase.tier] = 0
      }
      purchasedByTier[purchase.tier] += purchase.quantity
      totalPurchased += purchase.quantity
    })

    // Check limits for each tier (only for online available tiers)
    const tierLimits = {}
    let hasReachedMaxLimit = false
    let limitExceededTiers = []

    // Filter tiers to only include those available for online purchase
    const onlineAvailableTiers = ticketConfig.tiers.filter(
      (tier) =>
        tier.availabilityMode === 'Online' || tier.availabilityMode === 'Both'
    )

    onlineAvailableTiers.forEach((tier) => {
      const purchased = purchasedByTier[tier.name] || 0
      tierLimits[tier.name] = {
        limitPerUser: tier.limitPerUser,
        purchased: purchased,
        remaining: tier.limitPerUser ? tier.limitPerUser - purchased : null,
        canPurchaseMore: tier.limitPerUser
          ? purchased < tier.limitPerUser
          : true,
      }

      if (tier.limitPerUser && purchased >= tier.limitPerUser) {
        hasReachedMaxLimit = true
        limitExceededTiers.push(tier.name)
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Ticket limits checked successfully',
      data: {
        hasReachedMaxLimit,
        limitExceededTiers,
        totalPurchased,
        tierLimits,
        buyerType,
        buyerIdentifier: buyerType === 'user' ? userId : guestEmail,
      },
    })
  } catch (error) {
    console.error('Error checking ticket limits:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    })
  }
}
