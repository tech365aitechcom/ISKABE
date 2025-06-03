const TrainingFacility = require('../models/trainingFacility.model')

exports.createTrainingFacility = async (req, res) => {
  try {
    const { id: userId } = req.user
    const newFacility = new TrainingFacility({ ...req.body, createdBy: userId })
    await newFacility.save()

    res.status(201).json({
      success: true,
      message: 'Training facility created successfully',
      data: newFacility,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getAllFacilities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, martialArtsStyle } = req.query

    const filter = {}

    if (search) {
      filter.$or = [
        { facilityName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ]
    }

    if (martialArtsStyle) {
      filter.martialArtsStyles = { $in: [martialArtsStyle] }
    }

    const total = await TrainingFacility.countDocuments(filter)

    const facilities = await TrainingFacility.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate(
        'createdBy',
        '-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -__v'
      )
    res.json({
      success: true,
      message: 'Training facilities fetched successfully',
      data: {
        items: facilities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getFacilityById = async (req, res) => {
  try {
    const facility = await TrainingFacility.findById(req.params.id)
    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: 'Training facility not found' })
    }

    res.json({ success: true, data: facility })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateFacility = async (req, res) => {
  try {
    const facility = await TrainingFacility.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: 'Training facility not found' })
    }

    res.json({
      success: true,
      message: 'Training facility updated successfully',
      data: facility,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteFacility = async (req, res) => {
  try {
    const facility = await TrainingFacility.findByIdAndDelete(req.params.id)
    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: 'Training facility not found' })
    }

    res.json({
      success: true,
      message: 'Training facility deleted successfully',
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
