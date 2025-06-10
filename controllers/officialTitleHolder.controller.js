const { roles } = require('../constant')
const OfficialTitleHolder = require('../models/officialTitleHolder.model')

exports.createOfficialTitleHolder = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create.',
      })
    }

    const rule = new OfficialTitleHolder({
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

exports.getAllOfficialTitleHolders = async (req, res) => {
  try {
    const {
      proClassification,
      sport,
      ageClass,
      weightClass,
      search,
      page = 1,
      limit = 10,
    } = req.query
    const filter = {}
    if (proClassification) filter.proClassification = proClassification
    if (sport) filter.sport = sport
    if (ageClass) filter.ageClass = ageClass
    if (weightClass) filter.weightClass = weightClass
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await OfficialTitleHolder.countDocuments(filter)

    const officialTitleHolders = await OfficialTitleHolder.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate({
        path: 'fighter',
        populate: {
          path: 'userId',
          select:
            '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v',
        },
      })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      message: 'Official Title Holder list fetched',
      data: {
        items: officialTitleHolders,
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

exports.getOfficialTitleHoldersById = async (req, res) => {
  try {
    const rule = await OfficialTitleHolder.findById(req.params.id)
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
      .populate(
        'fighter',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }
    res.json({
      success: true,
      message: 'Official Title Holder fetched successfully',
      data: rule,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error fetching Official Title Holder' })
  }
}

exports.updateOfficialTitleHolder = async (req, res) => {
  try {
    const officialTitleHolder = await OfficialTitleHolder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    ).populate(
      'createdBy',
      '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
    )
    if (!officialTitleHolder) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({
      success: true,
      message: 'Official Title Holder updated successfully',
      data: officialTitleHolder,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error updating data' })
  }
}

exports.deleteOfficialTitleHolder = async (req, res) => {
  try {
    const officialTitleHolder = await OfficialTitleHolder.findByIdAndDelete(
      req.params.id
    )
    if (!officialTitleHolder) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({
      success: true,
      message: 'Official Title Holder deleted successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error deleting item' })
  }
}
