const express = require('express')
const router = express.Router()
const registrationController = require('../controllers/registration.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, registrationController.createRegistration)
router.get('/', registrationController.getRegistrations)

module.exports = router
