const express = require('express')
const router = express.Router()
const HomepageConfigController = require('../controllers/homeSetting.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, HomepageConfigController.createHomePageConfig)
router.get('/', HomepageConfigController.getHomePageConfig)
// router.put('/:id', HomepageConfigController.updateSettings)
// router.delete('/:id', HomepageConfigController.deleteSettings)

module.exports = router
