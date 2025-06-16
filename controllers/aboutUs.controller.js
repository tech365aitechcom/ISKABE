const { roles } = require('../constant')
const AboutUs = require('../models/aboutUs.model')

exports.createAboutUs = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create.',
      })
    }

    const existing = await AboutUs.findOne()
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'About Us already exist. Please update the existing.',
      })
    }

    const aboutUs = new AboutUs({
      ...req.body,
      createdBy: userId,
    })

    await aboutUs.save()

    res.status(201).json({
      message: 'About Us created successfully',
      data: aboutUs,
    })
  } catch (err) {
    console.log(err)
    res
      .status(400)
      .json({ success: false, message: 'Creation Failed', error: err.message })
  }
}

exports.getAboutUs = async (req, res) => {
  try {
    const data = await AboutUs.findOne()
    res.status(200).json({ success: true, message: 'Fetched About Us', data })
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Server Error', error: err.message })
  }
}

exports.getFooterConfig = async (req, res) => {
  try {
    // Fetch only logo and menuItems fields
    const data = await AboutUs.findOne()
      .select(
        'facebookURL instagramURL twitterURL termsConditionsPDF privacyPolicyPDF copyrightNoticePDF'
      )
      .lean()

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateAboutUs = async (req, res) => {
  try {
    const updated = await AboutUs.findOneAndUpdate({}, req.body, { new: true })
    res
      .status(200)
      .json({ success: true, message: 'Updated About Us', data: updated })
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: 'Update Failed', error: err.message })
  }
}

exports.deleteAboutUs = async (req, res) => {
  try {
    await AboutUs.deleteMany({})
    res.status(200).json({ success: true, message: 'Deleted About Us' })
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Deletion Failed', error: err.message })
  }
}
