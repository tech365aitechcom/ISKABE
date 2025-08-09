const express = require('express')
const router = express.Router()
const spectatorTicketController = require('../controllers/spectatorTicket.controller')
const spectatorTicketPurchaseController = require('../controllers/spectatorTicketPurchase.controller')
const { protect } = require('../middlewares/auth.middleware')

// Spectator Ticket
router.post('/', protect, spectatorTicketController.createSpectatorTicket)
router.get('/', spectatorTicketController.getAllSpectatorTickets)
router.get('/:eventId', spectatorTicketController.getSpectatorTicketByEventId)
router.put('/:eventId', spectatorTicketController.updateSpectatorTicket)
router.delete('/:eventId', spectatorTicketController.deleteSpectatorTicket)

// Spectator Ticket Purchase
router.post('/purchase', spectatorTicketPurchaseController.buySpectatorTicket)
router.post(
  '/redeem',
  protect,
  spectatorTicketPurchaseController.redeemSpectatorTicket
)
router.get(
  '/purchase/user',
  protect,
  spectatorTicketPurchaseController.getTicketsByUser
)
router.get(
  '/purchase/:ticketCode',
  spectatorTicketPurchaseController.getTicketByCode
)
router.get(
  '/purchase/event/:eventId',
  spectatorTicketPurchaseController.getEventPurchases
)
router.get(
  '/purchase/event/:eventId/redemption-logs',
  spectatorTicketPurchaseController.getEventRedemptionLogs
)

module.exports = router
