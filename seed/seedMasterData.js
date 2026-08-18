const mongoose = require('mongoose')
const Master = require('../models/master.model')
const proClassifications = require('../master/proClassifications')
const topics = require('../master/topics')
const roles = require('../master/roles')
const newsCategories = require('../master/newsCategory')
require('dotenv').config()

const masterData = {
  proClassifications,
  topics,
  roles,
  newsCategories,
}

const itemKey = (item) => item.value || item.label || item.title

const preserveIds = (items, existingItems = []) => {
  const idsByKey = new Map(
    existingItems
      .filter((item) => item && item._id && itemKey(item))
      .map((item) => [itemKey(item), item._id])
  )

  return items.map((item) => ({
    _id: idsByKey.get(itemKey(item)) || new mongoose.Types.ObjectId(),
    ...item,
  }))
}

async function seedMasterData() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to seed master data.')
  }

  await mongoose.connect(process.env.MONGO_URI)

  for (const [type, data] of Object.entries(masterData)) {
    const existing = await Master.findOne({ type }).lean()
    const dataWithIds = preserveIds(data, existing?.data)

    await Master.findOneAndUpdate(
      { type },
      { $set: { data: dataWithIds } },
      { upsert: true, runValidators: true }
    )

    console.log(`Seeded master data: ${type} (${dataWithIds.length} records)`)
  }
}

async function run() {
  try {
    await seedMasterData()
    console.log('Master-data seed completed.')
  } catch (error) {
    console.error(`Master-data seed failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

if (require.main === module) {
  run()
}

module.exports = seedMasterData
