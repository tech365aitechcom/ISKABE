const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const multer = require('multer')
const crypto = require('crypto')
require('dotenv').config()

// Sharp's native Linux binary requires SSE4.2 on recent releases. Some VPS
// hypervisors expose older x86-64 CPUs, so image optimisation must not prevent
// the whole API from starting. File signatures are still validated below.
let sharp = null
try {
  sharp = require('sharp')
  sharp.concurrency(Math.max(1, Number(process.env.SHARP_CONCURRENCY) || 2))
  sharp.cache({ memory: 50, files: 20, items: 100 })
} catch (error) {
  console.warn(
    `Sharp is unavailable; validated images will be uploaded without resizing: ${error.message.split('\n')[0]}`
  )
}

const s3Bucket = new S3Client({
  region: process.env.S3_AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

const hasBytes = (buffer, bytes, offset = 0) =>
  bytes.every((byte, index) => buffer[offset + index] === byte)

const detectMimeType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null

  if (hasBytes(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png'
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(buffer.toString('ascii', 8, 12))
  ) {
    return 'image/avif'
  }
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf'
  }

  return null
}

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'application/pdf': '.pdf',
}

console.log('S3 Client Configuration:', {
  region: process.env.S3_AWS_REGION,
  bucket: process.env.S3_BUCKET_NAME,
  hasAccessKey: !!process.env.S3_ACCESS_KEY,
  hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
})

const uploadS3 = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file buffer provided')
    }

    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ]
    const isImage = imageTypes.includes(file.mimetype)
    const isPDF = file.mimetype === 'application/pdf'

    if (!isImage && !isPDF) {
      throw new Error(`Unsupported file type: ${file.mimetype}`)
    }

    const detectedMimeType = detectMimeType(file.buffer)
    if (detectedMimeType !== file.mimetype) {
      throw new Error('File content does not match its declared type')
    }

    let fileBuffer = file.buffer

    if (isImage && sharp) {
      // Resize image
      try {
        fileBuffer = await sharp(file.buffer, {
          limitInputPixels: 40_000_000,
          sequentialRead: true,
        })
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .toBuffer()
      } catch (err) {
        throw new Error(`Invalid or unsafe image: ${err.message}`)
      }
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: file.mimetype,
      Key: `${crypto.randomUUID()}${extensionByMimeType[detectedMimeType]}`,
      Body: fileBuffer,
      ACL: 'public-read', // Make the file publicly accessible
    }

    console.log('S3 Upload Params:', {
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.S3_AWS_REGION,
      fileName: file.originalname,
    })

    await s3Bucket.send(new PutObjectCommand(params))

    const encodedKey = params.Key.split('/').map(encodeURIComponent).join('/')
    return `https://${params.Bucket}.s3.${process.env.S3_AWS_REGION}.amazonaws.com/${encodedKey}`
  } catch (err) {
    throw new Error(`Upload failed: ${err.message}`)
  }
}

const storage = multer.memoryStorage()
const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
])

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('Unsupported file type'))
    }
    callback(null, true)
  },
})

module.exports = { uploadS3, upload }
