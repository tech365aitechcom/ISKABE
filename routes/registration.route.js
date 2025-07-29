const express = require('express')
const router = express.Router()
const registrationController = require('../controllers/registration.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, registrationController.createRegistration)
router.get('/', registrationController.getRegistrations)
router.get('/:id', registrationController.getRegistrationById)
router.get('/event/:eventId', registrationController.getRegistrationsByEventId)
router.put('/:id', registrationController.updateRegistration)
router.delete('/:id', registrationController.deleteRegistration)

module.exports = router
