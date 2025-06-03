const express = require('express')
const router = express.Router()
const contactUsController = require('../controllers/contactUs.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, contactUsController.createContact)
router.get('/', contactUsController.getAllContacts)
router.get('/:id', contactUsController.getContactById)
router.delete('/:id', contactUsController.deleteContact)

module.exports = router
