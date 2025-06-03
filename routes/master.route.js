const express = require('express')
const router = express.Router()
const masterController = require('../controllers/master.controller')

// GET /api/master
router.get('/master', masterController.getAllMasterData)

// GET /api/master/:type (e.g., /api/master/topics)
router.get('/master/:type', masterController.getMasterByType)

module.exports = router
