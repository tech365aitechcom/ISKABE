const crypto = require('crypto')
const mongoose = require('mongoose')
const User = require('../models/user.model')
const FighterProfile = require('../models/fighterProfile.model')
const TrainerProfile = require('../models/TrainerProfile.model')
require('dotenv').config()

const seedUsers = [
  { role: 'user', firstName: 'User', phoneNumber: '+15550000001' },
  { role: 'parent', firstName: 'Parent', phoneNumber: '+15550000002' },
  { role: 'fighter', firstName: 'Fighter', phoneNumber: '+15550000003' },
  { role: 'trainer', firstName: 'Trainer', phoneNumber: '+15550000004' },
  { role: 'promoter', firstName: 'Promoter', phoneNumber: '+15550000005' },
  { role: 'superAdmin', firstName: 'Admin', phoneNumber: '+15550000006' },
]

const emailForRole = (role) => {
  const envName = `SEED_${role.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}_EMAIL`
  return process.env[envName] || `${role.toLowerCase()}@seed.ikffightplatform.com`
}

const ensureProfile = async (user) => {
  if (user.role === 'fighter') {
    await FighterProfile.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true, runValidators: true }
    )
  }

  if (user.role === 'trainer') {
    await TrainerProfile.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true, runValidators: true }
    )
  }
}

async function seedRoleUsers() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to seed users.')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const temporaryPassword =
    process.env.SEED_USER_PASSWORD || `${crypto.randomBytes(12).toString('base64url')}9a`
  const results = []

  for (const definition of seedUsers) {
    const email = emailForRole(definition.role).toLowerCase()
    let user = await User.findOne({ email })
    const created = !user

    if (!user) {
      user = new User({
        ...definition,
        lastName: 'Seed',
        email,
        password: temporaryPassword,
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        country: 'United States',
        termsAgreed: true,
        isVerified: true,
      })
    } else {
      user.firstName = definition.firstName
      user.lastName = 'Seed'
      user.role = definition.role
      user.phoneNumber = definition.phoneNumber
      user.country = user.country || 'United States'
      user.termsAgreed = true
      user.isVerified = true
    }

    await user.save()
    await ensureProfile(user)
    results.push({ role: definition.role, email, created })
  }

  console.table(results)

  if (results.some(({ created }) => created)) {
    console.log(`Temporary password for newly created users: ${temporaryPassword}`)
    console.log('Change the temporary passwords before using these accounts in production.')
  } else {
    console.log('All seed users already existed; their passwords were left unchanged.')
  }
}

async function run() {
  try {
    await seedRoleUsers()
    console.log('Role-user seed completed.')
  } catch (error) {
    console.error(`Role-user seed failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

if (require.main === module) {
  run()
}

module.exports = seedRoleUsers
