const express = require('express')
const router = express.Router()
const peopleController = require('../controllers/people.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, peopleController.createPeople)
router.get('/', peopleController.getAllPeople)
router.get('/:id', peopleController.getPeopleById)
router.put('/:id', peopleController.updatePeople)
router.delete('/:id', peopleController.deletePeople)

module.exports = router
