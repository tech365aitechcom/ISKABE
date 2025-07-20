const { roles } = require('../constant')
const Suspension = require('../models/suspension.model')
const User = require('../models/user.model')

exports.createSuspension = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    const { person } = req.body

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to suspend users.',
      })
    }

    const existingSuspension = await Suspension.findOne({ person })

    if (existingSuspension) {
      return res.status(400).json({
        success: false,
        message: 'This user is already suspended.',
      })
    }

    const newSuspension = new Suspension({
      ...req.body,
      createdBy: userId,
    })

    await newSuspension.save()

    await User.findByIdAndUpdate(person, { isSuspended: true })



    res.status(201).json({
      success: true,
      message: 'User suspended successfully.',
      newSuspension,
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllSuspensions = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query
    const match = {}

    if (type) match.type = type
    if (status) match.status = status

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const searchRegex = search
      ? new RegExp(search.trim(), 'i') // case-insensitive regex
      : null

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'person',
          foreignField: '_id',
          as: 'person',
        },
      },
      { $unwind: '$person' },
    ]

    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            { 'person.firstName': { $regex: searchRegex } },
            { 'person.middleName': { $regex: searchRegex } },
            { 'person.lastName': { $regex: searchRegex } },
          ],
        },
      })
    }

    if (type) {
      pipeline.push({ $match: { type } })
    }

    if (status) {
      pipeline.push({ $match: { status } })
    }

    const totalResult = await Suspension.aggregate([
      ...pipeline,
      { $count: 'total' },
    ])
    const total = totalResult.length > 0 ? totalResult[0].total : 0

    pipeline.push({ $sort: { createdAt: -1 } })
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) })

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } }
    )

    const suspensions = await Suspension.aggregate(pipeline)

    res.json({
      success: true,
      message: 'Suspensions list fetched',
      data: {
        items: suspensions,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getSuspensionById = async (req, res) => {
  try {
    const suspension = await Suspension.findById(req.params.id)
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate(
        'person',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
    if (!suspension) {
      return res.status(404).json({ error: 'Suspension not found' })
    }
    res.json({
      success: true,
      message: 'Suspension fetched successfully',
      data: suspension,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateSuspension = async (req, res) => {
  try {
    const suspension = await Suspension.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!suspension) {
      return res.status(404).json({ error: 'Suspension not found' })
    }
    res.json({ message: 'Suspension updated successfully', data: suspension })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteSuspension = async (req, res) => {
  try {
    const suspension = await Suspension.findByIdAndDelete(req.params.id)
    if (!suspension) {
      return res.status(404).json({ error: 'Suspension not found' })
    }
    res.json({
      success: true,
      message: 'Suspensiondeleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
