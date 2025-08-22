const Event = require('../models/event.model')
const Venue = require('../models/venue.model')
const FighterProfile = require('../models/fighterProfile.model')
const SpectatorTicketPurchase = require('../models/spectatorTicketPurchase.model')
const Bout = require('../models/bout.model')
const Registration = require('../models/registration.model')

exports.getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const start = startDate ? new Date(startDate) : new Date('2000-01-01')
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)

    // 1. Total Events
    const totalEvents = await Event.countDocuments()

    // 2. Total Fighters
    const totalFighters = await FighterProfile.countDocuments()

    const genderSplitRaw = await FighterProfile.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$userInfo.gender', null] },
              then: 'Other',
              else: '$userInfo.gender',
            },
          },
          count: { $sum: 1 },
        },
      },
    ])

    const genderSplit = genderSplitRaw.reduce(
      (acc, curr) => {
        const key = (curr._id || 'Other').toLowerCase()
        acc[key] = curr.count
        return acc
      },
      { male: 0, female: 0, other: 0 }
    )

    const totalFightersData = {
      total: totalFighters,
      genderSplit,
    }

    //3. Bout fight today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todaysBoutCount = await Bout.countDocuments({
      startDate: { $gte: today, $lt: tomorrow },
    })

    // 4. Total Revenue (filtered)
    const totalRevenueData = await SpectatorTicketPurchase.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])
    const totalRevenue = totalRevenueData[0]?.total || 0

    // 5. Total Tickets Sold (filtered)
    const totalTickets = await SpectatorTicketPurchase.countDocuments({
      createdAt: { $gte: start, $lte: end },
    })

    // 6. Total Venues
    const totalVenues = await Venue.countDocuments()

    // 7. Event Participation Trend (filtered by registration date)
    const eventParticipationTrend = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ])

    // 8. Ticket Types Breakdown (filtered)
    const ticketTypeBreakdown = await SpectatorTicketPurchase.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $addFields: {
          tierList: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$tiers', []] } }, 0] },
              then: '$tiers',
              else: [{ tierName: '$tier', quantity: '$quantity' }],
            },
          },
        },
      },
      { $unwind: '$tierList' },
      {
        $group: {
          _id: '$tierList.tierName',
          count: { $sum: '$tierList.quantity' },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ])

    // 9. Daily Ticket Sales (filtered)
    const dailyTicketSales = await SpectatorTicketPurchase.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ])

    // 10. Revenue vs Redemption (filtered)
    const redemptionStats = await SpectatorTicketPurchase.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $addFields: {
          ticketPrice: { $divide: ['$totalAmount', '$quantity'] },
          redeemedRevenue: {
            $multiply: [
              { $divide: ['$totalAmount', '$quantity'] },
              '$redeemedQuantity',
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalAmount' },
          redeemedRevenue: { $sum: '$redeemedRevenue' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRevenue: 1,
          redeemedRevenue: 1,
        },
      },
    ])

    // 11. Weight Class Distribution
    const weightClassDistribution = await FighterProfile.aggregate([
      {
        $match: {
          weightClass: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: {
            weightClass: '$weightClass',
            gender: '$user.gender',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.weightClass',
          male: {
            $sum: {
              $cond: [{ $eq: ['$_id.gender', 'Male'] }, '$count', 0],
            },
          },
          female: {
            $sum: {
              $cond: [{ $eq: ['$_id.gender', 'Female'] }, '$count', 0],
            },
          },
          other: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$_id.gender', 'Male'] },
                    { $ne: ['$_id.gender', 'Female'] },
                  ],
                },
                '$count',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          weightClass: '$_id',
          male: 1,
          female: 1,
          other: 1,
        },
      },
    ])

    // 12. Bout Progress
    const totalBouts = await Bout.countDocuments()
    const completedBouts = await Bout.countDocuments({ fight: { $ne: null } })
    const scheduledBouts = totalBouts - completedBouts

    const boutProgress = {
      completed:
        totalBouts > 0
          ? ((completedBouts / totalBouts) * 100).toFixed(2)
          : '0.00',
      pending:
        totalBouts > 0
          ? ((scheduledBouts / totalBouts) * 100).toFixed(2)
          : '0.00',
    }

    // 13. Upcoming Events

    const rawUpcomingEvents = await Event.find({
      startDate: { $gte: new Date() },
      isDraft: false,
    })
      .sort({ startDate: 1 })
      .select('name startDate endDate venue poster')
      .populate('venue', 'name address')
      .lean()

    const eventIds = rawUpcomingEvents.map((event) => event._id)

    const fighterCounts = await Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          registrationType: 'fighter',
          status: 'Verified',
        },
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
        },
      },
    ])

    const fighterCountMap = fighterCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count
      return acc
    }, {})

    const upcomingEvents = rawUpcomingEvents.map((event) => ({
      ...event,
      registeredFighters: fighterCountMap[event._id.toString()] || 0,
    }))

    // 14. Recent Fighter Registrations
    const recentFighterRegistrations = await Registration.find({
      registrationType: 'fighter',
      status: 'Verified',
    })
      .sort({ createdAt: -1 })
      .populate('event')
      .populate('createdBy')

    // 15. Bouts Missing Results
    const boutsMissingResults = await Bout.find({ fight: null })
      .sort({ startDate: -1 })
      .select('startDate boutNumber redCorner blueCorner bracket')
      .populate('redCorner')
      .populate('blueCorner')
      .populate({
        path: 'bracket',
        populate: {
          path: 'event',
        },
      })

    // 16. Fighters with Alerts
    const rawAlerts = await Registration.find({
      registrationType: 'fighter',
      $or: [
        { medicalExamDone: false },
        { physicalRenewalDate: { $lt: new Date() } },
        { licenseRenewalDate: { $lt: new Date() } },
        { status: { $ne: 'Verified' } },
      ],
    })
      .select(
        '_id firstName lastName status medicalExamDone physicalRenewalDate licenseRenewalDate'
      )
      .lean()

    function isDateExpired(date) {
      return date && new Date(date) < new Date()
    }

    const fightersWithAlerts = rawAlerts.map((fighter) => {
      let issueType = null
      let severity = 'Warning'

      if (
        fighter.medicalExamDone === false ||
        isDateExpired(fighter.physicalRenewalDate)
      ) {
        issueType = 'Medical Expired'
        severity = 'Critical'
      } else if (isDateExpired(fighter.licenseRenewalDate)) {
        issueType = 'License Expired'
        severity = 'Warning'
      } else if (fighter.status !== 'Verified') {
        issueType = 'Documentation Incomplete'
        severity = 'Warning'
      }

      return {
        id: fighter._id, // Include the ID
        name: `${fighter.firstName} ${fighter.lastName}`,
        issueType,
        status: severity,
      }
    })

    // 17. Recent Spectator Ticket Purchases
    const spectatorTicketLogs = await SpectatorTicketPurchase.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate({
        path: 'event',
        populate: {
          path: 'venue',
        },
      })

    res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: {
        totalEvents,
        totalFightersData,
        todaysBoutCount,
        totalRevenue,
        totalTickets,
        totalVenues,
        eventParticipationTrend,
        ticketTypeBreakdown,
        dailyTicketSales,
        redemptionStats,
        weightClassDistribution,
        boutProgress,
        upcomingEvents,
        recentFighterRegistrations,
        boutsMissingResults,
        fightersWithAlerts,
        spectatorTicketLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ message: 'Failed to fetch dashboard data' })
  }
}
