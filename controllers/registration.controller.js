const Registration = require('../models/registration.model')

// Create new registration
exports.createRegistration = async (req, res) => {
  try {
    const { id: userId } = req.user

    const registration = new Registration({
      ...req.body,
      createdBy: userId,
    })

    await registration.save()

    res.status(201).json({
      message: 'Registration successfully',
      data: registration,
    })
  } catch (error) {
    console.log(error)

    res.status(400).json({ message: error.message })
  }
}
