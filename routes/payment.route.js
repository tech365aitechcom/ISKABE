const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/payment.controller')

// POST /api/payment/create-intent
router.post('/create-intent', paymentController.createPaymentIntent)

module.exports = router
