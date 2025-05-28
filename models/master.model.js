const mongoose = require('mongoose')

const MasterSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
})

module.exports = mongoose.model('Master', MasterSchema)
