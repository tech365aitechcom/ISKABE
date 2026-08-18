const jwt = require('jsonwebtoken')
const config = require('../config/config')
require('dotenv').config()

// JWT authentication middleware
exports.protect = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1]

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
}

// Optional JWT authentication middleware - doesn't throw error if no token
exports.optionalAuth = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1]

  if (!token) {
    // No token provided, continue without user
    req.user = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch (err) {
    // Invalid token, continue without user
    req.user = null
    next()
  }
}

exports.requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action.',
      })
    }

    next()
  }
}
