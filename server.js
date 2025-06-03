const express = require('express')
const app = express()
require('dotenv').config()
const connectDB = require('./config/db')
const cors = require('cors')

const masterRoutes = require('./routes/master.route')
const userRoutes = require('./routes/user.route')
const newsRoutes = require('./routes/news.route')
const venueRouter = require('./routes/venue.route')
const ruleRouter = require('./routes/rule.route')
const officialTitleHoldersRoutes = require('./routes/officialTitleHolder.route')
const aboutUsRoutes = require('./routes/aboutUs.route')
const contactUsSettingsRoutes = require('./routes/contactUsSetting.routes')
const contactUsRoutes = require('./routes/contactUs.route')
const trainingFacilitiesRoutes = require('./routes/trainingFacility.route')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', masterRoutes)
app.use('/api/auth', userRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/venues', venueRouter)
app.use('/api/rules', ruleRouter)
app.use('/api/official-title-holders', officialTitleHoldersRoutes)
app.use('/api/about-us', aboutUsRoutes)
app.use('/api/contactUs-settings', contactUsSettingsRoutes)
app.use('/api/contact-us', contactUsRoutes)
app.use('/api/training-facilities', trainingFacilitiesRoutes)

// Define a test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is working properly!' })
})

const port = process.env.PORT || 3000

connectDB()
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
