const express = require('express')
const app = express()
require('dotenv').config()
const connectDB = require('./config/db')
const cors = require('cors')
const bodyParser = require('body-parser')
const { uploadS3, upload } = require('./config/s3')
const SuspensionService = require('./services/suspension.service')

const masterRoutes = require('./routes/master.route')
const userRoutes = require('./routes/user.route')
const trainerProfileRoutes = require('./routes/trainerProfile.route')
const fighterProfileRoutes = require('./routes/fighterProfile.route')
const newsRoutes = require('./routes/news.route')
const venueRouter = require('./routes/venue.route')
const eventRouter = require('./routes/event.route')
const ruleRouter = require('./routes/rule.route')
const officialTitleHoldersRoutes = require('./routes/officialTitleHolder.route')
const aboutUsRoutes = require('./routes/aboutUs.route')
const contactUsSettingsRoutes = require('./routes/contactUsSetting.route')
const contactUsRoutes = require('./routes/contactUs.route')
const homeConfigRoutes = require('./routes/homeSetting.route')
const trainingFacilitiesRoutes = require('./routes/trainingFacility.route')
const promoterRoutes = require('./routes/promoter.route')
const peopleRoutes = require('./routes/people.route')
const registrationRoutes = require('./routes/registration.route')
const suspensionRoutes = require('./routes/suspension.route')
const tournamentSettingRoutes = require('./routes/tournamentSettings.route')
const spectatorTicketRoutes = require('./routes/spectatorTicket.route')
const fighterCheckInRoutes = require('./routes/fighterCheckIn.route')
const bracketRoutes = require('./routes/bracket.route')
const boutRoutes = require('./routes/bout.route')
const fightRoutes = require('./routes/fight.route')
const cashCodeRoutes = require('./routes/cashCode.route')
const dashboardRoutes = require('./routes/dashboard.route')
const paymentRoutes = require('./routes/payment.route')

app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api/master', masterRoutes)
app.use('/api/auth', userRoutes)
app.use('/api/trainers', trainerProfileRoutes)
app.use('/api/fighters', fighterProfileRoutes)
app.use('/api/promoter', promoterRoutes)
app.use('/api/people', peopleRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/venues', venueRouter)
app.use('/api/events', eventRouter)
app.use('/api/rules', ruleRouter)
app.use('/api/official-title-holders', officialTitleHoldersRoutes)
app.use('/api/about-us', aboutUsRoutes)
app.use('/api/contactUs-settings', contactUsSettingsRoutes)
app.use('/api/home-config', homeConfigRoutes)
app.use('/api/contact-us', contactUsRoutes)
app.use('/api/training-facilities', trainingFacilitiesRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/suspensions', suspensionRoutes)
app.use('/api/tournament-setting', tournamentSettingRoutes)
app.use('/api/spectator-ticket', spectatorTicketRoutes)
app.use('/api/fighter-checkins', fighterCheckInRoutes)
app.use('/api/brackets', bracketRoutes)
app.use('/api/bouts', boutRoutes)
app.use('/api/fights', fightRoutes)
app.use('/api/cash-code', cashCodeRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/payment', paymentRoutes)

// Define a test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is working properly!' })
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const fileUrl = await uploadS3(req.file)
    res.json({ success: true, url: fileUrl })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

const port = process.env.PORT || 3000

connectDB()

// Simple scheduler for suspension cleanup (runs every hour)
const runSuspensionCleanup = () => {
  setInterval(async () => {
    try {
      await SuspensionService.runCleanupJob()
    } catch (error) {
      console.error('Scheduled suspension cleanup failed:', error)
    }
  }, 60 * 60 * 1000) // Run every hour
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
  
  // Start suspension cleanup scheduler
  runSuspensionCleanup()
  console.log('Suspension cleanup scheduler started (runs every hour)')
  
  // Run initial cleanup
  setTimeout(async () => {
    try {
      await SuspensionService.runCleanupJob()
    } catch (error) {
      console.error('Initial suspension cleanup failed:', error)
    }
  }, 5000) // Wait 5 seconds after server start
})
