const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboard.controller')
const { protect, requireRoles } = require('../middlewares/auth.middleware')
const { roles } = require('../constant')

router.get(
  '/',
  protect,
  requireRoles(roles.superAdmin),
  dashboardController.getDashboardData
)

module.exports = router
