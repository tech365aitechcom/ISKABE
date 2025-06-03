module.exports = {
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ikf_platform', // Example MongoDB URI
  },
  port: process.env.PORT || 3000, // Default port for the application
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'ikffightplatform@gmail.com',
      pass: process.env.EMAIL_PASS || 'your_email_password',
    },
    from: process.env.EMAIL_FROM || 'ikffightplatform@gmail.com',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key', // For session management/tokens
  resetTokenExpiry: 3600, // Seconds (1 hour)
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000', // Base URL for the application
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    apiKey: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
  },
}
