const Master = require('../models/master.model')

exports.getAllMasterData = async (req, res) => {
  try {
    const all = await Master.find({})
    const response = {}
    all.forEach((doc) => {
      response[doc.type] = doc.data
    })

    res.json(response)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch master data.' })
  }
}

exports.getMasterByType = async (req, res) => {
  try {
    const { type } = req.params
    const master = await Master.findOne({ type })

    if (!master) {
      return res
        .status(404)
        .json({ message: `Master type '${type}' not found.` })
    }

    res.json({ [type]: master.data })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching master data.' })
  }
}
