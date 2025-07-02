const express = require('express')
const router = express.Router()
const venueController = require('../controllers/venue.controller')
const { protect } = require('../middlewares/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Venues
 *   description: Venue management APIs
 */

/**
 * @swagger
 * /venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venue'
 *     responses:
 *       201:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 */
router.post('/', protect, venueController.createVenue)

/**
 * @swagger
 * /venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Venues]
 *     responses:
 *       200:
 *         description: List of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venue'
 */
router.get('/', venueController.getVenues)

/**
 * @swagger
 * /venues/{id}:
 *   get:
 *     summary: Get a venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Venue ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       404:
 *         description: Venue not found
 */
router.get('/:id', venueController.getVenueById)

/**
 * @swagger
 * /venues/{id}:
 *   put:
 *     summary: Update a venue by ID
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Venue ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venue'
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       404:
 *         description: Venue not found
 */
router.put('/:id', protect, venueController.updateVenue)

/**
 * @swagger
 * /venues/{id}:
 *   delete:
 *     summary: Delete a venue by ID
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Venue ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *       404:
 *         description: Venue not found
 */
router.delete('/:id', protect, venueController.deleteVenue)

module.exports = router
