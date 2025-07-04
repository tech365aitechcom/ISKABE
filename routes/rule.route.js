const express = require('express')
const router = express.Router()
const ruleController = require('../controllers/rule.controller')
const { protect } = require('../middlewares/auth.middleware')

router.get('/', ruleController.getAllRules)
router.get('/active', ruleController.getActiveRules)
router.post('/', protect, ruleController.createRule)
router.get('/:id', ruleController.getRulesById)
router.put('/:id', ruleController.updateRule)
router.delete('/:id', ruleController.deleteRule)

module.exports = router
