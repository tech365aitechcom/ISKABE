const express = require('express')
const router = express.Router()
const newsController = require('../controllers/news.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, newsController.createNews)
router.get('/', newsController.getAllNews)
router.get('/:id', newsController.getNewsById)
router.put('/:id', protect, newsController.updateNews)
router.delete('/:id', protect, newsController.deleteNews)
router.patch('/:id/publish', protect, newsController.togglePublishStatus)

module.exports = router
