const { S3 } = require('aws-sdk')
const sharp = require('sharp')
const multer = require('multer')
require('dotenv').config()

const s3Bucket = new S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_AWS_REGION,
  signatureVersion: 'v4',
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
        fileBuffer = await sharp(file.buffer).resize({ width: 800 }).toBuffer()
      } catch (err) {
        console.warn('Sharp failed, using original buffer:', err.message)
        fileBuffer = file.buffer
      }
    } else {
      // No processing needed for PDFs
      fileBuffer = file.buffer
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: file.mimetype,
      Key: file.originalname, // You can customize this to avoid overwrites
      Body: fileBuffer,
      ACL: 'public-read', // Make the file publicly accessible
    }

    console.log('S3 Upload Params:', {
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.S3_AWS_REGION,
      fileName: file.originalname,
    })

    return new Promise((resolve, reject) => {
      s3Bucket.upload(params, (err, data) => {
        if (err) {
          console.error('S3 Upload Error:', err)
          return reject(err.message)
        }
        console.log('S3 Upload Success:', data)

        // Return the public URL (no expiration)
        return resolve(data.Location)
      })
    })
  } catch (err) {
    throw new Error(`Upload failed: ${err.message}`)
  }
}

const storage = multer.memoryStorage()
const upload = multer({ storage })

module.exports = { uploadS3, upload }
