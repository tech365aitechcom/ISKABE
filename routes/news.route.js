const express = require('express')
const router = express.Router()
const newsController = require('../controllers/news.controller')
const { protect } = require('../middlewares/auth.middleware')

router.get('/', newsController.getAllNews)
router.post('/', protect, newsController.createNews)
router.get('/:id', newsController.getNewsById)
router.put('/:id', newsController.updateNews)
router.delete('/:id', newsController.deleteNews)
router.patch('/:id/publish', newsController.togglePublishStatus)

module.exports = router
