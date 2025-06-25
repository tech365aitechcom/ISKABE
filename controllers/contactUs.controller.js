const Contact = require('../models/contactUs.model')

exports.createContact = async (req, res) => {
  try {
    const { id: userId } = req.user

    const contact = new Contact({ ...req.body, createdBy: userId })
    await contact.save()

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received.',
      data: contact,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, state } = req.query
    const skip = (page - 1) * limit

    const matchStage = {}

    if (state) matchStage.state = state

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $unwind: {
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...matchStage,
          ...(search
            ? {
                $or: [
                  { subIssue: { $regex: search, $options: 'i' } },
                  { 'createdBy.email': { $regex: search, $options: 'i' } },
                ],
              }
            : {}),
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]

    const result = await Contact.aggregate(pipeline)
    const items = result[0].data
    const total = result[0].totalCount[0]?.count || 0

    // Remove sensitive fields from createdBy
    items.forEach((item) => {
      if (item.createdBy) {
        delete item.createdBy.password
        delete item.createdBy.verificationToken
        delete item.createdBy.verificationTokenExpiry
        delete item.createdBy.resetToken
        delete item.createdBy.resetTokenExpiry
        delete item.createdBy.__v
      }
    })

    res.json({
      success: true,
      message: 'Contacts fetched successfully',
      data: {
        items,
        pagination: {
          totalItems: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          pageSize: parseInt(limit),
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact)
      return res
        .status(404)
        .json({ success: false, message: 'Contact not found' })
    res.json({ success: true, data: contact })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!contact)
      return res
        .status(404)
        .json({ success: false, message: 'Contact not found' })
    res.json({ success: true, message: 'Contact updated successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact)
      return res
        .status(404)
        .json({ success: false, message: 'Contact not found' })
    res.json({ success: true, message: 'Contact deleted successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
