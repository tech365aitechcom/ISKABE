const express = require('express')
const router = express.Router()
const tournamentSettingsController = require('../controllers/tournamentSettings.controller')
const { protect } = require('../middlewares/auth.middleware')

router.post('/', protect, tournamentSettingsController.createTournamentSettings)
router.get(
  '/:eventId',
  tournamentSettingsController.getTournamentSettingsByEventId
)
router.put('/:eventId', tournamentSettingsController.updateTournamentSettings)
router.delete(
  '/:eventId',
  tournamentSettingsController.deleteTournamentSettings
)

module.exports = router
