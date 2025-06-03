const express = require('express')
const router = express.Router()
const contactUsSettingController = require('../controllers/contactUsSetting.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, contactUsSettingController.createSettings)
router.get('/', contactUsSettingController.getSettings)
router.put('/:id', contactUsSettingController.updateSettings)
router.delete('/:id', contactUsSettingController.deleteSettings)

module.exports = router
