const express = require('express')
const router = express.Router()
const officialTitleHolderController = require('../controllers/officialTitleHolder.controller')
const { protect } = require('../middlewares/auth.middleware')

router.get('/', officialTitleHolderController.getAllOfficialTitleHolders)
router.post(
  '/',
  protect,
  officialTitleHolderController.createOfficialTitleHolder
)
router.get('/:id', officialTitleHolderController.getOfficialTitleHoldersById)
router.put('/:id', officialTitleHolderController.updateOfficialTitleHolder)
router.delete('/:id', officialTitleHolderController.deleteOfficialTitleHolder)

module.exports = router
