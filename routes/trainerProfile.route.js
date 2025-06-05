const express = require('express')
const router = express.Router()
const trainerProfileController = require('../controllers/trainerProfile.controller')
const { protect } = require('../middlewares/auth.middleware')

// Update trainer profile route
router.put('/:id', protect, trainerProfileController.updateTrainerProfileById)

module.exports = router
