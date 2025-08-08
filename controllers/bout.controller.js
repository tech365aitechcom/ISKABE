const { roles } = require('../constant')
const Bout = require('../models/bout.model')
const Bracket = require('../models/bracket.model')
const Fight = require('../models/fight.model')

exports.createBout = async (req, res) => {
  try {
    const { role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create brackets.',
      })
    }

    const { bracket, boutNumber } = req.body

    // Check for duplicate boutNumber within the same bracket
    const existingBout = await Bout.findOne({ bracket, boutNumber })
    if (existingBout) {
      return res.status(400).json({
        success: false,
        message: `Bout number ${boutNumber} already exists in this bracket.`,
      })
    }

    // Create and save the new bout
    const bout = new Bout(req.body)
    await bout.save()

    // Push bout ID to bracket.bouts array
    await Bracket.findByIdAndUpdate(bracket, {
      $push: { bouts: bout._id },
    })

    res.status(201).json({
      success: true,
      message: 'Bout created successfully',
      data: bout,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.getAllBouts = async (req, res) => {
  try {
    const { bracketId, page = 1, limit = 10 } = req.query
    const filter = {}

    if (bracketId) filter.bracket = bracketId

    const bouts = await Bout.find(filter)
      .populate('bracket')
      .populate('redCorner')
      .populate('blueCorner')
      .populate('fight')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ boutNumber: 1 })

    const count = await Bout.countDocuments(filter)

    res.status(200).json({
      success: true,
      data: bouts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getBoutById = async (req, res) => {
  try {
    const bout = await Bout.findById(req.params.id)
      .populate('bracket')
      .populate('redCorner')
      .populate('blueCorner')
      .populate('fight')

    if (!bout) {
      return res.status(404).json({ success: false, message: 'Bout not found' })
    }

    res.status(200).json({ success: true, data: bout })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateBout = async (req, res) => {
  try {
    const updated = await Bout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bout not found' })
    }

    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.deleteBout = async (req, res) => {
  try {
    const { id } = req.params

    const bout = await Bout.findById(id)
    if (!bout) {
      return res.status(404).json({ success: false, message: 'Bout not found' })
    }

    // Delete associated fight
    await Fight.deleteMany({ bout: id })

    // Remove bout reference from bracket
    await Bracket.findByIdAndUpdate(bout.bracket, {
      $pull: { bouts: bout._id },
    })

    await bout.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Bout and related fight deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
