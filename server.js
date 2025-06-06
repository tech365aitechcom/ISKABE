const express = require('express')
const app = express()
require('dotenv').config()
const connectDB = require('./config/db')
const cors = require('cors')
const bodyParser = require('body-parser')
const { uploadS3, upload } = require('./config/s3')

const masterRoutes = require('./routes/master.route')
const userRoutes = require('./routes/user.route')
const trainerProfileRoutes = require('./routes/trainerProfile.route')
const fighterProfileRoutes = require('./routes/fighterProfile.route')
const newsRoutes = require('./routes/news.route')
const venueRouter = require('./routes/venue.route')
const ruleRouter = require('./routes/rule.route')
const officialTitleHoldersRoutes = require('./routes/officialTitleHolder.route')
const aboutUsRoutes = require('./routes/aboutUs.route')
const contactUsSettingsRoutes = require('./routes/contactUsSetting.routes')
const contactUsRoutes = require('./routes/contactUs.route')
const trainingFacilitiesRoutes = require('./routes/trainingFacility.route')
const promoterRoutes = require('./routes/promoter.route')
const registrationRoutes = require('./routes/registration.route')

app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api/master', masterRoutes)
app.use('/api/auth', userRoutes)
app.use('/api/auth/trainer', trainerProfileRoutes)
app.use('/api/auth/fighter', fighterProfileRoutes)
app.use('/api/promoter', promoterRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/venues', venueRouter)
app.use('/api/rules', ruleRouter)
app.use('/api/official-title-holders', officialTitleHoldersRoutes)
app.use('/api/about-us', aboutUsRoutes)
app.use('/api/contactUs-settings', contactUsSettingsRoutes)
app.use('/api/contact-us', contactUsRoutes)
app.use('/api/training-facilities', trainingFacilitiesRoutes)
app.use('/api/registration', registrationRoutes)

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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
