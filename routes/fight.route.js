const express = require('express')
const router = express.Router()
const fightController = require('../controllers/fight.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, fightController.createFight)
router.get('/', fightController.getAllFights)
router.get('/:id', fightController.getFightById)
router.put('/:id', fightController.updateFight)
router.delete('/:id', fightController.deleteFight)

module.exports = router
