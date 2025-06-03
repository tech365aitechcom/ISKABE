const express = require('express')
const router = express.Router()
const facilityController = require('../controllers/trainingFacility.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, facilityController.createTrainingFacility)
router.get('/', facilityController.getAllFacilities)
router.get('/:id', facilityController.updateFacility)
router.delete('/:id', facilityController.deleteFacility)

module.exports = router
