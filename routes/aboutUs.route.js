const express = require('express')
const router = express.Router()
const aboutUsController = require('../controllers/aboutUs.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, aboutUsController.createAboutUs)
router.get('/', aboutUsController.getAboutUs)
router.get('/footer', aboutUsController.getFooterConfig)
router.put('/:id', aboutUsController.updateAboutUs)
router.delete('/:id', aboutUsController.deleteAboutUs)

module.exports = router
