const express = require('express')
const router = express.Router()
const HomepageConfigController = require('../controllers/homeSetting.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, HomepageConfigController.createHomePageConfig)
router.get('/', HomepageConfigController.getHomePageConfig)
router.get('/navbar', HomepageConfigController.getNavbarConfig)
router.put('/:id', HomepageConfigController.updateHomePageConfig)
router.delete('/:id', HomepageConfigController.deleteHomePageConfig)

module.exports = router
