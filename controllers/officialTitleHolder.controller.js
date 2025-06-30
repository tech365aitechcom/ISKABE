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
      message: 'Official Title Holder created successfully',
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
      country,
      state,
      city,
      search,
      page = 1,
      limit = 10,
    } = req.query

    const match = {}

    if (proClassification) match.proClassification = proClassification
    if (sport) match.sport = sport
    if (ageClass) match.ageClass = ageClass
    if (weightClass) match.weightClass = weightClass
    if (search) match.title = { $regex: search, $options: 'i' }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'fighterprofiles',
          localField: 'fighter',
          foreignField: '_id',
          as: 'fighter',
        },
      },
      { $unwind: { path: '$fighter', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'fighter.userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]

    const locationFilter = {}
    if (country) locationFilter['user.country'] = country
    if (state) locationFilter['user.state'] = state
    if (city) locationFilter['user.city'] = city

    if (Object.keys(locationFilter).length > 0) {
      pipeline.push({ $match: locationFilter })
    }

    // Count total
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await OfficialTitleHolder.aggregate(countPipeline)
    const total = countResult[0]?.total || 0

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    pipeline.push({ $sort: { createdAt: -1 } })
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    // Project only required fields
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        date: 1,
        proClassification: 1,
        sport: 1,
        ageClass: 1,
        weightClass: 1,
        notes: 1,
        createdAt: 1,
        fighter: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          dateOfBirth: 1,
          email: 1,
          country: 1,
          state: 1,
          city: 1,
          profilePhoto: 1,
        },
      },
    })

    const data = await OfficialTitleHolder.aggregate(pipeline)

    res.json({
      success: true,
      message: 'Official Title Holder list fetched',
      data: {
        items: data,
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
    res.status(500).json({ error: 'Error fetching title holders' })
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
