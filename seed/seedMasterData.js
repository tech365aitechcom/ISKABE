const mongoose = require('mongoose')
const Master = require('../models/master.model')
const proClassifications = require('../master/proClassifications')
const topics = require('../master/topics')
const roles = require('../master/roles')
const newsCategory = require('../master/newsCategory')
require('dotenv').config()

const mongoURI = process.env.MONGO_URI

async function seed() {
  await mongoose.connect(mongoURI)

  await Master.deleteMany({ type: 'proClassifications' })

  const dataWithIds = proClassifications.map((data) => ({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  }))

  await Master.create({
    type: 'proClassifications',
    data: dataWithIds,
  })

  console.log('Seeded data to MongoDB.')
  process.exit()
}

seed()
