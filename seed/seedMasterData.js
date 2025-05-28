const mongoose = require('mongoose')
const Master = require('../models/master.model')
const topics = require('../master/topics')
require('dotenv').config()

const mongoURI = process.env.MONGO_URI

async function seed() {
  await mongoose.connect(mongoURI)

  await Master.deleteMany({ type: 'topics' })

  await Master.create({
    type: 'topics',
    data: topics,
  })

  console.log('Seeded topics data to MongoDB.')
  process.exit()
}

seed()
