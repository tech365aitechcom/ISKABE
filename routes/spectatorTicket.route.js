const express = require('express')
const router = express.Router()
const spectatorTicketController = require('../controllers/spectatorTicket.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, spectatorTicketController.createSpectatorTicket)
router.get('/', spectatorTicketController.getAllSpectatorTickets)
router.get('/:eventId', spectatorTicketController.getSpectatorTicketByEventId)
router.put('/:eventId', spectatorTicketController.updateSpectatorTicket)
router.delete('/:eventId', spectatorTicketController.deleteSpectatorTicket)

module.exports = router
