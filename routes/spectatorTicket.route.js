const express = require('express')
const router = express.Router()
const spectatorTicketController = require('../controllers/spectatorTicket.controller')
const spectatorTicketPurchaseController = require('../controllers/SpectatorTicketPurchase.controller')
const { protect } = require('../middlewares/auth.middleware')

// Spectator Ticket
router.post('/', protect, spectatorTicketController.createSpectatorTicket)
router.get('/', spectatorTicketController.getAllSpectatorTickets)
router.get('/:eventId', spectatorTicketController.getSpectatorTicketByEventId)
router.put('/:eventId', spectatorTicketController.updateSpectatorTicket)
router.delete('/:eventId', spectatorTicketController.deleteSpectatorTicket)

// Spectator Ticket Purchase
router.post('/purchase', spectatorTicketPurchaseController.buySpectatorTicket)

module.exports = router
