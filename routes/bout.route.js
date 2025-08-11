const express = require('express')
const router = express.Router()
const boutController = require('../controllers/bout.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, boutController.createBout)
router.get('/', boutController.getAllBouts)
router.get('/event/:eventId', boutController.getBoutsByEventId)
router.get('/:id', boutController.getBoutById)
router.put('/:id', boutController.updateBout)
router.delete('/:id', boutController.deleteBout)

module.exports = router
