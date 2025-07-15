const express = require('express')
const router = express.Router()
const bracketController = require('../controllers/bracket.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, bracketController.createBracket)
router.get('/', bracketController.getAllBrackets)
router.get('/:id', bracketController.getBracketById)
router.put('/:id', bracketController.updateBracket)
router.delete('/:id', bracketController.deleteBracket)

module.exports = router
