const swaggerJsdoc = require('swagger-jsdoc')
const mongooseToSwagger = require('mongoose-to-swagger')
const Venue = require('./models/venue.model')
const News = require('./models/news.model')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A sample Express API using Swagger',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
    components: {
      schemas: {
        Venue: mongooseToSwagger(Venue),
        News: mongooseToSwagger(News),
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec
