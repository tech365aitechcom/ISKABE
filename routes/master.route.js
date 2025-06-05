const express = require('express')
const router = express.Router()
const masterController = require('../controllers/master.controller')

router.get('/', masterController.getAllMasterData)
router.get('/:type', masterController.getMasterByType)

module.exports = router
