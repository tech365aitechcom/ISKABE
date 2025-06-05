const { S3 } = require('aws-sdk')
const sharp = require('sharp')
const multer = require('multer')
require('dotenv').config()

const s3Bucket = new S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_AWS_REGION,
})

const uploadS3 = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file buffer provided')
    }

    const resizedImageBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // You can remove this if resizing isn't needed
      .toBuffer()

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: file.mimetype,
      Key: file.originalname,
      Body: resizedImageBuffer,
    }

    return new Promise((resolve, reject) => {
      s3Bucket.upload(params, (err, data) => {
        if (err) {
          console.error('S3 Upload Error:', err)
          return reject(err.message)
        }
        console.log('S3 Upload Success:', data)
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
