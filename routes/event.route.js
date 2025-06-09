const express = require('express')
const router = express.Router()
const eventController = require('../controllers/event.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, eventController.createEvent)

router.get('/', eventController.getAllEvents)

router.get('/:id', eventController.getEventById)

router.put('/:id', protect, eventController.updateEvent)

router.delete('/:id', protect, eventController.deleteEvent)

router.patch('/:id/toggle-status', protect, eventController.toggleEventStatus)

module.exports = router
