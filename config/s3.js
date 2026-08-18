const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
require('dotenv').config()

// Bound libvips worker usage so concurrent uploads cannot consume every core.
sharp.concurrency(Math.max(1, Number(process.env.SHARP_CONCURRENCY) || 2))
sharp.cache({ memory: 50, files: 20, items: 100 })

const s3Bucket = new S3Client({
  region: process.env.S3_AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

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
      'image/tiff',
    ]
    const isImage = imageTypes.includes(file.mimetype)
    const isPDF = file.mimetype === 'application/pdf'

    if (!isImage && !isPDF) {
      throw new Error(`Unsupported file type: ${file.mimetype}`)
    }

    let fileBuffer

    if (isImage) {
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
    } else {
      // No processing needed for PDFs
      fileBuffer = file.buffer
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: file.mimetype,
      Key: `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
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
  'image/tiff',
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
