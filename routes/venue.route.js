const express = require('express')
const router = express.Router()
const venueController = require('../controllers/venue.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, venueController.createVenue)
router.get('/', venueController.getVenues)
router.get('/:id', venueController.getVenueById)
router.put('/:id', venueController.updateVenue)
router.delete('/:id', venueController.deleteVenue)

module.exports = router
