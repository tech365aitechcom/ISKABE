const express = require('express')
const router = express.Router()
const cashCodeController = require('../controllers/cashCode.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, cashCodeController.requestCashCode)
router.get('/', cashCodeController.getAllCashCodes)
router.get('/:id', cashCodeController.getCashCodeById)
router.put('/:id', cashCodeController.updateCashCode)
router.delete('/:id', cashCodeController.deleteCashCode)

module.exports = router
