const express = require('express')
const router = express.Router()
const fighterCheckInController = require('../controllers/fighterCheckIn.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, fighterCheckInController.createFighterCheckIn)
router.get('/', fighterCheckInController.getAllFighterCheckIns)
router.get('/:id', fighterCheckInController.getFighterCheckInById)
router.put('/:id', fighterCheckInController.updateFighterCheckIn)
router.delete('/:id', fighterCheckInController.deleteFighterCheckIn)

module.exports = router
