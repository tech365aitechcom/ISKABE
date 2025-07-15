const Fight = require('../models/fight.model')
const Bout = require('../models/bout.model')
const { roles } = require('../constant')

exports.createFight = async (req, res) => {
  try {
    const { role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create brackets.',
      })
    }
    const fight = new Fight(req.body)
    await fight.save()

    await Bout.findByIdAndUpdate(fight.bout, { fight: fight._id })

    res.status(201).json({
      success: true,
      message: 'Fight created successfully',
      data: fight,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error while creating fight' })
  }
}

exports.getAllFights = async (req, res) => {
  try {
    const {
      eventId,
      bracketId,
      boutId,
      status,
      page = 1,
      limit = 10,
    } = req.query

    const filter = {}
    if (eventId) filter.event = eventId
    if (bracketId) filter.bracket = bracketId
    if (boutId) filter.bout = boutId
    if (status) filter.status = status

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Fight.countDocuments(filter)

    const fights = await Fight.find(filter)
      .populate({
        path: 'winner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      message: 'Fights fetched successfully',
      data: {
        items: fights,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch fights' })
  }
}

exports.getFightById = async (req, res) => {
  try {
    const fight = await Fight.findById(req.params.id)
      .populate('event bracket bout')
      .populate({
        path: 'winner',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhoto',
        },
      })

    if (!fight) {
      return res.status(404).json({ message: 'Fight not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Fight fetched successfully',
      data: fight,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to retrieve fight' })
  }
}

exports.updateFight = async (req, res) => {
  try {
    const updatedFight = await Fight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    if (!updatedFight) {
      return res.status(404).json({ message: 'Fight not found' })
    }

    res.status(200).json(updatedFight)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update fight' })
  }
}

exports.deleteFight = async (req, res) => {
  try {
    const fight = await Fight.findByIdAndDelete(req.params.id)

    if (!fight) {
      return res.status(404).json({ message: 'Fight not found' })
    }

    // Optional: Remove reference from Bout
    await Bout.findByIdAndUpdate(fight.bout, { $unset: { fight: '' } })

    res.status(200).json({ message: 'Fight deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete fight' })
  }
}
