const { roles } = require('../constant')
const Rules = require('../models/rule.model')

exports.createRule = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create rules.',
      })
    }

    const rule = new Rules({
      ...req.body,
      createdBy: userId,
    })

    await rule.save()

    res.status(201).json({
      message: 'Rule created successfully',
      data: rule,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error creating rule' })
  }
}

exports.getAllRules = async (req, res) => {
  try {
    const {
      categoryTabName,
      subTabName,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query
    const filter = {}
    if (categoryTabName) filter.categoryTabName = categoryTabName
    if (subTabName) filter.subTabName = subTabName
    if (status) filter.status = status
    if (search) {
      filter.$or = [{ ruleTitle: { $regex: search, $options: 'i' } }]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Rules.countDocuments(filter)

    const rules = await Rules.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      message: 'Rules list fetched',
      data: {
        items: rules,
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
    res.status(500).json({ error: 'Error fetching rules' })
  }
}

exports.getRulesById = async (req, res) => {
  try {
    const rule = await Rules.findById(req.params.id).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }
    res.json({
      success: true,
      message: 'Rule fetched successfully',
      data: rule,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching rule' })
  }
}

exports.updateRule = async (req, res) => {
  try {
    const rule = await Rules.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }
    res.json({
      success: true,
      message: 'Rule updated successfully',
      data: rule,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error updating rule' })
  }
}

exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rules.findByIdAndDelete(req.params.id)
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }
    res.json({
      success: true,
      message: 'Rule deleted successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting rule' })
  }
}
