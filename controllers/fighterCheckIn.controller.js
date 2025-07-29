const FighterCheckIn = require('../models/fighterCheckIn.model')
const Suspension = require('../models/suspension.model')
const { roles } = require('../constant')
const mongoose = require('mongoose')

// Create Fighter Check-In
exports.createFighterCheckIn = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    if (role !== roles.superAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create fighter check-in.',
      })
    }

    const checkIn = new FighterCheckIn({
      ...req.body,
      createdBy: userId,
    })

    await checkIn.save()

    res.status(201).json({
      success: true,
      message: 'Fighter check-in created successfully',
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create fighter check-in',
      error,
    })
  }
}

//Get Fighter Check-In by ID
exports.getFighterCheckInById = async (req, res) => {
  try {
    const { id } = req.params
    const checkIn = await FighterCheckIn.findById(id)
      .populate('event')
      .populate({
        path: 'fighter',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email role profilePhoto',
        },
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email role profilePhoto',
      })

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'Fighter check-in not found',
      })
    }

    const userId = checkIn?.fighter?.userId?._id

    let result = checkIn.toObject()

    if (userId) {
      const activeSuspension = await Suspension.findOne({
        person: new mongoose.Types.ObjectId(userId),
        status: 'Active',
      })
      result.suspensionInfo = activeSuspension
        ? {
            hasActiveSuspension: true,
            type: activeSuspension.type,
            description: activeSuspension.description,
            incidentDate: activeSuspension.incidentDate,
            indefinite: activeSuspension.indefinite,
            medicalClearance: activeSuspension.medicalClearance,
          }
        : { hasActiveSuspension: false }
    } else {
      result.suspensionInfo = { hasActiveSuspension: false }
    }

    res.status(200).json({
      success: true,
      message: 'Fighter check-in fetched successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fighter check-in',
      error,
    })
  }
}

// Get All Fighter Check-Ins (optional: filter by event or fighter)
exports.getAllFighterCheckIns = async (req, res) => {
  try {
    const filter = {}
    if (req.query.eventId) filter.event = req.query.eventId
    if (req.query.fighter) filter.fighter = req.query.fighter

    const checkIns = await FighterCheckIn.find(filter)
      .populate('event')
      .populate({
        path: 'fighter',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email role profilePhoto',
        },
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email role profilePhoto',
      })
      .sort({ createdAt: -1 })

    const result = await Promise.all(
      checkIns.map(async (checkIn) => {
        const userId = checkIn?.fighter?.userId?._id

        if (userId) {
          const activeSuspension = await Suspension.findOne({
            person: new mongoose.Types.ObjectId(userId),
            status: 'Active',
          })
          return {
            ...checkIn.toObject(),
            suspensionInfo: activeSuspension
              ? {
                  hasActiveSuspension: true,
                  type: activeSuspension.type,
                  description: activeSuspension.description,
                  incidentDate: activeSuspension.incidentDate,
                  indefinite: activeSuspension.indefinite,
                  medicalClearance: activeSuspension.medicalClearance,
                }
              : { hasActiveSuspension: false },
          }
        }

        return {
          ...checkIn.toObject(),
          suspensionInfo: { hasActiveSuspension: false },
        }
      })
    )

    res.status(200).json({
      success: true,
      message: 'Fighter check-ins fetched successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fighter check-ins',
      error,
    })
  }
}

//  Update Fighter Check-In
exports.updateFighterCheckIn = async (req, res) => {
  try {
    const { id } = req.params

    const updated = await FighterCheckIn.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Fighter check-in not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Fighter check-in updated successfully',
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update fighter check-in',
      error,
    })
  }
}

// Delete Fighter Check-In
exports.deleteFighterCheckIn = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await FighterCheckIn.findByIdAndDelete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Fighter check-in not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Fighter check-in deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete fighter check-in',
      error,
    })
  }
}
