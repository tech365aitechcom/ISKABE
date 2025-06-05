const express = require('express')
const router = express.Router()
const promoterController = require('../controllers/promoter.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, promoterController.createPromoter)
router.get('/', promoterController.getAllPromoterProfile)

module.exports = router
