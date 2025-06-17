const Contact = require('../models/contactUs.model')

exports.createContact = async (req, res) => {
  try {
    const { id: userId } = req.user

    const contact = new Contact({ ...req.body, createdBy: userId })
    await contact.save()

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contact,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, subject, state } = req.query

    const filter = {}
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ]
    }
    if (subject) filter.subject = subject
    if (state) filter.state = state

    const total = await Contact.countDocuments(filter)
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
    res.json({
      success: true,
      message: 'Contacts fetched successfully',
      data: {
        items: contacts,
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
