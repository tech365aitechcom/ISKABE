const { roles } = require('../constant')
const Bracket = require('../models/bracket.model')
const Bout = require('../models/bout.model')
const Fight = require('../models/fight.model')

exports.createBracket = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create brackets.',
      })
    }
    const bracket = new Bracket({ ...req.body, createdBy: userId })
    await bracket.save()

    res.status(201).json({
      success: true,
      message: 'Bracket created successfully',
      data: bracket,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create bracket',
      error,
    })
  }
}

exports.getAllBrackets = async (req, res) => {
  try {
    const { eventId, page = 1, limit = 10 } = req.query
    const filter = {}

    if (eventId) filter.event = eventId

    const brackets = await Bracket.find(filter)
      .populate('event')
      .populate({
        path: 'fighters',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .lean() // Get plain JS objects for post-processing
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await Bracket.countDocuments(filter)

    // Dynamically fetch all bouts related to these brackets
    const bracketIds = brackets.map((b) => b._id)
    const allBouts = await Bout.find({ bracket: { $in: bracketIds } })
      .populate({
        path: 'redCorner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .populate({
        path: 'blueCorner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .populate('fight')
      .lean()

    // Group bouts by bracket ID
    const boutsByBracket = {}
    allBouts.forEach((b) => {
      const bid = b.bracket.toString()
      if (!boutsByBracket[bid]) boutsByBracket[bid] = []
      boutsByBracket[bid].push(b)
    })

    // Attach bouts to each bracket
    const enrichedBrackets = brackets.map((b) => {
      const bid = b._id.toString()
      return {
        ...b,
        bouts: boutsByBracket[bid] || [],
      }
    })

    res.status(200).json({
      success: true,
      data: enrichedBrackets,
      pagination: {
        totalItems: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        pageSize: parseInt(limit),
      },
    })
  } catch (error) {
    console.error('Error in getAllBrackets:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getBracketById = async (req, res) => {
  try {
    const bracket = await Bracket.findById(req.params.id)
      .populate('event')
      .populate({
        path: 'fighters',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .lean()

    if (!bracket) {
      return res
        .status(404)
        .json({ success: false, message: 'Bracket not found' })
    }

    // Fetch bouts dynamically for this bracket
    const bouts = await Bout.find({ bracket: bracket._id })
      .populate({
        path: 'redCorner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .populate({
        path: 'blueCorner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .populate('fight')
      .lean()

    // Attach bouts to the bracket object
    bracket.bouts = bouts

    res.status(200).json({ success: true, data: bracket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateBracket = async (req, res) => {
  try {
    const updatedBracket = await Bracket.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedBracket) {
      return res
        .status(404)
        .json({ success: false, message: 'Bracket not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Bracket updated successfully',
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.deleteBracket = async (req, res) => {
  try {
    const { id } = req.params

    const bracket = await Bracket.findById(id)

    if (!bracket) {
      return res
        .status(404)
        .json({ success: false, message: 'Bracket not found' })
    }

    // Delete all bouts and their fights
    const bouts = await Bout.find({ bracket: id })

    for (const bout of bouts) {
      await Fight.deleteMany({ bout: bout._id })
    }

    await Bout.deleteMany({ bracket: id })

    await bracket.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Bracket and related bouts/fights deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bracket',
      error,
    })
  }
}
