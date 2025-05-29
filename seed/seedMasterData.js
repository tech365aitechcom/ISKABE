const mongoose = require('mongoose')
const Master = require('../models/master.model')
const topics = require('../master/topics')
const proClassifications = require('../master/proClassifications')
require('dotenv').config()

const mongoURI = process.env.MONGO_URI

async function seed() {
  await mongoose.connect(mongoURI)

  await Master.deleteMany({ type: 'weightClassesData' })

  await Master.create({
    type: 'proClassifications',
    data: proClassifications,
  })

  console.log('Seeded Pro Classifications data to MongoDB.')
  process.exit()
}

seed()
