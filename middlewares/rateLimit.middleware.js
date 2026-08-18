const buckets = new Map()

const MAX_TRACKED_CLIENTS = 10000

const getClientKey = (req) => req.ip || req.socket?.remoteAddress || 'unknown'

const rateLimit = ({ windowMs, max, name = 'request' }) => {
  return (req, res, next) => {
    const now = Date.now()
    const key = `${name}:${getClientKey(req)}`
    let bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }

    bucket.count += 1

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      })
    }

    if (buckets.size > MAX_TRACKED_CLIENTS) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey)
      }
    }

    next()
  }
}

module.exports = { rateLimit }
