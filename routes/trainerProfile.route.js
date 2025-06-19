const express = require('express')
const router = express.Router()
const trainerProfileController = require('../controllers/trainerProfile.controller')
const { protect } = require('../middlewares/auth.middleware')

// Get trainer profile route
router.get('/', trainerProfileController.getAllTrainerProfiles)

// Create trainer profile route
router.post('/', protect, trainerProfileController.createTrainerProfile)

// Update trainer profile route
router.put('/:id', protect, trainerProfileController.updateTrainerProfileById)

module.exports = router
