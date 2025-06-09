const express = require('express')
const router = express.Router()
const facilityController = require('../controllers/trainingFacility.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, facilityController.createTrainingFacility)
router.get('/', protect, facilityController.getAllFacilities)
router.get('/:id', facilityController.getFacilityById)
router.put('/:id', facilityController.updateFacility)
router.delete('/:id', facilityController.deleteFacility)

module.exports = router
