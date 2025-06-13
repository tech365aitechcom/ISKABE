const express = require('express')
const router = express.Router()
const suspensionController = require('../controllers/suspension.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, suspensionController.createSuspension)
router.get('/', suspensionController.getAllSuspensions)
router.get('/:id', suspensionController.getSuspensionById)
router.put('/:id', suspensionController.updateSuspension)
router.delete('/:id', suspensionController.deleteSuspension)

module.exports = router
