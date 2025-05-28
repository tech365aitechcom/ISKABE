const express = require('express')
const app = express()
require('dotenv').config()
const connectDB = require('./config/db')
const cors = require('cors')

const path = require('path')

const masterRoutes = require('./routes/master.route')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api', masterRoutes)

// Define a test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is working properly!' })
})

const port = process.env.PORT || 3000

connectDB()
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
