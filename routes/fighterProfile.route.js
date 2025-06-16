const express = require('express')
const router = express.Router()
const fighterProfileController = require('../controllers/fighterProfile.controller')
const { protect } = require('../middlewares/auth.middleware')

// Get fighter profile route
router.get('/', fighterProfileController.getAllFighterProfiles)

// Get fighter by id
router.get('/:id', fighterProfileController.getFighterProfileById)

// Update fighter profile route
router.put('/:id', protect, fighterProfileController.updateFighterProfileById)

module.exports = router
